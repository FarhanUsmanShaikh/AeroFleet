import type { WaypointAction } from '../types/shared.types';
import { Mission } from './mission.entity';
export declare class Waypoint {
    id: string;
    missionId: string;
    sequenceNumber: number;
    latitude: number;
    longitude: number;
    altitude: number;
    action: WaypointAction;
    completed: boolean;
    completedAt: Date;
    mission: Mission;
}
