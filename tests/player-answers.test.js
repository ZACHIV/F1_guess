import { describe, expect, it } from 'vitest';
import {
  getAcceptedAnswers,
  isChallengeAnswerCorrect,
  normalizeAnswer
} from '../src/player/answer-utils.js';

describe('normalizeAnswer', () => {
  it('lowercases, trims, and strips punctuation for fuzzy text matching', () => {
    expect(normalizeAnswer('  COTA!!!  ')).toBe('cota');
  });
});

describe('getAcceptedAnswers', () => {
  const challenge = {
    trackName: 'Circuit of the Americas',
    trackCountry: 'United States',
    answerAliases: ['COTA', 'Austin']
  };

  it('collects track, country, and aliases into one normalized answer set', () => {
    expect(getAcceptedAnswers(challenge)).toEqual([
      'circuit of the americas',
      'united states',
      'cota',
      'austin'
    ]);
  });
});

describe('isChallengeAnswerCorrect', () => {
  const challenge = {
    trackName: 'Circuit Gilles Villeneuve',
    trackCountry: 'Canada',
    answerAliases: ['Montreal', 'Gilles Villeneuve']
  };

  it('accepts the full circuit name in formal mode', () => {
    expect(isChallengeAnswerCorrect(challenge, 'Circuit Gilles Villeneuve')).toBe(true);
  });

  it('accepts the country in formal mode', () => {
    expect(isChallengeAnswerCorrect(challenge, 'canada')).toBe(true);
  });

  it('accepts aliases and abbreviations in formal mode', () => {
    expect(isChallengeAnswerCorrect(challenge, 'Montreal')).toBe(true);
  });

  it('rejects unrelated answers', () => {
    expect(isChallengeAnswerCorrect(challenge, 'Spa')).toBe(false);
  });
});
