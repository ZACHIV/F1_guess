import challengeLibrary from '../data/challenge-library.json';
import archiveAudioManifest from './archive-audio-manifest.json';

const ARCHIVE_PALETTES = [
  ['#eef0ea', '#bdccb6', '#fbfcf9'],
  ['#e8edf6', '#b6c5dd', '#fafcff'],
  ['#ede7ea', '#cbb5c2', '#faf6f7'],
  ['#ece7d8', '#d7bd87', '#fbf9f0'],
  ['#edf4ef', '#b6d2b9', '#f6faf7'],
  ['#e7eff2', '#b0cfd5', '#f7fbfb'],
  ['#efe7e0', '#d5b49a', '#faf8f3'],
  ['#f6efe3', '#dbccb4', '#f9f6ef'],
  ['#efe8de', '#d8c0aa', '#fbf7f2'],
  ['#e7edf3', '#b6cadb', '#f9fbfd'],
  ['#ece6f2', '#c7b5de', '#fbf9fd'],
  ['#e6eeef', '#a7c8cb', '#f7fbfb']
];

const ARCHIVE_DETAILS = {
  'australia-quali-lando-norris-2025': { city: 'Melbourne', note: 'Lakeside balance', length: '5.278 km', turns: '14', firstGrandPrix: '1996', curatorNote: 'Albert Park is catalogued for its deceptive calm: open water, parkland light, and a circuit that sharpens as speed rises.' },
  'china-quali-oscar-piastri-2025': { city: 'Shanghai', note: 'Spiral opening', length: '5.451 km', turns: '16', firstGrandPrix: '2004', curatorNote: 'Shanghai enters the archive as a study in expansion and compression, opening with a spiralling gesture before stretching into monumental distance.' },
  'japan-quali-max-verstappen-2025': { city: 'Suzuka', note: 'Figure-eight line', length: '5.807 km', turns: '18', firstGrandPrix: '1987', curatorNote: 'Suzuka reads like choreography on paper: crossover geometry, long commitment, and a measured kind of violence.' },
  'bahrain-quali-oscar-piastri-2025': { city: 'Sakhir', note: 'Desert floodlit', length: '5.412 km', turns: '15', firstGrandPrix: '2004', curatorNote: 'Bahrain is archived as a twilight machine in the sand, where wide braking zones and harsh traction points create a crisp, technical cadence.' },
  'saudi-arabia-quali-max-verstappen-2025': { city: 'Jeddah', note: 'Night velocity', length: '6.174 km', turns: '27', firstGrandPrix: '2021', curatorNote: 'Jeddah belongs to the archive’s nocturnal wing, where speed feels less mechanical and more like a streak of light.', circuit: 'Jeddah' },
  'miami-quali-max-verstappen-2025': { city: 'Miami Gardens', note: 'Stadium weave', length: '5.412 km', turns: '19', firstGrandPrix: '2022', curatorNote: 'Miami is preserved as a contemporary collage: marina illusion, stadium perimeter, and a rhythm that switches abruptly between display and precision.', circuit: 'Miami' },
  'imola-quali-oscar-piastri-2025': { city: 'Imola', note: 'Old-school rhythm', length: '4.909 km', turns: '19', firstGrandPrix: '1980', curatorNote: 'Imola is preserved here as a study in compression: camber, memory, and an old circuit’s refusal to flatten itself.' },
  'monaco-quali-lando-norris-2025': { city: 'Monte Carlo', note: 'Harbour run', length: '3.337 km', turns: '19', firstGrandPrix: '1950', curatorNote: 'Monte Carlo forms the archive’s benchmark for proximity, theatre, and impossible precision.', circuit: 'Monte Carlo' },
  'spain-quali-oscar-piastri-2025': { city: 'Montmelo', note: 'Measured load', length: '4.657 km', turns: '14', firstGrandPrix: '1991', curatorNote: 'Barcelona-Catalunya is filed under aerodynamic discipline, where the lap reveals itself through balance, load, and tidy repetition.', circuit: 'Barcelona-Catalunya' },
  'canada-quali-george-russell-2025': { city: 'Montreal', note: 'Island attack', length: '4.361 km', turns: '14', firstGrandPrix: '1978', curatorNote: 'Gilles Villeneuve is preserved as an edge condition: heavy stops, impatient chicanes, and walls that turn every correction into evidence.', circuit: 'Gilles Villeneuve' },
  'austria-quali-lando-norris-2025': { city: 'Spielberg', note: 'Compressed climb', length: '4.318 km', turns: '10', firstGrandPrix: '1970', curatorNote: 'The Red Bull Ring remains one of the archive’s purest objects: short, elevated, and brutally clear about where time is won or lost.' },
  'great-britain-quali-max-verstappen-2025': { city: 'Silverstone', note: 'High-speed sweep', length: '5.891 km', turns: '18', firstGrandPrix: '1950', curatorNote: 'Silverstone is catalogued as a work of airflow and faith, where velocity becomes the primary design material.', country: 'Great Britain' },
  'belgium-quali-lando-norris-2025': { city: 'Stavelot', note: 'Ardennes climb', length: '7.004 km', turns: '19', firstGrandPrix: '1950', curatorNote: 'Spa is the archive’s landscape piece, where elevation, weather, and distance conspire to enlarge every gesture.' },
  'hungary-quali-charles-leclerc-2025': { city: 'Mogyorod', note: 'Compact pressure', length: '4.381 km', turns: '14', firstGrandPrix: '1986', curatorNote: 'Hungaroring is held in the collection as a dense object: little rest, little horizon, and constant technical pressure.' },
  'netherlands-quali-oscar-piastri-2025': { city: 'Zandvoort', note: 'Dune banking', length: '4.259 km', turns: '14', firstGrandPrix: '1952', curatorNote: 'Zandvoort is archived for its compressed horizon, banked surfaces, and the curious softness of a fast lap drawn through dunes.', circuit: 'Zandvoort' },
  'italy-quali-max-verstappen-2025': { city: 'Monza', note: 'Temple of speed', length: '5.793 km', turns: '11', firstGrandPrix: '1950', curatorNote: 'Monza remains the archive’s cleanest expression of reduction: fewer corners, lighter drag, and speed exposed without ornament.' },
  'azerbaijan-quali-max-verstappen-2025': { city: 'Baku', note: 'Walled contrast', length: '6.003 km', turns: '20', firstGrandPrix: '2016', curatorNote: 'Baku is catalogued as a city of opposites, shifting from medieval narrowness to one of the longest full-throttle avenues on the calendar.', circuit: 'Baku City Circuit' },
  'singapore-quali-george-russell-2025': { city: 'Singapore', note: 'Midnight corners', length: '4.940 km', turns: '19', firstGrandPrix: '2008', curatorNote: 'Marina Bay sits in the archive as an illuminated manuscript: humid, intricate, and relentlessly urban.' },
  'united-states-quali-max-verstappen-2025': { city: 'Austin', note: 'Texas rise', length: '5.513 km', turns: '20', firstGrandPrix: '2012', curatorNote: 'COTA is indexed as an exercise in quotation and reinvention, where borrowed motifs become a distinct modern circuit.' },
  'mexico-quali-lando-norris-2025': { city: 'Mexico City', note: 'Altitude stadium', length: '4.304 km', turns: '17', firstGrandPrix: '1963', curatorNote: 'Hermanos Rodriguez is archived as a high-altitude contradiction, pairing thin air and long straights with one of the calendar’s loudest final sectors.', circuit: 'Hermanos Rodriguez' },
  'brazil-quali-lando-norris-2025': { city: 'Sao Paulo', note: 'Counterclockwise pulse', length: '4.309 km', turns: '15', firstGrandPrix: '1973', curatorNote: 'Interlagos is preserved here as a compact storm system: short lap, changing weather, and an unmistakable rise-and-fall cadence.' },
  'las-vegas-quali-lando-norris-2025': { city: 'Las Vegas', note: 'Neon straight', length: '6.201 km', turns: '17', firstGrandPrix: '2023', curatorNote: 'Las Vegas enters the archive as spectacle by design: a circuit built from glare, straight-line excess, and reflected surfaces.', country: 'Las Vegas', circuit: 'Las Vegas Strip' },
  'qatar-quali-oscar-piastri-2025': { city: 'Lusail', note: 'Desert ribbon', length: '5.419 km', turns: '16', firstGrandPrix: '2021', curatorNote: 'Lusail is indexed as a ribbon of medium-speed commitment, where the lap depends on carrying shape through a seemingly endless chain of arcs.', circuit: 'Lusail' },
  'abu-dhabi-quali-max-verstappen-2025': { city: 'Abu Dhabi', note: 'Twilight marina', length: '5.281 km', turns: '16', firstGrandPrix: '2009', curatorNote: 'Yas Marina is presented as a twilight object, all softened edges and deliberate theatrical framing around the harbour.', country: 'Abu Dhabi', circuit: 'Yas Marina' }
};

export const ARCHIVE_TRACKS = challengeLibrary
  .slice()
  .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
  .map((challenge, index) => {
    const detail = ARCHIVE_DETAILS[challenge.id] ?? {};

    return {
      id: challenge.id,
      issue: String(index + 1).padStart(2, '0'),
      country: detail.country ?? challenge.trackCountry,
      circuit: detail.circuit ?? challenge.trackName,
      city: detail.city ?? challenge.answerAliases?.[2] ?? challenge.answerAliases?.[1] ?? challenge.trackCountry,
      note: detail.note ?? 'Archive study',
      length: detail.length ?? 'Data pending',
      turns: detail.turns ?? 'Data pending',
      firstGrandPrix: detail.firstGrandPrix ?? 'Archive pending',
      curatorNote: detail.curatorNote ?? 'This circuit sits in the archive as part of the 2025 qualifying collection.',
      asset: challenge.trackSvgSrc,
      colors: ARCHIVE_PALETTES[index % ARCHIVE_PALETTES.length],
      audioSrc: challenge.audioSrc,
      ambientEndMs: archiveAudioManifest[challenge.id]?.ambientEndMs ?? Math.max((challenge.clipDurationMs ?? 0) - 3000, 0),
      crossfadeMs: archiveAudioManifest[challenge.id]?.crossfadeMs ?? 3200,
      volumeMultiplier: archiveAudioManifest[challenge.id]?.volumeMultiplier ?? 1,
      themes: deriveThemes(challenge.id, detail.country ?? challenge.trackCountry)
    };
  });

export const ARCHIVE_THEMES = [
  { id: 'all', label: 'All circuits' },
  { id: 'street', label: 'Street theater' },
  { id: 'night', label: 'Night sessions' },
  { id: 'speed', label: 'Temple of speed' },
  { id: 'heritage', label: 'Heritage lines' }
];

function deriveThemes(id, country) {
  const themes = new Set();

  if (['monaco', 'saudi-arabia', 'azerbaijan', 'singapore', 'las-vegas', 'mexico'].some((token) => id.includes(token))) {
    themes.add('street');
  }

  if (['bahrain', 'saudi-arabia', 'singapore', 'las-vegas', 'qatar', 'abu-dhabi'].some((token) => id.includes(token))) {
    themes.add('night');
  }

  if (['italy', 'belgium', 'great-britain', 'austria', 'japan'].some((token) => id.includes(token))) {
    themes.add('speed');
  }

  if (['monaco', 'italy', 'great-britain', 'belgium', 'japan', 'brazil', 'hungary', 'imola'].some((token) => id.includes(token))) {
    themes.add('heritage');
  }

  if (!themes.size && ['Monaco', 'Italy', 'Belgium', 'Japan'].includes(country)) {
    themes.add('heritage');
  }

  return [...themes];
}
