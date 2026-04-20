import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  duplicateChallengeRecord,
  getChallengeLibrarySummary,
  moveChallengeRecord,
  normalizeChallengeRecord,
  removeChallengeRecord,
  sortChallengeRecords,
  upsertChallengeRecord
} from '../server/lib/challenge-library.mjs';

describe('normalizeChallengeRecord', () => {
  it('fills default management fields for challenge records', () => {
    const result = normalizeChallengeRecord({
      id: 'melbourne-2026',
      title: 'Melbourne opener'
    });

    expect(result.category).toBe('Uncategorized');
    expect(result.status).toBe('draft');
    expect(result.tags).toEqual([]);
    expect(result.notes).toBe('');
    expect(result.sortOrder).toBe(0);
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });
});

describe('upsertChallengeRecord', () => {
  it('adds a new challenge when the slug is not present', () => {
    const result = upsertChallengeRecord([], {
      id: 'melbourne-2026',
      title: 'Melbourne opener'
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'melbourne-2026',
        title: 'Melbourne opener',
        sortOrder: 0
      })
    ]);
  });

  it('replaces an existing challenge with the same id', () => {
    const result = upsertChallengeRecord(
      [
        { id: 'melbourne-2026', title: 'Old title' },
        { id: 'monza-2026', title: 'Monza' }
      ],
      { id: 'melbourne-2026', title: 'New title' }
    );

    expect(result[0]).toEqual(expect.objectContaining({ id: 'melbourne-2026', title: 'New title' }));
    expect(result[1]).toEqual(expect.objectContaining({ id: 'monza-2026', title: 'Monza' }));
  });

  it('removes a challenge by id', () => {
    const result = removeChallengeRecord(
      [
        { id: 'melbourne-2026', title: 'Melbourne' },
        { id: 'monza-2026', title: 'Monza' }
      ],
      'melbourne-2026'
    );

    expect(result).toEqual([expect.objectContaining({ id: 'monza-2026', title: 'Monza', sortOrder: 0 })]);
  });
});

describe('sortChallengeRecords', () => {
  it('sorts by category when requested', () => {
    const result = sortChallengeRecords(
      [
        { id: 'b', title: 'B', category: 'Tracks' },
        { id: 'a', title: 'A', category: 'Drivers' }
      ],
      'category-asc'
    );

    expect(result.map((record) => record.id)).toEqual(['a', 'b']);
  });
});

describe('moveChallengeRecord', () => {
  it('moves a record up in manual ordering', () => {
    const result = moveChallengeRecord(
      [
        { id: 'a', title: 'A', sortOrder: 0 },
        { id: 'b', title: 'B', sortOrder: 1 },
        { id: 'c', title: 'C', sortOrder: 2 }
      ],
      'c',
      'up'
    );

    expect(result.map((record) => record.id)).toEqual(['a', 'c', 'b']);
    expect(result.map((record) => record.sortOrder)).toEqual([0, 1, 2]);
  });
});

describe('duplicateChallengeRecord', () => {
  it('duplicates a challenge with a new draft identity', () => {
    const result = duplicateChallengeRecord(
      [{ id: 'austria-2025', title: 'Austria', status: 'ready' }],
      'austria-2025',
      'austria-2025-copy'
    );

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: 'austria-2025-copy',
        title: 'Austria Copy',
        status: 'draft'
      })
    );
  });
});

describe('getChallengeLibrarySummary', () => {
  it('returns total count and distinct category/status lists', () => {
    const result = getChallengeLibrarySummary([
      { id: 'a', title: 'A', category: 'Qualifying', status: 'draft' },
      { id: 'b', title: 'B', category: 'Race', status: 'ready' },
      { id: 'c', title: 'C', category: 'Qualifying', status: 'ready' }
    ]);

    expect(result).toEqual({
      total: 3,
      categories: ['Qualifying', 'Race'],
      statuses: ['draft', 'ready']
    });
  });
});

describe('azerbaijan challenge assets', () => {
  it('uses real Azerbaijan telemetry instead of the Monza placeholder', () => {
    const challengeLibrary = JSON.parse(
      readFileSync(resolve(process.cwd(), 'src/data/challenge-library.json'), 'utf8')
    );
    const azerbaijan = challengeLibrary.find((record) => record.id === 'azerbaijan-quali-max-verstappen-2025');

    expect(azerbaijan).toBeTruthy();
    expect(azerbaijan.notes).not.toContain('manual placeholder');
    expect(azerbaijan.telemetrySource).not.toContain('Manual placeholder');
    expect(azerbaijan.telemetrySource).toContain('Azerbaijan');

    const azerbaijanLocation = readFileSync(
      resolve(process.cwd(), 'public/telemetry/azerbaijan-quali-max-verstappen-2025.location.json'),
      'utf8'
    );
    const italyLocation = readFileSync(
      resolve(process.cwd(), 'public/telemetry/italy-quali-max-verstappen-2025.location.json'),
      'utf8'
    );
    const azerbaijanCarData = readFileSync(
      resolve(process.cwd(), 'public/telemetry/azerbaijan-quali-max-verstappen-2025.car-data.json'),
      'utf8'
    );
    const italyCarData = readFileSync(
      resolve(process.cwd(), 'public/telemetry/italy-quali-max-verstappen-2025.car-data.json'),
      'utf8'
    );

    expect(azerbaijanLocation).not.toBe(italyLocation);
    expect(azerbaijanCarData).not.toBe(italyCarData);
  });
});
