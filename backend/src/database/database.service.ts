import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { seedDatabase } from './seeds/initial-seed';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Check database connection
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      this.logger.log('Database connection established');

      // Run database seeding
      await this.seedDatabaseIfNeeded();
      
      this.logger.log('Database initialization completed');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async seedDatabaseIfNeeded() {
    try {
      await seedDatabase(this.dataSource);
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      // Don't throw error for seeding failures in production
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
}
