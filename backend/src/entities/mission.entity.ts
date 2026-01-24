import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import * as sharedTypes from '../types/shared.types';
import { Drone } from './drone.entity';
import { Waypoint } from './waypoint.entity';
import { MissionReport } from './mission-report.entity';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'drone_id' })
  droneId: string;

  @Column({ type: 'varchar', length: 50, default: 'PLANNED' })
  status: sharedTypes.MissionStatus;

  @Column({ type: 'varchar', length: 50 })
  pattern: sharedTypes.MissionPattern;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  altitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'overlap_percentage' })
  overlapPercentage: number;

  @Column({ type: 'json', name: 'survey_area' })
  surveyArea: sharedTypes.Polygon;

  @Column({ type: 'int', name: 'total_waypoints' })
  totalWaypoints: number;

  @Column({ type: 'int', default: 0, name: 'current_waypoint_index' })
  currentWaypointIndex: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'progress_percentage' })
  progress: number;

  @Column({ type: 'int', nullable: true, name: 'estimated_duration' })
  estimatedDuration: number;

  @Column({ type: 'int', nullable: true, name: 'actual_duration' })
  actualDuration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'distance_covered' })
  distanceCovered: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @ManyToOne(() => Drone, drone => drone.missions)
  @JoinColumn({ name: 'drone_id' })
  drone: Drone;

  @OneToMany(() => Waypoint, waypoint => waypoint.mission, { cascade: true })
  waypoints: Waypoint[];

  @OneToMany(() => MissionReport, report => report.mission)
  reports: MissionReport[];

  // Virtual property for estimated time remaining
  get estimatedTimeRemaining(): number {
    if (!this.estimatedDuration || this.status === 'COMPLETED' || this.status === 'ABORTED') {
      return 0;
    }
    
    const elapsed = this.startedAt ? 
      Math.floor((Date.now() - this.startedAt.getTime()) / 1000) : 0;
    
    const remaining = this.estimatedDuration - elapsed;
    return Math.max(0, remaining);
  }
}
