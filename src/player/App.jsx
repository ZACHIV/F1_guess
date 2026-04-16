import { startTransition, useEffect, useMemo, useState } from 'react';
import fallbackChallenges from '../data/challenge-library.json';
import { normalizeChallenge } from '../lib/challenge-utils.js';
import { loadChallengeTelemetry } from '../lib/challenge-assets.js';
import {
  buildTelemetryPath,
  getInterpolatedTelemetryPoint,
  getNearestTelemetrySample,
  normalizeTelemetryPoints,
  toElapsedSamples
} from '../lib/telemetry-utils.js';
import { isChallengeAnswerCorrect } from './answer-utils.js';
import PosterStage from './components/PosterStage.jsx';
import WaveformHUD from './components/WaveformHUD.jsx';
import TrackHUD from './components/TrackHUD.jsx';
import TimerRing from './components/TimerRing.jsx';
import AnswerDock from './components/AnswerDock.jsx';
import TelemetryStrip from './components/TelemetryStrip.jsx';
import { getSynchronizedElapsedMs } from './sync-utils.js';

const TRACK_DIMENSIONS = { width: 360, height: 250, padding: 26 };
const STORAGE_KEY = 'f1-guess:selected-challenge';
const EMPTY_HUD = { speed: '-', n_gear: '-', throttle: '-', rpm: '-' };

function getMode() {
  if (typeof window === 'undefined') {
    return 'formal';
  }

  return new URLSearchParams(window.location.search).get('mode') === 'debug' ? 'debug' : 'formal';
}

function getStoredChallengeId() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function storeChallengeId(challengeId) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, challengeId);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

function getPlayableChallenges(challenges) {
  return challenges
    .map((challenge) => normalizeChallenge(challenge))
    .filter((challenge) => challenge.trackSvgSrc && challenge.telemetryLocationSrc && challenge.telemetryCarDataSrc);
}

function buildTelemetryModel(locationData, carData) {
  const locationFrames = normalizeTelemetryPoints(toElapsedSamples(locationData), TRACK_DIMENSIONS);
  const carFrames = toElapsedSamples(carData);

  if (!locationFrames.length || !carFrames.length) {
    return null;
  }

  return {
    locationFrames,
    carFrames,
    telemetryPath: buildTelemetryPath(locationFrames),
    initialMarker: locationFrames[0],
    initialHud: carFrames[0]
  };
}

async function loadChallengeLibrary() {
  try {
    const response = await fetch('/api/studio/library');
    if (!response.ok) {
      throw new Error('Load failed');
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload.records;
  } catch {
    return fallbackChallenges;
  }
}

export default function App({ initialLibrary }) {
  const [library, setLibrary] = useState(() =>
    getPlayableChallenges(initialLibrary ?? fallbackChallenges)
  );
  const [selectedChallengeId, setSelectedChallengeId] = useState(() =>
    getStoredChallengeId() || getPlayableChallenges(initialLibrary ?? fallbackChallenges)[0]?.id || ''
  );
  const [telemetryModel, setTelemetryModel] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [hudState, setHudState] = useState(EMPTY_HUD);
  const [marker, setMarker] = useState({ x: 180, y: 125 });
  const [waveform, setWaveform] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answerValue, setAnswerValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const mode = getMode();

  useEffect(() => {
    if (initialLibrary) {
      return undefined;
    }

    let cancelled = false;
    loadChallengeLibrary().then((records) => {
      if (cancelled) {
        return;
      }

      const playable = getPlayableChallenges(records);
      setLibrary(playable);
      if (!playable.some((challenge) => challenge.id === selectedChallengeId)) {
        setSelectedChallengeId(playable[0]?.id ?? '');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialLibrary]);

  const challenge = useMemo(
    () => library.find((item) => item.id === selectedChallengeId) ?? library[0] ?? null,
    [library, selectedChallengeId]
  );

  useEffect(() => {
    if (!challenge) {
      return undefined;
    }

    storeChallengeId(challenge.id);
    setError('');
    setFeedback(null);
    setAnswerValue('');
    setCurrentTime(0);

    let cancelled = false;

    loadChallengeTelemetry(challenge)
      .then(({ locationData, carData }) => {
        if (cancelled) {
          return;
        }

        const nextTelemetryModel = buildTelemetryModel(locationData, carData);
        setTelemetryModel(nextTelemetryModel);
        setMarker(nextTelemetryModel?.initialMarker ?? { x: 180, y: 125 });
        setHudState(nextTelemetryModel?.initialHud ?? EMPTY_HUD);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load challenge.');
      });

    return () => {
      cancelled = true;
    };
  }, [challenge]);

  useEffect(() => {
    if (!telemetryModel) {
      return;
    }

    const syncedElapsedMs = getSynchronizedElapsedMs(currentTime, challenge);
    const nextMarker = getInterpolatedTelemetryPoint(telemetryModel.locationFrames, syncedElapsedMs) ?? telemetryModel.initialMarker;
    const nextHudState = getNearestTelemetrySample(telemetryModel.carFrames, syncedElapsedMs) ?? telemetryModel.initialHud;
    setMarker(nextMarker);
    setHudState(nextHudState);
  }, [challenge, currentTime, telemetryModel]);

  const telemetryPath = telemetryModel?.telemetryPath ?? 'M 40 200 L 110 160 L 185 146 L 246 102 L 310 70';
  const syncedElapsedMs = getSynchronizedElapsedMs(currentTime, challenge);
  const syncedDurationMs = Math.max(0, (challenge.clipDurationMs ?? 0) - Number(challenge.telemetryOffsetMs ?? 0));

  if (!challenge) {
    return <div className="flex min-h-screen items-center justify-center bg-[#040507] text-white">No playable challenge found.</div>;
  }

  function handleAnswerSubmit(value, correctOverride) {
    const isCorrect = typeof correctOverride === 'boolean'
      ? correctOverride
      : isChallengeAnswerCorrect(challenge, value);

    setFeedback({
      correct: isCorrect,
      message: isCorrect
        ? `Locked in. ${challenge.trackName} is a match.`
        : `Not this time. Accepted answers include ${challenge.trackName}, ${challenge.trackCountry}, and any saved aliases.`
    });
  }

  async function handlePlaybackToggle() {
    if (!waveform) {
      return;
    }

    await waveform.playPause();
  }

  return (
    <PosterStage challenge={challenge}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="hud-label">f1 sound guess</p>
          <h1 className="mt-3 max-w-[14rem] text-[2.2rem] font-semibold leading-[0.94] text-white">
            {challenge.title}
          </h1>
          <p className="mt-3 max-w-[15rem] text-sm leading-6 text-stone-300/85">
            Immersive poster mode with live circuit, elapsed timer, and engine-note signature.
          </p>
        </div>

        <div className="pt-2 text-right">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-stone-300">
            {challenge.driverName} #{challenge.driverNumber || '00'}
          </div>
        </div>
      </header>

      <WaveformHUD
        audioSrc={challenge.audioSrc}
        onFinish={() => setCurrentTime(0)}
        onPlayStateChange={setIsPlaying}
        onReady={setWaveform}
        onTimeUpdate={setCurrentTime}
      />

      <section className="mt-5 flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="hud-label">now reading</p>
            <p className="mt-2 text-sm text-stone-300/90">
              {challenge.trackName} · {challenge.trackCountry}
            </p>
          </div>

          <button
            className="rounded-full bg-[linear-gradient(135deg,#ff7c39,#ff9a4d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,124,57,0.32)] transition hover:-translate-y-0.5"
            onClick={handlePlaybackToggle}
            type="button"
          >
            {isPlaying ? 'Pause Clip' : 'Play Clip'}
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <TrackHUD
            challenge={challenge}
            dimensions={TRACK_DIMENSIONS}
            marker={marker}
            telemetryPath={telemetryPath}
          />
          <TimerRing currentTime={syncedElapsedMs} durationMs={syncedDurationMs} />
        </div>

        <TelemetryStrip hudState={hudState} />

        {error ? (
          <div className="rounded-[22px] border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <AnswerDock
          answerValue={answerValue}
          challenge={challenge}
          feedback={feedback}
          mode={mode}
          onAnswerChange={setAnswerValue}
          onAnswerSubmit={handleAnswerSubmit}
        />

        {library.length > 1 ? (
          <nav className="grid grid-cols-3 gap-2 pt-1">
            {library.map((item) => (
              <button
                className={`rounded-[18px] border px-3 py-3 text-left text-xs transition ${
                  item.id === challenge.id
                    ? 'border-orange-300/45 bg-orange-500/14 text-white'
                    : 'border-white/10 bg-white/[0.04] text-stone-300'
                }`}
                key={item.id}
                onClick={() => {
                  startTransition(() => {
                    setSelectedChallengeId(item.id);
                  });
                }}
                type="button"
              >
                <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-400">
                  #{String(item.sortOrder + 1).padStart(2, '0')}
                </span>
                <span className="mt-2 block text-sm">{item.trackName}</span>
              </button>
            ))}
          </nav>
        ) : null}
      </section>
    </PosterStage>
  );
}
