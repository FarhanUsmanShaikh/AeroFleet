import { Mission } from './mission.entity';
export declare class MissionReport {
    id: string;
    missionId: string;
    totalFlightDuration: number;
    distanceCovered: number;
    coveragePercentage: number;
    finalStatus: 'COMPLETED' | 'ABORTED';
    abortReason: string;
    waypointsCompleted: number;
    batteryConsumed: number;
    generatedAt: Date;
    mission: Mission;
}
