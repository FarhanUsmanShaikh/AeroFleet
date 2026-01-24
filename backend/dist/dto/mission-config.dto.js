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
exports.MissionConfigDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class LatLngDto {
    latitude;
    longitude;
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LatLngDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LatLngDto.prototype, "longitude", void 0);
class PolygonDto {
    coordinates;
    area;
}
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LatLngDto),
    __metadata("design:type", Array)
], PolygonDto.prototype, "coordinates", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PolygonDto.prototype, "area", void 0);
class SensorConfigDto {
    type;
    frequency;
    resolution;
}
__decorate([
    (0, class_validator_1.IsEnum)(['CAMERA', 'LIDAR', 'THERMAL']),
    __metadata("design:type", String)
], SensorConfigDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], SensorConfigDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SensorConfigDto.prototype, "resolution", void 0);
class MissionConfigDto {
    name;
    droneId;
    surveyArea;
    pattern;
    altitude;
    overlapPercentage;
    sensorSettings;
}
exports.MissionConfigDto = MissionConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], MissionConfigDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MissionConfigDto.prototype, "droneId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PolygonDto),
    __metadata("design:type", PolygonDto)
], MissionConfigDto.prototype, "surveyArea", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['GRID', 'CROSSHATCH', 'PERIMETER']),
    __metadata("design:type", String)
], MissionConfigDto.prototype, "pattern", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(400),
    __metadata("design:type", Number)
], MissionConfigDto.prototype, "altitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], MissionConfigDto.prototype, "overlapPercentage", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SensorConfigDto),
    __metadata("design:type", SensorConfigDto)
], MissionConfigDto.prototype, "sensorSettings", void 0);
//# sourceMappingURL=mission-config.dto.js.map