export function getWorkflowMediaPaths(slug) {
  return {
    videoMp4: `.tmp/${slug}.mp4`,
    audioWav: `public/audio/${slug}.wav`,
    audioMp3: `public/audio/${slug}.mp3`
  };
}

export function buildExtractionCommands({ slug, url }) {
  const paths = getWorkflowMediaPaths(slug);

  return [
    {
      command: 'yt-dlp',
      args: ['--merge-output-format', 'mp4', '-o', paths.videoMp4, url]
    },
    {
      command: 'ffmpeg',
      args: ['-y', '-i', paths.videoMp4, '-vn', '-ac', '2', '-ar', '44100', paths.audioWav]
    },
    {
      command: 'ffmpeg',
      args: ['-y', '-i', paths.audioWav, '-codec:a', 'libmp3lame', '-q:a', '2', paths.audioMp3]
    }
  ];
}
