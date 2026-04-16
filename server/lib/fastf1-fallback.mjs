import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const resolverScriptPath = resolve(root, 'scripts/resolve-fastest-lap.py');
const cacheDir = resolve(root, '.tmp/fastf1-cache');

export function resolveFastestLapWithFastF1({ year, grandPrix, driverNumber }) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('python3', [
      resolverScriptPath,
      String(year),
      grandPrix,
      String(driverNumber),
      cacheDir
    ], { cwd: root });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(stderr.trim() || `FastF1 fallback exited with code ${code}`));
        return;
      }

      try {
        resolvePromise(JSON.parse(stdout.trim()));
      } catch (error) {
        rejectPromise(error);
      }
    });
  });
}
