import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, Max, Length } from 'class-validator';
import type { DroneStatus } from '../types/shared.types';

export class CreateDroneDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  model: string;

  @IsOptional()
  @IsNumber()
  currentLatitude?: number;

  @IsOptional()
  @IsNumber()
  currentLongitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(300) // 5 minutes minimum
  @Max(7200) // 2 hours maximum
  maxFlightTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(30)
  maxSpeed?: number;
}

export class UpdateDroneStatusDto {
  @IsEnum(['AVAILABLE', 'IN_MISSION', 'MAINTENANCE'])
  status: DroneStatus;
}

export class UpdateDroneLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class UpdateDroneBatteryDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel: number;
}
