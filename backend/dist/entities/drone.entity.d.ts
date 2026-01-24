import * as sharedTypes from '../types/shared.types';
import { Mission } from './mission.entity';
export declare class Drone {
    id: string;
    name: string;
    model: string;
    status: sharedTypes.DroneStatus;
    batteryLevel: number;
    currentLatitude: number | null;
    currentLongitude: number | null;
    maxFlightTime: number;
    maxSpeed: number;
    createdAt: Date;
    updatedAt: Date;
    missions: Mission[];
    get currentLocation(): sharedTypes.LatLng | null;
    set currentLocation(location: sharedTypes.LatLng | null);
    get lastUpdated(): Date;
}
