import express from 'express';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import {
  buildExtractionCommands,
  buildVideoMetadataCommand,
  getWorkflowMediaPaths
} from './lib/extract-workflow.mjs';
import { importLocalCircuitSvg } from './lib/f1db-local.mjs';
import {
  readChallengeLibrary,
  removeChallengeRecord,
  upsertChallengeRecord,
  writeChallengeLibrary
} from './lib/challenge-library.mjs';
import { buildLapWindow, fetchOpenF1 } from './lib/openf1.mjs';
import { parseVideoMetadata, resolveParsedVideoMetadata } from './lib/video-metadata.mjs';

const app = express();
const PORT = 8787;
const root = process.cwd();
const challengeLibraryPath = resolve(root, 'src/data/challenge-library.json');

app.use(express.json({ limit: '2mb' }));

function runCommand(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd: root });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(stderr || `${command} exited with ${code}`));
    });
  });
}

function runCommandWithOutput(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd: root });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise(stdout);
        return;
      }

      rejectPromise(new Error(stderr || `${command} exited with ${code}`));
    });
  });
}

async function ensureDir(pathname) {
  if (!existsSync(pathname)) {
    await mkdir(pathname, { recursive: true });
  }
}

async function probeDuration(pathname) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      pathname
    ], { cwd: root });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise(Number.parseFloat(stdout.trim() || '0'));
        return;
      }

      rejectPromise(new Error(stderr || 'ffprobe failed'));
    });
  });
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/studio/library', async (_request, response, next) => {
  try {
    response.json(await readChallengeLibrary(challengeLibraryPath));
  } catch (error) {
    next(error);
  }
});

app.post('/api/studio/extract', async (request, response, next) => {
  try {
    const { slug, url } = request.body;
    const paths = getWorkflowMediaPaths(slug);

    await ensureDir(resolve(root, '.tmp'));
    await ensureDir(resolve(root, 'public/audio'));

    for (const step of buildExtractionCommands({ slug, url })) {
      await runCommand(step.command, step.args);
    }

    const durationSeconds = await probeDuration(resolve(root, paths.audioMp3));

    response.json({
      ok: true,
      paths,
      durationMs: Math.round(durationSeconds * 1000)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/studio/video-metadata', async (request, response, next) => {
  try {
    const { url, title = '', description = '' } = request.body;
    let sourceTitle = title;
    let sourceDescription = description;

    if (url) {
      const command = buildVideoMetadataCommand({ url });
      const stdout = await runCommandWithOutput(command.command, command.args);
      const payload = JSON.parse(stdout);
      sourceTitle = sourceTitle || payload.title || '';
      sourceDescription = sourceDescription || payload.description || '';
    }

    const parsed = parseVideoMetadata({
      title: sourceTitle,
      description: sourceDescription
    });
    const resolved = await resolveParsedVideoMetadata(parsed, fetchOpenF1);

    response.json({
      ok: true,
      sourceTitle,
      sourceDescription,
      parsed: resolved
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/studio/tracks/import-local', async (request, response, next) => {
  try {
    const { assetName, query } = request.body;
    const targetDir = resolve(root, 'public/assets/tracks');

    await ensureDir(targetDir);

    const result = await importLocalCircuitSvg(root, { assetName, query });

    response.json({
      ok: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/studio/openf1/sessions', async (request, response, next) => {
  try {
    const result = await fetchOpenF1('/sessions', {
      year: request.query.year,
      country_name: request.query.countryName,
      session_name: request.query.sessionName
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/studio/openf1/drivers', async (request, response, next) => {
  try {
    const result = await fetchOpenF1('/drivers', {
      session_key: request.query.sessionKey
    });
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/studio/openf1/laps', async (request, response, next) => {
  try {
    const result = await fetchOpenF1('/laps', {
      session_key: request.query.sessionKey,
      driver_number: request.query.driverNumber
    });
    response.json(result.filter((lap) => lap.lap_duration !== null));
  } catch (error) {
    next(error);
  }
});

app.post('/api/studio/openf1/import', async (request, response, next) => {
  try {
    const { slug, sessionKey, driverNumber, lapNumber } = request.body;
    const telemetryDir = resolve(root, 'public/telemetry');
    const laps = await fetchOpenF1('/laps', {
      session_key: sessionKey,
      driver_number: driverNumber,
      lap_number: lapNumber
    });
    const lap = laps.find((item) => Number(item.lap_number) === Number(lapNumber));

    if (!lap || lap.lap_duration === null) {
      throw new Error('No timed lap found for the requested parameters.');
    }

    const window = buildLapWindow(lap);
    const [location, carData] = await Promise.all([
      fetchOpenF1('/location', {
        session_key: sessionKey,
        driver_number: driverNumber,
        'date>': window.startIso,
        'date<': window.endIso
      }),
      fetchOpenF1('/car_data', {
        session_key: sessionKey,
        driver_number: driverNumber,
        'date>': window.startIso,
        'date<': window.endIso
      })
    ]);

    await ensureDir(telemetryDir);

    const locationPath = resolve(telemetryDir, `${slug}.location.json`);
    const carDataPath = resolve(telemetryDir, `${slug}.car-data.json`);

    await writeFile(locationPath, `${JSON.stringify(location, null, 2)}\n`, 'utf8');
    await writeFile(carDataPath, `${JSON.stringify(carData, null, 2)}\n`, 'utf8');

    response.json({
      ok: true,
      telemetryLocationSrc: `/telemetry/${slug}.location.json`,
      telemetryCarDataSrc: `/telemetry/${slug}.car-data.json`,
      locationPoints: location.length,
      carSamples: carData.length,
      lapDuration: lap.lap_duration
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/studio/challenges', async (request, response, next) => {
  try {
    const existing = await readChallengeLibrary(challengeLibraryPath);
    const updated = upsertChallengeRecord(existing, request.body);

    await writeChallengeLibrary(challengeLibraryPath, updated);

    response.json({
      ok: true,
      total: updated.length
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/studio/challenges/:id', async (request, response, next) => {
  try {
    const existing = await readChallengeLibrary(challengeLibraryPath);
    const updated = removeChallengeRecord(existing, request.params.id);

    await writeChallengeLibrary(challengeLibraryPath, updated);

    response.json({
      ok: true,
      total: updated.length
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  response.status(500).json({
    ok: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
});

app.listen(PORT, () => {
  console.log(`Studio API listening on http://127.0.0.1:${PORT}`);
});
