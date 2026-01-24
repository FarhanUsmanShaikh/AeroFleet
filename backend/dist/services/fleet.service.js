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
exports.FleetService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const drone_entity_1 = require("../entities/drone.entity");
const uuid_1 = require("uuid");
let FleetService = class FleetService {
    droneRepository;
    constructor(droneRepository) {
        this.droneRepository = droneRepository;
    }
    async getAllDrones(filter) {
        try {
            const queryBuilder = this.droneRepository.createQueryBuilder('drone');
            if (filter?.status) {
                queryBuilder.andWhere('drone.status = :status', { status: filter.status });
            }
            if (filter?.model) {
                queryBuilder.andWhere('drone.model LIKE :model', { model: `%${filter.model}%` });
            }
            const drones = await queryBuilder
                .orderBy('drone.name', 'ASC')
                .getMany();
            return {
                success: true,
                data: drones
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getDroneById(id) {
        try {
            const drone = await this.droneRepository.findOne({
                where: { id },
                relations: ['missions']
            });
            if (!drone) {
                throw new common_1.NotFoundException('Drone not found');
            }
            return {
                success: true,
                data: drone
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async updateDroneStatus(id, status) {
        try {
            const drone = await this.droneRepository.findOne({ where: { id } });
            if (!drone) {
                throw new common_1.NotFoundException('Drone not found');
            }
            drone.status = status;
            drone.updatedAt = new Date();
            const updatedDrone = await this.droneRepository.save(drone);
            return {
                success: true,
                data: updatedDrone,
                message: 'Drone status updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async updateDroneLocation(id, location) {
        try {
            const drone = await this.droneRepository.findOne({ where: { id } });
            if (!drone) {
                throw new common_1.NotFoundException('Drone not found');
            }
            drone.currentLatitude = location.latitude;
            drone.currentLongitude = location.longitude;
            drone.updatedAt = new Date();
            const updatedDrone = await this.droneRepository.save(drone);
            return {
                success: true,
                data: updatedDrone,
                message: 'Drone location updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async updateDroneBattery(id, batteryLevel) {
        try {
            const drone = await this.droneRepository.findOne({ where: { id } });
            if (!drone) {
                throw new common_1.NotFoundException('Drone not found');
            }
            if (batteryLevel < 0 || batteryLevel > 100) {
                throw new Error('Battery level must be between 0 and 100');
            }
            drone.batteryLevel = batteryLevel;
            drone.updatedAt = new Date();
            const updatedDrone = await this.droneRepository.save(drone);
            return {
                success: true,
                data: updatedDrone,
                message: 'Drone battery level updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getAvailableDrones() {
        try {
            const drones = await this.droneRepository.find({
                where: { status: 'AVAILABLE' },
                order: { name: 'ASC' }
            });
            return {
                success: true,
                data: drones
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async createDrone(droneData) {
        try {
            const drone = this.droneRepository.create({
                id: (0, uuid_1.v4)(),
                name: droneData.name,
                model: droneData.model,
                status: 'AVAILABLE',
                batteryLevel: 100,
                currentLatitude: droneData.currentLocation?.latitude,
                currentLongitude: droneData.currentLocation?.longitude,
                maxFlightTime: droneData.maxFlightTime || 1800,
                maxSpeed: droneData.maxSpeed || 15,
            });
            const savedDrone = await this.droneRepository.save(drone);
            return {
                success: true,
                data: savedDrone,
                message: 'Drone created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async seedSampleDrones() {
        try {
            const existingDrones = await this.droneRepository.count();
            if (existingDrones > 0) {
                const drones = await this.droneRepository.find();
                return {
                    success: true,
                    data: drones,
                    message: 'Sample drones already exist'
                };
            }
            const sampleDrones = [
                {
                    name: 'Falcon-01',
                    model: 'DJI Matrice 300 RTK',
                    currentLocation: { latitude: 37.7749, longitude: -122.4194 },
                    maxFlightTime: 2700,
                    maxSpeed: 17
                },
                {
                    name: 'Eagle-02',
                    model: 'DJI Phantom 4 RTK',
                    currentLocation: { latitude: 37.7849, longitude: -122.4094 },
                    maxFlightTime: 1800,
                    maxSpeed: 15
                },
                {
                    name: 'Hawk-03',
                    model: 'Autel EVO II Pro',
                    currentLocation: { latitude: 37.7649, longitude: -122.4294 },
                    maxFlightTime: 2400,
                    maxSpeed: 16
                },
                {
                    name: 'Raven-04',
                    model: 'DJI Mavic 3 Enterprise',
                    currentLocation: { latitude: 37.7549, longitude: -122.4394 },
                    maxFlightTime: 2100,
                    maxSpeed: 14
                },
                {
                    name: 'Osprey-05',
                    model: 'Parrot ANAFI USA',
                    currentLocation: { latitude: 37.7949, longitude: -122.3994 },
                    maxFlightTime: 1920,
                    maxSpeed: 13
                }
            ];
            const createdDrones = [];
            for (const droneData of sampleDrones) {
                const result = await this.createDrone(droneData);
                if (result.success && result.data) {
                    createdDrones.push(result.data);
                }
            }
            return {
                success: true,
                data: createdDrones,
                message: 'Sample drones created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getFleetStatistics() {
        try {
            const drones = await this.droneRepository.find();
            const stats = {
                total: drones.length,
                available: drones.filter(d => d.status === 'AVAILABLE').length,
                inMission: drones.filter(d => d.status === 'IN_MISSION').length,
                maintenance: drones.filter(d => d.status === 'MAINTENANCE').length,
                averageBatteryLevel: drones.length > 0 ?
                    drones.reduce((sum, d) => sum + d.batteryLevel, 0) / drones.length : 0
            };
            return {
                success: true,
                data: stats
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(drone_entity_1.Drone)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FleetService);
//# sourceMappingURL=fleet.service.js.map