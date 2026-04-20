import { useEffect, useMemo, useRef, useState } from 'react';

const TRACKS = [
  {
    id: 'monaco',
    issue: '01',
    country: 'Monaco',
    circuit: 'Monte Carlo',
    note: 'Harbour run',
    asset: '/assets/tracks/monaco-quali-lando-norris-2025.svg',
    colors: ['#f6efe3', '#dbccb4', '#f9f6ef']
  },
  {
    id: 'japan',
    issue: '02',
    country: 'Japan',
    circuit: 'Suzuka',
    note: 'Figure-eight line',
    asset: '/assets/tracks/japan-quali-max-verstappen-2025.svg',
    colors: ['#ede7ea', '#cbb5c2', '#faf6f7']
  },
  {
    id: 'saudi',
    issue: '03',
    country: 'Saudi Arabia',
    circuit: 'Jeddah',
    note: 'Night velocity',
    asset: '/assets/tracks/saudi-arabia-quali-max-verstappen-2025.svg',
    colors: ['#edf4ef', '#b6d2b9', '#f6faf7']
  },
  {
    id: 'imola',
    issue: '04',
    country: 'Italy',
    circuit: 'Imola',
    note: 'Old-school rhythm',
    asset: '/assets/tracks/imola-quali-oscar-piastri-2025.svg',
    colors: ['#efe7e0', '#d5b49a', '#faf8f3']
  },
  {
    id: 'silverstone',
    issue: '05',
    country: 'Great Britain',
    circuit: 'Silverstone',
    note: 'High-speed sweep',
    asset: '/assets/tracks/great-britain-quali-max-verstappen-2025.svg',
    colors: ['#e7ecf4', '#b5c1d9', '#f8fafc']
  },
  {
    id: 'spa',
    issue: '06',
    country: 'Belgium',
    circuit: 'Spa-Francorchamps',
    note: 'Ardennes climb',
    asset: '/assets/tracks/belgium-quali-lando-norris-2025.svg',
    colors: ['#ede8e2', '#cbb49d', '#fbf7f1']
  },
  {
    id: 'hungary',
    issue: '07',
    country: 'Hungary',
    circuit: 'Hungaroring',
    note: 'Compact pressure',
    asset: '/assets/tracks/hungary-quali-charles-leclerc-2025.svg',
    colors: ['#ece7d8', '#d7bd87', '#fbf9f0']
  },
  {
    id: 'singapore',
    issue: '08',
    country: 'Singapore',
    circuit: 'Marina Bay',
    note: 'Midnight corners',
    asset: '/assets/tracks/singapore-quali-george-russell-2025.svg',
    colors: ['#e7e5ee', '#afa9c6', '#f8f8fb']
  },
  {
    id: 'austin',
    issue: '09',
    country: 'United States',
    circuit: 'Circuit of the Americas',
    note: 'Texas rise',
    asset: '/assets/tracks/united-states-quali-max-verstappen-2025.svg',
    colors: ['#f3e6e1', '#d9b2a3', '#fcf7f5']
  },
  {
    id: 'vegas',
    issue: '10',
    country: 'Las Vegas',
    circuit: 'Las Vegas Strip',
    note: 'Neon straight',
    asset: '/assets/tracks/las-vegas-quali-lando-norris-2025.svg',
    colors: ['#ece6f2', '#c7b5de', '#fbf9fd']
  },
  {
    id: 'abu-dhabi',
    issue: '11',
    country: 'Abu Dhabi',
    circuit: 'Yas Marina',
    note: 'Twilight marina',
    asset: '/assets/tracks/abu-dhabi-quali-max-verstappen-2025.svg',
    colors: ['#e6eeef', '#a7c8cb', '#f7fbfb']
  },
  {
    id: 'australia',
    issue: '12',
    country: 'Australia',
    circuit: 'Albert Park',
    note: 'Lakeside balance',
    asset: '/assets/tracks/australia-quali-lando-norris-2025.svg',
    colors: ['#eef0ea', '#bdccb6', '#fbfcf9']
  }
];

const MOBILE_BREAKPOINT = 720;

function modulo(value, length) {
  return ((value % length) + length) % length;
}

function wrapOffset(value, length) {
  return modulo(value + length / 2, length) - length / 2;
}

export default function ArchiveApp() {
  const stageRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startOffset: 0
  });
  const offsetRef = useRef(0);
  const frameRef = useRef(0);
  const lastTimestampRef = useRef(0);

  const [stageWidth, setStageWidth] = useState(1440);
  const [offset, setOffset] = useState(0);

  const layout = useMemo(() => {
    const compact = stageWidth < MOBILE_BREAKPOINT;
    const cardWidth = compact ? 146 : 184;
    const cardHeight = compact ? 200 : 262;
    const gap = compact ? 18 : 24;

    return {
      compact,
      cardWidth,
      cardHeight,
      gap,
      span: cardWidth + gap,
      speed: compact ? 18 : 28
    };
  }, [stageWidth]);

  const totalSpan = layout.span * TRACKS.length;

  useEffect(() => {
    if (!stageRef.current) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width);
    });

    resizeObserver.observe(stageRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const animate = (timestamp) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (!dragRef.current.active) {
        offsetRef.current -= layout.speed * deltaSeconds;
        setOffset(offsetRef.current);
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      lastTimestampRef.current = 0;
    };
  }, [layout.speed]);

  const beginDrag = (event) => {
    if (!stageRef.current) {
      return;
    }

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offsetRef.current
    };

    stageRef.current.setPointerCapture(event.pointerId);
    stageRef.current.classList.add('is-dragging');
  };

  const moveDrag = (event) => {
    if (!dragRef.current.active) {
      return;
    }

    const delta = event.clientX - dragRef.current.startX;
    offsetRef.current = dragRef.current.startOffset + delta;
    setOffset(offsetRef.current);
  };

  const endDrag = (event) => {
    if (!dragRef.current.active) {
      return;
    }

    dragRef.current.active = false;
    lastTimestampRef.current = 0;

    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }

    stageRef.current?.classList.remove('is-dragging');
  };

  const handleWheel = (event) => {
    offsetRef.current -= event.deltaY * 0.35;
    setOffset(offsetRef.current);
    lastTimestampRef.current = 0;
  };

  return (
    <main className="archive-page">
      <header className="archive-header">
        <div>
          <p className="archive-header__eyebrow">PADDOCK ARCHIVE</p>
          <p className="archive-header__subcopy">Formula One circuit selection</p>
        </div>
        <div className="archive-header__issue">
          <span>Issue 01</span>
          <span>Curated selection</span>
        </div>
      </header>

      <section
        ref={stageRef}
        className="archive-stage"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onWheel={handleWheel}
        aria-label="F1 circuit gallery"
      >
        <div className="archive-stage__fog" />
        <div className="archive-stage__floor" />
        <div className="archive-stage__viewport">
          {TRACKS.map((track, index) => {
            const position = wrapOffset(index * layout.span + offset, totalSpan);
            const normalizedDistance = Math.min(
              Math.abs(position) / (stageWidth * (layout.compact ? 0.62 : 0.52)),
              1.25
            );
            const rotateY = Math.max(-58, Math.min(58, (position / stageWidth) * 88));
            const scale = 1 - normalizedDistance * 0.28;
            const opacity = 1 - normalizedDistance * 0.48;
            const translateY = normalizedDistance * 20;
            const translateZ = 120 - normalizedDistance * 260;
            const glowOpacity = Math.max(0.14, 0.65 - normalizedDistance * 0.45);

            return (
              <article
                key={track.id}
                className="track-card"
                style={{
                  '--card-width': `${layout.cardWidth}px`,
                  '--card-height': `${layout.cardHeight}px`,
                  '--card-start': track.colors[0],
                  '--card-end': track.colors[1],
                  '--card-sheen': track.colors[2],
                  '--card-glow-opacity': glowOpacity,
                  opacity,
                  zIndex: Math.round(1000 - normalizedDistance * 100),
                  transform: `translate3d(calc(${position}px - 50%), ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`
                }}
              >
                <div className="track-card__inner">
                  <div className="track-card__meta">
                    <span>{track.country}</span>
                    <span>{track.issue}</span>
                  </div>
                  <div className="track-card__visual">
                    <img
                      src={track.asset}
                      alt={`${track.country} ${track.circuit}`}
                      draggable="false"
                    />
                  </div>
                  <div className="track-card__footer">
                    <p>{track.note}</p>
                    <h2>{track.circuit}</h2>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
