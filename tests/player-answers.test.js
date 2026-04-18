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
    expect(getAcceptedAnswers(challenge)).toEqual(expect.arrayContaining([
      'circuit of the americas',
      'united states',
      '美洲赛道',
      '美国',
      'cota',
      'austin'
    ]));
  });
});

describe('isChallengeAnswerCorrect', () => {
  const challenge = {
    trackName: 'Circuit Gilles Villeneuve',
    trackCountry: 'Canada',
    answerAliases: ['Montreal', 'Gilles Villeneuve'],
    zhAliases: ['维伦纽夫赛道', '蒙特利尔']
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

  it('accepts chinese input aliases', () => {
    expect(isChallengeAnswerCorrect(challenge, '加拿大')).toBe(true);
  });

  it('accepts colloquial chinese track aliases', () => {
    expect(isChallengeAnswerCorrect(challenge, '维伦纽夫')).toBe(true);
  });

  it('rejects unrelated answers', () => {
    expect(isChallengeAnswerCorrect(challenge, 'Spa')).toBe(false);
  });
});
