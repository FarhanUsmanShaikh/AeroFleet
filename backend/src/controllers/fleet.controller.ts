import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FleetService } from '../services/fleet.service';
import { MissionGateway } from '../gateways/mission.gateway';
import { CreateDroneDto, UpdateDroneStatusDto, UpdateDroneLocationDto, UpdateDroneBatteryDto } from '../dto/drone.dto';
import type { DroneFilter, ApiResponse, Drone } from '../types/shared.types';

@Controller('api/fleet')
export class FleetController {
  constructor(
    private readonly fleetService: FleetService,
    private readonly missionGateway: MissionGateway,
  ) {}

  @Get()
  async getAllDrones(@Query() filter: DroneFilter): Promise<ApiResponse<Drone[]>> {
    try {
      return await this.fleetService.getAllDrones(filter);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch drones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('available')
  async getAvailableDrones(): Promise<ApiResponse<Drone[]>> {
    try {
      return await this.fleetService.getAvailableDrones();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch available drones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics')
  async getFleetStatistics() {
    try {
      return await this.fleetService.getFleetStatistics();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch fleet statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getDroneById(@Param('id') id: string): Promise<ApiResponse<Drone>> {
    try {
      return await this.fleetService.getDroneById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch drone',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':id/status')
  async updateDroneStatus(
    @Param('id') id: string,
    @Body() body: UpdateDroneStatusDto
  ): Promise<ApiResponse<Drone>> {
    try {
      const result = await this.fleetService.updateDroneStatus(id, body.status);
      
      if (result.success && result.data) {
        // Broadcast fleet status update
        this.missionGateway.broadcastFleetStatus({
          droneId: id,
          status: body.status,
          batteryLevel: result.data.batteryLevel,
          currentLocation: result.data.currentLocation,
          lastUpdated: result.data.updatedAt
        });

        // Send system notification for maintenance status
        if (body.status === 'MAINTENANCE') {
          this.missionGateway.broadcastSystemNotification({
            type: 'warning',
            title: 'Drone Maintenance',
            message: `Drone ${result.data.name} has been set to maintenance mode`,
            data: { droneId: id }
          });
        }
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update drone status',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/location')
  async updateDroneLocation(
    @Param('id') id: string,
    @Body() body: UpdateDroneLocationDto
  ): Promise<ApiResponse<Drone>> {
    try {
      const location = { latitude: body.latitude, longitude: body.longitude };
      const result = await this.fleetService.updateDroneLocation(id, location);
      
      if (result.success) {
        // Broadcast drone position update
        this.missionGateway.broadcastDronePosition(id, location);
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update drone location',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/battery')
  async updateDroneBattery(
    @Param('id') id: string,
    @Body() body: UpdateDroneBatteryDto
  ): Promise<ApiResponse<Drone>> {
    try {
      const result = await this.fleetService.updateDroneBattery(id, body.batteryLevel);
      
      if (result.success && result.data) {
        // Broadcast fleet status update
        this.missionGateway.broadcastFleetStatus({
          droneId: id,
          status: result.data.status,
          batteryLevel: body.batteryLevel,
          currentLocation: result.data.currentLocation,
          lastUpdated: result.data.updatedAt
        });

        // Send low battery warning
        if (body.batteryLevel <= 20) {
          this.missionGateway.broadcastEmergency({
            type: 'LOW_BATTERY',
            droneId: id,
            message: `Drone ${result.data.name} has low battery: ${body.batteryLevel}%`,
            severity: body.batteryLevel <= 10 ? 'critical' : 'high'
          });
        }
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update drone battery',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post()
  async createDrone(@Body() droneData: CreateDroneDto): Promise<ApiResponse<Drone>> {
    try {
      const createData = {
        name: droneData.name,
        model: droneData.model,
        currentLocation: droneData.currentLatitude && droneData.currentLongitude ? {
          latitude: droneData.currentLatitude,
          longitude: droneData.currentLongitude
        } : undefined,
        maxFlightTime: droneData.maxFlightTime,
        maxSpeed: droneData.maxSpeed
      };
      
      const result = await this.fleetService.createDrone(createData);
      
      if (result.success && result.data) {
        // Broadcast system notification
        this.missionGateway.broadcastSystemNotification({
          type: 'success',
          title: 'Drone Added',
          message: `New drone "${droneData.name}" has been added to the fleet`,
          data: { droneId: result.data.id }
        });

        // Broadcast fleet update
        this.missionGateway.broadcastFleetStatus({
          droneId: result.data.id,
          status: result.data.status,
          batteryLevel: result.data.batteryLevel,
          currentLocation: result.data.currentLocation,
          lastUpdated: result.data.updatedAt
        });
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create drone',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('seed')
  async seedSampleDrones(): Promise<ApiResponse<Drone[]>> {
    try {
      const result = await this.fleetService.seedSampleDrones();
      
      if (result.success && result.data) {
        // Broadcast system notification
        this.missionGateway.broadcastSystemNotification({
          type: 'info',
          title: 'Fleet Initialized',
          message: `Sample drone fleet has been initialized with ${result.data.length} drones`,
        });

        // Broadcast fleet updates for each drone
        result.data.forEach(drone => {
          this.missionGateway.broadcastFleetStatus({
            droneId: drone.id,
            status: drone.status,
            batteryLevel: drone.batteryLevel,
            currentLocation: drone.currentLocation,
            lastUpdated: drone.updatedAt
          });
        });
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to seed sample drones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/missions')
  async getDroneMissions(@Param('id') id: string) {
    try {
      const result = await this.fleetService.getDroneById(id);
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.missions || []
        };
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch drone missions',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
