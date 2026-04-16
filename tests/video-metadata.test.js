import { describe, expect, it } from 'vitest';
import {
  parseVideoMetadata,
  pickFastestLap,
  resolveParsedVideoMetadata
} from '../server/lib/video-metadata.mjs';

describe('parseVideoMetadata', () => {
  it('extracts qualifying metadata from title and description', () => {
    const result = parseVideoMetadata({
      title: 'Lando Norris Pole Lap | 2025 Austrian GP Qualifying Onboard',
      description: 'McLaren onboard from the Red Bull Ring in Spielberg.'
    });

    expect(result.trackName).toBe('Red Bull Ring');
    expect(result.trackCountry).toBe('Austria');
    expect(result.driverName).toBe('Lando Norris');
    expect(result.driverNumber).toBe('4');
    expect(result.year).toBe('2025');
    expect(result.sessionName).toBe('Qualifying');
    expect(result.id).toBe('austria-quali-lando-norris-2025');
  });

  it('leaves unknown fields blank for manual completion', () => {
    const result = parseVideoMetadata({
      title: 'Onboard lap from a crazy weekend',
      description: ''
    });

    expect(result.trackName).toBe('');
    expect(result.driverName).toBe('');
    expect(result.year).toBe('');
    expect(result.unresolvedFields).toEqual(['trackName', 'driverName', 'year']);
  });
});

describe('pickFastestLap', () => {
  it('returns the quickest valid lap', () => {
    expect(
      pickFastestLap([
        { lap_number: 4, lap_duration: null },
        { lap_number: 7, lap_duration: 64.4 },
        { lap_number: 9, lap_duration: 63.9 }
      ])
    ).toEqual({ lap_number: 9, lap_duration: 63.9 });
  });
});

describe('resolveParsedVideoMetadata', () => {
  it('fills session key and fastest qualifying lap when matches are unique', async () => {
    const fetchOpenF1 = async (pathname) => {
      if (pathname === '/sessions') {
        return [
          {
            session_key: 9951,
            session_name: 'Qualifying',
            circuit_short_name: 'Spielberg',
            country_name: 'Austria',
            location: 'Spielberg'
          }
        ];
      }

      if (pathname === '/drivers') {
        return [
          {
            session_key: 9951,
            driver_number: 4,
            full_name: 'Lando NORRIS'
          }
        ];
      }

      if (pathname === '/laps') {
        return [
          { lap_number: 14, lap_duration: 64.268 },
          { lap_number: 17, lap_duration: 63.971 }
        ];
      }

      return [];
    };

    const parsed = parseVideoMetadata({
      title: 'Lando Norris Pole Lap | 2025 Austrian GP Qualifying Onboard',
      description: 'Red Bull Ring onboard.'
    });
    const resolved = await resolveParsedVideoMetadata(parsed, fetchOpenF1);

    expect(resolved.sessionKey).toBe('9951');
    expect(resolved.driverNumber).toBe('4');
    expect(resolved.lapNumber).toBe('17');
  });

  it('falls back to an alternate fastest-lap resolver when OpenF1 laps are missing', async () => {
    const fetchOpenF1 = async (pathname) => {
      if (pathname === '/sessions') {
        return [
          {
            session_key: 9900,
            session_name: 'Qualifying',
            circuit_short_name: 'Baku',
            country_name: 'Azerbaijan',
            location: 'Baku'
          }
        ];
      }

      if (pathname === '/drivers') {
        return [
          {
            session_key: 9900,
            driver_number: 1,
            full_name: 'Max VERSTAPPEN'
          }
        ];
      }

      if (pathname === '/laps') {
        throw new Error('OpenF1 request failed: 404');
      }

      return [];
    };

    const parsed = {
      ...parseVideoMetadata({
        title: 'Max Verstappen Pole Lap | 2025 Azerbaijan Grand Prix Qualifying Onboard',
        description: 'Baku onboard.'
      }),
      grandPrix: 'Azerbaijan Grand Prix'
    };
    const resolveFastestLap = async () => ({
      lapNumber: '22',
      lapStartIso: '2025-09-20T14:10:13.495Z',
      lapDurationSeconds: 101.117
    });

    const resolved = await resolveParsedVideoMetadata(parsed, fetchOpenF1, { resolveFastestLap });

    expect(resolved.sessionKey).toBe('9900');
    expect(resolved.driverNumber).toBe('1');
    expect(resolved.lapNumber).toBe('22');
    expect(resolved.lapStartIso).toBe('2025-09-20T14:10:13.495Z');
    expect(resolved.lapDurationSeconds).toBe(101.117);
  });
});
