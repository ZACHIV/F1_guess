import { startTransition, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
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
import { isChallengeAnswerCorrect } from './answer-utils.js';
import {
  MAX_GUESS_MS,
  formatScoreTime,
  getDuelChallenge
} from './game-config.js';
import {
  buildResultNarrative,
  pickResultVariant
} from './result-copy.js';
import AudioPlayer from './components/AudioPlayer.jsx';
import PosterStage from './components/PosterStage.jsx';
import ResultReviewPage from './components/ResultReviewPage.jsx';
import TimerRing from './components/TimerRing.jsx';
import InteractionDock from './components/InteractionDock.jsx';
import LocalePicker from './components/LocalePicker.jsx';
import {
  detectInitialLocale,
  getLocalizedAnswerLabel,
  t
} from './i18n.js';
import { getSynchronizedElapsedMs } from './sync-utils.js';
import {
  muteDutchAnthemPlayback,
  playResultAudioCue,
  resetResultAudioState
} from './anthem.js';

const TRACK_DIMENSIONS = { width: 360, height: 250, padding: 26 };
const EMPTY_HUD = { speed: '-', n_gear: '-', throttle: '-', rpm: '-' };
const MARKETING_SNAPSHOT_PRESETS = {
  live: {
    challengeId: 'italy-quali-max-verstappen-2025',
    locale: 'en',
    runState: 'live',
    currentTimeMs: 16_840,
    answerValue: 'Monza',
    canResume: true,
    isPlaying: true
  },
  win: {
    challengeId: 'italy-quali-max-verstappen-2025',
    locale: 'en',
    runState: 'result',
    resultOutcome: 'win',
    playerTimeMs: 18_440
  },
  lose: {
    challengeId: 'italy-quali-max-verstappen-2025',
    locale: 'en',
    runState: 'result',
    resultOutcome: 'lose',
    playerTimeMs: 26_980
  }
};

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

function buildResult(challenge, outcome, playerTimeMs, locale, variantId = pickResultVariant(outcome)) {
  const benchmarkMs = challenge?.benchmarkMs ?? 0;
  const deltaMs = Math.abs(playerTimeMs - benchmarkMs);
  const answerLabel = getLocalizedAnswerLabel(challenge, locale);
  const localizedTrackName = answerLabel.split(' · ')[0];
  const narrative = buildResultNarrative(
    locale,
    outcome,
    {
      track: localizedTrackName,
      answer: answerLabel,
      delta: formatScoreTime(deltaMs)
    },
    variantId
  );

  if (outcome === 'win') {
    return {
      outcome,
      playerTimeMs,
      benchmarkMs,
      variantId: narrative.variantId,
      locale,
      localized: {
        headline: narrative.headline,
        copy: narrative.copy,
        deltaLabel: t(locale, 'deltaFaster', { delta: formatScoreTime(deltaMs) })
      }
    };
  }

  if (outcome === 'timeout') {
    return {
      outcome,
      playerTimeMs,
      benchmarkMs,
      variantId: narrative.variantId,
      locale,
      localized: {
        headline: narrative.headline,
        copy: narrative.copy,
        deltaLabel: t(locale, 'deltaBehind', { delta: formatScoreTime(Math.max(playerTimeMs - benchmarkMs, 0)) })
      }
    };
  }

  if (outcome === 'forfeit') {
    return {
      outcome,
      playerTimeMs,
      benchmarkMs,
      variantId: narrative.variantId,
      locale,
      localized: {
        headline: narrative.headline,
        copy: narrative.copy,
        deltaLabel: t(locale, 'deltaBehind', { delta: formatScoreTime(Math.max(playerTimeMs - benchmarkMs, 0)) })
      }
    };
  }

  return {
    outcome,
    playerTimeMs,
    benchmarkMs,
    variantId: narrative.variantId,
    locale,
    localized: {
      headline: narrative.headline,
      copy: narrative.copy,
      deltaLabel: t(locale, 'deltaSlower', { delta: formatScoreTime(deltaMs) })
    }
  };
}

function getMarketingSnapshotConfig() {
  if (typeof window === 'undefined') {
    return null;
  }

  const snapshotKey = new URLSearchParams(window.location.search).get('snapshot');
  if (!snapshotKey) {
    return null;
  }

  return MARKETING_SNAPSHOT_PRESETS[snapshotKey] ?? null;
}

export default function App({ initialLibrary }) {
  const marketingSnapshot = useMemo(() => getMarketingSnapshotConfig(), []);
  const marketingSnapshotAppliedRef = useRef(false);
  const resultAudioCleanupRef = useRef(() => {});
  const [locale, setLocale] = useState(detectInitialLocale);
  const [library, setLibrary] = useState(() => getPlayableChallenges(initialLibrary ?? fallbackChallenges));
  const [selectedChallengeId, setSelectedChallengeId] = useState(() =>
    marketingSnapshot?.challengeId
      ?? pickRandomChallenge(getPlayableChallenges(initialLibrary ?? fallbackChallenges))?.id
      ?? ''
  );
  const [telemetryModel, setTelemetryModel] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [hudState, setHudState] = useState(EMPTY_HUD);
  const [marker, setMarker] = useState({ x: 180, y: 125 });
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [answerValue, setAnswerValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [runState, setRunState] = useState('idle');
  const [result, setResult] = useState(null);
  const [submitState, setSubmitState] = useState('idle');
  const [canMuteAnthem, setCanMuteAnthem] = useState(false);
  const [anthemMuted, setAnthemMuted] = useState(false);

  const muteAnthemCue = useEffectEvent(() => {
    muteDutchAnthemPlayback();
    setAnthemMuted(true);
    setCanMuteAnthem(false);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('f1_guess_locale', locale);
    }
  }, [locale]);

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
    setSubmitState('idle');
    resultAudioCleanupRef.current?.();
    resultAudioCleanupRef.current = () => {};
    resetResultAudioState();
    setCanMuteAnthem(false);
    setAnthemMuted(false);
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

        setError(loadError instanceof Error ? loadError.message : t(locale, 'loadChallengeError'));
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
    if (!result || result.locale === locale) {
      return;
    }

    setResult(buildResult(challenge, result.outcome, result.playerTimeMs, locale, result.variantId));
  }, [challenge, locale, result]);

  useEffect(() => {
    resultAudioCleanupRef.current?.();
    resultAudioCleanupRef.current = () => {};
    resetResultAudioState();
    setAnthemMuted(false);

    if (!result || result.outcome === 'win') {
      setCanMuteAnthem(false);
      return undefined;
    }

    const cleanup = playResultAudioCue(result);
    resultAudioCleanupRef.current = cleanup;
    setCanMuteAnthem(true);

    return () => {
      cleanup?.();
      if (resultAudioCleanupRef.current === cleanup) {
        resultAudioCleanupRef.current = () => {};
      }
      resetResultAudioState();
      setCanMuteAnthem(false);
      setAnthemMuted(false);
    };
  }, [challenge?.id, result?.outcome, result?.playerTimeMs]);

  useEffect(() => {
    if (submitState !== 'error') {
      return undefined;
    }

    const resetTimer = window.setTimeout(() => {
      setSubmitState('idle');
    }, 1000);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [submitState]);

  useEffect(() => {
    if (!marketingSnapshot || !challenge || !telemetryModel || marketingSnapshotAppliedRef.current) {
      return;
    }

    marketingSnapshotAppliedRef.current = true;
    setLocale(marketingSnapshot.locale ?? 'en');
    setError('');
    setFeedback(null);
    setSubmitState('idle');
    setAnswerValue(marketingSnapshot.answerValue ?? '');
    setCurrentTime(marketingSnapshot.currentTimeMs ?? 0);
    setCanResume(Boolean(marketingSnapshot.canResume));
    setIsPlaying(Boolean(marketingSnapshot.isPlaying));

    if (marketingSnapshot.resultOutcome) {
      setRunState('result');
      setResult(
        buildResult(
          challenge,
          marketingSnapshot.resultOutcome,
          marketingSnapshot.playerTimeMs ?? 0,
          marketingSnapshot.locale ?? 'en'
        )
      );
      return;
    }

    setResult(null);
    setRunState(marketingSnapshot.runState ?? 'idle');
  }, [challenge, marketingSnapshot, telemetryModel]);

  const currentBenchmarkMs = challenge?.benchmarkMs ?? 0;
  const sessionElapsedMs = Math.min(currentTime, MAX_GUESS_MS);
  const displayElapsedMs = result?.playerTimeMs ?? sessionElapsedMs;
  const telemetryPath = telemetryModel?.telemetryPath ?? 'M 40 200 L 110 160 L 185 146 L 246 102 L 310 70';

  const playFromStart = useEffectEvent(async () => {
    if (!audioPlayer) {
      setError(t(locale, 'audioArmingError'));
      return false;
    }

    try {
      audioPlayer.currentTime = 0;
      setCurrentTime(0);
      await audioPlayer.play();
      setCanResume(true);
      return true;
    } catch {
      setError(t(locale, 'playbackBlockedError'));
      return false;
    }
  });

  const resumePlayback = useEffectEvent(async () => {
    if (!audioPlayer) {
      return false;
    }

    try {
      await audioPlayer.play();
      setCanResume(true);
      return true;
    } catch {
      setError(t(locale, 'playbackBlockedError'));
      return false;
    }
  });

  const finishRound = useEffectEvent((outcome, playerTimeMs) => {
    audioPlayer?.pause();
    setIsPlaying(false);
    setCanResume(false);
    setFeedback(null);
    setSubmitState('idle');
    setRunState('result');
    setResult(buildResult(challenge, outcome, playerTimeMs, locale));
  });

  useEffect(() => {
    if (runState !== 'live' || sessionElapsedMs < MAX_GUESS_MS) {
      return;
    }

    finishRound('timeout', MAX_GUESS_MS);
  }, [finishRound, runState, sessionElapsedMs]);

  if (!challenge) {
    return <div className="flex min-h-screen items-center justify-center bg-[#040507] text-white">{t(locale, 'noPlayableChallenge')}</div>;
  }

  async function handleStart() {
    setError('');
    setFeedback(null);
    setResult(null);
    setSubmitState('idle');
    setAnswerValue('');
    setRunState('live');
    const didStart = await playFromStart();
    if (!didStart) {
      setRunState('idle');
    }
  }

  async function handleTogglePlayback() {
    if (!audioPlayer) {
      return;
    }

    if (runState === 'live' && isPlaying) {
      audioPlayer.pause();
      return;
    }

    if (runState === 'live' && canResume) {
      await resumePlayback();
      return;
    }

    await playFromStart();
  }

  async function handleReplayLive() {
    if (runState !== 'live') {
      return;
    }

    await playFromStart();
  }

  function handleAnswerSubmit() {
    if (runState !== 'live') {
      return;
    }

    if (!answerValue.trim()) {
      return;
    }

    if (isChallengeAnswerCorrect(challenge, answerValue)) {
      const playerTimeMs = Math.min(currentTime, MAX_GUESS_MS);
      setSubmitState('idle');
      finishRound(playerTimeMs < currentBenchmarkMs ? 'win' : 'lose', playerTimeMs);
      return;
    }

    setSubmitState('error');
    setFeedback({
      kind: 'miss',
      message: t(locale, 'wrongCircuitFeedback')
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
    setSubmitState('idle');
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
        <AudioPlayer
          audioSrc={challenge.audioSrc}
          onFinish={() => {
            setIsPlaying(false);
            setCanResume(false);
          }}
          onPlayStateChange={setIsPlaying}
          onReady={setAudioPlayer}
          onTimeUpdate={setCurrentTime}
        />
        <ResultReviewPage
          canReplay={Boolean(audioPlayer)}
          canMuteAnthem={canMuteAnthem && !anthemMuted}
          challenge={challenge}
          dimensions={TRACK_DIMENSIONS}
          locale={locale}
          marker={marker}
          onLocaleChange={setLocale}
          onNextChallenge={handleNextChallenge}
          onMuteAnthem={muteAnthemCue}
          onReplayAudio={handleReplayReview}
          onRetry={handleRetry}
          result={result}
          telemetryPath={telemetryPath}
        />
      </>
    );
  }

  return (
    <>
      <AudioPlayer
        audioSrc={challenge.audioSrc}
        onFinish={() => {
          setIsPlaying(false);
          setCanResume(false);
        }}
        onPlayStateChange={setIsPlaying}
        onReady={setAudioPlayer}
        onTimeUpdate={setCurrentTime}
      />
      <PosterStage challenge={challenge} result={result} runState={runState}>
        <div className="duel-stage__language-switch">
          <LocalePicker locale={locale} onChange={setLocale} />
        </div>

        <div className="relative flex flex-1 flex-col justify-between px-5 pb-8 pt-5 sm:px-7 sm:pb-10">
          <section className="duel-stage__hero duel-stage__hero--anchored pointer-events-none px-1">
            <h1 className="duel-stage__hero-title hero-display">{t(locale, 'heroTitle')}</h1>
          </section>

          <div className="duel-stage__control-cluster">
            <InteractionDock
              answerValue={answerValue}
              canStart={Boolean(audioPlayer)}
              canResume={canResume}
              isPlaying={isPlaying}
              onAnswerChange={(value) => {
                setAnswerValue(value);
                if (submitState === 'error') {
                  setSubmitState('idle');
                }
              }}
              onReplay={handleReplayLive}
              onAnswerSubmit={handleAnswerSubmit}
              onStart={handleStart}
              onSurrender={handleSurrender}
              onTogglePlayback={handleTogglePlayback}
              runState={runState}
              submitState={submitState}
              locale={locale}
              timer={(
                <TimerRing
                  benchmarkMs={currentBenchmarkMs}
                  currentTime={displayElapsedMs}
                  durationMs={MAX_GUESS_MS}
                  result={result}
                  runState={runState}
                />
              )}
            />
          </div>
        </div>

        {error ? (
          <div className="pointer-events-none absolute inset-x-6 top-28 z-20 rounded-full border border-white/20 bg-black/28 px-4 py-2 text-center text-xs text-white/90 backdrop-blur-xl">
            {error}
          </div>
        ) : null}
      </PosterStage>
    </>
  );
}
