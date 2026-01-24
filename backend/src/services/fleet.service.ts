import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drone } from '../entities/drone.entity';
import { DroneStatus, DroneFilter, ApiResponse, LatLng } from '../types/shared.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
  ) {}

  async getAllDrones(filter?: DroneFilter): Promise<ApiResponse<Drone[]>> {
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDroneById(id: string): Promise<ApiResponse<Drone>> {
    try {
      const drone = await this.droneRepository.findOne({
        where: { id },
        relations: ['missions']
      });

      if (!drone) {
        throw new NotFoundException('Drone not found');
      }

      return {
        success: true,
        data: drone
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateDroneStatus(id: string, status: DroneStatus): Promise<ApiResponse<Drone>> {
    try {
      const drone = await this.droneRepository.findOne({ where: { id } });

      if (!drone) {
        throw new NotFoundException('Drone not found');
      }

      drone.status = status;
      drone.updatedAt = new Date();
      
      const updatedDrone = await this.droneRepository.save(drone);

      return {
        success: true,
        data: updatedDrone,
        message: 'Drone status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateDroneLocation(id: string, location: LatLng): Promise<ApiResponse<Drone>> {
    try {
      const drone = await this.droneRepository.findOne({ where: { id } });

      if (!drone) {
        throw new NotFoundException('Drone not found');
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateDroneBattery(id: string, batteryLevel: number): Promise<ApiResponse<Drone>> {
    try {
      const drone = await this.droneRepository.findOne({ where: { id } });

      if (!drone) {
        throw new NotFoundException('Drone not found');
      }

      // Validate battery level
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAvailableDrones(): Promise<ApiResponse<Drone[]>> {
    try {
      const drones = await this.droneRepository.find({
        where: { status: 'AVAILABLE' },
        order: { name: 'ASC' }
      });

      return {
        success: true,
        data: drones
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createDrone(droneData: {
    name: string;
    model: string;
    currentLocation?: LatLng;
    maxFlightTime?: number;
    maxSpeed?: number;
  }): Promise<ApiResponse<Drone>> {
    try {
      const drone = this.droneRepository.create({
        id: uuidv4(),
        name: droneData.name,
        model: droneData.model,
        status: 'AVAILABLE',
        batteryLevel: 100,
        currentLatitude: droneData.currentLocation?.latitude,
        currentLongitude: droneData.currentLocation?.longitude,
        maxFlightTime: droneData.maxFlightTime || 1800, // 30 minutes default
        maxSpeed: droneData.maxSpeed || 15, // 15 m/s default
      });

      const savedDrone = await this.droneRepository.save(drone);

      return {
        success: true,
        data: savedDrone,
        message: 'Drone created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async seedSampleDrones(): Promise<ApiResponse<Drone[]>> {
    try {
      // Check if drones already exist
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
          currentLocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
          maxFlightTime: 2700, // 45 minutes
          maxSpeed: 17
        },
        {
          name: 'Eagle-02',
          model: 'DJI Phantom 4 RTK',
          currentLocation: { latitude: 37.7849, longitude: -122.4094 },
          maxFlightTime: 1800, // 30 minutes
          maxSpeed: 15
        },
        {
          name: 'Hawk-03',
          model: 'Autel EVO II Pro',
          currentLocation: { latitude: 37.7649, longitude: -122.4294 },
          maxFlightTime: 2400, // 40 minutes
          maxSpeed: 16
        },
        {
          name: 'Raven-04',
          model: 'DJI Mavic 3 Enterprise',
          currentLocation: { latitude: 37.7549, longitude: -122.4394 },
          maxFlightTime: 2100, // 35 minutes
          maxSpeed: 14
        },
        {
          name: 'Osprey-05',
          model: 'Parrot ANAFI USA',
          currentLocation: { latitude: 37.7949, longitude: -122.3994 },
          maxFlightTime: 1920, // 32 minutes
          maxSpeed: 13
        }
      ];

      const createdDrones: Drone[] = [];

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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFleetStatistics(): Promise<ApiResponse<{
    total: number;
    available: number;
    inMission: number;
    maintenance: number;
    averageBatteryLevel: number;
  }>> {
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
