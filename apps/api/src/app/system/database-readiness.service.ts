import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DatabaseReadiness {
  status: 'healthy' | 'unhealthy';
  checkedAt: string;
  reason?: string;
}

@Injectable()
export class DatabaseReadinessService {
  constructor(private readonly dataSource: DataSource) {}

  async getReadiness(): Promise<DatabaseReadiness> {
    if (!this.dataSource.isInitialized) {
      return {
        status: 'unhealthy',
        checkedAt: new Date().toISOString(),
        reason: 'Database connection is not initialized.',
      };
    }

    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'healthy',
        checkedAt: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'unhealthy',
        checkedAt: new Date().toISOString(),
        reason: 'Database query failed.',
      };
    }
  }
}
