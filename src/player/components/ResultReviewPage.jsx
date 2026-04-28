import { formatScoreTime } from '../game-config.js';
import { t } from '../i18n.js';
import { getCountryNameByLocale, getTrackNameByLocale } from '../track-locales.js';
import { getTrackNote } from '../track-notes.js';
import LocalePicker from './LocalePicker.jsx';
import TrackHUD from './TrackHUD.jsx';
import DashboardHeader from './DashboardHeader.jsx';

export default function ResultReviewPage({
  canReplay,
  canMuteAnthem = false,
  challenge,
  dimensions,
  galleryHref = '/',
  marker,
  onNextChallenge,
  onMuteAnthem,
  onLocaleChange,
  onReplayAudio,
  onRetry,
  locale,
  result,
  telemetryPath
}) {
  const headline = result.localized?.headline ?? result.headline;
  const copy = result.localized?.copy ?? result.copy;
  const deltaLabel = result.localized?.deltaLabel ?? result.deltaLabel;
  const trackName = getTrackNameByLocale(challenge.trackName, locale);
  const countryName = getCountryNameByLocale(challenge.trackCountry, locale);
  const trackNote = getTrackNote(challenge.trackName, locale);
  const benchmarkSourceLabel = challenge.benchmarkSource === 'recorded'
    ? t(locale, 'benchmarkSourceRecorded')
    : t(locale, 'benchmarkSourceEstimated');
  const isCorrect = result.outcome === 'win' || result.outcome === 'lose';
  const isSuccess = result.outcome === 'win';

  return (
    <div
      style={{ minHeight: '100vh' }}
      data-testid="result-review-page"
    >
      <DashboardHeader
        activeNav="play"
        locale={locale}
        onLocaleChange={onLocaleChange}
        galleryHref={galleryHref}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'grid', gap: 20 }}>
        {/* Hero Panel */}
        <header className="panel" style={{ padding: 24 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
            {t(locale, 'resultEyebrow')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div className={`result-icon ${isCorrect ? 'result-icon--correct' : 'result-icon--wrong'}`}>
                {isCorrect ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              <div style={{ maxWidth: 560 }}>
                <h1 style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 0.95,
                  color: '#fff'
                }}>
                  {headline}
                </h1>
                <p style={{ margin: '10px 0 0', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
                  {copy}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="button-primary" onClick={onNextChallenge} type="button">
                {t(locale, 'nextDuel')}
              </button>
              <button className="button-secondary" onClick={onRetry} type="button">
                {t(locale, 'retry')}
              </button>
              <button
                className="button-secondary"
                disabled={!canReplay}
                onClick={onReplayAudio}
                type="button"
              >
                {t(locale, 'replayAudio')}
              </button>
              {canMuteAnthem ? (
                <button className="button-danger" onClick={onMuteAnthem} type="button">
                  {t(locale, 'muteAnthem')}
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {/* Track + Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) 300px', gap: 18, alignItems: 'start' }}>
          <TrackHUD
            challenge={challenge}
            dimensions={dimensions}
            locale={locale}
            marker={marker}
            telemetryPath={telemetryPath}
          />

          <aside style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            {/* Time Stats */}
            <section className="panel" style={{ padding: 16 }}>
              <p className="telemetry-card__label" style={{ marginBottom: 12 }}>{t(locale, 'debrief')}</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="stat-row">
                  <span className="stat-row__label">{t(locale, 'player')}</span>
                  <span className="stat-row__value">{formatScoreTime(result.playerTimeMs)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-row__label">{t(locale, 'max')}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="stat-row__value">{formatScoreTime(result.benchmarkMs)}</span>
                    <div className="stat-row__hint">{benchmarkSourceLabel}</div>
                  </div>
                </div>
                <div className="stat-row">
                  <span className="stat-row__label">{t(locale, 'gap')}</span>
                  <span className="stat-row__value" style={{ color: isSuccess ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {deltaLabel}
                  </span>
                </div>
              </div>
            </section>

            {/* Track Reveal */}
            <section className="panel" style={{ padding: 16 }}>
              <p className="telemetry-card__label" style={{ marginBottom: 12 }}>{t(locale, 'trackReveal')}</p>
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="stat-row">
                  <span className="stat-row__label">{t(locale, 'circuit')}</span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
                    {trackName}
                  </strong>
                </div>
                <div className="stat-row">
                  <span className="stat-row__label">{t(locale, 'country')}</span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
                    {countryName}
                  </strong>
                </div>
                <div className="stat-row">
                  <span className="stat-row__label">{t(locale, 'driver')}</span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
                    {challenge.driverName} #{challenge.driverNumber || '00'}
                  </strong>
                </div>
              </div>

              {trackNote ? (
                <div style={{
                  marginTop: 12,
                  padding: '12px 14px',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-control)',
                  background: 'var(--color-surface)'
                }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                    {t(locale, 'trackNote')}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                    {trackNote}
                  </p>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
