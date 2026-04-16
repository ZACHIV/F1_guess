import { describe, expect, it } from 'vitest';
import { getSynchronizedElapsedMs } from '../src/player/sync-utils.js';

describe('getSynchronizedElapsedMs', () => {
  it('subtracts the telemetry offset and clamps at zero', () => {
    expect(getSynchronizedElapsedMs(1200, { telemetryOffsetMs: 3000 })).toBe(0);
    expect(getSynchronizedElapsedMs(4500, { telemetryOffsetMs: 3000 })).toBe(1500);
  });

  it('falls back to the raw elapsed time when no offset is configured', () => {
    expect(getSynchronizedElapsedMs(4500, {})).toBe(4500);
  });
});
