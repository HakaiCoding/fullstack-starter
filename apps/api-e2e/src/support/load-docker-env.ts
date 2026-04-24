import * as fs from 'node:fs';
import * as path from 'node:path';

function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();

  if (trimmed === '' || trimmed.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const value = trimmed.slice(separatorIndex + 1).trim();

  return [key, value];
}

export function loadDockerEnvFile(): void {
  const envFilePath = path.resolve(process.cwd(), '.env.docker');
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const content = fs.readFileSync(envFilePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
