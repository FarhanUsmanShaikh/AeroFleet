import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Drone Survey Management System API - Ready for Operations! 🚁';
  }
}
