import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const repoUrl = 'https://github.com/F1DB/f1db.git';
const targetDir = resolve(root, 'submodule/f1db');
const parentDir = resolve(root, 'submodule');
const refresh = process.argv.includes('--refresh');

function run(command, args, cwd = root) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function main() {
  await mkdir(parentDir, { recursive: true });

  if (!existsSync(targetDir)) {
    console.log(`Cloning ${repoUrl} into ${targetDir}`);
    await run('git', ['clone', '--depth', '1', repoUrl, targetDir]);
    return;
  }

  if (!existsSync(resolve(targetDir, '.git'))) {
    throw new Error(`Target directory exists but is not a git repository: ${targetDir}`);
  }

  if (!refresh) {
    console.log(`f1db already exists at ${targetDir}`);
    console.log('Skipping download. Re-run with --refresh to update it.');
    return;
  }

  console.log(`Refreshing f1db in ${targetDir}`);
  await run('git', ['fetch', 'origin', 'main', '--depth', '1'], targetDir);
  await run('git', ['checkout', '-f', 'FETCH_HEAD'], targetDir);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
