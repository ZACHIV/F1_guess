export function getWorkflowMediaPaths(slug) {
  return {
    videoMp4: `.tmp/${slug}.mp4`,
    audioWav: `public/audio/${slug}.wav`,
    audioMp3: `public/audio/${slug}.mp3`
  };
}

export function buildVideoMetadataCommand({ url, cookiesPath = '' }) {
  const cookieArgs = cookiesPath
    ? ['--cookies', cookiesPath]
    : [];

  return {
    command: 'yt-dlp',
    args: ['--dump-single-json', '--skip-download', '--no-warnings', '--js-runtimes', 'node', ...cookieArgs, url]
  };
}

export function buildExtractionCommands({ slug, url, cookiesFromBrowser = '', cookiesPath = '' }) {
  const paths = getWorkflowMediaPaths(slug);
  const cookieArgs = cookiesPath
    ? ['--cookies', cookiesPath]
    : cookiesFromBrowser
      ? ['--cookies-from-browser', cookiesFromBrowser]
      : [];

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
        ...cookieArgs,
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
