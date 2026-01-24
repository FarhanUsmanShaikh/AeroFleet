"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionReport = void 0;
const typeorm_1 = require("typeorm");
const mission_entity_1 = require("./mission.entity");
let MissionReport = class MissionReport {
    id;
    missionId;
    totalFlightDuration;
    distanceCovered;
    coveragePercentage;
    finalStatus;
    abortReason;
    waypointsCompleted;
    batteryConsumed;
    generatedAt;
    mission;
};
exports.MissionReport = MissionReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MissionReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mission_id' }),
    __metadata("design:type", String)
], MissionReport.prototype, "missionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_flight_duration' }),
    __metadata("design:type", Number)
], MissionReport.prototype, "totalFlightDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, name: 'distance_covered' }),
    __metadata("design:type", Number)
], MissionReport.prototype, "distanceCovered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'coverage_percentage' }),
    __metadata("design:type", Number)
], MissionReport.prototype, "coveragePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'final_status' }),
    __metadata("design:type", String)
], MissionReport.prototype, "finalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'abort_reason' }),
    __metadata("design:type", String)
], MissionReport.prototype, "abortReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'waypoints_completed' }),
    __metadata("design:type", Number)
], MissionReport.prototype, "waypointsCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'battery_consumed' }),
    __metadata("design:type", Number)
], MissionReport.prototype, "batteryConsumed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'generated_at' }),
    __metadata("design:type", Date)
], MissionReport.prototype, "generatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => mission_entity_1.Mission, mission => mission.reports),
    (0, typeorm_1.JoinColumn)({ name: 'mission_id' }),
    __metadata("design:type", mission_entity_1.Mission)
], MissionReport.prototype, "mission", void 0);
exports.MissionReport = MissionReport = __decorate([
    (0, typeorm_1.Entity)('mission_reports')
], MissionReport);
//# sourceMappingURL=mission-report.entity.js.map