import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Mission } from './mission.entity';

@Entity('mission_reports')
export class MissionReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id' })
  missionId: string;

  @Column({ type: 'int', name: 'total_flight_duration' })
  totalFlightDuration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'distance_covered' })
  distanceCovered: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'coverage_percentage' })
  coveragePercentage: number;

  @Column({ type: 'varchar', length: 50, name: 'final_status' })
  finalStatus: 'COMPLETED' | 'ABORTED';

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'abort_reason' })
  abortReason: string;

  @Column({ type: 'int', name: 'waypoints_completed' })
  waypointsCompleted: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'battery_consumed' })
  batteryConsumed: number;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @ManyToOne(() => Mission, mission => mission.reports)
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;
}
