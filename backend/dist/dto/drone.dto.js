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
exports.UpdateDroneBatteryDto = exports.UpdateDroneLocationDto = exports.UpdateDroneStatusDto = exports.CreateDroneDto = void 0;
const class_validator_1 = require("class-validator");
class CreateDroneDto {
    name;
    model;
    currentLatitude;
    currentLongitude;
    maxFlightTime;
    maxSpeed;
}
exports.CreateDroneDto = CreateDroneDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateDroneDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateDroneDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDroneDto.prototype, "currentLatitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDroneDto.prototype, "currentLongitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(300),
    (0, class_validator_1.Max)(7200),
    __metadata("design:type", Number)
], CreateDroneDto.prototype, "maxFlightTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], CreateDroneDto.prototype, "maxSpeed", void 0);
class UpdateDroneStatusDto {
    status;
}
exports.UpdateDroneStatusDto = UpdateDroneStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['AVAILABLE', 'IN_MISSION', 'MAINTENANCE']),
    __metadata("design:type", String)
], UpdateDroneStatusDto.prototype, "status", void 0);
class UpdateDroneLocationDto {
    latitude;
    longitude;
}
exports.UpdateDroneLocationDto = UpdateDroneLocationDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], UpdateDroneLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], UpdateDroneLocationDto.prototype, "longitude", void 0);
class UpdateDroneBatteryDto {
    batteryLevel;
}
exports.UpdateDroneBatteryDto = UpdateDroneBatteryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateDroneBatteryDto.prototype, "batteryLevel", void 0);
//# sourceMappingURL=drone.dto.js.map