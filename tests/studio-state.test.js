import { describe, expect, it } from 'vitest';
import {
  createDefaultStudioFormState,
  createEmptyStudioDraft,
  createInitialStudioState,
  createTurn1CropAssetState,
  getLapStats
} from '../src/studio/state.js';

describe('studio state factories', () => {
  it('creates a blank studio draft with turn1 fields', () => {
    const draft = createEmptyStudioDraft();

    expect(draft.status).toBe('draft');
    expect(draft.turn1CornerName).toBe('');
    expect(draft.turn1Crop).toBeNull();
    expect(draft.options).toEqual([]);
  });

  it('creates the default studio form state', () => {
    expect(createDefaultStudioFormState()).toEqual(expect.objectContaining({
      librarySort: 'manual',
      year: '2025',
      sessionName: 'Qualifying'
    }));
  });

  it('creates the default crop asset shell', () => {
    expect(createTurn1CropAssetState()).toEqual({
      svgSrc: '',
      status: 'idle',
      viewBox: '0 0 500 500',
      bounds: { x: 0, y: 0, width: 500, height: 500 },
      markup: '',
      error: ''
    });
  });

  it('creates the initial studio state', () => {
    const state = createInitialStudioState();

    expect(state.message).toBe('准备就绪。');
    expect(state.draft).toEqual(expect.objectContaining({ status: 'draft' }));
    expect(state.form).toEqual(expect.objectContaining({ librarySort: 'manual' }));
  });
});

describe('getLapStats', () => {
  it('returns defaults for empty lap lists', () => {
    expect(getLapStats([])).toEqual({
      fastestLap: null,
      maxLapNumber: ''
    });
  });

  it('returns fastest lap and max lap number', () => {
    const result = getLapStats([
      { lap_number: 2, lap_duration: 91.2 },
      { lap_number: 7, lap_duration: 89.9 },
      { lap_number: 4, lap_duration: 90.4 }
    ]);

    expect(result.fastestLap).toEqual({ lap_number: 7, lap_duration: 89.9 });
    expect(result.maxLapNumber).toBe('7');
  });
});
