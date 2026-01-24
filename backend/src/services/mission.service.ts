import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { Drone } from '../entities/drone.entity';
import { Waypoint } from '../entities/waypoint.entity';
import { MissionReport } from '../entities/mission-report.entity';
import { WaypointGeneratorService } from './waypoint-generator.service';
import { MissionConfig, ApiResponse, Waypoint as WaypointType } from '../types/shared.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MissionService {
  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(Waypoint)
    private waypointRepository: Repository<Waypoint>,
    @InjectRepository(MissionReport)
    private reportRepository: Repository<MissionReport>,
    private waypointGenerator: WaypointGeneratorService,
  ) {}

  async createMission(config: MissionConfig): Promise<ApiResponse<Mission>> {
    try {
      // Validate drone availability
      const drone = await this.droneRepository.findOne({ 
        where: { id: config.droneId } 
      });
      
      if (!drone) {
        throw new NotFoundException('Drone not found');
      }
      
      if (drone.status !== 'AVAILABLE') {
        throw new BadRequestException('Drone is not available for mission assignment');
      }

      // Validate mission parameters
      this.validateMissionConfig(config);

      // Generate waypoints based on pattern
      let generatedWaypoints: Omit<WaypointType, 'id' | 'missionId' | 'completed' | 'completedAt'>[];
      switch (config.pattern) {
        case 'GRID':
          generatedWaypoints = this.waypointGenerator.generateGridPattern(
            config.surveyArea, 
            config.altitude, 
            config.overlapPercentage
          );
          break;
        case 'CROSSHATCH':
          generatedWaypoints = this.waypointGenerator.generateCrosshatchPattern(
            config.surveyArea, 
            config.altitude, 
            config.overlapPercentage
          );
          break;
        case 'PERIMETER':
          generatedWaypoints = this.waypointGenerator.generatePerimeterPattern(
            config.surveyArea, 
            config.altitude
          );
          break;
        default:
          throw new BadRequestException('Invalid mission pattern');
      }

      // Calculate mission estimates
      const estimatedDuration = this.waypointGenerator.estimateFlightTime(generatedWaypoints, drone.maxSpeed);

      // Create mission
      const mission = this.missionRepository.create({
        id: uuidv4(),
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

      // Create waypoints
      const waypoints = generatedWaypoints.map((wp: Omit<WaypointType, 'id' | 'missionId' | 'completed' | 'completedAt'>) => 
        this.waypointRepository.create({
          id: uuidv4(),
          missionId: savedMission.id,
          sequenceNumber: wp.sequenceNumber,
          latitude: wp.latitude,
          longitude: wp.longitude,
          altitude: wp.altitude,
          action: wp.action,
          completed: false,
        })
      );

      await this.waypointRepository.save(waypoints);

      // Load mission with relations
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async startMission(missionId: string): Promise<ApiResponse<Mission>> {
    try {
      const mission = await this.missionRepository.findOne({
        where: { id: missionId },
        relations: ['drone']
      });

      if (!mission) {
        throw new NotFoundException('Mission not found');
      }

      if (mission.status !== 'PLANNED') {
        throw new BadRequestException('Mission cannot be started from current status');
      }

      if (mission.drone.status !== 'AVAILABLE') {
        throw new BadRequestException('Drone is not available');
      }

      // Update mission status
      mission.status = 'STARTING';
      mission.startedAt = new Date();
      await this.missionRepository.save(mission);

      // Update drone status
      mission.drone.status = 'IN_MISSION';
      await this.droneRepository.save(mission.drone);

      return {
        success: true,
        data: mission,
        message: 'Mission started successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async pauseMission(missionId: string): Promise<ApiResponse<Mission>> {
    try {
      const mission = await this.missionRepository.findOne({
        where: { id: missionId },
        relations: ['drone']
      });

      if (!mission) {
        throw new NotFoundException('Mission not found');
      }

      if (mission.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Mission cannot be paused from current status');
      }

      mission.status = 'PAUSED';
      await this.missionRepository.save(mission);

      return {
        success: true,
        data: mission,
        message: 'Mission paused successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async resumeMission(missionId: string): Promise<ApiResponse<Mission>> {
    try {
      const mission = await this.missionRepository.findOne({
        where: { id: missionId },
        relations: ['drone']
      });

      if (!mission) {
        throw new NotFoundException('Mission not found');
      }

      if (mission.status !== 'PAUSED') {
        throw new BadRequestException('Mission cannot be resumed from current status');
      }

      mission.status = 'IN_PROGRESS';
      await this.missionRepository.save(mission);

      return {
        success: true,
        data: mission,
        message: 'Mission resumed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async abortMission(missionId: string, reason?: string): Promise<ApiResponse<Mission>> {
    try {
      const mission = await this.missionRepository.findOne({
        where: { id: missionId },
        relations: ['drone', 'waypoints']
      });

      if (!mission) {
        throw new NotFoundException('Mission not found');
      }

      if (!['STARTING', 'IN_PROGRESS', 'PAUSED'].includes(mission.status)) {
        throw new BadRequestException('Mission cannot be aborted from current status');
      }

      // Update mission status
      mission.status = 'ABORTED';
      mission.completedAt = new Date();
      mission.actualDuration = mission.startedAt ? 
        Math.floor((Date.now() - mission.startedAt.getTime()) / 1000) : 0;
      
      await this.missionRepository.save(mission);

      // Update drone status
      mission.drone.status = 'AVAILABLE';
      await this.droneRepository.save(mission.drone);

      // Generate mission report
      await this.generateMissionReport(mission, reason);

      return {
        success: true,
        data: mission,
        message: 'Mission aborted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMissionStatus(missionId: string): Promise<ApiResponse<Mission>> {
    try {
      const mission = await this.missionRepository.findOne({
        where: { id: missionId },
        relations: ['drone', 'waypoints']
      });

      if (!mission) {
        throw new NotFoundException('Mission not found');
      }

      return {
        success: true,
        data: mission
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getActiveMissions(): Promise<ApiResponse<Mission[]>> {
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
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllMissions(): Promise<ApiResponse<Mission[]>> {
    try {
      const missions = await this.missionRepository.find({
        relations: ['drone'],
        order: { createdAt: 'DESC' }
      });

      return {
        success: true,
        data: missions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private validateMissionConfig(config: MissionConfig): void {
    // Validate altitude
    if (config.altitude < 10 || config.altitude > 400) {
      throw new BadRequestException('Altitude must be between 10 and 400 meters');
    }

    // Validate overlap percentage
    if (config.overlapPercentage < 10 || config.overlapPercentage > 90) {
      throw new BadRequestException('Overlap percentage must be between 10 and 90');
    }

    // Validate survey area
    if (!config.surveyArea || !config.surveyArea.coordinates || config.surveyArea.coordinates.length < 3) {
      throw new BadRequestException('Survey area must have at least 3 coordinates');
    }

    // Validate mission name
    if (!config.name || config.name.trim().length === 0 || config.name.length > 255) {
      throw new BadRequestException('Mission name must be between 1 and 255 characters');
    }
  }

  private async generateMissionReport(mission: Mission, abortReason?: string): Promise<void> {
    const completedWaypoints = mission.waypoints?.filter(wp => wp.completed).length || 0;
    const coveragePercentage = mission.totalWaypoints > 0 ? 
      (completedWaypoints / mission.totalWaypoints) * 100 : 0;

    // Estimate battery consumption based on flight time
    const batteryConsumed = mission.actualDuration ? 
      Math.min(100, (mission.actualDuration / mission.drone.maxFlightTime) * 100) : 0;

    const report = this.reportRepository.create({
      id: uuidv4(),
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
}
