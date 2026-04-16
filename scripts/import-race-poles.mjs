#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { buildExtractionCommands, getWorkflowMediaPaths } from '../server/lib/extract-workflow.mjs';
import { resolveFastestLapWithFastF1 } from '../server/lib/fastf1-fallback.mjs';
import { importLocalCircuitSvg } from '../server/lib/f1db-local.mjs';
import { buildLapWindow, fetchOpenF1 } from '../server/lib/openf1.mjs';
import {
  readChallengeLibrary,
  upsertChallengeRecord,
  writeChallengeLibrary
} from '../server/lib/challenge-library.mjs';
import { resolveParsedVideoMetadata } from '../server/lib/video-metadata.mjs';
import {
  buildRacePoleChallengeRecord,
  buildRacePoleSlug,
  getRacePoleTrackMetadata,
  listRacePoleGrandPrixNames
} from '../server/lib/race-pole-batch.mjs';

const root = process.cwd();
const localToolDir = resolve(root, '.tools/bin');
const youtubeCookiesPath = resolve(root, '.tmp/youtube-cookies.txt');
const csvPath = resolve(root, process.argv[2] || 'output/spreadsheet/f1_2025_race_poles.csv');
const challengeLibraryPath = resolve(root, 'src/data/challenge-library.json');
const telemetryDir = resolve(root, 'public/telemetry');
const trackDir = resolve(root, 'public/assets/tracks');
const legacyIdsToRemove = new Set([
  'austria-pole-onboard-2025',
  'canada-quali-george-russell-2025',
  'united-states-quali-max-verstappen-2025'
]);
const manualPlaceholders = new Map([
  [
    'Azerbaijan Grand Prix',
    {
      copyFromGrandPrix: 'Italian Grand Prix',
      note: 'Manual placeholder: OpenF1 fastest-lap data is incomplete for 2025 Azerbaijan qualifying. Audio/telemetry are copied from round 16 and must be replaced manually.'
    }
  ]
]);

function resolveCommand(command) {
  const localCommand = resolve(localToolDir, command);
  return existsSync(localCommand) ? localCommand : command;
}

function runCommand(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(resolveCommand(command), args, { cwd: root, stdio: 'inherit' });

    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

function runCommandWithOutput(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(resolveCommand(command), args, { cwd: root });
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
      if (code === 0) {
        resolvePromise(stdout.trim());
        return;
      }

      rejectPromise(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}

async function ensureDir(pathname) {
  if (!existsSync(pathname)) {
    await mkdir(pathname, { recursive: true });
  }
}

function parseCsv(source) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(current);
      current = '';
      if (row.some((value) => value !== '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  return dataRows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  );
}

function serializeCsv(rows) {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escapeValue = (value) => {
    const stringValue = String(value ?? '');
    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replaceAll('"', '""')}"`;
    }
    return stringValue;
  };

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(','))
  ].join('\n') + '\n';
}

function formatDriverAliases(driverName) {
  const parts = String(driverName ?? '').trim().split(/\s+/).filter(Boolean);
  return [...new Set([driverName, parts.at(-1), parts[0]].filter(Boolean))];
}

function buildResolvedSeed(row) {
  const track = getRacePoleTrackMetadata(row.grand_prix);
  const year = String(new Date(row.race_date).getUTCFullYear());
  return {
    grandPrix: row.grand_prix,
    sourceTitle: row.youtube_title,
    sourceDescription: row.youtube_url,
    id: buildRacePoleSlug({
      grandPrix: row.grand_prix,
      poleSitter: row.pole_sitter,
      year
    }),
    title: row.youtube_title,
    trackName: track.trackName,
    trackCountry: track.trackCountry,
    trackQuery: track.trackQuery,
    trackAliases: track.answerAliases,
    driverName: row.pole_sitter,
    driverNumber: '',
    driverAliases: formatDriverAliases(row.pole_sitter),
    year,
    sessionName: 'Qualifying',
    sessionKey: '',
    lapNumber: '',
    unresolvedFields: []
  };
}

function buildDebugOptions(currentGrandPrix) {
  const names = listRacePoleGrandPrixNames();
  const currentIndex = names.indexOf(currentGrandPrix);
  const currentTrack = getRacePoleTrackMetadata(currentGrandPrix).trackName;
  const picks = new Set([currentTrack]);

  for (let offset = 1; picks.size < 4 && offset < names.length; offset += 1) {
    const nextName = names[(currentIndex + offset) % names.length];
    picks.add(getRacePoleTrackMetadata(nextName).trackName);
  }

  return [...picks];
}

async function probeDuration(pathname) {
  const output = await runCommandWithOutput('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    pathname
  ]);

  return Math.round(Number.parseFloat(output || '0') * 1000);
}

async function removeExistingArtifacts(slug) {
  const mediaPaths = getWorkflowMediaPaths(slug);
  const extraPaths = [
    resolve(root, mediaPaths.audioMp3),
    resolve(root, mediaPaths.audioWav),
    resolve(root, mediaPaths.videoMp4),
    resolve(root, '.tmp', `${slug}.source.wav`),
    resolve(root, 'public/telemetry', `${slug}.location.json`),
    resolve(root, 'public/telemetry', `${slug}.car-data.json`),
    resolve(root, 'public/assets/tracks', `${slug}.svg`)
  ];

  await Promise.all(extraPaths.map((pathname) => rm(pathname, { force: true })));
}

async function createManualPlaceholderArtifacts({ slug, sourceSlug }) {
  const targets = [
    ['public/audio', '.wav'],
    ['public/audio', '.mp3'],
    ['public/telemetry', '.location.json'],
    ['public/telemetry', '.car-data.json']
  ];

  for (const [dir, suffix] of targets) {
    await cp(resolve(root, dir, `${sourceSlug}${suffix}`), resolve(root, dir, `${slug}${suffix}`), {
      force: true
    });
  }
}

async function importTelemetry({ slug, sessionKey, driverNumber, lapNumber, lapStartIso = '', lapDurationSeconds = 0 }) {
  let lapDuration = lapDurationSeconds;
  let window = null;

  if (lapStartIso && lapDurationSeconds) {
    window = buildLapWindow({
      date_start: lapStartIso,
      lap_duration: lapDurationSeconds
    });
  } else {
    const laps = await fetchOpenF1('/laps', {
      session_key: sessionKey,
      driver_number: driverNumber,
      lap_number: lapNumber
    });
    const lap = laps.find((item) => Number(item.lap_number) === Number(lapNumber));

    if (!lap || lap.lap_duration === null) {
      throw new Error(`No timed lap found for ${slug}`);
    }

    lapDuration = lap.lap_duration;
    window = buildLapWindow(lap);
  }
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

  return {
    telemetryLocationSrc: `/telemetry/${slug}.location.json`,
    telemetryCarDataSrc: `/telemetry/${slug}.car-data.json`,
    lapDuration
  };
}

async function extractAudio(row, slug) {
  if (existsSync(youtubeCookiesPath)) {
    for (const step of buildExtractionCommands({
      slug,
      url: row.youtube_url,
      cookiesPath: youtubeCookiesPath
    })) {
      await runCommand(step.command, step.args);
    }

    return probeDuration(resolve(root, getWorkflowMediaPaths(slug).audioMp3));
  }

  const cookieBrowsers = ['', 'chrome', 'safari', 'brave', 'edge', 'firefox'];
  let lastError = null;

  for (const cookiesFromBrowser of cookieBrowsers) {
    try {
      for (const step of buildExtractionCommands({ slug, url: row.youtube_url, cookiesFromBrowser })) {
        await runCommand(step.command, step.args);
      }

      return probeDuration(resolve(root, getWorkflowMediaPaths(slug).audioMp3));
    } catch (error) {
      lastError = error;
      await removeExistingArtifacts(slug);
    }
  }

  throw lastError ?? new Error(`Audio extraction failed for ${slug}`);
}

async function main() {
  await ensureDir(resolve(root, '.tmp'));
  await ensureDir(resolve(root, 'public/audio'));
  await ensureDir(telemetryDir);
  await ensureDir(trackDir);

  const csvSource = await readFile(csvPath, 'utf8');
  const rows = parseCsv(csvSource);
  const existingRecords = await readChallengeLibrary(challengeLibraryPath);
  const generatedSlugs = rows.map((row) =>
    buildRacePoleSlug({
      grandPrix: row.grand_prix,
      poleSitter: row.pole_sitter,
      year: String(new Date(row.race_date).getUTCFullYear())
    })
  );

  let nextRecords = existingRecords.filter(
    (record) => !generatedSlugs.includes(record.id) && !legacyIdsToRemove.has(record.id)
  );

  for (const row of rows) {
    const seed = buildResolvedSeed(row);
    const slug = seed.id;
    const track = getRacePoleTrackMetadata(row.grand_prix);
    const manualPlaceholder = manualPlaceholders.get(row.grand_prix);

    console.log(`\n[import] Processing round ${row.round}: ${row.grand_prix} (${slug})`);
    await removeExistingArtifacts(slug);

    const resolved = await resolveParsedVideoMetadata(seed, fetchOpenF1, {
      resolveFastestLap: (metadata) =>
        resolveFastestLapWithFastF1({
          year: metadata.year,
          grandPrix: metadata.grandPrix,
          driverNumber: metadata.driverNumber
        })
    });
    if (!resolved.sessionKey || !resolved.driverNumber || !resolved.lapNumber) {
      throw new Error(`Unable to resolve OpenF1 metadata for ${row.grand_prix}: ${resolved.unresolvedFields.join(', ')}`);
    }

    row.session_key = resolved.sessionKey;

    const importedTrack = await importLocalCircuitSvg(root, {
      assetName: slug,
      query: track.trackQuery
    });
    let durationMs;
    let importedTelemetry;

    if (manualPlaceholder) {
      const sourceSlug = buildRacePoleSlug({
        grandPrix: manualPlaceholder.copyFromGrandPrix,
        poleSitter: rows[Number(row.round) - 2].pole_sitter,
        year: String(new Date(rows[Number(row.round) - 2].race_date).getUTCFullYear())
      });
      await createManualPlaceholderArtifacts({ slug, sourceSlug });
      durationMs = await probeDuration(resolve(root, getWorkflowMediaPaths(slug).audioMp3));
      importedTelemetry = {
        telemetryLocationSrc: `/telemetry/${slug}.location.json`,
        telemetryCarDataSrc: `/telemetry/${slug}.car-data.json`,
        lapDuration: Number(resolved.lapDurationSeconds || 0)
      };
    } else {
      durationMs = await extractAudio(row, slug);
      importedTelemetry = await importTelemetry({
        slug,
        sessionKey: resolved.sessionKey,
        driverNumber: resolved.driverNumber,
        lapNumber: resolved.lapNumber,
        lapStartIso: resolved.lapStartIso,
        lapDurationSeconds: resolved.lapDurationSeconds
      });
    }

    const challengeRecord = buildRacePoleChallengeRecord({
      row,
      resolved,
      importedTrack,
      importedTelemetry,
      durationMs
    });

    challengeRecord.options = buildDebugOptions(row.grand_prix);
    if (manualPlaceholder) {
      challengeRecord.status = 'draft';
      challengeRecord.notes = `${manualPlaceholder.note}\nOriginal video: ${row.youtube_url}`;
      challengeRecord.telemetrySource = `Manual placeholder copied from ${manualPlaceholder.copyFromGrandPrix} (${buildRacePoleSlug({
        grandPrix: manualPlaceholder.copyFromGrandPrix,
        poleSitter: rows[Number(row.round) - 2].pole_sitter,
        year: String(new Date(rows[Number(row.round) - 2].race_date).getUTCFullYear())
      })})`;
    }
    nextRecords = upsertChallengeRecord(nextRecords, challengeRecord);
    await writeChallengeLibrary(challengeLibraryPath, nextRecords);
    await writeFile(csvPath, serializeCsv(rows), 'utf8');
  }
  console.log(`\n[import] Done. Updated CSV at ${csvPath} and wrote ${rows.length} challenge records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
