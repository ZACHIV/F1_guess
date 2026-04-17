export const MAX_GUESS_MS = 60_000;

export const DUEL_POOL = [
  { id: 'italy-quali-max-verstappen-2025', benchmarkMs: 22_120, label: 'Monza' },
  { id: 'netherlands-quali-oscar-piastri-2025', benchmarkMs: 19_320, label: 'Netherlands' },
  { id: 'brazil-quali-lando-norris-2025', benchmarkMs: 28_230, label: 'Brazil' },
  { id: 'belgium-quali-lando-norris-2025', benchmarkMs: 25_320, label: 'Belgium' },
  { id: 'azerbaijan-quali-max-verstappen-2025', benchmarkMs: 27_640, label: 'Baku' },
  { id: 'singapore-quali-george-russell-2025', benchmarkMs: 54_390, label: 'Singapore' },
  { id: 'united-states-quali-max-verstappen-2025', benchmarkMs: 27_800, label: 'COTA' }
];

const DUEL_LOOKUP = new Map(DUEL_POOL.map((entry) => [entry.id, entry]));

export function formatScoreTime(ms) {
  return `${(Math.max(0, Number(ms ?? 0)) / 1000).toFixed(2)}s`;
}

export function formatClockTime(ms) {
  const totalMs = Math.max(0, Number(ms ?? 0));
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centiseconds = String(Math.floor((totalMs % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${centiseconds}`;
}

export function getDuelChallenge(challenge) {
  const duelEntry = DUEL_LOOKUP.get(challenge?.id);
  if (!duelEntry) {
    return null;
  }

  return {
    ...challenge,
    benchmarkMs: duelEntry.benchmarkMs,
    benchmarkLabel: formatScoreTime(duelEntry.benchmarkMs),
    benchmarkTrackLabel: duelEntry.label
  };
}

export function getDuelChallengeIds() {
  return DUEL_POOL.map((entry) => entry.id);
}
