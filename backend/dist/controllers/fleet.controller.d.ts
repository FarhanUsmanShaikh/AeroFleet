import { FleetService } from '../services/fleet.service';
import { MissionGateway } from '../gateways/mission.gateway';
import { CreateDroneDto, UpdateDroneStatusDto, UpdateDroneLocationDto, UpdateDroneBatteryDto } from '../dto/drone.dto';
import type { DroneFilter, ApiResponse, Drone } from '../types/shared.types';
export declare class FleetController {
    private readonly fleetService;
    private readonly missionGateway;
    constructor(fleetService: FleetService, missionGateway: MissionGateway);
    getAllDrones(filter: DroneFilter): Promise<ApiResponse<Drone[]>>;
    getAvailableDrones(): Promise<ApiResponse<Drone[]>>;
    getFleetStatistics(): Promise<ApiResponse<{
        total: number;
        available: number;
        inMission: number;
        maintenance: number;
        averageBatteryLevel: number;
    }>>;
    getDroneById(id: string): Promise<ApiResponse<Drone>>;
    updateDroneStatus(id: string, body: UpdateDroneStatusDto): Promise<ApiResponse<Drone>>;
    updateDroneLocation(id: string, body: UpdateDroneLocationDto): Promise<ApiResponse<Drone>>;
    updateDroneBattery(id: string, body: UpdateDroneBatteryDto): Promise<ApiResponse<Drone>>;
    createDrone(droneData: CreateDroneDto): Promise<ApiResponse<Drone>>;
    seedSampleDrones(): Promise<ApiResponse<Drone[]>>;
    getDroneMissions(id: string): Promise<ApiResponse<import("../entities/drone.entity").Drone> | {
        success: boolean;
        data: import("../entities/mission.entity").Mission[];
    }>;
}
