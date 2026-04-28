import { t } from '../i18n.js';

export default function InteractionDock({
  answerValue,
  canStart,
  canResume,
  feedback,
  isPlaying,
  onAnswerChange,
  onReplay,
  onAnswerSubmit,
  onStart,
  onSurrender,
  onTogglePlayback,
  runState,
  submitState,
  timer,
  locale
}) {
  const isSubmitError = submitState === 'error';

  return (
    <section
      className="panel"
      style={{ padding: 20 }}
      data-testid="interaction-dock"
    >
      {/* ── Idle: Start Screen ── */}
      {runState === 'idle' ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p className="telemetry-card__label" style={{ marginBottom: 4 }}>Audio Duel Protocol</p>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.02em', color: '#fff', textTransform: 'uppercase' }}>
                Listen first. Lock the circuit before the benchmark falls.
              </h2>
            </div>
            <span className="chip">Round idle</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              className="play-control animate-pulse-glow"
              disabled={!canStart}
              onClick={onStart}
              type="button"
              aria-label="Start Duel"
              style={!canStart ? { opacity: 0.4, cursor: 'not-allowed', animation: 'none' } : {}}
            >
              <span className="play-control__icon play-control__icon--play" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'end' }}>
            <p style={{
              margin: 0,
              padding: '10px 14px',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.78rem',
              lineHeight: 1.6,
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)'
            }}>
              {t(locale, 'idleHelper')}
            </p>
            {timer}
          </div>
        </div>
      ) : null}

      {/* ── Live: Playing Screen ── */}
      {runState === 'live' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p className="telemetry-card__label" style={{ marginBottom: 4 }}>Live Recognition</p>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '0.02em', color: '#fff', textTransform: 'uppercase' }}>
                Catch the braking pattern and commit your guess.
              </h2>
            </div>
            <span className="chip chip--hard">Signal live</span>
          </div>

          {/* Play + Skip Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <button className="skip-control" type="button" aria-label="Skip back 15s">
              -15s
            </button>
            <button
              className="play-control animate-pulse-glow"
              onClick={onTogglePlayback}
              type="button"
              aria-label={isPlaying ? 'Pause' : canResume ? 'Resume' : 'Play'}
            >
              {isPlaying ? (
                <span className="play-control__icon play-control__icon--pause" />
              ) : (
                <span className="play-control__icon play-control__icon--play" />
              )}
            </button>
            <button className="skip-control" type="button" aria-label="Skip forward 15s">
              +15s
            </button>
          </div>

          {/* Guess Input Row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              aria-label="Circuit guess"
              className={`input-dark${isSubmitError ? ' animate-shake' : ''}`}
              style={{ flex: 1 }}
              onChange={(event) => onAnswerChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onAnswerSubmit();
              }}
              placeholder={t(locale, 'answerPlaceholder')}
              value={answerValue}
            />
            <button
              className={isSubmitError ? 'button-danger' : 'button-primary'}
              onClick={onAnswerSubmit}
              type="button"
            >
              {isSubmitError ? t(locale, 'wrong') : t(locale, 'submit')}
            </button>
          </div>

          {/* Action Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'start' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="button-secondary" onClick={onReplay} type="button">
                {t(locale, 'replay')}
              </button>
              <button
                className="button-ghost"
                onClick={onSurrender}
                type="button"
                style={{ color: '#ffb8b6' }}
              >
                {t(locale, 'surrender')}
              </button>
            </div>
            {timer}
          </div>

          {/* Helper text */}
          {t(locale, 'liveHelper') ? (
            <p style={{
              margin: 0,
              padding: '10px 14px',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.78rem',
              lineHeight: 1.6,
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)'
            }}>
              {t(locale, 'liveHelper')}
            </p>
          ) : null}

          {/* Wrong answer feedback */}
          {feedback ? (
            <p
              aria-live="polite"
              style={{
                margin: 0,
                padding: '10px 14px',
                border: '1px solid rgba(255,51,48,0.25)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                color: '#ffb8b6',
                background: 'rgba(140,16,13,0.15)'
              }}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
