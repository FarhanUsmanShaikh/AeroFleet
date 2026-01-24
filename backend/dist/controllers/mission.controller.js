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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionController = void 0;
const common_1 = require("@nestjs/common");
const mission_service_1 = require("../services/mission.service");
const mission_simulator_service_1 = require("../services/mission-simulator.service");
const mission_gateway_1 = require("../gateways/mission.gateway");
const mission_config_dto_1 = require("../dto/mission-config.dto");
const mission_control_dto_1 = require("../dto/mission-control.dto");
let MissionController = class MissionController {
    missionService;
    simulatorService;
    missionGateway;
    constructor(missionService, simulatorService, missionGateway) {
        this.missionService = missionService;
        this.simulatorService = simulatorService;
        this.missionGateway = missionGateway;
    }
    async createMission(config) {
        try {
            const result = await this.missionService.createMission(config);
            if (result.success && result.data) {
                this.missionGateway.broadcastSystemNotification({
                    type: 'success',
                    title: 'Mission Created',
                    message: `Mission "${config.name}" has been created successfully`,
                    data: { missionId: result.data.id }
                });
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create mission', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getAllMissions() {
        try {
            return await this.missionService.getAllMissions();
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch missions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getActiveMissions() {
        try {
            return await this.missionService.getActiveMissions();
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch active missions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMissionById(id) {
        try {
            return await this.missionService.getMissionStatus(id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch mission', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async controlMission(id, body) {
        try {
            const { action, reason } = body;
            let result;
            switch (action) {
                case 'START':
                    result = await this.missionService.startMission(id);
                    if (result.success && result.data) {
                        await this.simulatorService.startSimulation(id);
                        this.missionGateway.broadcastMissionStatusChange(id, 'STARTING', result.data);
                    }
                    break;
                case 'PAUSE':
                    result = await this.missionService.pauseMission(id);
                    if (result.success && result.data) {
                        await this.simulatorService.pauseSimulation(id);
                        this.missionGateway.broadcastMissionStatusChange(id, 'PAUSED', result.data);
                    }
                    break;
                case 'RESUME':
                    result = await this.missionService.resumeMission(id);
                    if (result.success && result.data) {
                        await this.simulatorService.resumeSimulation(id);
                        this.missionGateway.broadcastMissionStatusChange(id, 'IN_PROGRESS', result.data);
                    }
                    break;
                case 'ABORT':
                    result = await this.missionService.abortMission(id, reason);
                    if (result.success && result.data) {
                        await this.simulatorService.stopSimulation(id);
                        this.missionGateway.broadcastMissionStatusChange(id, 'ABORTED', result.data);
                        this.missionGateway.broadcastSystemNotification({
                            type: 'warning',
                            title: 'Mission Aborted',
                            message: `Mission has been aborted${reason ? `: ${reason}` : ''}`,
                            data: { missionId: id, reason }
                        });
                    }
                    break;
                default:
                    throw new common_1.HttpException('Invalid mission action', common_1.HttpStatus.BAD_REQUEST);
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to control mission', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getMissionWaypoints(id) {
        try {
            const result = await this.missionService.getMissionStatus(id);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data.waypoints || []
                };
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch mission waypoints', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getMissionProgress(id) {
        try {
            const result = await this.missionService.getMissionStatus(id);
            if (result.success && result.data) {
                const mission = result.data;
                return {
                    success: true,
                    data: {
                        missionId: mission.id,
                        status: mission.status,
                        progress: mission.progress,
                        currentWaypointIndex: mission.currentWaypointIndex,
                        totalWaypoints: mission.totalWaypoints,
                        estimatedTimeRemaining: mission.estimatedTimeRemaining,
                        distanceCovered: mission.distanceCovered,
                        batteryLevel: mission.drone?.batteryLevel || 0,
                        dronePosition: mission.drone?.currentLocation || null
                    }
                };
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch mission progress', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getMissionStatistics() {
        try {
            const allMissionsResult = await this.missionService.getAllMissions();
            if (!allMissionsResult.success || !allMissionsResult.data) {
                return allMissionsResult;
            }
            const missions = allMissionsResult.data;
            const stats = {
                totalMissions: missions.length,
                completedMissions: missions.filter(m => m.status === 'COMPLETED').length,
                abortedMissions: missions.filter(m => m.status === 'ABORTED').length,
                activeMissions: missions.filter(m => ['STARTING', 'IN_PROGRESS', 'PAUSED'].includes(m.status)).length,
                averageDuration: 0,
                completionRate: 0,
                totalFlightTime: 0,
                totalDistance: 0
            };
            const completedMissions = missions.filter(m => m.actualDuration);
            if (completedMissions.length > 0) {
                stats.averageDuration = completedMissions.reduce((sum, m) => sum + (m.actualDuration || 0), 0) / completedMissions.length;
                stats.totalFlightTime = completedMissions.reduce((sum, m) => sum + (m.actualDuration || 0), 0);
            }
            if (missions.length > 0) {
                stats.completionRate = (stats.completedMissions / missions.length) * 100;
                stats.totalDistance = missions.reduce((sum, m) => sum + m.distanceCovered, 0);
            }
            return {
                success: true,
                data: stats
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch mission statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.MissionController = MissionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mission_config_dto_1.MissionConfigDto]),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "createMission", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "getAllMissions", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "getActiveMissions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "getMissionById", null);
__decorate([
    (0, common_1.Put)(':id/control'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mission_control_dto_1.MissionControlDto]),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "controlMission", null);
__decorate([
    (0, common_1.Get)(':id/waypoints'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "getMissionWaypoints", null);
__decorate([
    (0, common_1.Get)(':id/progress'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "getMissionProgress", null);
__decorate([
    (0, common_1.Get)('statistics/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MissionController.prototype, "getMissionStatistics", null);
exports.MissionController = MissionController = __decorate([
    (0, common_1.Controller)('api/missions'),
    __metadata("design:paramtypes", [mission_service_1.MissionService,
        mission_simulator_service_1.MissionSimulatorService,
        mission_gateway_1.MissionGateway])
], MissionController);
//# sourceMappingURL=mission.controller.js.map