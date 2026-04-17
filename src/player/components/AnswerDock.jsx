import { useDeferredValue } from 'react';
import { normalizeAnswer } from '../answer-utils.js';
import { formatScoreTime } from '../game-config.js';

export default function AnswerDock({
  answerValue,
  benchmarkLabel,
  canStart,
  feedback,
  isPlaying,
  maxTimeLabel,
  result,
  runState,
  onAnswerChange,
  onAnswerSubmit,
  onNextChallenge,
  onRetry,
  onStart,
  onTogglePlayback
}) {
  const deferredAnswer = useDeferredValue(answerValue);
  const answerPreview = normalizeAnswer(deferredAnswer);
  const inputDisabled = runState !== 'live';

  return (
    <section className="rounded-[30px] border border-white/10 bg-black/18 p-4 backdrop-blur-xl" data-testid="answer-dock">
      {runState === 'idle' ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="hud-label">duel protocol</p>
              <h2 className="mt-3 text-[1.45rem] font-semibold leading-tight text-white">
                Start the drop and call the circuit before the room belongs to Max.
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-300">
              7 benchmark laps
            </span>
          </div>

          <div className="mt-5 grid gap-3 text-sm leading-6 text-stone-300/88">
            <p>One circuit is loaded in secret. The clip starts instantly and the clock runs to {maxTimeLabel}.</p>
            <p>Guess the circuit name, country, city, or alias. If your time is slower than {benchmarkLabel}, Max still wins.</p>
          </div>

          <button
            className="mt-5 w-full rounded-full bg-[linear-gradient(135deg,#fff2d7,#ff8b45_38%,#ff5d36_100%)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#140b08] shadow-[0_18px_46px_rgba(255,113,53,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={!canStart}
            onClick={onStart}
            type="button"
          >
            {canStart ? 'Start Duel' : 'Arming Audio'}
          </button>
        </>
      ) : null}

      {runState === 'live' ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="hud-label">live answer input</p>
              <h2 className="mt-3 text-[1.45rem] font-semibold leading-tight text-white">
                Name the circuit before Max closes the window.
              </h2>
            </div>
            <button
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-200 transition hover:border-white/30"
              onClick={onTogglePlayback}
              type="button"
            >
              {isPlaying ? 'Pause audio' : 'Replay audio'}
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-white/10 bg-black/25 p-2">
            <input
              aria-label="Circuit guess"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-stone-500"
              disabled={inputDisabled}
              onChange={(event) => onAnswerChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onAnswerSubmit();
                }
              }}
              placeholder="Monza, Spa, COTA, Singapore..."
              value={answerValue}
            />
            <button
              className="rounded-full bg-[linear-gradient(135deg,#ff7c39,#ff9a4d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,124,57,0.32)] transition hover:-translate-y-0.5"
              onClick={onAnswerSubmit}
              type="button"
            >
              Lock Guess
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-400">
            <span>{answerPreview ? `Normalized: ${answerPreview}` : 'Accepts circuit, city, country, or alias'}</span>
            <span>{benchmarkLabel} to beat · {maxTimeLabel} cutoff</span>
          </div>
        </>
      ) : null}

      {result ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="hud-label">{result.outcome === 'win' ? 'result: beat max' : 'result: max p1'}</p>
              <h2 className="mt-3 text-[1.45rem] font-semibold leading-tight text-white">
                {result.headline}
              </h2>
              <p className="mt-3 max-w-[28rem] text-sm leading-6 text-stone-300/88">
                {result.copy}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.22em] ${
                result.outcome === 'win'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                  : 'border-orange-300/30 bg-orange-500/10 text-orange-100'
              }`}
            >
              Player {formatScoreTime(result.playerTimeMs)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ResultStat label="Player" value={formatScoreTime(result.playerTimeMs)} />
            <ResultStat label="Max" value={formatScoreTime(result.benchmarkMs)} />
            <ResultStat label="Gap" value={result.deltaLabel} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-[linear-gradient(135deg,#fff2d7,#ff8b45_38%,#ff5d36_100%)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#140b08] shadow-[0_18px_46px_rgba(255,113,53,0.35)] transition hover:-translate-y-0.5"
              onClick={onNextChallenge}
              type="button"
            >
              Next Random Duel
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:border-white/30"
              onClick={onRetry}
              type="button"
            >
              Retry Same Track
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:border-white/30"
              onClick={onTogglePlayback}
              type="button"
            >
              Replay Audio
            </button>
          </div>
        </>
      ) : null}

      <FeedbackLine feedback={feedback} runState={runState} />
    </section>
  );
}

function ResultStat({ label, value }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="hud-label">{label}</p>
      <strong className="mt-2 block text-[1.35rem] font-semibold text-white">{value}</strong>
    </article>
  );
}

function FeedbackLine({ feedback, runState }) {
  if (!feedback || runState !== 'live') {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
        feedback.kind === 'miss'
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
          : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
      }`}
    >
      {feedback.message}
    </div>
  );
}
