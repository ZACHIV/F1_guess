import { getCountryNameByLocale, getTrackNameByLocale } from '../track-locales.js';
import { t } from '../i18n.js';

export default function TrackHUD({
  challenge,
  telemetryPath,
  marker,
  dimensions,
  locale = 'en'
}) {
  const trackName = getTrackNameByLocale(challenge.trackName, locale);
  const countryName = getCountryNameByLocale(challenge.trackCountry, locale);
  const headerLabel = t(locale, 'trackDebriefTrace');
  const description = t(locale, 'trackDebriefDescription');

  return (
    <section
      className="track-map-panel"
      style={{ minHeight: 480, padding: 16, display: 'flex', flexDirection: 'column' }}
      data-testid="track-hud"
    >
      <div className="hud-grid" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <p className="telemetry-card__label">{headerLabel}</p>
            <h2 style={{
              margin: '4px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#fff'
            }}>
              {trackName}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--color-text-muted)', maxWidth: '20rem' }}>
              {description}
            </p>
          </div>
          <div style={{
            padding: '6px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.03)'
          }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
              {countryName}
            </p>
          </div>
        </div>

        {/* Track SVG viewport */}
        <div
          data-testid="track-hud-viewport"
          style={{
            flex: 1,
            position: 'relative',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-panel)',
            background: 'var(--color-surface-deep)',
            overflow: 'hidden'
          }}
        >
          <div className="hud-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
          <svg
            className="track-map-svg"
            style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', minHeight: 320 }}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Outer glow */}
            <path
              className="track-glow"
              d={telemetryPath}
              strokeWidth="14"
            />
            {/* Core neon stroke */}
            <path
              className="track-core"
              d={telemetryPath}
              strokeWidth="6"
            />
            {/* White-hot center */}
            <path
              className="track-hot"
              d={telemetryPath}
            />
            {/* Marker */}
            <g className="track-marker">
              <circle cx={marker.x} cy={marker.y} r="12" fill="rgba(255,51,48,0.2)" />
              <circle cx={marker.x} cy={marker.y} r="5" fill="#ff3330" stroke="#fff" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
