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
var MissionSimulatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionSimulatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mission_entity_1 = require("../entities/mission.entity");
const drone_entity_1 = require("../entities/drone.entity");
const waypoint_entity_1 = require("../entities/waypoint.entity");
const mission_service_1 = require("./mission.service");
const fleet_service_1 = require("./fleet.service");
let MissionSimulatorService = MissionSimulatorService_1 = class MissionSimulatorService {
    missionRepository;
    droneRepository;
    waypointRepository;
    missionService;
    fleetService;
    logger = new common_1.Logger(MissionSimulatorService_1.name);
    activeSimulations = new Map();
    UPDATE_INTERVAL = 2000;
    BATTERY_CONSUMPTION_RATE = 0.5;
    constructor(missionRepository, droneRepository, waypointRepository, missionService, fleetService) {
        this.missionRepository = missionRepository;
        this.droneRepository = droneRepository;
        this.waypointRepository = waypointRepository;
        this.missionService = missionService;
        this.fleetService = fleetService;
    }
    async startSimulation(missionId) {
        try {
            if (this.activeSimulations.has(missionId)) {
                this.logger.warn(`Simulation already running for mission ${missionId}`);
                return;
            }
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone', 'waypoints']
            });
            if (!mission) {
                throw new Error('Mission not found');
            }
            if (mission.status !== 'STARTING' && mission.status !== 'IN_PROGRESS') {
                throw new Error('Mission is not in a state that can be simulated');
            }
            if (mission.status === 'STARTING') {
                mission.status = 'IN_PROGRESS';
                await this.missionRepository.save(mission);
            }
            const simulation = {
                missionId,
                intervalId: null,
                startTime: Date.now(),
                lastUpdateTime: Date.now()
            };
            simulation.intervalId = setInterval(async () => {
                await this.updateMissionProgress(missionId);
            }, this.UPDATE_INTERVAL);
            this.activeSimulations.set(missionId, simulation);
            this.logger.log(`Started simulation for mission ${missionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to start simulation for mission ${missionId}:`, error);
            throw error;
        }
    }
    async pauseSimulation(missionId) {
        const simulation = this.activeSimulations.get(missionId);
        if (simulation && simulation.intervalId) {
            clearInterval(simulation.intervalId);
            this.activeSimulations.delete(missionId);
            this.logger.log(`Paused simulation for mission ${missionId}`);
        }
    }
    async resumeSimulation(missionId) {
        await this.startSimulation(missionId);
    }
    async stopSimulation(missionId) {
        const simulation = this.activeSimulations.get(missionId);
        if (simulation && simulation.intervalId) {
            clearInterval(simulation.intervalId);
            this.activeSimulations.delete(missionId);
            this.logger.log(`Stopped simulation for mission ${missionId}`);
        }
    }
    async updateMissionProgress(missionId) {
        try {
            const mission = await this.missionRepository.findOne({
                where: { id: missionId },
                relations: ['drone', 'waypoints']
            });
            if (!mission || mission.status !== 'IN_PROGRESS') {
                await this.stopSimulation(missionId);
                return;
            }
            const simulation = this.activeSimulations.get(missionId);
            if (!simulation)
                return;
            const now = Date.now();
            const elapsedTime = (now - simulation.startTime) / 1000;
            const deltaTime = (now - simulation.lastUpdateTime) / 1000;
            const progressPercentage = mission.estimatedDuration > 0 ?
                Math.min(100, (elapsedTime / mission.estimatedDuration) * 100) : 0;
            const targetWaypointIndex = Math.floor((progressPercentage / 100) * mission.totalWaypoints);
            const currentWaypointIndex = Math.min(targetWaypointIndex, mission.totalWaypoints - 1);
            const sortedWaypoints = mission.waypoints.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
            let dronePosition;
            if (currentWaypointIndex < sortedWaypoints.length) {
                const currentWaypoint = sortedWaypoints[currentWaypointIndex];
                dronePosition = {
                    latitude: currentWaypoint.latitude,
                    longitude: currentWaypoint.longitude
                };
                if (!currentWaypoint.completed) {
                    currentWaypoint.completed = true;
                    currentWaypoint.completedAt = new Date();
                    await this.waypointRepository.save(currentWaypoint);
                }
            }
            else {
                const lastWaypoint = sortedWaypoints[sortedWaypoints.length - 1];
                dronePosition = {
                    latitude: lastWaypoint.latitude,
                    longitude: lastWaypoint.longitude
                };
            }
            const flightTimeMinutes = elapsedTime / 60;
            const batteryConsumed = flightTimeMinutes * this.BATTERY_CONSUMPTION_RATE;
            const currentBatteryLevel = Math.max(0, mission.drone.batteryLevel - batteryConsumed);
            if (currentBatteryLevel <= 20 && mission.status === 'IN_PROGRESS') {
                await this.missionService.abortMission(missionId, 'Low battery - automatic safety abort');
                await this.stopSimulation(missionId);
                return;
            }
            mission.progress = progressPercentage;
            mission.currentWaypointIndex = currentWaypointIndex;
            mission.distanceCovered = this.calculateDistanceCovered(sortedWaypoints, currentWaypointIndex);
            await this.missionRepository.save(mission);
            await this.fleetService.updateDroneLocation(mission.droneId, dronePosition);
            await this.fleetService.updateDroneBattery(mission.droneId, currentBatteryLevel);
            if (progressPercentage >= 100) {
                mission.status = 'COMPLETED';
                mission.completedAt = new Date();
                mission.actualDuration = Math.floor(elapsedTime);
                await this.missionRepository.save(mission);
                mission.drone.status = 'AVAILABLE';
                await this.droneRepository.save(mission.drone);
                await this.generateCompletionReport(mission);
                await this.stopSimulation(missionId);
                this.logger.log(`Mission ${missionId} completed successfully`);
            }
            simulation.lastUpdateTime = now;
        }
        catch (error) {
            this.logger.error(`Error updating mission progress for ${missionId}:`, error);
        }
    }
    calculateDistanceCovered(waypoints, currentIndex) {
        if (currentIndex <= 0 || waypoints.length === 0)
            return 0;
        let totalDistance = 0;
        for (let i = 1; i <= Math.min(currentIndex, waypoints.length - 1); i++) {
            const prev = waypoints[i - 1];
            const curr = waypoints[i];
            totalDistance += this.calculateDistance({ latitude: prev.latitude, longitude: prev.longitude }, { latitude: curr.latitude, longitude: curr.longitude });
        }
        return totalDistance;
    }
    calculateDistance(point1, point2) {
        const R = 6371000;
        const dLat = this.toRadians(point2.latitude - point1.latitude);
        const dLng = this.toRadians(point2.longitude - point1.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    async generateCompletionReport(mission) {
        this.logger.log(`Generating completion report for mission ${mission.id}`);
    }
    async stopAllSimulations() {
        for (const [missionId, simulation] of this.activeSimulations) {
            if (simulation.intervalId) {
                clearInterval(simulation.intervalId);
            }
            this.logger.log(`Stopped simulation for mission ${missionId}`);
        }
        this.activeSimulations.clear();
    }
    getActiveSimulationsCount() {
        return this.activeSimulations.size;
    }
    isSimulationActive(missionId) {
        return this.activeSimulations.has(missionId);
    }
};
exports.MissionSimulatorService = MissionSimulatorService;
exports.MissionSimulatorService = MissionSimulatorService = MissionSimulatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mission_entity_1.Mission)),
    __param(1, (0, typeorm_1.InjectRepository)(drone_entity_1.Drone)),
    __param(2, (0, typeorm_1.InjectRepository)(waypoint_entity_1.Waypoint)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mission_service_1.MissionService,
        fleet_service_1.FleetService])
], MissionSimulatorService);
//# sourceMappingURL=mission-simulator.service.js.map