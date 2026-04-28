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
import DashboardHeader from './components/DashboardHeader.jsx';
import PosterStage from './components/PosterStage.jsx';
import ResultReviewPage from './components/ResultReviewPage.jsx';
import TimerRing from './components/TimerRing.jsx';
import InteractionDock from './components/InteractionDock.jsx';
import TelemetryStrip from './components/TelemetryStrip.jsx';
import WaveformDisplay from './components/WaveformDisplay.jsx';
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
  if (!challenges.length) return null;
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
  if (!locationFrames.length || !carFrames.length) return null;
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
    if (!response.ok) throw new Error('Load failed');
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
    locale, outcome,
    { track: localizedTrackName, answer: answerLabel, delta: formatScoreTime(deltaMs) },
    variantId
  );

  if (outcome === 'win') {
    return {
      outcome, playerTimeMs, benchmarkMs, variantId: narrative.variantId, locale,
      localized: {
        headline: narrative.headline, copy: narrative.copy,
        deltaLabel: t(locale, 'deltaFaster', { delta: formatScoreTime(deltaMs) })
      }
    };
  }
  if (outcome === 'timeout') {
    return {
      outcome, playerTimeMs, benchmarkMs, variantId: narrative.variantId, locale,
      localized: {
        headline: narrative.headline, copy: narrative.copy,
        deltaLabel: t(locale, 'deltaBehind', { delta: formatScoreTime(Math.max(playerTimeMs - benchmarkMs, 0)) })
      }
    };
  }
  if (outcome === 'forfeit') {
    return {
      outcome, playerTimeMs, benchmarkMs, variantId: narrative.variantId, locale,
      localized: {
        headline: narrative.headline, copy: narrative.copy,
        deltaLabel: t(locale, 'deltaBehind', { delta: formatScoreTime(Math.max(playerTimeMs - benchmarkMs, 0)) })
      }
    };
  }
  return {
    outcome, playerTimeMs, benchmarkMs, variantId: narrative.variantId, locale,
    localized: {
      headline: narrative.headline, copy: narrative.copy,
      deltaLabel: t(locale, 'deltaSlower', { delta: formatScoreTime(deltaMs) })
    }
  };
}

function getMarketingSnapshotConfig() {
  if (typeof window === 'undefined') return null;
  const snapshotKey = new URLSearchParams(window.location.search).get('snapshot');
  if (!snapshotKey) return null;
  return MARKETING_SNAPSHOT_PRESETS[snapshotKey] ?? null;
}

function getInitialTrackIdFromUrl() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('track') ?? '';
}

export default function App({ initialLibrary }) {
  const marketingSnapshot = useMemo(() => getMarketingSnapshotConfig(), []);
  const initialTrackId = useMemo(() => getInitialTrackIdFromUrl(), []);
  const marketingSnapshotAppliedRef = useRef(false);
  const resultAudioCleanupRef = useRef(() => {});
  const [locale, setLocale] = useState(detectInitialLocale);
  const [library, setLibrary] = useState(() => getPlayableChallenges(initialLibrary ?? fallbackChallenges));
  const [selectedChallengeId, setSelectedChallengeId] = useState(() =>
    marketingSnapshot?.challengeId
      ?? initialTrackId
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
    if (initialLibrary) return undefined;
    let cancelled = false;
    loadChallengeLibrary().then((records) => {
      if (cancelled) return;
      const playable = getPlayableChallenges(records);
      setLibrary(playable);
      setSelectedChallengeId((currentId) => {
        if (playable.some((entry) => entry.id === currentId)) return currentId;
        if (initialTrackId && playable.some((entry) => entry.id === initialTrackId)) return initialTrackId;
        return pickRandomChallenge(playable)?.id ?? '';
      });
    });
    return () => { cancelled = true; };
  }, [initialLibrary, initialTrackId]);

  const challenge = useMemo(
    () => library.find((item) => item.id === selectedChallengeId) ?? library[0] ?? null,
    [library, selectedChallengeId]
  );

  useEffect(() => {
    if (!challenge) return undefined;
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
        if (cancelled) return;
        const nextTelemetryModel = buildTelemetryModel(locationData, carData);
        setTelemetryModel(nextTelemetryModel);
        setMarker(nextTelemetryModel?.initialMarker ?? { x: 180, y: 125 });
        setHudState(nextTelemetryModel?.initialHud ?? EMPTY_HUD);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : t(locale, 'loadChallengeError'));
      });
    return () => { cancelled = true; };
  }, [challenge]);

  useEffect(() => {
    if (!telemetryModel) return;
    const telemetryElapsedMs = getSynchronizedElapsedMs(currentTime, challenge);
    const nextMarker = getInterpolatedTelemetryPoint(telemetryModel.locationFrames, telemetryElapsedMs) ?? telemetryModel.initialMarker;
    const nextHudState = getNearestTelemetrySample(telemetryModel.carFrames, telemetryElapsedMs) ?? telemetryModel.initialHud;
    setMarker(nextMarker);
    setHudState(nextHudState);
  }, [challenge, currentTime, telemetryModel]);

  useEffect(() => {
    if (!result || result.locale === locale) return;
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
      if (resultAudioCleanupRef.current === cleanup) resultAudioCleanupRef.current = () => {};
      resetResultAudioState();
      setCanMuteAnthem(false);
      setAnthemMuted(false);
    };
  }, [challenge?.id, result?.outcome, result?.playerTimeMs]);

  useEffect(() => {
    if (submitState !== 'error') return undefined;
    const resetTimer = window.setTimeout(() => setSubmitState('idle'), 1000);
    return () => window.clearTimeout(resetTimer);
  }, [submitState]);

  useEffect(() => {
    if (!marketingSnapshot || !challenge || !telemetryModel || marketingSnapshotAppliedRef.current) return;
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
      setResult(buildResult(challenge, marketingSnapshot.resultOutcome, marketingSnapshot.playerTimeMs ?? 0, marketingSnapshot.locale ?? 'en'));
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
    if (!audioPlayer) return false;
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
    if (runState !== 'live' || sessionElapsedMs < MAX_GUESS_MS) return;
    finishRound('timeout', MAX_GUESS_MS);
  }, [finishRound, runState, sessionElapsedMs]);

  if (!challenge) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', color: '#fff' }}>
        {t(locale, 'noPlayableChallenge')}
      </div>
    );
  }

  async function handleStart() {
    setError('');
    setFeedback(null);
    setResult(null);
    setSubmitState('idle');
    setAnswerValue('');
    setRunState('live');
    const didStart = await playFromStart();
    if (!didStart) setRunState('idle');
  }

  async function handleTogglePlayback() {
    if (!audioPlayer) return;
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
    if (runState !== 'live') return;
    await playFromStart();
  }

  function handleAnswerSubmit() {
    if (runState !== 'live') return;
    if (!answerValue.trim()) return;
    if (isChallengeAnswerCorrect(challenge, answerValue)) {
      const playerTimeMs = Math.min(currentTime, MAX_GUESS_MS);
      setSubmitState('idle');
      finishRound(playerTimeMs < currentBenchmarkMs ? 'win' : 'lose', playerTimeMs);
      return;
    }
    setSubmitState('error');
    setFeedback({ kind: 'miss', message: t(locale, 'wrongCircuitFeedback') });
  }

  function handleNextChallenge() {
    const nextChallenge = pickRandomChallenge(library, challenge.id);
    if (!nextChallenge) return;
    startTransition(() => setSelectedChallengeId(nextChallenge.id));
  }

  async function handleRetry() {
    setError('');
    setFeedback(null);
    setResult(null);
    setSubmitState('idle');
    setAnswerValue('');
    setRunState('live');
    const didStart = await playFromStart();
    if (!didStart) setRunState('idle');
  }

  function handleSurrender() {
    if (runState !== 'live') return;
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
          onFinish={() => { setIsPlaying(false); setCanResume(false); }}
          onPlayStateChange={setIsPlaying}
          onReady={setAudioPlayer}
          onTimeUpdate={setCurrentTime}
        />
        <ResultReviewPage
          canReplay={Boolean(audioPlayer)}
          canMuteAnthem={canMuteAnthem && !anthemMuted}
          challenge={challenge}
          dimensions={TRACK_DIMENSIONS}
          galleryHref="/"
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
        onFinish={() => { setIsPlaying(false); setCanResume(false); }}
        onPlayStateChange={setIsPlaying}
        onReady={setAudioPlayer}
        onTimeUpdate={setCurrentTime}
      />
      <PosterStage>
        <DashboardHeader
          activeNav="play"
          locale={locale}
          onLocaleChange={setLocale}
          galleryHref="/"
        />

        <div className="dashboard">
          {/* Sidebar */}
          <aside className="dashboard__sidebar">
            <TelemetryStrip hudState={hudState} />

            <section className="panel" style={{ padding: 16 }}>
              <p className="telemetry-card__label" style={{ marginBottom: 12 }}>Session Clock</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TimerRing currentTime={displayElapsedMs} durationMs={MAX_GUESS_MS} />
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Timer starts with playback. Freezes on reveal.
              </p>
            </section>

            <section className="panel" style={{ padding: 16 }}>
              <p className="telemetry-card__label" style={{ marginBottom: 12 }}>Protocol</p>
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  { label: 'Audio Armed', active: runState !== 'idle' },
                  { label: 'Guess Window', active: runState === 'live' },
                  { label: 'Feedback Pulse', active: Boolean(feedback) },
                  { label: 'Track Reveal', active: runState === 'result' }
                ].map((step) => (
                  <div
                    key={step.label}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${step.active ? 'var(--color-red)' : 'var(--color-border-soft)'}`,
                      borderRadius: 'var(--radius-control)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: step.active ? '#fff' : 'var(--color-text-dim)',
                      background: step.active ? 'rgba(255,51,48,0.08)' : 'transparent'
                    }}
                  >
                    {step.label}
                  </div>
                ))}
              </div>
            </section>

            {/* Challenge meta chips */}
            <section className="panel" style={{ padding: 16 }}>
              <p className="telemetry-card__label" style={{ marginBottom: 10 }}>Challenge</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="chip">{challenge.driverName} #{challenge.driverNumber || '00'}</span>
                <span className="chip">{challenge.durationLabel || '00:00'}</span>
                <span className="chip chip--hard">{formatScoreTime(currentBenchmarkMs)}</span>
              </div>
            </section>
          </aside>

          {/* Main */}
          <main className="dashboard__main">
            {/* Hero area */}
            <div className="panel" style={{ padding: 24 }}>
              <p className="telemetry-card__label" style={{ marginBottom: 8 }}>For Operators, Not Spectators</p>
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 0.9,
                color: '#fff'
              }}>
                {t(locale, 'heroTitle')}
              </h1>
              <p style={{ margin: '12px 0 0', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--color-text-muted)', maxWidth: '28rem' }}>
                {t(locale, 'idleHelper')}
              </p>

              {runState === 'live' ? (
                <div style={{ marginTop: 20 }}>
                  <WaveformDisplay
                    currentTime={currentTime}
                    durationMs={challenge.clipDurationMs || MAX_GUESS_MS}
                    isPlaying={isPlaying}
                  />
                </div>
              ) : (
                <div style={{
                  marginTop: 20,
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-panel)',
                  background: 'var(--color-surface-deep)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div className="hud-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
                  <span style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                    Audio Trace Armed
                  </span>
                </div>
              )}
            </div>

            {/* Interaction Dock */}
            <InteractionDock
              answerValue={answerValue}
              canStart={Boolean(audioPlayer)}
              canResume={canResume}
              feedback={feedback}
              isPlaying={isPlaying}
              onAnswerChange={(value) => {
                setAnswerValue(value);
                if (submitState === 'error') setSubmitState('idle');
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
                <TimerRing currentTime={displayElapsedMs} durationMs={MAX_GUESS_MS} />
              )}
            />
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="mobile-nav">
          <div className="mobile-nav__items">
            <button className="mobile-nav__item active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Play
            </button>
            <button className="mobile-nav__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
              Practice
            </button>
            <button className="mobile-nav__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Challenges
            </button>
            <button className="mobile-nav__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-4" />
              </svg>
              Stats
            </button>
            <button className="mobile-nav__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          </div>
        </nav>

        {error ? (
          <div style={{
            position: 'fixed',
            left: '50%',
            top: 80,
            transform: 'translateX(-50%)',
            zIndex: 100,
            maxWidth: '92%',
            width: 620,
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
            fontSize: '0.78rem',
            textAlign: 'center',
            color: '#fff'
          }}>
            {error}
          </div>
        ) : null}
      </PosterStage>
    </>
  );
}
