import { Repository } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { Drone } from '../entities/drone.entity';
import { Waypoint } from '../entities/waypoint.entity';
import { MissionReport } from '../entities/mission-report.entity';
import { WaypointGeneratorService } from './waypoint-generator.service';
import { MissionConfig, ApiResponse } from '../types/shared.types';
export declare class MissionService {
    private missionRepository;
    private droneRepository;
    private waypointRepository;
    private reportRepository;
    private waypointGenerator;
    constructor(missionRepository: Repository<Mission>, droneRepository: Repository<Drone>, waypointRepository: Repository<Waypoint>, reportRepository: Repository<MissionReport>, waypointGenerator: WaypointGeneratorService);
    createMission(config: MissionConfig): Promise<ApiResponse<Mission>>;
    startMission(missionId: string): Promise<ApiResponse<Mission>>;
    pauseMission(missionId: string): Promise<ApiResponse<Mission>>;
    resumeMission(missionId: string): Promise<ApiResponse<Mission>>;
    abortMission(missionId: string, reason?: string): Promise<ApiResponse<Mission>>;
    getMissionStatus(missionId: string): Promise<ApiResponse<Mission>>;
    getActiveMissions(): Promise<ApiResponse<Mission[]>>;
    getAllMissions(): Promise<ApiResponse<Mission[]>>;
    private validateMissionConfig;
    private generateMissionReport;
}
