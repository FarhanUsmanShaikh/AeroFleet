import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MissionUpdate, FleetUpdate, LatLng } from '../types/shared.types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/missions',
})
export class MissionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MissionGateway.name);
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Send welcome message
    client.emit('connection', {
      message: 'Connected to Drone Survey Management System',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('joinMission')
  handleJoinMission(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { missionId: string }
  ): void {
    const { missionId } = data;
    client.join(`mission-${missionId}`);
    this.logger.log(`Client ${client.id} joined mission room: ${missionId}`);
    
    client.emit('joinedMission', {
      missionId,
      message: `Joined mission ${missionId} updates`,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveMission')
  handleLeaveMission(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { missionId: string }
  ): void {
    const { missionId } = data;
    client.leave(`mission-${missionId}`);
    this.logger.log(`Client ${client.id} left mission room: ${missionId}`);
    
    client.emit('leftMission', {
      missionId,
      message: `Left mission ${missionId} updates`,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('joinFleet')
  handleJoinFleet(@ConnectedSocket() client: Socket): void {
    client.join('fleet-updates');
    this.logger.log(`Client ${client.id} joined fleet updates`);
    
    client.emit('joinedFleet', {
      message: 'Joined fleet updates',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveFleet')
  handleLeaveFleet(@ConnectedSocket() client: Socket): void {
    client.leave('fleet-updates');
    this.logger.log(`Client ${client.id} left fleet updates`);
    
    client.emit('leftFleet', {
      message: 'Left fleet updates',
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast mission updates to clients subscribed to specific mission
  broadcastMissionUpdate(missionId: string, update: MissionUpdate): void {
    this.server.to(`mission-${missionId}`).emit('missionUpdate', {
      ...update,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.debug(`Broadcasted mission update for ${missionId}:`, update);
  }

  // Broadcast drone position updates
  broadcastDronePosition(droneId: string, position: LatLng, missionId?: string): void {
    const positionUpdate = {
      droneId,
      position,
      timestamp: new Date().toISOString(),
    };

    // Send to specific mission room if provided
    if (missionId) {
      this.server.to(`mission-${missionId}`).emit('dronePosition', positionUpdate);
    }

    // Also send to fleet updates
    this.server.to('fleet-updates').emit('dronePosition', positionUpdate);
    
    this.logger.debug(`Broadcasted drone position for ${droneId}:`, position);
  }

  // Broadcast fleet status updates
  broadcastFleetStatus(fleetUpdate: FleetUpdate): void {
    this.server.to('fleet-updates').emit('fleetUpdate', {
      ...fleetUpdate,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.debug(`Broadcasted fleet update for ${fleetUpdate.droneId}:`, fleetUpdate);
  }

  // Broadcast system-wide notifications
  broadcastSystemNotification(notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }): void {
    this.server.emit('systemNotification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Broadcasted system notification: ${notification.title}`);
  }

  // Broadcast mission status changes to all clients
  broadcastMissionStatusChange(missionId: string, status: string, data?: any): void {
    const statusUpdate = {
      missionId,
      status,
      data,
      timestamp: new Date().toISOString(),
    };

    // Send to specific mission room
    this.server.to(`mission-${missionId}`).emit('missionStatusChange', statusUpdate);
    
    // Send to fleet updates for dashboard
    this.server.to('fleet-updates').emit('missionStatusChange', statusUpdate);
    
    this.logger.log(`Broadcasted mission status change for ${missionId}: ${status}`);
  }

  // Emergency broadcast to all connected clients
  broadcastEmergency(emergency: {
    type: 'MISSION_ABORT' | 'LOW_BATTERY' | 'CONNECTION_LOST' | 'SYSTEM_ERROR';
    missionId?: string;
    droneId?: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    this.server.emit('emergency', {
      ...emergency,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.warn(`Emergency broadcast: ${emergency.type} - ${emergency.message}`);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get clients in specific room
  getClientsInRoom(room: string): number {
    const roomClients = this.server.sockets.adapter.rooms.get(room);
    return roomClients ? roomClients.size : 0;
  }

  // Send heartbeat to maintain connections
  sendHeartbeat(): void {
    this.server.emit('heartbeat', {
      timestamp: new Date().toISOString(),
      connectedClients: this.getConnectedClientsCount(),
    });
  }
}
