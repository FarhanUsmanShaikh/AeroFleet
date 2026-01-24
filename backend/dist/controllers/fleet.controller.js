"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetController = void 0;
const common_1 = require("@nestjs/common");
const fleet_service_1 = require("../services/fleet.service");
const mission_gateway_1 = require("../gateways/mission.gateway");
const drone_dto_1 = require("../dto/drone.dto");
let FleetController = class FleetController {
    fleetService;
    missionGateway;
    constructor(fleetService, missionGateway) {
        this.fleetService = fleetService;
        this.missionGateway = missionGateway;
    }
    async getAllDrones(filter) {
        try {
            return await this.fleetService.getAllDrones(filter);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch drones', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAvailableDrones() {
        try {
            return await this.fleetService.getAvailableDrones();
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch available drones', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getFleetStatistics() {
        try {
            return await this.fleetService.getFleetStatistics();
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch fleet statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDroneById(id) {
        try {
            return await this.fleetService.getDroneById(id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch drone', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async updateDroneStatus(id, body) {
        try {
            const result = await this.fleetService.updateDroneStatus(id, body.status);
            if (result.success && result.data) {
                this.missionGateway.broadcastFleetStatus({
                    droneId: id,
                    status: body.status,
                    batteryLevel: result.data.batteryLevel,
                    currentLocation: result.data.currentLocation,
                    lastUpdated: result.data.updatedAt
                });
                if (body.status === 'MAINTENANCE') {
                    this.missionGateway.broadcastSystemNotification({
                        type: 'warning',
                        title: 'Drone Maintenance',
                        message: `Drone ${result.data.name} has been set to maintenance mode`,
                        data: { droneId: id }
                    });
                }
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update drone status', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async updateDroneLocation(id, body) {
        try {
            const location = { latitude: body.latitude, longitude: body.longitude };
            const result = await this.fleetService.updateDroneLocation(id, location);
            if (result.success) {
                this.missionGateway.broadcastDronePosition(id, location);
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update drone location', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async updateDroneBattery(id, body) {
        try {
            const result = await this.fleetService.updateDroneBattery(id, body.batteryLevel);
            if (result.success && result.data) {
                this.missionGateway.broadcastFleetStatus({
                    droneId: id,
                    status: result.data.status,
                    batteryLevel: body.batteryLevel,
                    currentLocation: result.data.currentLocation,
                    lastUpdated: result.data.updatedAt
                });
                if (body.batteryLevel <= 20) {
                    this.missionGateway.broadcastEmergency({
                        type: 'LOW_BATTERY',
                        droneId: id,
                        message: `Drone ${result.data.name} has low battery: ${body.batteryLevel}%`,
                        severity: body.batteryLevel <= 10 ? 'critical' : 'high'
                    });
                }
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update drone battery', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async createDrone(droneData) {
        try {
            const createData = {
                name: droneData.name,
                model: droneData.model,
                currentLocation: droneData.currentLatitude && droneData.currentLongitude ? {
                    latitude: droneData.currentLatitude,
                    longitude: droneData.currentLongitude
                } : undefined,
                maxFlightTime: droneData.maxFlightTime,
                maxSpeed: droneData.maxSpeed
            };
            const result = await this.fleetService.createDrone(createData);
            if (result.success && result.data) {
                this.missionGateway.broadcastSystemNotification({
                    type: 'success',
                    title: 'Drone Added',
                    message: `New drone "${droneData.name}" has been added to the fleet`,
                    data: { droneId: result.data.id }
                });
                this.missionGateway.broadcastFleetStatus({
                    droneId: result.data.id,
                    status: result.data.status,
                    batteryLevel: result.data.batteryLevel,
                    currentLocation: result.data.currentLocation,
                    lastUpdated: result.data.updatedAt
                });
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create drone', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async seedSampleDrones() {
        try {
            const result = await this.fleetService.seedSampleDrones();
            if (result.success && result.data) {
                this.missionGateway.broadcastSystemNotification({
                    type: 'info',
                    title: 'Fleet Initialized',
                    message: `Sample drone fleet has been initialized with ${result.data.length} drones`,
                });
                result.data.forEach(drone => {
                    this.missionGateway.broadcastFleetStatus({
                        droneId: drone.id,
                        status: drone.status,
                        batteryLevel: drone.batteryLevel,
                        currentLocation: drone.currentLocation,
                        lastUpdated: drone.updatedAt
                    });
                });
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to seed sample drones', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDroneMissions(id) {
        try {
            const result = await this.fleetService.getDroneById(id);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data.missions || []
                };
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch drone missions', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.FleetController = FleetController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getAllDrones", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getAvailableDrones", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getFleetStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getDroneById", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, drone_dto_1.UpdateDroneStatusDto]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "updateDroneStatus", null);
__decorate([
    (0, common_1.Put)(':id/location'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, drone_dto_1.UpdateDroneLocationDto]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "updateDroneLocation", null);
__decorate([
    (0, common_1.Put)(':id/battery'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, drone_dto_1.UpdateDroneBatteryDto]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "updateDroneBattery", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [drone_dto_1.CreateDroneDto]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "createDrone", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "seedSampleDrones", null);
__decorate([
    (0, common_1.Get)(':id/missions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getDroneMissions", null);
exports.FleetController = FleetController = __decorate([
    (0, common_1.Controller)('api/fleet'),
    __metadata("design:paramtypes", [fleet_service_1.FleetService,
        mission_gateway_1.MissionGateway])
], FleetController);
//# sourceMappingURL=fleet.controller.js.map