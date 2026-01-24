import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MissionUpdate, FleetUpdate, LatLng } from '../types/shared.types';
export declare class MissionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedClients;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinMission(client: Socket, data: {
        missionId: string;
    }): void;
    handleLeaveMission(client: Socket, data: {
        missionId: string;
    }): void;
    handleJoinFleet(client: Socket): void;
    handleLeaveFleet(client: Socket): void;
    broadcastMissionUpdate(missionId: string, update: MissionUpdate): void;
    broadcastDronePosition(droneId: string, position: LatLng, missionId?: string): void;
    broadcastFleetStatus(fleetUpdate: FleetUpdate): void;
    broadcastSystemNotification(notification: {
        type: 'info' | 'warning' | 'error' | 'success';
        title: string;
        message: string;
        data?: any;
    }): void;
    broadcastMissionStatusChange(missionId: string, status: string, data?: any): void;
    broadcastEmergency(emergency: {
        type: 'MISSION_ABORT' | 'LOW_BATTERY' | 'CONNECTION_LOST' | 'SYSTEM_ERROR';
        missionId?: string;
        droneId?: string;
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }): void;
    getConnectedClientsCount(): number;
    getClientsInRoom(room: string): number;
    sendHeartbeat(): void;
}
