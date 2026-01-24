"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const drone_entity_1 = require("./entities/drone.entity");
const mission_entity_1 = require("./entities/mission.entity");
const waypoint_entity_1 = require("./entities/waypoint.entity");
const mission_report_entity_1 = require("./entities/mission-report.entity");
const waypoint_generator_service_1 = require("./services/waypoint-generator.service");
const mission_service_1 = require("./services/mission.service");
const fleet_service_1 = require("./services/fleet.service");
const mission_simulator_service_1 = require("./services/mission-simulator.service");
const database_service_1 = require("./database/database.service");
const mission_controller_1 = require("./controllers/mission.controller");
const fleet_controller_1 = require("./controllers/fleet.controller");
const mission_gateway_1 = require("./gateways/mission.gateway");
const database_config_1 = require("./config/database.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: database_config_1.getDatabaseConfig,
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([
                drone_entity_1.Drone,
                mission_entity_1.Mission,
                waypoint_entity_1.Waypoint,
                mission_report_entity_1.MissionReport,
            ]),
        ],
        controllers: [
            app_controller_1.AppController,
            mission_controller_1.MissionController,
            fleet_controller_1.FleetController,
        ],
        providers: [
            app_service_1.AppService,
            database_service_1.DatabaseService,
            waypoint_generator_service_1.WaypointGeneratorService,
            mission_service_1.MissionService,
            fleet_service_1.FleetService,
            mission_simulator_service_1.MissionSimulatorService,
            mission_gateway_1.MissionGateway,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map