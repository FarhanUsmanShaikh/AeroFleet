import { Injectable } from '@nestjs/common';
import { Polygon, LatLng, Waypoint } from '../types/shared.types';

@Injectable()
export class WaypointGeneratorService {
  
  /**
   * Generate waypoints for GRID pattern
   */
  generateGridPattern(area: Polygon, altitude: number, overlap: number): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] {
    const bounds = this.calculateBounds(area.coordinates);
    const spacing = this.calculateSpacing(overlap, altitude);
    const waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] = [];
    
    let sequenceNumber = 1;
    let isEvenRow = true;
    
    // Generate parallel lines from north to south
    for (let lat = bounds.north; lat >= bounds.south; lat -= spacing.latSpacing) {
      const lineWaypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] = [];
      
      for (let lng = bounds.west; lng <= bounds.east; lng += spacing.lngSpacing) {
        if (this.isPointInPolygon({ latitude: lat, longitude: lng }, area.coordinates)) {
          lineWaypoints.push({
            sequenceNumber: 0, // Will be set later
            latitude: lat,
            longitude: lng,
            altitude,
            action: 'FLY_TO'
          });
        }
      }
      
      // Alternate direction for efficient flight path (boustrophedon pattern)
      if (!isEvenRow) {
        lineWaypoints.reverse();
      }
      
      // Assign sequence numbers
      lineWaypoints.forEach(wp => {
        wp.sequenceNumber = sequenceNumber++;
        waypoints.push(wp);
      });
      
      isEvenRow = !isEvenRow;
    }
    
    return this.optimizeWaypointOrder(waypoints);
  }

  /**
   * Generate waypoints for CROSSHATCH pattern
   */
  generateCrosshatchPattern(area: Polygon, altitude: number, overlap: number): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] {
    // Generate grid pattern first
    const gridWaypoints = this.generateGridPattern(area, altitude, overlap);
    
    // Generate perpendicular lines
    const bounds = this.calculateBounds(area.coordinates);
    const spacing = this.calculateSpacing(overlap, altitude);
    const crossWaypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] = [];
    
    let sequenceNumber = gridWaypoints.length + 1;
    let isEvenCol = true;
    
    // Generate perpendicular lines from west to east
    for (let lng = bounds.west; lng <= bounds.east; lng += spacing.lngSpacing) {
      const lineWaypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] = [];
      
      for (let lat = bounds.north; lat >= bounds.south; lat -= spacing.latSpacing) {
        if (this.isPointInPolygon({ latitude: lat, longitude: lng }, area.coordinates)) {
          lineWaypoints.push({
            sequenceNumber: 0, // Will be set later
            latitude: lat,
            longitude: lng,
            altitude,
            action: 'FLY_TO'
          });
        }
      }
      
      // Alternate direction for efficient flight path
      if (!isEvenCol) {
        lineWaypoints.reverse();
      }
      
      // Assign sequence numbers
      lineWaypoints.forEach(wp => {
        wp.sequenceNumber = sequenceNumber++;
        crossWaypoints.push(wp);
      });
      
      isEvenCol = !isEvenCol;
    }
    
    // Combine grid and cross patterns
    const allWaypoints = [...gridWaypoints, ...crossWaypoints];
    return this.optimizeWaypointOrder(allWaypoints);
  }

  /**
   * Generate waypoints for PERIMETER pattern
   */
  generatePerimeterPattern(area: Polygon, altitude: number): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] {
    const waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] = [];
    
    // Follow the polygon boundary
    area.coordinates.forEach((coord, index) => {
      waypoints.push({
        sequenceNumber: index + 1,
        latitude: coord.latitude,
        longitude: coord.longitude,
        altitude,
        action: 'FLY_TO'
      });
    });
    
    // Close the loop by returning to the first point
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

  /**
   * Optimize waypoint order to minimize flight distance
   */
  optimizeWaypointOrder(waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[]): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[] {
    if (waypoints.length <= 2) return waypoints;
    
    // For now, return waypoints as-is since they're already optimized during generation
    // In a production system, you might implement more sophisticated algorithms like:
    // - Traveling Salesman Problem (TSP) solver
    // - Nearest neighbor algorithm
    // - Genetic algorithm for large waypoint sets
    
    return waypoints.map((wp, index) => ({
      ...wp,
      sequenceNumber: index + 1
    }));
  }

  /**
   * Calculate total flight distance for waypoints
   */
  calculateFlightDistance(waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[]): number {
    if (waypoints.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      
      totalDistance += this.calculateDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
    }
    
    return totalDistance;
  }

  /**
   * Estimate flight time based on waypoints and drone speed
   */
  estimateFlightTime(waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[], droneSpeed: number): number {
    const distance = this.calculateFlightDistance(waypoints);
    const baseFlightTime = distance / droneSpeed; // seconds
    
    // Add time for waypoint actions (hover, data collection, etc.)
    const waypointActionTime = waypoints.length * 2; // 2 seconds per waypoint
    
    // Add 10% buffer for safety and maneuvering
    const bufferTime = (baseFlightTime + waypointActionTime) * 0.1;
    
    return Math.ceil(baseFlightTime + waypointActionTime + bufferTime);
  }

  /**
   * Calculate bounds of polygon coordinates
   */
  private calculateBounds(coordinates: LatLng[]): { north: number; south: number; east: number; west: number } {
    let north = -90, south = 90, east = -180, west = 180;
    
    coordinates.forEach(coord => {
      north = Math.max(north, coord.latitude);
      south = Math.min(south, coord.latitude);
      east = Math.max(east, coord.longitude);
      west = Math.min(west, coord.longitude);
    });
    
    return { north, south, east, west };
  }

  /**
   * Calculate spacing between waypoints based on overlap percentage
   */
  private calculateSpacing(overlap: number, altitude: number): { latSpacing: number; lngSpacing: number } {
    // Simplified calculation - in reality this would depend on camera FOV and sensor specifications
    const baseSpacing = altitude * 0.001; // Base spacing proportional to altitude
    const overlapFactor = (100 - overlap) / 100;
    
    return {
      latSpacing: baseSpacing * overlapFactor,
      lngSpacing: baseSpacing * overlapFactor
    };
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  private isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
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

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLng = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
