import { waitForPortOpen } from '@nx/node/utils';
import { loadDockerEnvFile } from './load-docker-env';

declare global {
  // Shared across setup/teardown files.
  // eslint-disable-next-line no-var
  var __TEARDOWN_MESSAGE__: string | undefined;
}

async function waitForDatabasePort(): Promise<void> {
  const databaseHost = process.env.POSTGRES_HOST ?? 'localhost';
  const databasePort = process.env.POSTGRES_PORT
    ? Number(process.env.POSTGRES_PORT)
    : 5432;

  await waitForPortOpen(databasePort, { host: databaseHost });
}

async function runMigrations(): Promise<void> {
  const { default: appDataSource } = await import(
    '../../../api/src/db/data-source'
  );

  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }

  try {
    await appDataSource.runMigrations();
  } finally {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  loadDockerEnvFile();
  await waitForDatabasePort();
  await runMigrations();

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
