import { io, Socket } from 'socket.io-client';
import type { MissionUpdate, FleetUpdate, LatLng } from '../../../shared/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface EmergencyAlert {
  type: 'MISSION_ABORT' | 'LOW_BATTERY' | 'CONNECTION_LOST' | 'SYSTEM_ERROR';
  missionId?: string;
  droneId?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface DronePositionUpdate {
  droneId: string;
  position: LatLng;
  timestamp: string;
}

export interface MissionStatusChange {
  missionId: string;
  status: string;
  data?: any;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private listeners: { [event: string]: Function[] } = {};

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket server...');

    this.socket = io(`${WS_URL}/missions`, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting from WebSocket server...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', { clientId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connectionError', { error, attempts: this.reconnectAttempts });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.emit('reconnected', { attempts: attemptNumber });
    });

    // Mission-specific events
    this.socket.on('missionUpdate', (data: MissionUpdate & { timestamp: string }) => {
      this.emit('missionUpdate', data);
    });

    this.socket.on('missionStatusChange', (data: MissionStatusChange) => {
      this.emit('missionStatusChange', data);
    });

    // Fleet events
    this.socket.on('fleetUpdate', (data: FleetUpdate & { timestamp: string }) => {
      this.emit('fleetUpdate', data);
    });

    this.socket.on('dronePosition', (data: DronePositionUpdate) => {
      this.emit('dronePosition', data);
    });

    // System events
    this.socket.on('systemNotification', (data: SystemNotification) => {
      this.emit('systemNotification', data);
    });

    this.socket.on('emergency', (data: EmergencyAlert) => {
      this.emit('emergency', data);
    });

    // Connection events
    this.socket.on('connection', (data) => {
      console.log('WebSocket connection established:', data);
    });

    this.socket.on('heartbeat', (data) => {
      this.emit('heartbeat', data);
    });
  }

  // Mission room management
  joinMission(missionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinMission', { missionId });
      console.log(`Joined mission room: ${missionId}`);
    }
  }

  leaveMission(missionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveMission', { missionId });
      console.log(`Left mission room: ${missionId}`);
    }
  }

  // Fleet updates
  joinFleet(): void {
    if (this.socket?.connected) {
      this.socket.emit('joinFleet');
      console.log('Joined fleet updates');
    }
  }

  leaveFleet(): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveFleet');
      console.log('Left fleet updates');
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      this.listeners[event] = [];
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionId(): string | undefined {
    return this.socket?.id;
  }

  // Utility method to wait for connection
  waitForConnection(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        this.off('connected', onConnect);
        reject(new Error('WebSocket connection timeout'));
      }, timeout);

      const onConnect = () => {
        clearTimeout(timer);
        this.off('connected', onConnect);
        resolve();
      };

      this.on('connected', onConnect);
    });
  }
}

export const websocketService = new WebSocketService();
export default websocketService;