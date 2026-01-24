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
exports.Waypoint = void 0;
const typeorm_1 = require("typeorm");
const mission_entity_1 = require("./mission.entity");
let Waypoint = class Waypoint {
    id;
    missionId;
    sequenceNumber;
    latitude;
    longitude;
    altitude;
    action;
    completed;
    completedAt;
    mission;
};
exports.Waypoint = Waypoint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Waypoint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mission_id' }),
    __metadata("design:type", String)
], Waypoint.prototype, "missionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'sequence_number' }),
    __metadata("design:type", Number)
], Waypoint.prototype, "sequenceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8 }),
    __metadata("design:type", Number)
], Waypoint.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8 }),
    __metadata("design:type", Number)
], Waypoint.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2 }),
    __metadata("design:type", Number)
], Waypoint.prototype, "altitude", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: 'FLY_TO'
    }),
    __metadata("design:type", String)
], Waypoint.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Waypoint.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true, name: 'completed_at' }),
    __metadata("design:type", Date)
], Waypoint.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => mission_entity_1.Mission, mission => mission.waypoints, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'mission_id' }),
    __metadata("design:type", mission_entity_1.Mission)
], Waypoint.prototype, "mission", void 0);
exports.Waypoint = Waypoint = __decorate([
    (0, typeorm_1.Entity)('waypoints'),
    (0, typeorm_1.Unique)('unique_mission_sequence', ['missionId', 'sequenceNumber'])
], Waypoint);
//# sourceMappingURL=waypoint.entity.js.map