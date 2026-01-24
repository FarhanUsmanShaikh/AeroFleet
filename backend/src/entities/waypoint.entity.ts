import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import type { WaypointAction } from '../types/shared.types';
import { Mission } from './mission.entity';

@Entity('waypoints')
@Unique('unique_mission_sequence', ['missionId', 'sequenceNumber'])
export class Waypoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id' })
  missionId: string;

  @Column({ type: 'int', name: 'sequence_number' })
  sequenceNumber: number;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  altitude: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'FLY_TO'
  })
  action: WaypointAction;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @ManyToOne(() => Mission, mission => mission.waypoints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;
}
