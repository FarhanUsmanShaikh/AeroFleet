import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { Drone } from './entities/drone.entity';
import { Mission } from './entities/mission.entity';
import { Waypoint } from './entities/waypoint.entity';
import { MissionReport } from './entities/mission-report.entity';

// Services
import { WaypointGeneratorService } from './services/waypoint-generator.service';
import { MissionService } from './services/mission.service';
import { FleetService } from './services/fleet.service';
import { MissionSimulatorService } from './services/mission-simulator.service';
import { DatabaseService } from './database/database.service';

// Controllers
import { MissionController } from './controllers/mission.controller';
import { FleetController } from './controllers/fleet.controller';

// Gateways
import { MissionGateway } from './gateways/mission.gateway';

// Configuration
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    
    // Entity repositories
    TypeOrmModule.forFeature([
      Drone,
      Mission,
      Waypoint,
      MissionReport,
    ]),
  ],
  controllers: [
    AppController,
    MissionController,
    FleetController,
  ],
  providers: [
    AppService,
    DatabaseService,
    WaypointGeneratorService,
    MissionService,
    FleetService,
    MissionSimulatorService,
    MissionGateway,
  ],
})
export class AppModule {}
