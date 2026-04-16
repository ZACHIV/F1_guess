import { describe, expect, it } from 'vitest';
import {
  buildRacePoleChallengeRecord,
  buildRacePoleSlug,
  getRacePoleTrackMetadata
} from '../server/lib/race-pole-batch.mjs';

describe('buildRacePoleSlug', () => {
  it('uses the canonical track-driver-year qualifying slug format', () => {
    expect(
      buildRacePoleSlug({
        grandPrix: 'Australian Grand Prix',
        poleSitter: 'Lando Norris',
        year: '2025'
      })
    ).toBe('australia-quali-lando-norris-2025');
  });
});

describe('getRacePoleTrackMetadata', () => {
  it('returns the configured circuit mapping for a grand prix', () => {
    expect(getRacePoleTrackMetadata('United States Grand Prix')).toMatchObject({
      trackName: 'Circuit of the Americas',
      trackCountry: 'United States',
      trackQuery: 'Austin / COTA'
    });
  });
});

describe('buildRacePoleChallengeRecord', () => {
  it('builds a ready-to-save challenge with audio, telemetry, svg, and sync offset', () => {
    const record = buildRacePoleChallengeRecord({
      row: {
        round: '10',
        grand_prix: 'Canadian Grand Prix',
        race_date: '2025-06-15',
        pole_sitter: 'George Russell',
        youtube_title: "George Russell's Pole Lap | 2025 Canadian Grand Prix | Pirelli",
        youtube_url: 'https://www.youtube.com/watch?v=-Ya90uFjYEE',
        session_key: '9951'
      },
      resolved: {
        title: '2025 · Circuit Gilles Villeneuve · Qualifying · George Russell',
        driverNumber: '63',
        lapNumber: '17'
      },
      importedTrack: {
        trackSvgSrc: '/assets/tracks/canada-quali-george-russell-2025.svg'
      },
      importedTelemetry: {
        telemetryLocationSrc: '/telemetry/canada-quali-george-russell-2025.location.json',
        telemetryCarDataSrc: '/telemetry/canada-quali-george-russell-2025.car-data.json',
        lapDuration: 70.123
      },
      durationMs: 74200
    });

    expect(record.id).toBe('canada-quali-george-russell-2025');
    expect(record.audioSrc).toBe('/audio/canada-quali-george-russell-2025.mp3');
    expect(record.trackSvgSrc).toBe('/assets/tracks/canada-quali-george-russell-2025.svg');
    expect(record.telemetryLocationSrc).toBe('/telemetry/canada-quali-george-russell-2025.location.json');
    expect(record.telemetryOffsetMs).toBe(3000);
    expect(record.sessionKey).toBe('9951');
    expect(record.lapNumber).toBe('17');
    expect(record.sortOrder).toBe(9);
    expect(record.clipDurationMs).toBe(74200);
    expect(record.answerAliases).toContain('Montreal');
  });
});
