import { describe, expect, it } from 'vitest';
import {
  buildTurn1CropFromSampledPoints,
  buildDefaultTurn1Crop,
  buildViewBoxBounds,
  clampTurn1Crop,
  moveTurn1Crop,
  resizeTurn1Crop,
  scaleTurn1Crop,
  withTurn1AspectRatio
} from '../src/lib/turn1-crop-utils.js';

const bounds = { x: 0, y: 0, width: 500, height: 500 };

describe('turn1 crop utils', () => {
  it('parses svg viewBox strings into numeric bounds', () => {
    expect(buildViewBoxBounds('0 0 640 480')).toEqual({ x: 0, y: 0, width: 640, height: 480 });
  });

  it('builds a default centered crop that respects the selected aspect ratio', () => {
    const crop = buildDefaultTurn1Crop(bounds, '16:9');

    expect((crop.width / crop.height).toFixed(4)).toBe((16 / 9).toFixed(4));
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
  });

  it('detects an initial turn crop from sampled path points', () => {
    const syntheticTurn = [
      { x: 20, y: 200 },
      { x: 60, y: 200 },
      { x: 100, y: 200 },
      { x: 140, y: 200 },
      { x: 180, y: 200 },
      { x: 210, y: 200 },
      { x: 230, y: 190 },
      { x: 245, y: 170 },
      { x: 250, y: 140 },
      { x: 248, y: 110 },
      { x: 240, y: 80 },
      { x: 228, y: 60 },
      { x: 210, y: 45 },
      { x: 185, y: 35 },
      { x: 160, y: 30 }
    ];

    const crop = buildTurn1CropFromSampledPoints(syntheticTurn, bounds, '4:3');

    expect(crop.x + crop.width / 2).toBeGreaterThan(130);
    expect(crop.y + crop.height / 2).toBeLessThan(180);
    expect(crop.width / crop.height).toBeCloseTo(4 / 3, 3);
  });

  it('keeps crops inside bounds when moving', () => {
    const crop = moveTurn1Crop({
      aspectRatio: '4:3',
      x: 420,
      y: 420,
      width: 160,
      height: 120
    }, 40, 40, bounds);

    expect(crop.x + crop.width).toBeLessThanOrEqual(500);
    expect(crop.y + crop.height).toBeLessThanOrEqual(500);
  });

  it('preserves the center when switching aspect ratios', () => {
    const crop = withTurn1AspectRatio({
      aspectRatio: '4:3',
      x: 100,
      y: 100,
      width: 200,
      height: 150
    }, '1:1', bounds);

    expect((crop.width / crop.height).toFixed(4)).toBe('1.0000');
    expect(crop.x + crop.width / 2).toBeCloseTo(200, 1);
    expect(crop.y + crop.height / 2).toBeCloseTo(175, 1);
  });

  it('scales crops around the center', () => {
    const crop = scaleTurn1Crop({
      aspectRatio: '4:3',
      x: 120,
      y: 140,
      width: 200,
      height: 150
    }, 1.2, bounds);

    expect(crop.width).toBeGreaterThan(200);
    expect(crop.height).toBeGreaterThan(150);
    expect(crop.x + crop.width / 2).toBeCloseTo(220, 1);
  });

  it('resizes from a corner handle while locking aspect ratio', () => {
    const crop = resizeTurn1Crop({
      aspectRatio: '4:3',
      x: 100,
      y: 100,
      width: 200,
      height: 150
    }, 'se', { x: 360, y: 310 }, bounds);

    expect((crop.width / crop.height).toFixed(4)).toBe((4 / 3).toFixed(4));
    expect(crop.width).toBeGreaterThan(200);
    expect(crop.height).toBeGreaterThan(150);
  });

  it('clamps oversized crops back into the editable bounds', () => {
    const crop = clampTurn1Crop({
      aspectRatio: '9:16',
      x: -40,
      y: -20,
      width: 700,
      height: 1300
    }, bounds);

    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.x + crop.width).toBeLessThanOrEqual(500);
    expect(crop.y + crop.height).toBeLessThanOrEqual(500);
  });
});
