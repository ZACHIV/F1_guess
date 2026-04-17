import { useEffect, useMemo, useState } from 'react';
import { formatScoreTime } from '../game-config.js';

const PHASE_TIMINGS = [140, 440, 860];

export default function VerstappenVictoryOverlay({ challenge, result }) {
  const isVisible = Boolean(result && (result.outcome === 'lose' || result.outcome === 'timeout'));
  const [phase, setPhase] = useState(0);
  const slashes = useMemo(() => Array.from({ length: 9 }, (_, index) => index), []);

  useEffect(() => {
    if (!isVisible) {
      setPhase(0);
      return undefined;
    }

    setPhase(1);
    const timers = PHASE_TIMINGS.map((delay, index) =>
      window.setTimeout(() => {
        setPhase(index + 2);
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setPhase(0);
    };
  }, [challenge?.id, isVisible, result?.playerTimeMs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="verstappen-takeover pointer-events-none absolute inset-0 overflow-hidden"
      data-phase={phase}
    >
      <div className="verstappen-takeover__glow" />
      <div className="verstappen-takeover__stripes" />
      <div className="verstappen-takeover__grid" />
      <div className="verstappen-takeover__flash" />
      <div className="verstappen-takeover__ring verstappen-takeover__ring--outer" />
      <div className="verstappen-takeover__ring verstappen-takeover__ring--inner" />

      <div className="verstappen-takeover__slashes">
        {slashes.map((index) => (
          <span key={index} style={{ '--slash-index': index }} />
        ))}
      </div>

      <div className="verstappen-takeover__badge">
        <span>01</span>
      </div>

      <div className="verstappen-takeover__hero-mark">
        <span className="verstappen-takeover__hero-main">P1</span>
        <span className="verstappen-takeover__hero-sub">VER</span>
      </div>

      <div className="verstappen-takeover__panel">
        <div className="verstappen-takeover__eyebrow">headset duel result</div>
        <div className="verstappen-takeover__hero">
          <div className="verstappen-takeover__copy">
            <h2>Verstappen wins the sound read.</h2>
            <p>
              {result.outcome === 'timeout'
                ? `You ran out of time before calling ${challenge.trackName}.`
                : `${challenge.trackName} was correct, but Max had already closed the benchmark line.`}
            </p>
          </div>
        </div>

        <div className="verstappen-takeover__stats">
          <Stat label="Max" value={formatScoreTime(result.benchmarkMs)} />
          <Stat label="Player" value={formatScoreTime(result.playerTimeMs)} />
          <Stat label="Gap" value={result.deltaLabel} />
        </div>

        <div className="verstappen-takeover__track">
          <span>{challenge.trackName}</span>
          <span>{challenge.trackCountry}</span>
          <span>{challenge.driverName}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="verstappen-takeover__stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
