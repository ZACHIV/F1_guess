import { describe, expect, it } from 'vitest';
import { getTrackNote } from '../src/player/track-notes.js';

describe('track-notes locale behavior', () => {
  it('returns localized japanese and korean track notes', () => {
    expect(getTrackNote('Monza', 'ja')).toContain('スピードの殿堂');
    expect(getTrackNote('Monza', 'ko')).toContain('스피드의 성전');
  });

  it('falls back to english for locales without translated notes', () => {
    expect(getTrackNote('Monza', 'fr')).toContain('Temple of Speed');
    expect(getTrackNote('Monza', 'it')).toContain('Temple of Speed');
  });
});
