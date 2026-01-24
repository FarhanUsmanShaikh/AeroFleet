import type { DroneStatus } from '../types/shared.types';
export declare class CreateDroneDto {
    name: string;
    model: string;
    currentLatitude?: number;
    currentLongitude?: number;
    maxFlightTime?: number;
    maxSpeed?: number;
}
export declare class UpdateDroneStatusDto {
    status: DroneStatus;
}
export declare class UpdateDroneLocationDto {
    latitude: number;
    longitude: number;
}
export declare class UpdateDroneBatteryDto {
    batteryLevel: number;
}
