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
exports.MissionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mission_entity_1 = require("../entities/mission.entity");
const drone_entity_1 = require("../entities/drone.entity");
const waypoint_entity_1 = require("../entities/waypoint.entity");
const mission_report_entity_1 = require("../entities/mission-report.entity");
const waypoint_generator_service_1 = require("./waypoint-generator.service");
const uuid_1 = require("uuid");
let MissionService = class MissionService {
    missionRepository;
    droneRepository;
    waypointRepository;
    reportRepository;
    waypointGenerator;
    constructor(missionRepository, droneRepository, waypointRepository, reportRepository, waypointGenerator) {
        this.missionRepository = missionRepository;
        this.droneRepository = droneRepository;
        this.waypointRepository = waypointRepository;
        this.reportRepository = reportRepository;
        this.waypointGenerator = waypointGenerator;
    }
    async createMission(config) {
        try {
            const drone = await this.droneRepository.findOne({
                where: { id: config.droneId }
            });
            if (!drone) {
                throw new common_1.NotFoundException('Drone not found');
            }
            if (drone.status !== 'AVAILABLE') {
                throw new common_1.BadRequestException('Drone is not available for mission assignment');
            }
            this.validateMissionConfig(config);
            let generatedWaypoints;
            switch (config.pattern) {
                case 'GRID':
                    generatedWaypoints = this.waypointGenerator.generateGridPattern(config.surveyArea, config.altitude, config.overlapPercentage);
                    break;
                case 'CROSSHATCH':
                    generatedWaypoints = this.waypointGenerator.generateCrosshatchPattern(config.surveyArea, config.altitude, config.overlapPercentage);
                    break;
                case 'PERIMETER':
                    generatedWaypoints = this.waypointGenerator.generatePerimeterPattern(config.surveyArea, config.altitude);
                    break;
                default:
                    throw new common_1.BadRequestException('Invalid mission pattern');
            }
            const estimatedDuration = this.waypointGenerator.estimateFlightTime(generatedWaypoints, drone.maxSpeed);
            const mission = this.missionRepository.create({
                id: (0, uuid_1.v4)(),
                name: config.name,
                droneId: config.droneId,
                status: 'PLANNED',
                pattern: config.pattern,
                altitude: config.altitude,
                overlapPercentage: config.overlapPercentage,
                surveyArea: config.surveyArea,
                totalWaypoints: generatedWaypoints.length,
                currentWaypointIndex: 0,
                progress: 0,
                estimatedDuration,
                distanceCovered: 0,
            });
            const savedMission = await this.missionRepository.save(mission);
            const waypoints = generatedWaypoints.map((wp) => this.waypointRepository.create({
                id: (0, uuid_1.v4)(),
                missionId: savedMission.id,
                sequenceNumber: wp.sequenceNumber,
                latitude: wp.latitude,
                longitude: wp.longitude,
                altitude: wp.altitude,
                action: wp.action,
                completed: false,
            }));
            await this.waypointRepository.save(waypoints);
            const missionWithRelations = await this.missionRepository.findOne({
                where: { id: savedMission.id },
                relations: ['drone', 'waypoints'],
            });
            if (!missionWithRelations) {
                throw new Error('Failed to load created mission');
            }
            return {
                success: true,
                data: missionWithRelations,
                message: 'Mission created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async startMission(missionId) {
        try {
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone']
            });
            if (!mission) {
                throw new common_1.NotFoundException('Mission not found');
            }
            if (mission.status !== 'PLANNED') {
                throw new common_1.BadRequestException('Mission cannot be started from current status');
            }
            if (mission.drone.status !== 'AVAILABLE') {
                throw new common_1.BadRequestException('Drone is not available');
            }
            mission.status = 'STARTING';
            mission.startedAt = new Date();
            await this.missionRepository.save(mission);
            mission.drone.status = 'IN_MISSION';
            await this.droneRepository.save(mission.drone);
            return {
                success: true,
                data: mission,
                message: 'Mission started successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async pauseMission(missionId) {
        try {
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone']
            });
            if (!mission) {
                throw new common_1.NotFoundException('Mission not found');
            }
            if (mission.status !== 'IN_PROGRESS') {
                throw new common_1.BadRequestException('Mission cannot be paused from current status');
            }
            mission.status = 'PAUSED';
            await this.missionRepository.save(mission);
            return {
                success: true,
                data: mission,
                message: 'Mission paused successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async resumeMission(missionId) {
        try {
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone']
            });
            if (!mission) {
                throw new common_1.NotFoundException('Mission not found');
            }
            if (mission.status !== 'PAUSED') {
                throw new common_1.BadRequestException('Mission cannot be resumed from current status');
            }
            mission.status = 'IN_PROGRESS';
            await this.missionRepository.save(mission);
            return {
                success: true,
                data: mission,
                message: 'Mission resumed successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async abortMission(missionId, reason) {
        try {
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone', 'waypoints']
            });
            if (!mission) {
                throw new common_1.NotFoundException('Mission not found');
            }
            if (!['STARTING', 'IN_PROGRESS', 'PAUSED'].includes(mission.status)) {
                throw new common_1.BadRequestException('Mission cannot be aborted from current status');
            }
            mission.status = 'ABORTED';
            mission.completedAt = new Date();
            mission.actualDuration = mission.startedAt ?
                Math.floor((Date.now() - mission.startedAt.getTime()) / 1000) : 0;
            await this.missionRepository.save(mission);
            mission.drone.status = 'AVAILABLE';
            await this.droneRepository.save(mission.drone);
            await this.generateMissionReport(mission, reason);
            return {
                success: true,
                data: mission,
                message: 'Mission aborted successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getMissionStatus(missionId) {
        try {
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone', 'waypoints']
            });
            if (!mission) {
                throw new common_1.NotFoundException('Mission not found');
            }
            return {
                success: true,
                data: mission
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getActiveMissions() {
        try {
            const missions = await this.missionRepository.find({
                where: [
                    { status: 'STARTING' },
                    { status: 'IN_PROGRESS' },
                    { status: 'PAUSED' }
                ],
                relations: ['drone', 'waypoints'],
                order: { createdAt: 'DESC' }
            });
            return {
                success: true,
                data: missions
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getAllMissions() {
        try {
            const missions = await this.missionRepository.find({
                relations: ['drone'],
                order: { createdAt: 'DESC' }
            });
            return {
                success: true,
                data: missions
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    validateMissionConfig(config) {
        if (config.altitude < 10 || config.altitude > 400) {
            throw new common_1.BadRequestException('Altitude must be between 10 and 400 meters');
        }
        if (config.overlapPercentage < 10 || config.overlapPercentage > 90) {
            throw new common_1.BadRequestException('Overlap percentage must be between 10 and 90');
        }
        if (!config.surveyArea || !config.surveyArea.coordinates || config.surveyArea.coordinates.length < 3) {
            throw new common_1.BadRequestException('Survey area must have at least 3 coordinates');
        }
        if (!config.name || config.name.trim().length === 0 || config.name.length > 255) {
            throw new common_1.BadRequestException('Mission name must be between 1 and 255 characters');
        }
    }
    async generateMissionReport(mission, abortReason) {
        const completedWaypoints = mission.waypoints?.filter(wp => wp.completed).length || 0;
        const coveragePercentage = mission.totalWaypoints > 0 ?
            (completedWaypoints / mission.totalWaypoints) * 100 : 0;
        const batteryConsumed = mission.actualDuration ?
            Math.min(100, (mission.actualDuration / mission.drone.maxFlightTime) * 100) : 0;
        const report = this.reportRepository.create({
            id: (0, uuid_1.v4)(),
            missionId: mission.id,
            totalFlightDuration: mission.actualDuration || 0,
            distanceCovered: mission.distanceCovered,
            coveragePercentage,
            finalStatus: mission.status === 'COMPLETED' ? 'COMPLETED' : 'ABORTED',
            abortReason,
            waypointsCompleted: completedWaypoints,
            batteryConsumed,
        });
        await this.reportRepository.save(report);
    }
};
exports.MissionService = MissionService;
exports.MissionService = MissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mission_entity_1.Mission)),
    __param(1, (0, typeorm_1.InjectRepository)(drone_entity_1.Drone)),
    __param(2, (0, typeorm_1.InjectRepository)(waypoint_entity_1.Waypoint)),
    __param(3, (0, typeorm_1.InjectRepository)(mission_report_entity_1.MissionReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        waypoint_generator_service_1.WaypointGeneratorService])
], MissionService);
//# sourceMappingURL=mission.service.js.map