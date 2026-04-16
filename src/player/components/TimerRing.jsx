function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `00:${minutes}:${seconds}`;
}

export default function TimerRing({ currentTime, durationMs }) {
  const progress = durationMs ? Math.min(currentTime / durationMs, 1) : 0;

  return (
    <div className="relative flex items-center justify-center" data-testid="timer-ring">
      <div
        className="timer-ring relative flex h-[138px] w-[138px] items-center justify-center rounded-full border border-white/12 shadow-[0_20px_48px_rgba(0,0,0,0.34)]"
        style={{
          '--progress': `${progress * 360}deg`
        }}
      >
        <div className="absolute inset-[8px] rounded-full border border-white/10 bg-[rgba(4,6,10,0.74)] backdrop-blur-xl" />
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,var(--timer-accent)_0deg,var(--timer-accent)_var(--progress),rgba(255,255,255,0.08)_var(--progress),rgba(255,255,255,0.05)_360deg)] [mask:radial-gradient(circle,transparent_60%,black_61%)]" />
        <div className="relative z-10 text-center">
          <p className="hud-label">elapsed</p>
          <strong className="mt-2 block text-[1.7rem] font-semibold tracking-[-0.08em] text-white">
            {formatTime(currentTime)}
          </strong>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
            {formatTime(durationMs)}
          </p>
        </div>
      </div>
    </div>
  );
}
