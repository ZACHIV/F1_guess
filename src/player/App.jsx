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
  MAX_GUESS_MS,
  formatScoreTime,
  getDuelChallenge
} from './game-config.js';
import PosterStage from './components/PosterStage.jsx';
import ResultReviewPage from './components/ResultReviewPage.jsx';
import WaveformHUD from './components/WaveformHUD.jsx';
import TimerRing from './components/TimerRing.jsx';
import InteractionDock from './components/InteractionDock.jsx';
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

  if (outcome === 'forfeit') {
    return {
      outcome,
      playerTimeMs,
      benchmarkMs,
      headline: `You waved off before ${challenge.trackName}.`,
      copy: `Correct answer: ${answerLabel}. You bailed out of the duel early, so Verstappen keeps the line.`,
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
  const [liveWaveform, setLiveWaveform] = useState(null);
  const [reviewWaveform, setReviewWaveform] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [answerValue, setAnswerValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [runState, setRunState] = useState('idle');
  const [result, setResult] = useState(null);
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
    setCanResume(false);

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
  const activeWaveform = result ? reviewWaveform : liveWaveform;

  const playFromStart = useEffectEvent(async () => {
    if (!activeWaveform) {
      setError('Audio is still arming. Give the waveform a second, then start again.');
      return false;
    }

    try {
      if (typeof activeWaveform.stop === 'function') {
        activeWaveform.stop();
      } else {
        activeWaveform.pause?.();
      }

      if (typeof activeWaveform.setTime === 'function') {
        activeWaveform.setTime(0);
      } else if (typeof activeWaveform.seekTo === 'function') {
        activeWaveform.seekTo(0);
      }

      setCurrentTime(0);
      await activeWaveform.play();
      setCanResume(true);
      return true;
    } catch {
      setError('Audio playback was blocked. Interact again to continue the duel.');
      return false;
    }
  });

  const resumePlayback = useEffectEvent(async () => {
    if (!activeWaveform) {
      return false;
    }

    try {
      await activeWaveform.play();
      setCanResume(true);
      return true;
    } catch {
      setError('Audio playback was blocked. Interact again to continue the duel.');
      return false;
    }
  });

  const finishRound = useEffectEvent((outcome, playerTimeMs) => {
    activeWaveform?.pause?.();
    setIsPlaying(false);
    setCanResume(false);
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
    if (!activeWaveform) {
      return;
    }

    if (runState === 'live' && isPlaying) {
      activeWaveform.pause?.();
      return;
    }

    if (runState === 'live' && canResume) {
      await resumePlayback();
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

  function handleSurrender() {
    if (runState !== 'live') {
      return;
    }

    finishRound('forfeit', Math.min(currentTime, MAX_GUESS_MS));
  }

  async function handleReplayReview() {
    await playFromStart();
  }

  if (result) {
    return (
      <>
        <WaveformHUD
          audioSrc={challenge.audioSrc}
          hidden
          onFinish={() => {
            setIsPlaying(false);
            setCanResume(false);
          }}
          onPlayStateChange={setIsPlaying}
          onReady={setReviewWaveform}
          onTimeUpdate={setCurrentTime}
        />
        <ResultReviewPage
          canReplay={Boolean(reviewWaveform)}
          challenge={challenge}
          dimensions={TRACK_DIMENSIONS}
          marker={marker}
          onNextChallenge={handleNextChallenge}
          onReplayAudio={handleReplayReview}
          onRetry={handleRetry}
          result={result}
          telemetryPath={telemetryPath}
        />
      </>
    );
  }

  return (
    <PosterStage challenge={challenge} result={result} runState={runState}>
        <WaveformHUD
          audioSrc={challenge.audioSrc}
        onFinish={() => {
          setIsPlaying(false);
          setCanResume(false);
        }}
        onPlayStateChange={setIsPlaying}
        onReady={setLiveWaveform}
        onTimeUpdate={setCurrentTime}
      />

      <div className="mt-auto px-6 pb-10 sm:px-8 sm:pb-12">
        <div className="ml-auto grid w-full max-w-[22rem] grid-cols-[minmax(0,1fr)_118px] items-end gap-3">
          <div className="min-w-0">
            <InteractionDock
              answerValue={answerValue}
              canStart={Boolean(liveWaveform)}
              canResume={canResume}
              feedback={feedback}
              isPlaying={isPlaying}
              onAnswerChange={setAnswerValue}
              onAnswerSubmit={handleAnswerSubmit}
              onStart={handleStart}
              onSurrender={handleSurrender}
              onTogglePlayback={handleTogglePlayback}
              runState={runState}
            />
          </div>
          <TimerRing
            benchmarkMs={currentBenchmarkMs}
            currentTime={displayElapsedMs}
            durationMs={MAX_GUESS_MS}
            result={result}
            runState={runState}
          />
        </div>
      </div>

      {error ? (
        <div className="pointer-events-none absolute inset-x-6 top-28 z-20 rounded-full border border-white/20 bg-black/28 px-4 py-2 text-center text-xs text-white/90 backdrop-blur-xl">
          {error}
        </div>
      ) : null}
    </PosterStage>
  );
}
