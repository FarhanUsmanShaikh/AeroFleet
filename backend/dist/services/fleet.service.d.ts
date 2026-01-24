import { Repository } from 'typeorm';
import { Drone } from '../entities/drone.entity';
import { DroneStatus, DroneFilter, ApiResponse, LatLng } from '../types/shared.types';
export declare class FleetService {
    private droneRepository;
    constructor(droneRepository: Repository<Drone>);
    getAllDrones(filter?: DroneFilter): Promise<ApiResponse<Drone[]>>;
    getDroneById(id: string): Promise<ApiResponse<Drone>>;
    updateDroneStatus(id: string, status: DroneStatus): Promise<ApiResponse<Drone>>;
    updateDroneLocation(id: string, location: LatLng): Promise<ApiResponse<Drone>>;
    updateDroneBattery(id: string, batteryLevel: number): Promise<ApiResponse<Drone>>;
    getAvailableDrones(): Promise<ApiResponse<Drone[]>>;
    createDrone(droneData: {
        name: string;
        model: string;
        currentLocation?: LatLng;
        maxFlightTime?: number;
        maxSpeed?: number;
    }): Promise<ApiResponse<Drone>>;
    seedSampleDrones(): Promise<ApiResponse<Drone[]>>;
    getFleetStatistics(): Promise<ApiResponse<{
        total: number;
        available: number;
        inMission: number;
        maintenance: number;
        averageBatteryLevel: number;
    }>>;
}
