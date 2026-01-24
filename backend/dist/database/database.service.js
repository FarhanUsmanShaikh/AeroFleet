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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const initial_seed_1 = require("./seeds/initial-seed");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    dataSource;
    logger = new common_1.Logger(DatabaseService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        await this.initializeDatabase();
    }
    async initializeDatabase() {
        try {
            if (!this.dataSource.isInitialized) {
                await this.dataSource.initialize();
            }
            this.logger.log('Database connection established');
            await this.seedDatabaseIfNeeded();
            this.logger.log('Database initialization completed');
        }
        catch (error) {
            this.logger.error('Database initialization failed:', error);
            throw error;
        }
    }
    async seedDatabaseIfNeeded() {
        try {
            await (0, initial_seed_1.seedDatabase)(this.dataSource);
        }
        catch (error) {
            this.logger.error('Database seeding failed:', error);
            if (process.env.NODE_ENV === 'development') {
                throw error;
            }
        }
    }
    async getConnectionStatus() {
        return {
            isConnected: this.dataSource.isInitialized,
            database: this.dataSource.options.database,
            type: this.dataSource.options.type,
        };
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], DatabaseService);
//# sourceMappingURL=database.service.js.map