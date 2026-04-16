import { describe, expect, it } from 'vitest';
import {
  buildMetadataAssistantPrompt,
  parseMetadataAssistantResponse
} from '../src/lib/studio-ai-utils.js';

describe('buildMetadataAssistantPrompt', () => {
  it('includes the current studio context and output contract', () => {
    const prompt = buildMetadataAssistantPrompt({
      videoUrl: 'https://example.com/video',
      videoTitle: 'Lando Norris Pole Lap',
      videoDescription: '2025 Austrian GP qualifying onboard',
      draft: {
        id: 'austria-quali-lando-norris-2025',
        trackName: 'Red Bull Ring'
      },
      form: {
        sessionName: 'Qualifying',
        year: '2025'
      }
    });

    expect(prompt).toContain('"videoUrl": "https://example.com/video"');
    expect(prompt).toContain('"trackName": "Red Bull Ring"');
    expect(prompt).toContain('"sessionName": ""');
    expect(prompt).toContain('"unresolvedFields": []');
  });
});

describe('parseMetadataAssistantResponse', () => {
  it('parses raw JSON responses', () => {
    const result = parseMetadataAssistantResponse(
      JSON.stringify({
        trackName: 'Red Bull Ring',
        driverNumber: '4',
        unresolvedFields: ['sessionKey']
      })
    );

    expect(result.trackName).toBe('Red Bull Ring');
    expect(result.driverNumber).toBe('4');
    expect(result.unresolvedFields).toEqual(['sessionKey']);
  });

  it('parses fenced JSON responses', () => {
    const result = parseMetadataAssistantResponse(`\`\`\`json
{"sessionKey":"9951","lapNumber":"17"}
\`\`\``);

    expect(result.sessionKey).toBe('9951');
    expect(result.lapNumber).toBe('17');
  });
});
