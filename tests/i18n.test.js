import { describe, expect, it } from 'vitest';
import {
  getLocalizedAnswerLabel,
  t
} from '../src/player/i18n.js';
import {
  getCountryNameByLocale,
  getLocaleLabel,
  getTrackNameByLocale,
  normalizeLocale
} from '../src/player/track-locales.js';

describe('i18n locale support', () => {
  it('normalizes browser-style locale strings to supported app locales', () => {
    expect(normalizeLocale('zh-TW')).toBe('zh-Hant');
    expect(normalizeLocale('fr-FR')).toBe('fr');
    expect(normalizeLocale('it-IT')).toBe('it');
    expect(normalizeLocale('ko-KR')).toBe('ko');
  });

  it('returns localized labels and track names for supported locales', () => {
    expect(getLocaleLabel('ja')).toBe('日本語');
    expect(getLocaleLabel('it')).toBe('Italiano');
    expect(getTrackNameByLocale('Suzuka', 'zh-Hant')).toBe('鈴鹿賽道');
    expect(getCountryNameByLocale('Italy', 'it')).toBe('Italia');
    expect(getCountryNameByLocale('Italy', 'fr')).toBe('Italie');
    expect(t('de', 'startDuel')).toBe('Duell starten');
    expect(t('it', 'startDuel')).toBe('Inizia duello');
  });

  it('builds a localized answer label outside English', () => {
    expect(getLocalizedAnswerLabel({
      trackName: 'Monza',
      trackCountry: 'Italy'
    }, 'zh-Hant')).toBe('蒙扎賽道 · 義大利');
  });
});
