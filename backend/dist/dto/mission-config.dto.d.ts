import type { MissionPattern } from '../types/shared.types';
declare class LatLngDto {
    latitude: number;
    longitude: number;
}
declare class PolygonDto {
    coordinates: LatLngDto[];
    area: number;
}
declare class SensorConfigDto {
    type: 'CAMERA' | 'LIDAR' | 'THERMAL';
    frequency: number;
    resolution: string;
}
export declare class MissionConfigDto {
    name: string;
    droneId: string;
    surveyArea: PolygonDto;
    pattern: MissionPattern;
    altitude: number;
    overlapPercentage: number;
    sensorSettings: SensorConfigDto;
}
export {};
