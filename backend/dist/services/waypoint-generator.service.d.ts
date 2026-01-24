import { Polygon, Waypoint } from '../types/shared.types';
export declare class WaypointGeneratorService {
    generateGridPattern(area: Polygon, altitude: number, overlap: number): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[];
    generateCrosshatchPattern(area: Polygon, altitude: number, overlap: number): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[];
    generatePerimeterPattern(area: Polygon, altitude: number): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[];
    optimizeWaypointOrder(waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[]): Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[];
    calculateFlightDistance(waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[]): number;
    estimateFlightTime(waypoints: Omit<Waypoint, 'id' | 'missionId' | 'completed' | 'completedAt'>[], droneSpeed: number): number;
    private calculateBounds;
    private calculateSpacing;
    private isPointInPolygon;
    private calculateDistance;
    private toRadians;
}
