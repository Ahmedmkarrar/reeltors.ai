import { mkdir, rm, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TEMP_DIR = resolve(__dirname, '..', '..', 'temp');

export async function ensureTempDir(): Promise<void> {
  await mkdir(TEMP_DIR, { recursive: true });
}

export function jobTempDir(jobId: string): string {
  return resolve(TEMP_DIR, jobId);
}

export async function createJobTempDir(jobId: string): Promise<string> {
  const dir = jobTempDir(jobId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanJobTempDir(jobId: string): Promise<void> {
  const dir = jobTempDir(jobId);
  if (!existsSync(dir)) return;
  await rm(dir, { recursive: true, force: true });
}

// clears all temp dirs older than the given max age (ms)
export async function cleanStaleTempDirs(maxAgeMs = 2 * 60 * 60 * 1000): Promise<void> {
  if (!existsSync(TEMP_DIR)) return;

  const entries = await readdir(TEMP_DIR, { withFileTypes: true });
  const now = Date.now();

  await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map(async (e) => {
        const { mtimeMs } = await import('node:fs').then((fs) =>
          fs.promises.stat(resolve(TEMP_DIR, e.name)),
        );
        if (now - mtimeMs > maxAgeMs) {
          await rm(resolve(TEMP_DIR, e.name), { recursive: true, force: true });
        }
      }),
  );
}
