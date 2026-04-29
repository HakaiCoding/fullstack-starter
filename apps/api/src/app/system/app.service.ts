import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { name: string; version: string; status: 'ok' } {
    return {
      name: 'Fullstack Starter API',
      version: 'v1',
      status: 'ok',
    };
  }

  getHealth(): { status: 'ok'; checks: { api: 'ok' } } {
    return {
      status: 'ok',
      checks: {
        api: 'ok',
      },
    };
  }

  getDatabaseHealth(): { status: 'ok'; checks: { database: 'ok' } } {
    return {
      status: 'ok',
      checks: {
        database: 'ok',
      },
    };
  }
}
