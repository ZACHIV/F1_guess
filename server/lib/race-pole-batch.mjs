const TELEMETRY_OFFSET_MS = 3000;

const TRACKS_BY_GRAND_PRIX = {
  'Australian Grand Prix': {
    slug: 'australia',
    trackName: 'Albert Park',
    trackCountry: 'Australia',
    trackQuery: 'Melbourne / Albert Park',
    answerAliases: ['Melbourne', 'Albert Park', 'Australia']
  },
  'Chinese Grand Prix': {
    slug: 'china',
    trackName: 'Shanghai International Circuit',
    trackCountry: 'China',
    trackQuery: 'Shanghai',
    answerAliases: ['Shanghai', 'China']
  },
  'Japanese Grand Prix': {
    slug: 'japan',
    trackName: 'Suzuka',
    trackCountry: 'Japan',
    trackQuery: 'Suzuka',
    answerAliases: ['Suzuka', 'Japan']
  },
  'Bahrain Grand Prix': {
    slug: 'bahrain',
    trackName: 'Bahrain International Circuit',
    trackCountry: 'Bahrain',
    trackQuery: 'Sakhir / Bahrain',
    answerAliases: ['Sakhir', 'Bahrain']
  },
  'Saudi Arabian Grand Prix': {
    slug: 'saudi-arabia',
    trackName: 'Jeddah Corniche Circuit',
    trackCountry: 'Saudi Arabia',
    trackQuery: 'Jeddah',
    answerAliases: ['Jeddah', 'Saudi Arabia']
  },
  'Miami Grand Prix': {
    slug: 'miami',
    trackName: 'Miami International Autodrome',
    trackCountry: 'United States',
    trackQuery: 'Miami',
    answerAliases: ['Miami', 'Miami Gardens']
  },
  'Emilia-Romagna Grand Prix': {
    slug: 'imola',
    trackName: 'Imola',
    trackCountry: 'Italy',
    trackQuery: 'Imola / Emilia-Romagna',
    answerAliases: ['Imola', 'Emilia-Romagna', 'Enzo e Dino Ferrari']
  },
  'Monaco Grand Prix': {
    slug: 'monaco',
    trackName: 'Circuit de Monaco',
    trackCountry: 'Monaco',
    trackQuery: 'Monaco / Monte Carlo',
    answerAliases: ['Monaco', 'Monte Carlo']
  },
  'Spanish Grand Prix': {
    slug: 'spain',
    trackName: 'Circuit de Barcelona-Catalunya',
    trackCountry: 'Spain',
    trackQuery: 'Barcelona / Catalunya',
    answerAliases: ['Barcelona', 'Catalunya', 'Spain']
  },
  'Canadian Grand Prix': {
    slug: 'canada',
    trackName: 'Circuit Gilles Villeneuve',
    trackCountry: 'Canada',
    trackQuery: 'Montreal / Gilles Villeneuve',
    answerAliases: ['Montreal', 'Gilles Villeneuve', 'Canada']
  },
  'Austrian Grand Prix': {
    slug: 'austria',
    trackName: 'Red Bull Ring',
    trackCountry: 'Austria',
    trackQuery: 'Red Bull Ring / Spielberg / A1-Ring',
    answerAliases: ['Red Bull Ring', 'Spielberg', 'Austria']
  },
  'British Grand Prix': {
    slug: 'great-britain',
    trackName: 'Silverstone',
    trackCountry: 'United Kingdom',
    trackQuery: 'Silverstone',
    answerAliases: ['Silverstone', 'Britain', 'United Kingdom']
  },
  'Belgian Grand Prix': {
    slug: 'belgium',
    trackName: 'Spa-Francorchamps',
    trackCountry: 'Belgium',
    trackQuery: 'Spa / Spa-Francorchamps',
    answerAliases: ['Spa', 'Spa-Francorchamps', 'Belgium']
  },
  'Hungarian Grand Prix': {
    slug: 'hungary',
    trackName: 'Hungaroring',
    trackCountry: 'Hungary',
    trackQuery: 'Hungaroring / Budapest',
    answerAliases: ['Hungaroring', 'Budapest', 'Hungary']
  },
  'Dutch Grand Prix': {
    slug: 'netherlands',
    trackName: 'Zandvoort',
    trackCountry: 'Netherlands',
    trackQuery: 'Zandvoort',
    answerAliases: ['Zandvoort', 'Netherlands']
  },
  'Italian Grand Prix': {
    slug: 'italy',
    trackName: 'Monza',
    trackCountry: 'Italy',
    trackQuery: 'Monza',
    answerAliases: ['Monza', 'Italy']
  },
  'Azerbaijan Grand Prix': {
    slug: 'azerbaijan',
    trackName: 'Baku City Circuit',
    trackCountry: 'Azerbaijan',
    trackQuery: 'Baku',
    answerAliases: ['Baku', 'Azerbaijan']
  },
  'Singapore Grand Prix': {
    slug: 'singapore',
    trackName: 'Marina Bay',
    trackCountry: 'Singapore',
    trackQuery: 'Singapore / Marina Bay',
    answerAliases: ['Marina Bay', 'Singapore']
  },
  'United States Grand Prix': {
    slug: 'united-states',
    trackName: 'Circuit of the Americas',
    trackCountry: 'United States',
    trackQuery: 'Austin / COTA',
    answerAliases: ['Austin', 'COTA', 'United States', 'Circuit of the Americas']
  },
  'Mexico City Grand Prix': {
    slug: 'mexico',
    trackName: 'Autodromo Hermanos Rodriguez',
    trackCountry: 'Mexico',
    trackQuery: 'Mexico City',
    answerAliases: ['Mexico City', 'Hermanos Rodriguez', 'Mexico']
  },
  'Sao Paulo Grand Prix': {
    slug: 'brazil',
    trackName: 'Interlagos',
    trackCountry: 'Brazil',
    trackQuery: 'Interlagos / Sao Paulo',
    answerAliases: ['Interlagos', 'Sao Paulo', 'Brazil']
  },
  'Las Vegas Grand Prix': {
    slug: 'las-vegas',
    trackName: 'Las Vegas Strip Circuit',
    trackCountry: 'United States',
    trackQuery: 'Las Vegas',
    answerAliases: ['Las Vegas', 'Vegas']
  },
  'Qatar Grand Prix': {
    slug: 'qatar',
    trackName: 'Lusail International Circuit',
    trackCountry: 'Qatar',
    trackQuery: 'Lusail / Qatar',
    answerAliases: ['Lusail', 'Qatar']
  },
  'Abu Dhabi Grand Prix': {
    slug: 'abu-dhabi',
    trackName: 'Yas Marina Circuit',
    trackCountry: 'United Arab Emirates',
    trackQuery: 'Yas Marina / Abu Dhabi',
    answerAliases: ['Yas Marina', 'Abu Dhabi', 'UAE', 'United Arab Emirates']
  }
};

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDurationLabel(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs || 0) / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `00:${minutes}:${seconds}`;
}

export function getRacePoleTrackMetadata(grandPrix) {
  const metadata = TRACKS_BY_GRAND_PRIX[grandPrix];
  if (!metadata) {
    throw new Error(`Unsupported grand prix mapping: ${grandPrix}`);
  }

  return metadata;
}

export function buildRacePoleSlug({ grandPrix, poleSitter, year }) {
  const track = getRacePoleTrackMetadata(grandPrix);
  return [track.slug, 'quali', slugify(poleSitter), slugify(year)].filter(Boolean).join('-');
}

export function buildRacePoleChallengeRecord({
  row,
  resolved,
  importedTrack,
  importedTelemetry,
  durationMs
}) {
  const track = getRacePoleTrackMetadata(row.grand_prix);
  const slug = buildRacePoleSlug({
    grandPrix: row.grand_prix,
    poleSitter: row.pole_sitter,
    year: String(new Date(row.race_date).getUTCFullYear())
  });

  return {
    id: slug,
    title: row.youtube_title,
    category: 'Race Pole Onboard',
    status: 'ready',
    tags: ['2025', 'pole', 'onboard', 'qualifying', 'race-weekend'],
    notes: row.youtube_url,
    audioSrc: `/audio/${slug}.mp3`,
    clipDurationMs: durationMs,
    durationLabel: formatDurationLabel(durationMs - TELEMETRY_OFFSET_MS),
    telemetryOffsetMs: TELEMETRY_OFFSET_MS,
    trackName: track.trackName,
    trackCountry: track.trackCountry,
    driverName: row.pole_sitter,
    driverNumber: resolved.driverNumber,
    sessionKey: row.session_key,
    lapNumber: resolved.lapNumber,
    telemetrySource: `OpenF1 official location + car_data (fastest qualifying lap, session ${row.session_key})`,
    trackVectorSource: 'F1DB white-outline track SVG',
    trackSvgSrc: importedTrack.trackSvgSrc,
    telemetryLocationSrc: importedTelemetry.telemetryLocationSrc,
    telemetryCarDataSrc: importedTelemetry.telemetryCarDataSrc,
    prompt: `Identify ${track.trackName} from the pole lap engine note and rhythm.`,
    answerAliases: [...new Set([track.trackName, track.trackCountry, ...track.answerAliases])],
    options: [],
    createdAt: row.race_date,
    updatedAt: row.race_date,
    sortOrder: Number(row.round) - 1
  };
}

export function listRacePoleGrandPrixNames() {
  return Object.keys(TRACKS_BY_GRAND_PRIX);
}
