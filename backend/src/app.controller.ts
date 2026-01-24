import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Drone Survey Management System',
      version: '1.0.0'
    };
  }

  @Get('api/health')
  getApiHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Drone Survey Management API',
      version: '1.0.0',
      endpoints: {
        missions: '/api/missions',
        fleet: '/api/fleet',
        websocket: '/missions'
      }
    };
  }
}
