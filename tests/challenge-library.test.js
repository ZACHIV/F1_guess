import { describe, expect, it } from 'vitest';
import { removeChallengeRecord, upsertChallengeRecord } from '../server/lib/challenge-library.mjs';

describe('upsertChallengeRecord', () => {
  it('adds a new challenge when the slug is not present', () => {
    const result = upsertChallengeRecord([], {
      id: 'melbourne-2026',
      title: 'Melbourne opener'
    });

    expect(result).toEqual([
      {
        id: 'melbourne-2026',
        title: 'Melbourne opener'
      }
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

    expect(result).toEqual([
      { id: 'melbourne-2026', title: 'New title' },
      { id: 'monza-2026', title: 'Monza' }
    ]);
  });

  it('removes a challenge by id', () => {
    const result = removeChallengeRecord(
      [
        { id: 'melbourne-2026', title: 'Melbourne' },
        { id: 'monza-2026', title: 'Monza' }
      ],
      'melbourne-2026'
    );

    expect(result).toEqual([{ id: 'monza-2026', title: 'Monza' }]);
  });
});
