import { MissionService } from '../services/mission.service';
import { MissionSimulatorService } from '../services/mission-simulator.service';
import { MissionGateway } from '../gateways/mission.gateway';
import { MissionConfigDto } from '../dto/mission-config.dto';
import { MissionControlDto } from '../dto/mission-control.dto';
import type { ApiResponse, Mission } from '../types/shared.types';
export declare class MissionController {
    private readonly missionService;
    private readonly simulatorService;
    private readonly missionGateway;
    constructor(missionService: MissionService, simulatorService: MissionSimulatorService, missionGateway: MissionGateway);
    createMission(config: MissionConfigDto): Promise<ApiResponse<Mission>>;
    getAllMissions(): Promise<ApiResponse<Mission[]>>;
    getActiveMissions(): Promise<ApiResponse<Mission[]>>;
    getMissionById(id: string): Promise<ApiResponse<Mission>>;
    controlMission(id: string, body: MissionControlDto): Promise<ApiResponse<Mission>>;
    getMissionWaypoints(id: string): Promise<ApiResponse<import("../entities/mission.entity").Mission> | {
        success: boolean;
        data: import("../entities/waypoint.entity").Waypoint[];
    }>;
    getMissionProgress(id: string): Promise<ApiResponse<import("../entities/mission.entity").Mission> | {
        success: boolean;
        data: {
            missionId: string;
            status: import("../types/shared.types").MissionStatus;
            progress: number;
            currentWaypointIndex: number;
            totalWaypoints: number;
            estimatedTimeRemaining: number;
            distanceCovered: number;
            batteryLevel: number;
            dronePosition: import("../types/shared.types").LatLng | null;
        };
    }>;
    getMissionStatistics(): Promise<ApiResponse<import("../entities/mission.entity").Mission[]> | {
        success: boolean;
        data: {
            totalMissions: number;
            completedMissions: number;
            abortedMissions: number;
            activeMissions: number;
            averageDuration: number;
            completionRate: number;
            totalFlightTime: number;
            totalDistance: number;
        };
    }>;
}
