import { IsString, IsNotEmpty, IsNumber, IsEnum, IsObject, ValidateNested, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';
import type { MissionPattern, SensorConfig, Polygon } from '../types/shared.types';

class LatLngDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class PolygonDto {
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  coordinates: LatLngDto[];

  @IsNumber()
  @Min(0)
  area: number;
}

class SensorConfigDto {
  @IsEnum(['CAMERA', 'LIDAR', 'THERMAL'])
  type: 'CAMERA' | 'LIDAR' | 'THERMAL';

  @IsNumber()
  @Min(0.1)
  @Max(10)
  frequency: number;

  @IsString()
  @IsNotEmpty()
  resolution: string;
}

export class MissionConfigDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  droneId: string;

  @ValidateNested()
  @Type(() => PolygonDto)
  surveyArea: PolygonDto;

  @IsEnum(['GRID', 'CROSSHATCH', 'PERIMETER'])
  pattern: MissionPattern;

  @IsNumber()
  @Min(10)
  @Max(400)
  altitude: number;

  @IsNumber()
  @Min(10)
  @Max(90)
  overlapPercentage: number;

  @ValidateNested()
  @Type(() => SensorConfigDto)
  sensorSettings: SensorConfigDto;
}
