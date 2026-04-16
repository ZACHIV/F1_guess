import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLapWindow, fetchOpenF1 } from '../server/lib/openf1.mjs';

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

describe('fetchOpenF1', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries when OpenF1 responds with 429 and then returns the JSON payload', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get(name) {
            return name.toLowerCase() === 'retry-after' ? '0' : null;
          }
        }
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ session_key: 9999 }]
      });
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await fetchOpenF1('/sessions', { year: 2025 }, { fetchImpl, sleep });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ session_key: 9999 }]);
  });
});
