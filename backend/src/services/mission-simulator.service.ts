import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { Drone } from '../entities/drone.entity';
import { Waypoint } from '../entities/waypoint.entity';
import { MissionService } from './mission.service';
import { FleetService } from './fleet.service';
import { LatLng } from '../types/shared.types';

interface ActiveSimulation {
  missionId: string;
  intervalId: NodeJS.Timeout | null;
  startTime: number;
  lastUpdateTime: number;
}

@Injectable()
export class MissionSimulatorService {
  private readonly logger = new Logger(MissionSimulatorService.name);
  private activeSimulations = new Map<string, ActiveSimulation>();
  private readonly UPDATE_INTERVAL = 2000; // 2 seconds
  private readonly BATTERY_CONSUMPTION_RATE = 0.5; // % per minute of flight

  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(Waypoint)
    private waypointRepository: Repository<Waypoint>,
    private missionService: MissionService,
    private fleetService: FleetService,
  ) {}

  async startSimulation(missionId: string): Promise<void> {
    try {
      // Check if simulation is already running
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

      // Update mission status to IN_PROGRESS if it's STARTING
      if (mission.status === 'STARTING') {
        mission.status = 'IN_PROGRESS';
        await this.missionRepository.save(mission);
      }

      // Start simulation
      const simulation: ActiveSimulation = {
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
    } catch (error) {
      this.logger.error(`Failed to start simulation for mission ${missionId}:`, error);
      throw error;
    }
  }

  async pauseSimulation(missionId: string): Promise<void> {
    const simulation = this.activeSimulations.get(missionId);
    if (simulation && simulation.intervalId) {
      clearInterval(simulation.intervalId);
      this.activeSimulations.delete(missionId);
      this.logger.log(`Paused simulation for mission ${missionId}`);
    }
  }

  async resumeSimulation(missionId: string): Promise<void> {
    // Resume is the same as start for our simulation
    await this.startSimulation(missionId);
  }

  async stopSimulation(missionId: string): Promise<void> {
    const simulation = this.activeSimulations.get(missionId);
    if (simulation && simulation.intervalId) {
      clearInterval(simulation.intervalId);
      this.activeSimulations.delete(missionId);
      this.logger.log(`Stopped simulation for mission ${missionId}`);
    }
  }

  private async updateMissionProgress(missionId: string): Promise<void> {
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
      if (!simulation) return;

      const now = Date.now();
      const elapsedTime = (now - simulation.startTime) / 1000; // seconds
      const deltaTime = (now - simulation.lastUpdateTime) / 1000; // seconds since last update

      // Calculate progress based on estimated duration
      const progressPercentage = mission.estimatedDuration > 0 ? 
        Math.min(100, (elapsedTime / mission.estimatedDuration) * 100) : 0;

      // Update current waypoint index based on progress
      const targetWaypointIndex = Math.floor((progressPercentage / 100) * mission.totalWaypoints);
      const currentWaypointIndex = Math.min(targetWaypointIndex, mission.totalWaypoints - 1);

      // Get current waypoint for drone position
      const sortedWaypoints = mission.waypoints.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      let dronePosition: LatLng;

      if (currentWaypointIndex < sortedWaypoints.length) {
        const currentWaypoint = sortedWaypoints[currentWaypointIndex];
        dronePosition = {
          latitude: currentWaypoint.latitude,
          longitude: currentWaypoint.longitude
        };

        // Mark waypoint as completed if we've reached it
        if (!currentWaypoint.completed) {
          currentWaypoint.completed = true;
          currentWaypoint.completedAt = new Date();
          await this.waypointRepository.save(currentWaypoint);
        }
      } else {
        // Use last waypoint position
        const lastWaypoint = sortedWaypoints[sortedWaypoints.length - 1];
        dronePosition = {
          latitude: lastWaypoint.latitude,
          longitude: lastWaypoint.longitude
        };
      }

      // Calculate battery consumption
      const flightTimeMinutes = elapsedTime / 60;
      const batteryConsumed = flightTimeMinutes * this.BATTERY_CONSUMPTION_RATE;
      const currentBatteryLevel = Math.max(0, mission.drone.batteryLevel - batteryConsumed);

      // Check for low battery (safety abort)
      if (currentBatteryLevel <= 20 && mission.status === 'IN_PROGRESS') {
        await this.missionService.abortMission(missionId, 'Low battery - automatic safety abort');
        await this.stopSimulation(missionId);
        return;
      }

      // Update mission progress
      mission.progress = progressPercentage;
      mission.currentWaypointIndex = currentWaypointIndex;
      mission.distanceCovered = this.calculateDistanceCovered(sortedWaypoints, currentWaypointIndex);
      await this.missionRepository.save(mission);

      // Update drone position and battery
      await this.fleetService.updateDroneLocation(mission.droneId, dronePosition);
      await this.fleetService.updateDroneBattery(mission.droneId, currentBatteryLevel);

      // Check if mission is complete
      if (progressPercentage >= 100) {
        mission.status = 'COMPLETED';
        mission.completedAt = new Date();
        mission.actualDuration = Math.floor(elapsedTime);
        await this.missionRepository.save(mission);

        // Update drone status
        mission.drone.status = 'AVAILABLE';
        await this.droneRepository.save(mission.drone);

        // Generate mission report
        await this.generateCompletionReport(mission);

        await this.stopSimulation(missionId);
        this.logger.log(`Mission ${missionId} completed successfully`);
      }

      simulation.lastUpdateTime = now;
    } catch (error) {
      this.logger.error(`Error updating mission progress for ${missionId}:`, error);
    }
  }

  private calculateDistanceCovered(waypoints: Waypoint[], currentIndex: number): number {
    if (currentIndex <= 0 || waypoints.length === 0) return 0;

    let totalDistance = 0;
    for (let i = 1; i <= Math.min(currentIndex, waypoints.length - 1); i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      totalDistance += this.calculateDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
    }

    return totalDistance;
  }

  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLng = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async generateCompletionReport(mission: Mission): Promise<void> {
    // This would be implemented by the MissionService
    // For now, we'll just log the completion
    this.logger.log(`Generating completion report for mission ${mission.id}`);
  }

  // Cleanup method to stop all simulations
  async stopAllSimulations(): Promise<void> {
    for (const [missionId, simulation] of this.activeSimulations) {
      if (simulation.intervalId) {
        clearInterval(simulation.intervalId);
      }
      this.logger.log(`Stopped simulation for mission ${missionId}`);
    }
    this.activeSimulations.clear();
  }

  // Get active simulations count
  getActiveSimulationsCount(): number {
    return this.activeSimulations.size;
  }

  // Check if a mission is being simulated
  isSimulationActive(missionId: string): boolean {
    return this.activeSimulations.has(missionId);
  }
}
