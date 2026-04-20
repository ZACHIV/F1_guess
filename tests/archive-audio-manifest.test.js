import { describe, expect, it } from 'vitest';
import archiveAudioManifest from '../src/archive/archive-audio-manifest.json';
import challengeLibrary from '../src/data/challenge-library.json';

describe('archive audio manifest', () => {
  it('covers every challenge that has an audio source', () => {
    const audioChallenges = challengeLibrary.filter((challenge) => challenge.audioSrc);

    expect(Object.keys(archiveAudioManifest)).toHaveLength(audioChallenges.length);

    for (const challenge of audioChallenges) {
      expect(archiveAudioManifest[challenge.id]).toBeTruthy();
      expect(archiveAudioManifest[challenge.id].ambientEndMs).toBeGreaterThan(0);
      expect(archiveAudioManifest[challenge.id].crossfadeMs).toBeGreaterThan(0);
      expect(archiveAudioManifest[challenge.id].volumeMultiplier).toBeGreaterThan(0);
    }
  });
});
