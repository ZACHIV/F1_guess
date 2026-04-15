import { describe, expect, it } from 'vitest';
import { buildLapWindow } from '../server/lib/openf1.mjs';

describe('buildLapWindow', () => {
  it('computes the inclusive lap time window from lap metadata', () => {
    const result = buildLapWindow({
      date_start: '2025-06-28T15:12:22.382000+00:00',
      lap_duration: 63.971
    });

    expect(result.startIso).toBe('2025-06-28T15:12:22.382Z');
    expect(result.endIso).toBe('2025-06-28T15:13:26.353Z');
  });
});
