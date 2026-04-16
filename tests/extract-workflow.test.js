import { describe, expect, it } from 'vitest';
import {
  buildExtractionCommands,
  buildVideoMetadataCommand,
  getWorkflowMediaPaths
} from '../server/lib/extract-workflow.mjs';

describe('getWorkflowMediaPaths', () => {
  it('returns the canonical output paths for a slug', () => {
    expect(getWorkflowMediaPaths('spa-2026')).toEqual({
      audioMp3: 'public/audio/spa-2026.mp3',
      audioWav: 'public/audio/spa-2026.wav',
      videoMp4: '.tmp/spa-2026.mp4'
    });
  });
});

describe('buildExtractionCommands', () => {
  it('builds the expected yt-dlp and ffmpeg workflow for full-audio extraction', () => {
    const steps = buildExtractionCommands({
      slug: 'spa-2026',
      url: 'https://example.com/video'
    });

    expect(steps).toHaveLength(2);
    expect(steps[0]).toEqual({
      command: 'yt-dlp',
      args: [
        '--extract-audio',
        '--audio-format',
        'wav',
        '--audio-quality',
        '0',
        '--no-playlist',
        '--js-runtimes',
        'node',
        '-o',
        'public/audio/spa-2026.%(ext)s',
        'https://example.com/video'
      ]
    });
    expect(steps[1].command).toBe('ffmpeg');
    expect(steps[1].args).toContain('public/audio/spa-2026.wav');
    expect(steps[1].args).toContain('public/audio/spa-2026.mp3');
  });
});

describe('buildVideoMetadataCommand', () => {
  it('builds the expected yt-dlp metadata inspection command', () => {
    expect(
      buildVideoMetadataCommand({
        url: 'https://example.com/video'
      })
    ).toEqual({
      command: 'yt-dlp',
      args: ['--dump-single-json', '--skip-download', '--no-warnings', '--js-runtimes', 'node', 'https://example.com/video']
    });
  });
});
