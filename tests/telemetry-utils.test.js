import { describe, expect, it } from 'vitest';
import {
  buildTelemetryPath,
  getInterpolatedTelemetryPoint,
  getNearestTelemetrySample,
  normalizeTelemetryPoints
} from '../src/lib/telemetry-utils.js';

describe('normalizeTelemetryPoints', () => {
  it('scales telemetry into the target box and flips the y-axis for svg rendering', () => {
    const points = normalizeTelemetryPoints(
      [
        { x: 0, y: 0, elapsedMs: 0 },
        { x: 100, y: 50, elapsedMs: 500 },
        { x: 200, y: 100, elapsedMs: 1000 }
      ],
      { width: 300, height: 200, padding: 20 }
    );

    expect(points[0].x).toBe(20);
    expect(points[0].y).toBe(165);
    expect(points[2].x).toBe(280);
    expect(points[2].y).toBe(35);
  });
});

describe('buildTelemetryPath', () => {
  it('creates an svg path string from normalized telemetry', () => {
    const path = buildTelemetryPath([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 }
    ]);

    expect(path).toBe('M 10.00 20.00 L 30.00 40.00 L 50.00 60.00');
  });
});

describe('telemetry sampling', () => {
  const samples = [
    { elapsedMs: 0, x: 0, y: 100, speed: 200 },
    { elapsedMs: 500, x: 50, y: 50, speed: 250 },
    { elapsedMs: 1000, x: 100, y: 0, speed: 300 }
  ];

  it('interpolates marker position between two telemetry points', () => {
    const point = getInterpolatedTelemetryPoint(samples, 250);

    expect(point.x).toBe(25);
    expect(point.y).toBe(75);
  });

  it('returns the nearest telemetry state for hud values', () => {
    const state = getNearestTelemetrySample(samples, 760);

    expect(state.speed).toBe(300);
  });
});
