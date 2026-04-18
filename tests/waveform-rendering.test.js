import { describe, expect, it } from 'vitest';
import { buildOscilloscopePoints, findTriggerIndex } from '../src/lib/waveform.js';

function buildSineFrame({ length = 128, shift = 0, period = 24 }) {
  return Float32Array.from({ length }, (_, index) => {
    const phase = ((index + shift) / period) * Math.PI * 2;
    return Math.sin(phase) * 0.7;
  });
}

function buildNoisySineFrame({ length = 128, period = 24 }) {
  return Float32Array.from({ length }, (_, index) => {
    const phase = (index / period) * Math.PI * 2;
    const wobble = index % 2 === 0 ? 0.12 : -0.12;
    return Math.sin(phase) * 0.7 + wobble;
  });
}

function averageAdjacentDelta(values) {
  let total = 0;
  for (let index = 1; index < values.length; index += 1) {
    total += Math.abs(values[index] - values[index - 1]);
  }

  return total / Math.max(1, values.length - 1);
}

function averageDifference(left, right) {
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += Math.abs(left[index] - right[index]);
  }

  return total / Math.max(1, left.length);
}

describe('waveform rendering helpers', () => {
  it('finds a rising-edge trigger so successive frames can align to the same phase', () => {
    const samples = Float32Array.from([-0.42, -0.28, -0.14, -0.03, 0.02, 0.18, 0.34, 0.41]);

    expect(findTriggerIndex(samples, 0.01)).toBe(4);
  });

  it('builds a smoother, phase-aligned point set for the oscilloscope path', () => {
    const firstFrame = buildSineFrame({ shift: 0 });
    const shiftedFrame = buildSineFrame({ shift: 7 });
    const noisyFrame = buildNoisySineFrame({});

    const firstPoints = buildOscilloscopePoints(firstFrame, 42, {
      triggerThreshold: 0.01,
      windowRadius: 3
    });
    const shiftedPoints = buildOscilloscopePoints(shiftedFrame, 42, {
      triggerThreshold: 0.01,
      windowRadius: 3
    });
    const unalignedShiftedPoints = buildOscilloscopePoints(shiftedFrame, 42, {
      alignPhase: false,
      windowRadius: 3
    });
    const noisyPoints = buildOscilloscopePoints(noisyFrame, 42, {
      triggerThreshold: 0.01,
      windowRadius: 3
    });
    const unsmoothedNoisyPoints = buildOscilloscopePoints(noisyFrame, 42, {
      triggerThreshold: 0.01,
      windowRadius: 0
    });

    expect(firstPoints).toHaveLength(42);
    expect(averageAdjacentDelta(noisyPoints)).toBeLessThan(averageAdjacentDelta(unsmoothedNoisyPoints));
    expect(averageDifference(firstPoints, shiftedPoints)).toBeLessThan(averageDifference(firstPoints, unalignedShiftedPoints));
  });
});
