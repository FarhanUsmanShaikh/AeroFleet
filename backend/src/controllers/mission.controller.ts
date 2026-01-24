import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MissionService } from '../services/mission.service';
import { MissionSimulatorService } from '../services/mission-simulator.service';
import { MissionGateway } from '../gateways/mission.gateway';
import { MissionConfigDto } from '../dto/mission-config.dto';
import { MissionControlDto } from '../dto/mission-control.dto';
import type { ApiResponse, Mission } from '../types/shared.types';

@Controller('api/missions')
export class MissionController {
  constructor(
    private readonly missionService: MissionService,
    private readonly simulatorService: MissionSimulatorService,
    private readonly missionGateway: MissionGateway,
  ) {}

  @Post()
  async createMission(@Body() config: MissionConfigDto): Promise<ApiResponse<Mission>> {
    try {
      const result = await this.missionService.createMission(config);
      
      if (result.success && result.data) {
        // Broadcast mission creation to fleet updates
        this.missionGateway.broadcastSystemNotification({
          type: 'success',
          title: 'Mission Created',
          message: `Mission "${config.name}" has been created successfully`,
          data: { missionId: result.data.id }
        });
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create mission',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async getAllMissions(): Promise<ApiResponse<Mission[]>> {
    try {
      return await this.missionService.getAllMissions();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch missions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('active')
  async getActiveMissions(): Promise<ApiResponse<Mission[]>> {
    try {
      return await this.missionService.getActiveMissions();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch active missions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getMissionById(@Param('id') id: string): Promise<ApiResponse<Mission>> {
    try {
      return await this.missionService.getMissionStatus(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch mission',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':id/control')
  async controlMission(
    @Param('id') id: string,
    @Body() body: MissionControlDto
  ): Promise<ApiResponse<Mission>> {
    try {
      const { action, reason } = body;
      let result: ApiResponse<Mission>;

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
          throw new HttpException('Invalid mission action', HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to control mission',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/waypoints')
  async getMissionWaypoints(@Param('id') id: string) {
    try {
      const result = await this.missionService.getMissionStatus(id);
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.waypoints || []
        };
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch mission waypoints',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':id/progress')
  async getMissionProgress(@Param('id') id: string) {
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
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch mission progress',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('statistics/overview')
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
        activeMissions: missions.filter(m => 
          ['STARTING', 'IN_PROGRESS', 'PAUSED'].includes(m.status)
        ).length,
        averageDuration: 0,
        completionRate: 0,
        totalFlightTime: 0,
        totalDistance: 0
      };

      const completedMissions = missions.filter(m => m.actualDuration);
      if (completedMissions.length > 0) {
        stats.averageDuration = completedMissions.reduce((sum, m) => 
          sum + (m.actualDuration || 0), 0) / completedMissions.length;
        stats.totalFlightTime = completedMissions.reduce((sum, m) => 
          sum + (m.actualDuration || 0), 0);
      }

      if (missions.length > 0) {
        stats.completionRate = (stats.completedMissions / missions.length) * 100;
        stats.totalDistance = missions.reduce((sum, m) => sum + m.distanceCovered, 0);
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch mission statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
