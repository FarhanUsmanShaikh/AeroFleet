"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MissionGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let MissionGateway = MissionGateway_1 = class MissionGateway {
    server;
    logger = new common_1.Logger(MissionGateway_1.name);
    connectedClients = new Map();
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);
        client.emit('connection', {
            message: 'Connected to Drone Survey Management System',
            clientId: client.id,
            timestamp: new Date().toISOString(),
        });
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    handleJoinMission(client, data) {
        const { missionId } = data;
        client.join(`mission-${missionId}`);
        this.logger.log(`Client ${client.id} joined mission room: ${missionId}`);
        client.emit('joinedMission', {
            missionId,
            message: `Joined mission ${missionId} updates`,
            timestamp: new Date().toISOString(),
        });
    }
    handleLeaveMission(client, data) {
        const { missionId } = data;
        client.leave(`mission-${missionId}`);
        this.logger.log(`Client ${client.id} left mission room: ${missionId}`);
        client.emit('leftMission', {
            missionId,
            message: `Left mission ${missionId} updates`,
            timestamp: new Date().toISOString(),
        });
    }
    handleJoinFleet(client) {
        client.join('fleet-updates');
        this.logger.log(`Client ${client.id} joined fleet updates`);
        client.emit('joinedFleet', {
            message: 'Joined fleet updates',
            timestamp: new Date().toISOString(),
        });
    }
    handleLeaveFleet(client) {
        client.leave('fleet-updates');
        this.logger.log(`Client ${client.id} left fleet updates`);
        client.emit('leftFleet', {
            message: 'Left fleet updates',
            timestamp: new Date().toISOString(),
        });
    }
    broadcastMissionUpdate(missionId, update) {
        this.server.to(`mission-${missionId}`).emit('missionUpdate', {
            ...update,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Broadcasted mission update for ${missionId}:`, update);
    }
    broadcastDronePosition(droneId, position, missionId) {
        const positionUpdate = {
            droneId,
            position,
            timestamp: new Date().toISOString(),
        };
        if (missionId) {
            this.server.to(`mission-${missionId}`).emit('dronePosition', positionUpdate);
        }
        this.server.to('fleet-updates').emit('dronePosition', positionUpdate);
        this.logger.debug(`Broadcasted drone position for ${droneId}:`, position);
    }
    broadcastFleetStatus(fleetUpdate) {
        this.server.to('fleet-updates').emit('fleetUpdate', {
            ...fleetUpdate,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Broadcasted fleet update for ${fleetUpdate.droneId}:`, fleetUpdate);
    }
    broadcastSystemNotification(notification) {
        this.server.emit('systemNotification', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Broadcasted system notification: ${notification.title}`);
    }
    broadcastMissionStatusChange(missionId, status, data) {
        const statusUpdate = {
            missionId,
            status,
            data,
            timestamp: new Date().toISOString(),
        };
        this.server.to(`mission-${missionId}`).emit('missionStatusChange', statusUpdate);
        this.server.to('fleet-updates').emit('missionStatusChange', statusUpdate);
        this.logger.log(`Broadcasted mission status change for ${missionId}: ${status}`);
    }
    broadcastEmergency(emergency) {
        this.server.emit('emergency', {
            ...emergency,
            timestamp: new Date().toISOString(),
        });
        this.logger.warn(`Emergency broadcast: ${emergency.type} - ${emergency.message}`);
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    getClientsInRoom(room) {
        const roomClients = this.server.sockets.adapter.rooms.get(room);
        return roomClients ? roomClients.size : 0;
    }
    sendHeartbeat() {
        this.server.emit('heartbeat', {
            timestamp: new Date().toISOString(),
            connectedClients: this.getConnectedClientsCount(),
        });
    }
};
exports.MissionGateway = MissionGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MissionGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinMission'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MissionGateway.prototype, "handleJoinMission", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveMission'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MissionGateway.prototype, "handleLeaveMission", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinFleet'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MissionGateway.prototype, "handleJoinFleet", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveFleet'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MissionGateway.prototype, "handleLeaveFleet", null);
exports.MissionGateway = MissionGateway = MissionGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        namespace: '/missions',
    })
], MissionGateway);
//# sourceMappingURL=mission.gateway.js.map