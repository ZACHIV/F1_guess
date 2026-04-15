export function normalizeChallenge(challenge) {
  const hasAudio = Boolean(challenge.audioSrc);

  return {
    ...challenge,
    hasAudio,
    statusLabel: hasAudio ? 'Clip ready' : 'Clip missing',
    helperCopy: hasAudio
      ? 'Press play, listen for the shift rhythm, then lock your guess.'
      : 'No clip loaded yet. Run the extraction tool to drop an audio file into public/audio.',
    durationSeconds: Math.round((challenge.clipDurationMs ?? 0) / 1000)
  };
}

export function getClipOutputPaths(slug) {
  return {
    wav: `public/audio/${slug}.wav`,
    mp3: `public/audio/${slug}.mp3`
  };
}
