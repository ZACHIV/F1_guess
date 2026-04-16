import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getClipOutputPaths } from '../src/lib/challenge-utils.js';

function printUsage() {
  console.log(`Usage:
  node scripts/extract-audio.mjs --url <video-url> --slug <clip-name> --start 00:04:12 --end 00:04:28

Optional:
  --title "Display title"
  --keep-video
  --dry-run`);
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : undefined;
}

const url = readArg('--url');
const slug = readArg('--slug');
const start = readArg('--start');
const end = readArg('--end');
const keepVideo = process.argv.includes('--keep-video');
const dryRun = process.argv.includes('--dry-run');

if (!url || !slug || !start || !end) {
  printUsage();
  process.exit(1);
}

const timePattern = /^\d{2}:\d{2}:\d{2}$/;

if (!timePattern.test(start) || !timePattern.test(end)) {
  console.error('Start and end times must use HH:MM:SS format.');
  process.exit(1);
}

function ensureTool(command, installHint) {
  const result = spawnSync('which', [command], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`${command} is required. ${installHint}`);
    process.exit(1);
  }
}

ensureTool('yt-dlp', 'Install with `brew install yt-dlp`.');
ensureTool('ffmpeg', 'Install with `brew install ffmpeg`.');

const audioDir = resolve('public/audio');
const downloadDir = resolve('.tmp');
const sourceWavPath = resolve(downloadDir, `${slug}.source.wav`);
const paths = getClipOutputPaths(slug);
const wavPath = resolve(paths.wav);
const mp3Path = resolve(paths.mp3);

if (!existsSync(audioDir)) {
  mkdirSync(audioDir, { recursive: true });
}

if (!existsSync(downloadDir)) {
  mkdirSync(downloadDir, { recursive: true });
}

const commands = [
  [
    'yt-dlp',
    [
      '--extract-audio',
      '--audio-format',
      'wav',
      '--audio-quality',
      '0',
      '--no-playlist',
      '--js-runtimes',
      'node',
      '-o',
      sourceWavPath,
      url
    ]
  ],
  [
    'ffmpeg',
    ['-y', '-ss', start, '-to', end, '-i', sourceWavPath, '-ac', '2', '-ar', '44100', wavPath]
  ],
  [
    'ffmpeg',
    ['-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-q:a', '2', mp3Path]
  ]
];

if (dryRun) {
  commands.forEach(([command, args]) => {
    console.log([command, ...args].join(' '));
  });
  process.exit(0);
}

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!keepVideo) {
  console.log(`Source audio cached at ${basename(sourceWavPath)} in .tmp for repeat clipping.`);
}

console.log(`Done. Created:
- ${wavPath}
- ${mp3Path}`);
