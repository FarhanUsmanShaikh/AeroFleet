import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Drone } from '../entities/drone.entity';
import { Mission } from '../entities/mission.entity';
import { Waypoint } from '../entities/waypoint.entity';
import { MissionReport } from '../entities/mission-report.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const dbType = configService.get('DB_TYPE', 'mysql');

  if (dbType === 'sqlite') {
    return {
      type: 'sqlite',
      database: configService.get('DB_DATABASE', './drone_survey.db'),
      entities: [Drone, Mission, Waypoint, MissionReport],
      synchronize: true, // Set to true for assessment projects to ensure tables are created on fresh deploys
      logging: configService.get('NODE_ENV') === 'development',
    };
  }

  // MySQL configuration
  return {
    type: 'mysql',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 3306),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_DATABASE', 'drone_survey_management'),
    entities: [Drone, Mission, Waypoint, MissionReport],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: configService.get('NODE_ENV') === 'development',
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
    charset: 'utf8mb4',
    timezone: 'Z',
  };
};
