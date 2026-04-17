import { formatClockTime, formatScoreTime } from '../game-config.js';

export default function TimerRing({ currentTime, durationMs, benchmarkMs, runState, result }) {
  const progress = durationMs ? Math.min(currentTime / durationMs, 1) : 0;
  const remainingMs = Math.max(0, durationMs - currentTime);
  const isDefeat = result?.outcome === 'lose' || result?.outcome === 'timeout';
  const statusLabel = result?.outcome === 'win'
    ? 'Beat Max'
    : result?.outcome === 'lose'
      ? 'Max P1'
      : result?.outcome === 'timeout'
        ? 'DNF'
        : runState === 'live'
          ? 'Live'
          : 'Ready';

  return (
    <div className="relative flex items-center justify-center" data-testid="timer-ring">
      <div
        className={`timer-ring relative flex h-[168px] w-[168px] items-center justify-center rounded-full border border-white/12 shadow-[0_20px_48px_rgba(0,0,0,0.34)] ${
          runState === 'live' ? 'is-live' : ''
        } ${isDefeat ? 'is-danger' : ''} ${result?.outcome === 'win' ? 'is-win' : ''}`}
        style={{
          '--progress': `${progress * 360}deg`
        }}
      >
        <div className="absolute inset-[8px] rounded-full border border-white/10 bg-[rgba(4,6,10,0.74)] backdrop-blur-xl" />
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,var(--timer-accent)_0deg,var(--timer-accent)_var(--progress),rgba(255,255,255,0.08)_var(--progress),rgba(255,255,255,0.05)_360deg)] [mask:radial-gradient(circle,transparent_60%,black_61%)]" />
        <div className="relative z-10 text-center">
          <p className="hud-label">{statusLabel}</p>
          <strong className="mt-2 block text-[1.95rem] font-semibold tracking-[-0.08em] text-white">
            {formatClockTime(currentTime)}
          </strong>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-400">
            Cutoff {formatScoreTime(durationMs)}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-stone-500">
            Max {formatScoreTime(benchmarkMs)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-500">
            {runState === 'live' ? `${formatScoreTime(remainingMs)} left` : 'One-shot audio duel'}
          </p>
        </div>
      </div>
    </div>
  );
}
