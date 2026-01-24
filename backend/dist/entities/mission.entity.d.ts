import * as sharedTypes from '../types/shared.types';
import { Drone } from './drone.entity';
import { Waypoint } from './waypoint.entity';
import { MissionReport } from './mission-report.entity';
export declare class Mission {
    id: string;
    name: string;
    droneId: string;
    status: sharedTypes.MissionStatus;
    pattern: sharedTypes.MissionPattern;
    altitude: number;
    overlapPercentage: number;
    surveyArea: sharedTypes.Polygon;
    totalWaypoints: number;
    currentWaypointIndex: number;
    progress: number;
    estimatedDuration: number;
    actualDuration: number;
    distanceCovered: number;
    createdAt: Date;
    startedAt: Date;
    completedAt: Date;
    drone: Drone;
    waypoints: Waypoint[];
    reports: MissionReport[];
    get estimatedTimeRemaining(): number;
}
