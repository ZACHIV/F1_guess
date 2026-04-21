// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInitialStudioState, createTurn1CropAssetState } from '../src/studio/state.js';
import { renderTurn1CropSection } from '../src/studio/render.js';
import { loadTrackSvgMarkup } from '../src/studio/turn1-crop-workbench.js';
import { clampTurn1Crop } from '../src/lib/turn1-crop-utils.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function setDraftTurn1CropFactory(state) {
  return (bounds, nextCrop = state.draft.turn1Crop) => {
    state.draft.turn1Crop = nextCrop
      ? clampTurn1Crop(nextCrop, bounds)
      : state.draft.turn1Crop;
    return state.draft.turn1Crop;
  };
}

describe('turn1 crop workbench', () => {
  it('recomputes an initial crop when a new track svg is loaded', async () => {
    const state = createInitialStudioState();
    state.cropAsset.svgSrc = '/assets/tracks/old.svg';
    state.draft.turn1Crop = {
      aspectRatio: '4:3',
      x: 210,
      y: 210,
      width: 160,
      height: 120
    };

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"></svg>'
    })));

    await loadTrackSvgMarkup({
      svgSrc: '/assets/tracks/new.svg',
      state,
      render: () => {},
      createTurn1CropAssetState,
      setDraftTurn1Crop: setDraftTurn1CropFactory(state)
    });

    expect(state.cropAsset.svgSrc).toBe('/assets/tracks/new.svg');
    expect(state.draft.turn1Crop.x).not.toBe(210);
    expect(state.draft.turn1Crop.width).toBeGreaterThan(0);
  });

  it('disables the explicit save button while studio is busy', () => {
    const state = createInitialStudioState();
    state.busy = true;
    state.draft.trackSvgSrc = '/assets/tracks/test.svg';
    state.cropAsset = {
      svgSrc: '/assets/tracks/test.svg',
      status: 'ready',
      viewBox: '0 0 500 500',
      bounds: { x: 0, y: 0, width: 500, height: 500 },
      markup: '',
      error: ''
    };
    state.draft.turn1Crop = {
      aspectRatio: '4:3',
      x: 120,
      y: 140,
      width: 200,
      height: 150
    };

    const html = renderTurn1CropSection({
      state,
      setDraftTurn1Crop: setDraftTurn1CropFactory(state)
    });

    expect(html).toContain('id="turn1-save-btn" disabled');
  });
});
