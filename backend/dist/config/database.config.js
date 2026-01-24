"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const drone_entity_1 = require("../entities/drone.entity");
const mission_entity_1 = require("../entities/mission.entity");
const waypoint_entity_1 = require("../entities/waypoint.entity");
const mission_report_entity_1 = require("../entities/mission-report.entity");
const getDatabaseConfig = (configService) => {
    const dbType = configService.get('DB_TYPE', 'mysql');
    if (dbType === 'sqlite') {
        return {
            type: 'sqlite',
            database: configService.get('DB_DATABASE', './drone_survey.db'),
            entities: [drone_entity_1.Drone, mission_entity_1.Mission, waypoint_entity_1.Waypoint, mission_report_entity_1.MissionReport],
            synchronize: true,
            logging: configService.get('NODE_ENV') === 'development',
        };
    }
    return {
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'drone_survey_management'),
        entities: [drone_entity_1.Drone, mission_entity_1.Mission, waypoint_entity_1.Waypoint, mission_report_entity_1.MissionReport],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/migrations/*.js'],
        migrationsTableName: 'migrations',
        charset: 'utf8mb4',
        timezone: 'Z',
    };
};
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map