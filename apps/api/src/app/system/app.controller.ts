import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseReadinessService } from './database-readiness.service';

@Controller({ version: '1' })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseReadinessService: DatabaseReadinessService,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health/db')
  async getDatabaseReadiness() {
    const readiness = await this.databaseReadinessService.getReadiness();

    if (readiness.status === 'unhealthy') {
      throw new ServiceUnavailableException(readiness);
    }

    return readiness;
  }
}
