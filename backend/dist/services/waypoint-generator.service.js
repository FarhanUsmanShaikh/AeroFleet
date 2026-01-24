"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaypointGeneratorService = void 0;
const common_1 = require("@nestjs/common");
let WaypointGeneratorService = class WaypointGeneratorService {
    generateGridPattern(area, altitude, overlap) {
        const bounds = this.calculateBounds(area.coordinates);
        const spacing = this.calculateSpacing(overlap, altitude);
        const waypoints = [];
        let sequenceNumber = 1;
        let isEvenRow = true;
        for (let lat = bounds.north; lat >= bounds.south; lat -= spacing.latSpacing) {
            const lineWaypoints = [];
            for (let lng = bounds.west; lng <= bounds.east; lng += spacing.lngSpacing) {
                if (this.isPointInPolygon({ latitude: lat, longitude: lng }, area.coordinates)) {
                    lineWaypoints.push({
                        sequenceNumber: 0,
                        latitude: lat,
                        longitude: lng,
                        altitude,
                        action: 'FLY_TO'
                    });
                }
            }
            if (!isEvenRow) {
                lineWaypoints.reverse();
            }
            lineWaypoints.forEach(wp => {
                wp.sequenceNumber = sequenceNumber++;
                waypoints.push(wp);
            });
            isEvenRow = !isEvenRow;
        }
        return this.optimizeWaypointOrder(waypoints);
    }
    generateCrosshatchPattern(area, altitude, overlap) {
        const gridWaypoints = this.generateGridPattern(area, altitude, overlap);
        const bounds = this.calculateBounds(area.coordinates);
        const spacing = this.calculateSpacing(overlap, altitude);
        const crossWaypoints = [];
        let sequenceNumber = gridWaypoints.length + 1;
        let isEvenCol = true;
        for (let lng = bounds.west; lng <= bounds.east; lng += spacing.lngSpacing) {
            const lineWaypoints = [];
            for (let lat = bounds.north; lat >= bounds.south; lat -= spacing.latSpacing) {
                if (this.isPointInPolygon({ latitude: lat, longitude: lng }, area.coordinates)) {
                    lineWaypoints.push({
                        sequenceNumber: 0,
                        latitude: lat,
                        longitude: lng,
                        altitude,
                        action: 'FLY_TO'
                    });
                }
            }
            if (!isEvenCol) {
                lineWaypoints.reverse();
            }
            lineWaypoints.forEach(wp => {
                wp.sequenceNumber = sequenceNumber++;
                crossWaypoints.push(wp);
            });
            isEvenCol = !isEvenCol;
        }
        const allWaypoints = [...gridWaypoints, ...crossWaypoints];
        return this.optimizeWaypointOrder(allWaypoints);
    }
    generatePerimeterPattern(area, altitude) {
        const waypoints = [];
        area.coordinates.forEach((coord, index) => {
            waypoints.push({
                sequenceNumber: index + 1,
                latitude: coord.latitude,
                longitude: coord.longitude,
                altitude,
                action: 'FLY_TO'
            });
        });
        if (waypoints.length > 0) {
            const firstPoint = area.coordinates[0];
            waypoints.push({
                sequenceNumber: waypoints.length + 1,
                latitude: firstPoint.latitude,
                longitude: firstPoint.longitude,
                altitude,
                action: 'FLY_TO'
            });
        }
        return waypoints;
    }
    optimizeWaypointOrder(waypoints) {
        if (waypoints.length <= 2)
            return waypoints;
        return waypoints.map((wp, index) => ({
            ...wp,
            sequenceNumber: index + 1
        }));
    }
    calculateFlightDistance(waypoints) {
        if (waypoints.length < 2)
            return 0;
        let totalDistance = 0;
        for (let i = 1; i < waypoints.length; i++) {
            const prev = waypoints[i - 1];
            const curr = waypoints[i];
            totalDistance += this.calculateDistance({ latitude: prev.latitude, longitude: prev.longitude }, { latitude: curr.latitude, longitude: curr.longitude });
        }
        return totalDistance;
    }
    estimateFlightTime(waypoints, droneSpeed) {
        const distance = this.calculateFlightDistance(waypoints);
        const baseFlightTime = distance / droneSpeed;
        const waypointActionTime = waypoints.length * 2;
        const bufferTime = (baseFlightTime + waypointActionTime) * 0.1;
        return Math.ceil(baseFlightTime + waypointActionTime + bufferTime);
    }
    calculateBounds(coordinates) {
        let north = -90, south = 90, east = -180, west = 180;
        coordinates.forEach(coord => {
            north = Math.max(north, coord.latitude);
            south = Math.min(south, coord.latitude);
            east = Math.max(east, coord.longitude);
            west = Math.min(west, coord.longitude);
        });
        return { north, south, east, west };
    }
    calculateSpacing(overlap, altitude) {
        const baseSpacing = altitude * 0.001;
        const overlapFactor = (100 - overlap) / 100;
        return {
            latSpacing: baseSpacing * overlapFactor,
            lngSpacing: baseSpacing * overlapFactor
        };
    }
    isPointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].longitude;
            const yi = polygon[i].latitude;
            const xj = polygon[j].longitude;
            const yj = polygon[j].latitude;
            if (((yi > point.latitude) !== (yj > point.latitude)) &&
                (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    calculateDistance(point1, point2) {
        const R = 6371000;
        const dLat = this.toRadians(point2.latitude - point1.latitude);
        const dLng = this.toRadians(point2.longitude - point1.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
};
exports.WaypointGeneratorService = WaypointGeneratorService;
exports.WaypointGeneratorService = WaypointGeneratorService = __decorate([
    (0, common_1.Injectable)()
], WaypointGeneratorService);
//# sourceMappingURL=waypoint-generator.service.js.map