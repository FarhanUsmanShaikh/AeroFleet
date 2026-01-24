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
exports.Drone = void 0;
const typeorm_1 = require("typeorm");
const sharedTypes = __importStar(require("../types/shared.types"));
const mission_entity_1 = require("./mission.entity");
let Drone = class Drone {
    id;
    name;
    model;
    status;
    batteryLevel;
    currentLatitude;
    currentLongitude;
    maxFlightTime;
    maxSpeed;
    createdAt;
    updatedAt;
    missions;
    get currentLocation() {
        if (this.currentLatitude !== null && this.currentLongitude !== null) {
            return {
                latitude: this.currentLatitude,
                longitude: this.currentLongitude
            };
        }
        return null;
    }
    set currentLocation(location) {
        if (location) {
            this.currentLatitude = location.latitude;
            this.currentLongitude = location.longitude;
        }
        else {
            this.currentLatitude = null;
            this.currentLongitude = null;
        }
    }
    get lastUpdated() {
        return this.updatedAt;
    }
};
exports.Drone = Drone;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Drone.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Drone.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Drone.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'AVAILABLE' }),
    __metadata("design:type", String)
], Drone.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 100.00 }),
    __metadata("design:type", Number)
], Drone.prototype, "batteryLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Object)
], Drone.prototype, "currentLatitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Object)
], Drone.prototype, "currentLongitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1800 }),
    __metadata("design:type", Number)
], Drone.prototype, "maxFlightTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 15.00 }),
    __metadata("design:type", Number)
], Drone.prototype, "maxSpeed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Drone.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Drone.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => mission_entity_1.Mission, mission => mission.drone),
    __metadata("design:type", Array)
], Drone.prototype, "missions", void 0);
exports.Drone = Drone = __decorate([
    (0, typeorm_1.Entity)('drones')
], Drone);
//# sourceMappingURL=drone.entity.js.map