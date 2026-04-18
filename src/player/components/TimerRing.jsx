function formatPosterClock(ms) {
  const totalMs = Math.max(0, Number(ms ?? 0));
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centiseconds = String(Math.floor((totalMs % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}:${centiseconds}`;
}

export default function TimerRing({ currentTime, durationMs }) {
  const progress = durationMs ? Math.min(currentTime / durationMs, 1) : 0;
  const progressDegrees = Math.max(12, progress * 360);

  return (
    <div className="poster-timer" data-testid="timer-ring">
      <div
        className="poster-timer__ring"
        style={{
          '--timer-progress': `${progressDegrees}deg`
        }}
      >
        <div className="poster-timer__inner">
          <strong>{formatPosterClock(currentTime)}</strong>
        </div>
      </div>
    </div>
  );
}
