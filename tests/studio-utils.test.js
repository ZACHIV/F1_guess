import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  formatDurationLabel,
  friendlyErrorMessage,
  requireValue,
  roundCropValue
} from '../src/studio/utils.js';

describe('studio utils', () => {
  it('formats durations for extracted audio labels', () => {
    expect(formatDurationLabel(62_000)).toBe('00:01:02');
  });

  it('rounds crop values for UI display', () => {
    expect(roundCropValue(120)).toBe('120');
    expect(roundCropValue(120.38)).toBe('120.4');
  });

  it('escapes user-controlled html snippets', () => {
    expect(escapeHtml('<track "1">')).toBe('&lt;track &quot;1&quot;&gt;');
  });

  it('maps known backend failures to friendly copy', () => {
    expect(friendlyErrorMessage('F1DB circuit not found for query: monaco')).toContain('本地 f1db');
  });

  it('throws when required values are empty', () => {
    expect(() => requireValue('', 'missing')).toThrow('missing');
  });
});
