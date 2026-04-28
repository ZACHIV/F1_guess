function formatPosterClock(ms) {
  const totalMs = Math.max(0, Number(ms ?? 0));
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centiseconds = String(Math.floor((totalMs % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}:${centiseconds}`;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerRing({ currentTime, durationMs }) {
  const progress = durationMs ? Math.min(currentTime / durationMs, 1) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="timer-ring" data-testid="timer-ring">
      <svg className="timer-ring__svg" viewBox="0 0 96 96">
        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const inner = i % 5 === 0 ? 74 : 78;
          const x1 = 48 + Math.cos(angle) * inner;
          const y1 = 48 + Math.sin(angle) * inner;
          const x2 = 48 + Math.cos(angle) * 80;
          const y2 = 48 + Math.sin(angle) * 80;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i % 5 === 0 ? '#6f797d' : '#273137'}
              strokeWidth={i % 5 === 0 ? 1.2 : 0.6}
            />
          );
        })}
        {/* Track */}
        <circle className="timer-ring__track" cx="48" cy="48" r={RADIUS} />
        {/* Fill */}
        <circle
          className="timer-ring__fill"
          cx="48" cy="48" r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="timer-ring__center">
        <span className="timer-ring__label">Clock</span>
        <span className="timer-ring__value">{formatPosterClock(currentTime)}</span>
      </div>
    </div>
  );
}
