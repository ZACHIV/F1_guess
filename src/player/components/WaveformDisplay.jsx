const BAR_COUNT = 64;

function generateBars(count) {
  const bars = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const height = 0.15 + 0.7 * Math.sin(t * Math.PI) + 0.15 * Math.sin(t * 13 + 0.7) * Math.cos(t * 5 + 0.3);
    bars.push(Math.max(0.08, Math.min(0.92, height)));
  }
  return bars;
}

const BARS = generateBars(BAR_COUNT);

export default function WaveformDisplay({ currentTime = 0, durationMs = 60000, isPlaying = false }) {
  const progress = durationMs ? Math.min(currentTime / durationMs, 1) : 0;
  const activeIndex = Math.floor(progress * BAR_COUNT);

  return (
    <div className="waveform-area" style={{ height: 100, padding: '8px 0' }}>
      <div className="hud-grid" />
      <svg
        viewBox={`0 0 ${BAR_COUNT * 6} 80`}
        preserveAspectRatio="none"
        style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '0 6px' }}
      >
        {BARS.map((h, i) => (
          <rect
            key={i}
            className={`waveform-bar${i <= activeIndex && isPlaying ? ' active' : ''}`}
            x={i * 6 + 1}
            y={40 - h * 36}
            width={4}
            height={h * 72}
            rx={2}
          />
        ))}
      </svg>

      <div className="timeline" style={{ margin: '8px 10px 0', position: 'relative', zIndex: 1 }}>
        <div className="timeline__fill" style={{ width: `${progress * 100}%` }} />
        <div className="timeline__thumb" style={{ left: `${progress * 100}%` }} />
      </div>
      <div className="timeline__labels" style={{ padding: '0 10px', position: 'relative', zIndex: 1 }}>
        <span>0:00</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  );
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
