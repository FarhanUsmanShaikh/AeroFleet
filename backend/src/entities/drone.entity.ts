import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import * as sharedTypes from '../types/shared.types';
import { Mission } from './mission.entity';

@Entity('drones')
export class Drone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  model: string;

  @Column({ type: 'varchar', length: 50, default: 'AVAILABLE' })
  status: sharedTypes.DroneStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.00 })
  batteryLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLatitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLongitude: number | null;

  @Column({ type: 'int', default: 1800 }) // 30 minutes in seconds
  maxFlightTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.00 }) // m/s
  maxSpeed: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Mission, mission => mission.drone)
  missions: Mission[];

  // Virtual property for current location
  get currentLocation(): sharedTypes.LatLng | null {
    if (this.currentLatitude !== null && this.currentLongitude !== null) {
      return {
        latitude: this.currentLatitude,
        longitude: this.currentLongitude
      };
    }
    return null;
  }

  set currentLocation(location: sharedTypes.LatLng | null) {
    if (location) {
      this.currentLatitude = location.latitude;
      this.currentLongitude = location.longitude;
    } else {
      this.currentLatitude = null;
      this.currentLongitude = null;
    }
  }

  // Virtual property for lastUpdated (alias for updatedAt)
  get lastUpdated(): Date {
    return this.updatedAt;
  }
}