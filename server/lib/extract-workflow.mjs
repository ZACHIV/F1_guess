export function getWorkflowMediaPaths(slug) {
  return {
    videoMp4: `.tmp/${slug}.mp4`,
    audioWav: `public/audio/${slug}.wav`,
    audioMp3: `public/audio/${slug}.mp3`
  };
}

export function buildVideoMetadataCommand({ url }) {
  return {
    command: 'yt-dlp',
    args: ['--dump-single-json', '--skip-download', '--no-warnings', '--js-runtimes', 'node', url]
  };
}

export function buildExtractionCommands({ slug, url }) {
  const paths = getWorkflowMediaPaths(slug);

  return [
    {
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
        `public/audio/${slug}.%(ext)s`,
        url
      ]
    },
    {
      command: 'ffmpeg',
      args: ['-y', '-i', paths.audioWav, '-codec:a', 'libmp3lame', '-q:a', '2', paths.audioMp3]
    }
  ];
}
