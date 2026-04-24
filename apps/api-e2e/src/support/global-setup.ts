import { waitForPortOpen } from '@nx/node/utils';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { loadDockerEnvFile } from './load-docker-env';

const workspaceRoot = path.resolve(__dirname, '../../../../');

declare global {
  // Shared across setup/teardown files.
  var __TEARDOWN_MESSAGE__: string | undefined;
}

async function waitForDatabasePort(): Promise<void> {
  const databaseHost = process.env.POSTGRES_HOST ?? 'localhost';
  const databasePort = process.env.POSTGRES_PORT
    ? Number(process.env.POSTGRES_PORT)
    : 5432;

  await waitForPortOpen(databasePort, { host: databaseHost });
}

function runWorkspaceCommand(
  command: string,
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      env: process.env,
    });

    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Command failed: ${command} ${args.join(' ')} (exit code: ${String(code)})`,
        ),
      );
    });
  });
}

async function runMigrations(): Promise<void> {
  await runWorkspaceCommand(process.execPath, [
    'tools/typeorm-cli.cjs',
    '-d',
    'apps/api/src/db/data-source.ts',
    'migration:run',
  ]);
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
