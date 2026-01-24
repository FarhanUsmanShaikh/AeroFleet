"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mission = void 0;
const typeorm_1 = require("typeorm");
const sharedTypes = __importStar(require("../types/shared.types"));
const drone_entity_1 = require("./drone.entity");
const waypoint_entity_1 = require("./waypoint.entity");
const mission_report_entity_1 = require("./mission-report.entity");
let Mission = class Mission {
    id;
    name;
    droneId;
    status;
    pattern;
    altitude;
    overlapPercentage;
    surveyArea;
    totalWaypoints;
    currentWaypointIndex;
    progress;
    estimatedDuration;
    actualDuration;
    distanceCovered;
    createdAt;
    startedAt;
    completedAt;
    drone;
    waypoints;
    reports;
    get estimatedTimeRemaining() {
        if (!this.estimatedDuration || this.status === 'COMPLETED' || this.status === 'ABORTED') {
            return 0;
        }
        const elapsed = this.startedAt ?
            Math.floor((Date.now() - this.startedAt.getTime()) / 1000) : 0;
        const remaining = this.estimatedDuration - elapsed;
        return Math.max(0, remaining);
    }
};
exports.Mission = Mission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Mission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Mission.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'drone_id' }),
    __metadata("design:type", String)
], Mission.prototype, "droneId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'PLANNED' }),
    __metadata("design:type", String)
], Mission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Mission.prototype, "pattern", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2 }),
    __metadata("design:type", Number)
], Mission.prototype, "altitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'overlap_percentage' }),
    __metadata("design:type", Number)
], Mission.prototype, "overlapPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', name: 'survey_area' }),
    __metadata("design:type", Object)
], Mission.prototype, "surveyArea", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_waypoints' }),
    __metadata("design:type", Number)
], Mission.prototype, "totalWaypoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'current_waypoint_index' }),
    __metadata("design:type", Number)
], Mission.prototype, "currentWaypointIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'progress_percentage' }),
    __metadata("design:type", Number)
], Mission.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, name: 'estimated_duration' }),
    __metadata("design:type", Number)
], Mission.prototype, "estimatedDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, name: 'actual_duration' }),
    __metadata("design:type", Number)
], Mission.prototype, "actualDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'distance_covered' }),
    __metadata("design:type", Number)
], Mission.prototype, "distanceCovered", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Mission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true, name: 'started_at' }),
    __metadata("design:type", Date)
], Mission.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true, name: 'completed_at' }),
    __metadata("design:type", Date)
], Mission.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => drone_entity_1.Drone, drone => drone.missions),
    (0, typeorm_1.JoinColumn)({ name: 'drone_id' }),
    __metadata("design:type", drone_entity_1.Drone)
], Mission.prototype, "drone", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => waypoint_entity_1.Waypoint, waypoint => waypoint.mission, { cascade: true }),
    __metadata("design:type", Array)
], Mission.prototype, "waypoints", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => mission_report_entity_1.MissionReport, report => report.mission),
    __metadata("design:type", Array)
], Mission.prototype, "reports", void 0);
exports.Mission = Mission = __decorate([
    (0, typeorm_1.Entity)('missions')
], Mission);
//# sourceMappingURL=mission.entity.js.map