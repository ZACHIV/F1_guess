import { describe, expect, it } from 'vitest';
import {
  buildResultNarrative,
  pickResultVariant
} from '../src/player/result-copy.js';

describe('result-copy', () => {
  it('builds a localized narrative from the chosen variant id', () => {
    const narrative = buildResultNarrative(
      'en',
      'lose',
      {
        track: 'Monza',
        answer: 'Monza · Italy',
        delta: '3.68s'
      },
      1
    );

    expect(narrative.variantId).toBe(1);
    expect(narrative.headline).toContain('You got Monza');
    expect(narrative.copy).toContain('3.68s');
  });

  it('picks a valid variant index for the requested outcome', () => {
    const variantId = pickResultVariant('win');
    expect(Number.isInteger(variantId)).toBe(true);
    expect(variantId).toBeGreaterThanOrEqual(0);
    expect(variantId).toBeLessThan(5);
  });
});
