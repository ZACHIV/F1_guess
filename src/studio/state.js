export function createTurn1CropAssetState() {
  return {
    svgSrc: '',
    status: 'idle',
    viewBox: '0 0 500 500',
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    markup: '',
    error: ''
  };
}

export function createEmptyStudioDraft() {
  return {
    id: '',
    title: '',
    category: 'Uncategorized',
    status: 'draft',
    tags: [],
    notes: '',
    audioSrc: '',
    clipDurationMs: 0,
    durationLabel: '',
    trackName: '',
    trackCountry: '',
    driverName: '',
    driverNumber: '',
    telemetrySource: '',
    trackVectorSource: '',
    trackSvgSrc: '',
    telemetryLocationSrc: '',
    telemetryCarDataSrc: '',
    prompt: '',
    options: [],
    turn1CornerName: '',
    turn1Crop: null,
    createdAt: '',
    updatedAt: '',
    sortOrder: 0
  };
}

export function createDefaultStudioFormState() {
  return {
    librarySearch: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    librarySort: 'manual',
    videoUrl: '',
    videoTitle: '',
    videoDescription: '',
    aiPrompt: '',
    aiResponse: '',
    trackAsset: '',
    trackQuery: '',
    year: '2025',
    sessionName: 'Qualifying',
    sessionKey: '',
    lapNumber: ''
  };
}

export function createInitialStudioState() {
  return {
    challenges: [],
    librarySummary: {
      total: 0,
      categories: [],
      statuses: []
    },
    selectedId: '',
    draft: createEmptyStudioDraft(),
    form: createDefaultStudioFormState(),
    sessions: [],
    drivers: [],
    laps: [],
    cropAsset: createTurn1CropAssetState(),
    cropInteraction: null,
    busy: false,
    busyLabel: '',
    message: '准备就绪。',
    tone: 'neutral',
    activity: []
  };
}

export function getLapStats(laps = []) {
  if (!laps.length) {
    return {
      fastestLap: null,
      maxLapNumber: ''
    };
  }

  const fastestLap = [...laps]
    .filter((lap) => lap.lap_duration !== null)
    .sort((left, right) => Number(left.lap_duration) - Number(right.lap_duration))[0] ?? null;

  const maxLapNumber = laps.reduce((max, lap) => Math.max(max, Number(lap.lap_number) || 0), 0);

  return {
    fastestLap,
    maxLapNumber: maxLapNumber ? String(maxLapNumber) : ''
  };
}
