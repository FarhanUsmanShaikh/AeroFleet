import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import type { MissionAction } from '../types/shared.types';

export class MissionControlDto {
  @IsEnum(['START', 'PAUSE', 'RESUME', 'ABORT'])
  action: MissionAction;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}
