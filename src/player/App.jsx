import { startTransition, useEffect, useEffectEvent, useMemo, useState } from 'react';
import fallbackChallenges from '../data/challenge-library.json';
import { loadChallengeTelemetry } from '../lib/challenge-assets.js';
import { normalizeChallenge } from '../lib/challenge-utils.js';
import {
  buildTelemetryPath,
  getInterpolatedTelemetryPoint,
  getNearestTelemetrySample,
  normalizeTelemetryPoints,
  toElapsedSamples
} from '../lib/telemetry-utils.js';
import { playResultAudioCue } from './anthem.js';
import { isChallengeAnswerCorrect } from './answer-utils.js';
import {
  DUEL_POOL,
  MAX_GUESS_MS,
  formatScoreTime,
  getDuelChallenge
} from './game-config.js';
import PosterStage from './components/PosterStage.jsx';
import WaveformHUD from './components/WaveformHUD.jsx';
import TrackHUD from './components/TrackHUD.jsx';
import TimerRing from './components/TimerRing.jsx';
import AnswerDock from './components/AnswerDock.jsx';
import TelemetryStrip from './components/TelemetryStrip.jsx';
import { getSynchronizedElapsedMs } from './sync-utils.js';

const TRACK_DIMENSIONS = { width: 360, height: 250, padding: 26 };
const EMPTY_HUD = { speed: '-', n_gear: '-', throttle: '-', rpm: '-' };

function pickRandomChallenge(challenges, excludeId = '') {
  if (!challenges.length) {
    return null;
  }

  const available = challenges.filter((challenge) => challenge.id !== excludeId);
  const pool = available.length ? available : challenges;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getPlayableChallenges(challenges) {
  return challenges
    .map((challenge) => getDuelChallenge(normalizeChallenge(challenge)))
    .filter((challenge) =>
      challenge &&
      challenge.trackSvgSrc &&
      challenge.telemetryLocationSrc &&
      challenge.telemetryCarDataSrc
    );
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

function buildResult(challenge, outcome, playerTimeMs) {
  const benchmarkMs = challenge?.benchmarkMs ?? 0;
  const deltaMs = Math.abs(playerTimeMs - benchmarkMs);
  const answerLabel = `${challenge.trackName} · ${challenge.trackCountry}`;

  if (outcome === 'win') {
    return {
      outcome,
      playerTimeMs,
      benchmarkMs,
      headline: `You beat Max to ${challenge.trackName}.`,
      copy: `Circuit revealed: ${answerLabel}. You locked the call ${formatScoreTime(deltaMs)} before Verstappen's benchmark line.`,
      deltaLabel: `${formatScoreTime(deltaMs)} faster`
    };
  }

  if (outcome === 'timeout') {
    return {
      outcome,
      playerTimeMs,
      benchmarkMs,
      headline: 'Clock out. Verstappen still takes P1.',
      copy: `The answer was ${answerLabel}. One minute expired before the correct call landed, so the Dutch anthem gets the room.`,
      deltaLabel: `${formatScoreTime(Math.max(playerTimeMs - benchmarkMs, 0))} behind`
    };
  }

  return {
    outcome,
    playerTimeMs,
    benchmarkMs,
    headline: `Max still called ${challenge.trackName} first.`,
    copy: `Correct answer: ${answerLabel}. You found it, but Verstappen's line was already gone by ${formatScoreTime(deltaMs)}.`,
    deltaLabel: `${formatScoreTime(deltaMs)} slower`
  };
}

export default function App({ initialLibrary }) {
  const [library, setLibrary] = useState(() => getPlayableChallenges(initialLibrary ?? fallbackChallenges));
  const [selectedChallengeId, setSelectedChallengeId] = useState(() =>
    pickRandomChallenge(getPlayableChallenges(initialLibrary ?? fallbackChallenges))?.id ?? ''
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
  const [runState, setRunState] = useState('idle');
  const [result, setResult] = useState(null);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

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
      setSelectedChallengeId((currentId) => {
        if (playable.some((entry) => entry.id === currentId)) {
          return currentId;
        }

        return pickRandomChallenge(playable)?.id ?? '';
      });
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

    setError('');
    setFeedback(null);
    setResult(null);
    setRunState('idle');
    setAnswerValue('');
    setCurrentTime(0);
    setTelemetryModel(null);
    setMarker({ x: 180, y: 125 });
    setHudState(EMPTY_HUD);
    setIsPlaying(false);

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

    const telemetryElapsedMs = getSynchronizedElapsedMs(currentTime, challenge);
    const nextMarker = getInterpolatedTelemetryPoint(telemetryModel.locationFrames, telemetryElapsedMs) ?? telemetryModel.initialMarker;
    const nextHudState = getNearestTelemetrySample(telemetryModel.carFrames, telemetryElapsedMs) ?? telemetryModel.initialHud;
    setMarker(nextMarker);
    setHudState(nextHudState);
  }, [challenge, currentTime, telemetryModel]);

  useEffect(() => {
    if (!result || result.outcome === 'win') {
      return undefined;
    }

    return playResultAudioCue(result);
  }, [result]);

  const currentBenchmarkMs = challenge?.benchmarkMs ?? 0;
  const sessionElapsedMs = Math.min(currentTime, MAX_GUESS_MS);
  const displayElapsedMs = result?.playerTimeMs ?? sessionElapsedMs;
  const telemetryPath = telemetryModel?.telemetryPath ?? 'M 40 200 L 110 160 L 185 146 L 246 102 L 310 70';
  const benchmarkLabel = formatScoreTime(currentBenchmarkMs);
  const maxTimeLabel = formatScoreTime(MAX_GUESS_MS);

  const playFromStart = useEffectEvent(async () => {
    if (!waveform) {
      setError('Audio is still arming. Give the waveform a second, then start again.');
      return false;
    }

    try {
      if (typeof waveform.stop === 'function') {
        waveform.stop();
      } else {
        waveform.pause?.();
      }

      if (typeof waveform.setTime === 'function') {
        waveform.setTime(0);
      } else if (typeof waveform.seekTo === 'function') {
        waveform.seekTo(0);
      }

      setCurrentTime(0);
      await waveform.play();
      return true;
    } catch {
      setError('Audio playback was blocked. Interact again to continue the duel.');
      return false;
    }
  });

  const finishRound = useEffectEvent((outcome, playerTimeMs) => {
    waveform?.pause?.();
    setIsPlaying(false);
    setFeedback(null);
    setRunState('result');
    setResult(buildResult(challenge, outcome, playerTimeMs));
  });

  useEffect(() => {
    if (runState !== 'live' || sessionElapsedMs < MAX_GUESS_MS) {
      return;
    }

    finishRound('timeout', MAX_GUESS_MS);
  }, [finishRound, runState, sessionElapsedMs]);

  if (!challenge) {
    return <div className="flex min-h-screen items-center justify-center bg-[#040507] text-white">No playable challenge found.</div>;
  }

  async function handleStart() {
    setError('');
    setFeedback(null);
    setResult(null);
    setAnswerValue('');
    setRunState('live');
    const didStart = await playFromStart();
    if (!didStart) {
      setRunState('idle');
    }
  }

  async function handleTogglePlayback() {
    if (!waveform) {
      return;
    }

    if (runState === 'live' && isPlaying) {
      waveform.pause?.();
      return;
    }

    await playFromStart();
  }

  function handleAnswerSubmit() {
    if (runState !== 'live') {
      return;
    }

    if (!answerValue.trim()) {
      setFeedback({
        kind: 'invalid',
        message: 'Say the circuit out loud if needed, then type the name before you lock it.'
      });
      return;
    }

    if (isChallengeAnswerCorrect(challenge, answerValue)) {
      const playerTimeMs = Math.min(currentTime, MAX_GUESS_MS);
      finishRound(playerTimeMs < currentBenchmarkMs ? 'win' : 'lose', playerTimeMs);
      return;
    }

    setFeedback({
      kind: 'miss',
      message: 'Wrong circuit. Keep listening for the braking rhythm and straight-line signature.'
    });
  }

  function handleNextChallenge() {
    const nextChallenge = pickRandomChallenge(library, challenge.id);
    if (!nextChallenge) {
      return;
    }

    startTransition(() => {
      setSelectedChallengeId(nextChallenge.id);
    });
  }

  async function handleRetry() {
    setError('');
    setFeedback(null);
    setResult(null);
    setAnswerValue('');
    setRunState('live');
    const didStart = await playFromStart();
    if (!didStart) {
      setRunState('idle');
    }
  }

  return (
    <PosterStage challenge={challenge} result={result} runState={runState}>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_380px] xl:items-start">
        <div className="grid gap-5">
          <header className="glass-panel overflow-hidden rounded-[32px] border border-white/12 p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="hud-label">f1 guess / blow your mind mode</p>
              <div className="flex flex-wrap gap-2">
                <StatPill label="Challenge Pool" value={String(DUEL_POOL.length).padStart(2, '0')} />
                <StatPill label="Cutoff" value={maxTimeLabel} />
                <StatPill label="Benchmark" value={benchmarkLabel} />
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
              <div>
                <h1 className="hero-display max-w-[11ch] text-[3.4rem] font-semibold leading-[0.88] tracking-[-0.08em] text-white sm:text-[4.4rem] lg:text-[5.5rem]">
                  Can you beat Max by ear?
                </h1>
                <p className="mt-5 max-w-[40rem] text-base leading-8 text-stone-300/84">
                  A one-minute headset duel inspired by Verstappen&apos;s onboard challenge on Instagram.
                  No maps. No labels. No telemetry until the round is over. Just one engine note and your nerve.
                </p>
              </div>

              <div className="grid gap-3 rounded-[28px] border border-white/10 bg-black/18 p-4">
                <HeroMicroCard title="What counts" value="Circuit, city, country, alias" />
                <HeroMicroCard title="Loss state" value="Slower than Max or 60s timeout" />
              </div>
            </div>
          </header>

          <WaveformHUD
            audioSrc={challenge.audioSrc}
            benchmarkLabel={benchmarkLabel}
            elapsedMs={displayElapsedMs}
            isPlaying={isPlaying}
            onFinish={() => setIsPlaying(false)}
            onPlayStateChange={setIsPlaying}
            onReady={setWaveform}
            onTimeUpdate={setCurrentTime}
            result={result}
            runState={runState}
          />

          {error ? (
            <div className="rounded-[22px] border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {!result ? null : (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <TrackHUD
                challenge={challenge}
                dimensions={TRACK_DIMENSIONS}
                marker={marker}
                telemetryPath={telemetryPath}
              />

              <div className="grid gap-4">
                <section className="glass-panel rounded-[30px] border border-white/12 p-4">
                  <p className="hud-label">debrief answer</p>
                  <h2 className="mt-3 text-[1.5rem] font-semibold text-white">{challenge.trackName}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-300/88">
                    {challenge.trackCountry} · {challenge.driverName} #{challenge.driverNumber || '00'}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-stone-400">
                    Benchmark set at {benchmarkLabel}. Your duel locked at {formatScoreTime(result.playerTimeMs)}.
                  </p>
                </section>

                <TelemetryStrip hudState={hudState} />
              </div>
            </section>
          )}
        </div>

        <aside className="grid gap-5 xl:sticky xl:top-6">
          <section className="glass-panel overflow-hidden rounded-[32px] border border-white/12 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="hud-label">duel cockpit</p>
                <h2 className="mt-3 text-[1.6rem] font-semibold leading-tight text-white">One screen. One clock. One shot.</h2>
              </div>
              <button
                aria-controls="benchmark-drawer"
                aria-expanded={showBenchmarks}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-300 transition hover:border-white/30"
                onClick={() => setShowBenchmarks(true)}
                type="button"
              >
                Hidden Pool
              </button>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="hud-label">race state</p>
                  <p className="mt-2 text-sm text-stone-300/80">Current line to beat</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-200">
                  {runState === 'result' ? 'locked' : runState}
                </span>
              </div>
              <div className="flex justify-center">
                <TimerRing
                  benchmarkMs={currentBenchmarkMs}
                  currentTime={displayElapsedMs}
                  durationMs={MAX_GUESS_MS}
                  result={result}
                  runState={runState}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <CompactMetric label="Max line" value={benchmarkLabel} />
              <CompactMetric label="Hard stop" value={maxTimeLabel} />
            </div>

            <div className="mt-5">
              <AnswerDock
                answerValue={answerValue}
                benchmarkLabel={benchmarkLabel}
                canStart={Boolean(waveform && !error)}
                feedback={feedback}
                isPlaying={isPlaying}
                maxTimeLabel={maxTimeLabel}
                onAnswerChange={setAnswerValue}
                onAnswerSubmit={handleAnswerSubmit}
                onNextChallenge={handleNextChallenge}
                onRetry={handleRetry}
                onStart={handleStart}
                onTogglePlayback={handleTogglePlayback}
                result={result}
                runState={runState}
              />
            </div>
          </section>
        </aside>
      </section>

      <aside
        aria-hidden={!showBenchmarks}
        className={`benchmark-drawer fixed inset-y-0 right-0 z-30 w-[min(100%,24rem)] border-l border-white/10 bg-[rgba(4,6,11,0.94)] p-5 shadow-[-24px_0_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition ${
          showBenchmarks ? 'translate-x-0' : 'translate-x-full'
        }`}
        id="benchmark-drawer"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="hud-label">hidden challenge pool</p>
            <h2 className="mt-3 text-[1.45rem] font-semibold text-white">Seven benchmark laps from Max's video.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300/88">
              This stays off-stage so the duel does not leak track names. Open only when you want the archive.
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-300 transition hover:border-white/30"
            onClick={() => setShowBenchmarks(false)}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {DUEL_POOL.map((entry) => (
            <article className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3" key={entry.id}>
              <p className="hud-label">{entry.label}</p>
              <strong className="mt-2 block text-[1.2rem] font-semibold text-white">{formatScoreTime(entry.benchmarkMs)}</strong>
              <p className="mt-2 text-xs leading-5 text-stone-400">Verstappen benchmark for this circuit.</p>
            </article>
          ))}
        </div>
      </aside>

      {showBenchmarks ? (
        <button
          aria-label="Close hidden challenge pool"
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setShowBenchmarks(false)}
          type="button"
        />
      ) : null}
    </PosterStage>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function HeroMicroCard({ title, value }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white">{value}</p>
    </article>
  );
}

function CompactMetric({ label, value }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}
