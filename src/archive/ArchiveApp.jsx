import { useEffect, useMemo, useRef, useState } from 'react';
import { ARCHIVE_TRACKS } from './archive-metadata.js';
import { useArchiveAmbientLoop } from './use-archive-ambient-loop.js';

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
  const [selectedTrackId, setSelectedTrackId] = useState('');

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

  const totalSpan = layout.span * ARCHIVE_TRACKS.length;
  const selectedIndex = ARCHIVE_TRACKS.findIndex((track) => track.id === selectedTrackId);
  const selectedTrack = selectedIndex >= 0 ? ARCHIVE_TRACKS[selectedIndex] : null;
  const ambientLoop = useArchiveAmbientLoop(selectedTrack);

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

      if (!dragRef.current.active && !selectedTrackId) {
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
  }, [layout.speed, selectedTrackId]);

  useEffect(() => {
    if (!selectedTrackId) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedTrackId('');
        return;
      }

      if (event.key === 'ArrowRight') {
        setSelectedTrackId(ARCHIVE_TRACKS[(selectedIndex + 1) % ARCHIVE_TRACKS.length].id);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setSelectedTrackId(
          ARCHIVE_TRACKS[(selectedIndex - 1 + ARCHIVE_TRACKS.length) % ARCHIVE_TRACKS.length].id
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, selectedTrackId]);

  const beginDrag = (event) => {
    if (!stageRef.current || selectedTrackId) {
      return;
    }

    if (event.target instanceof Element && event.target.closest('.track-card__button')) {
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
    if (selectedTrackId) {
      return;
    }

    offsetRef.current -= event.deltaY * 0.35;
    setOffset(offsetRef.current);
    lastTimestampRef.current = 0;
  };

  const closeDetail = () => {
    setSelectedTrackId('');
  };

  const showAdjacentTrack = (direction) => {
    if (selectedIndex < 0) {
      return;
    }

    setSelectedTrackId(
      ARCHIVE_TRACKS[(selectedIndex + direction + ARCHIVE_TRACKS.length) % ARCHIVE_TRACKS.length].id
    );
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
        className={`archive-stage${selectedTrack ? ' archive-stage--detail' : ''}`}
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
          {ARCHIVE_TRACKS.map((track, index) => {
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
                className={`track-card${selectedTrackId === track.id ? ' track-card--selected' : ''}${selectedTrack ? ' track-card--muted' : ''}`}
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
                <button
                  type="button"
                  className="track-card__button"
                  aria-label={`Open ${track.country} dossier`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setSelectedTrackId(track.id)}
                >
                  <TrackCardContent track={track} />
                </button>
              </article>
            );
          })}
        </div>
        {selectedTrack ? (
          <div
            className="archive-detail"
            role="dialog"
            aria-label={`${selectedTrack.circuit} archive detail`}
          >
            <button
              type="button"
              className="archive-detail__backdrop"
              aria-label="Close archive detail"
              onClick={closeDetail}
            />
            <div
              className="archive-detail__layout"
              data-testid="archive-detail-layout"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  closeDetail();
                }
              }}
            >
              <div className="archive-detail__toolbar">
                <button
                  type="button"
                  className="archive-detail__nav archive-detail__nav--prev"
                  aria-label="Previous circuit"
                  onClick={() => showAdjacentTrack(-1)}
                >
                  Previous
                </button>
                <p className="archive-detail__counter">
                  {selectedTrack.issue} / {String(ARCHIVE_TRACKS.length).padStart(2, '0')}
                </p>
                <button
                  type="button"
                  className="archive-detail__sound"
                  aria-label={ambientLoop.isEnabled ? 'Mute ambience' : 'Play ambience'}
                  onClick={() => {
                    if (ambientLoop.isBlocked) {
                      ambientLoop.retry();
                      return;
                    }

                    ambientLoop.setIsEnabled((current) => !current);
                  }}
                >
                  {ambientLoop.isBlocked
                    ? 'Tap for sound'
                    : ambientLoop.isEnabled
                      ? 'Ambience on'
                      : 'Ambience off'}
                </button>
                <button
                  type="button"
                  className="archive-detail__nav archive-detail__nav--next"
                  aria-label="Next circuit"
                  onClick={() => showAdjacentTrack(1)}
                >
                  Next
                </button>
              </div>

              <div className="archive-detail__cluster archive-detail__cluster--top-left">
                <p className="archive-detail__label">Country</p>
                <h3>{selectedTrack.country}</h3>
                <p className="archive-detail__meta">{selectedTrack.city}</p>
                <p className="archive-detail__meta">{selectedTrack.firstGrandPrix}</p>
              </div>

              <div className="archive-detail__cluster archive-detail__cluster--top-right">
                <p className="archive-detail__label">Archive Index</p>
                <h3>Issue {selectedTrack.issue}</h3>
                <p className="archive-detail__meta">Circuit dossier</p>
                <p className="archive-detail__meta">{selectedTrack.note}</p>
              </div>

              <article
                className="archive-detail__card"
                style={{
                  '--detail-card-start': selectedTrack.colors[0],
                  '--detail-card-end': selectedTrack.colors[1],
                  '--detail-card-sheen': selectedTrack.colors[2]
                }}
              >
                <TrackCardContent track={selectedTrack} />
              </article>

              <div className="archive-detail__cluster archive-detail__cluster--bottom-left">
                <p className="archive-detail__label">Curator's Note</p>
                <p className="archive-detail__copy">{selectedTrack.curatorNote}</p>
              </div>

              <div className="archive-detail__cluster archive-detail__cluster--bottom-right">
                <p className="archive-detail__label">Circuit Data</p>
                <dl className="archive-detail__specs">
                  <div>
                    <dt>Length</dt>
                    <dd>{selectedTrack.length}</dd>
                  </div>
                  <div>
                    <dt>Turns</dt>
                    <dd>{selectedTrack.turns}</dd>
                  </div>
                  <div>
                    <dt>First Grand Prix</dt>
                    <dd>{selectedTrack.firstGrandPrix}</dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                className="archive-detail__close"
                onClick={closeDetail}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function TrackCardContent({ track }) {
  return (
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
  );
}
