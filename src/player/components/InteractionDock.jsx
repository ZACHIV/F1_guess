import { normalizeAnswer } from '../answer-utils.js';

export default function InteractionDock({
  answerValue,
  canStart,
  canResume,
  feedback,
  isPlaying,
  onAnswerChange,
  onAnswerSubmit,
  onStart,
  onSurrender,
  onTogglePlayback,
  runState
}) {
  const answerPreview = normalizeAnswer(answerValue);

  return (
    <section
      className="interaction-dock rounded-[1.45rem] border border-white/12 bg-[linear-gradient(180deg,rgba(14,18,24,0.42),rgba(10,14,18,0.3))] p-3 text-white shadow-[0_16px_34px_rgba(0,0,0,0.14)] backdrop-blur-[22px]"
      data-testid="interaction-dock"
    >
      {runState === 'idle' ? (
        <div className="grid gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/48">Ready</p>
            <p className="mt-2 text-[1rem] leading-6 text-white/86">
              {canStart ? 'Audio is loaded. Tap to start the duel.' : 'Audio is arming. Start will unlock in a moment.'}
            </p>
          </div>
          <button
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#10161d] transition hover:bg-white/92 disabled:cursor-not-allowed disabled:bg-white/35"
            disabled={!canStart}
            onClick={onStart}
            type="button"
          >
            Start Duel
          </button>
        </div>
      ) : null}

      {runState === 'live' ? (
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/48">Live</p>
              <p className="mt-2 text-[1rem] leading-6 text-white/88">Type the track name, city, country, or alias.</p>
            </div>
            <button
              className="shrink-0 rounded-full border border-white/18 bg-white/8 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
              onClick={onTogglePlayback}
              type="button"
            >
              {isPlaying ? 'Pause' : canResume ? 'Resume' : 'Pause'}
            </button>
          </div>

          <div className="grid gap-2">
            <input
              aria-label="Circuit guess"
              className="min-w-0 rounded-full border border-white/10 bg-black/18 px-4 py-3 text-[0.95rem] text-white outline-none placeholder:text-white/30"
              onChange={(event) => onAnswerChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onAnswerSubmit();
                }
              }}
              placeholder="Monza / Spa / COTA / Singapore"
              value={answerValue}
            />

            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[11px] text-white/48">
                {answerPreview ? `Normalized: ${answerPreview}` : 'Listening for your guess'}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="rounded-full border border-white/14 bg-white/6 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                  onClick={onSurrender}
                  type="button"
                >
                  Surrender
                </button>
                <button
                  className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16"
                  onClick={onAnswerSubmit}
                  type="button"
                >
                  Lock
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-white/42">
            {isPlaying ? 'Playing' : canResume ? 'Paused. Tap Resume to continue.' : 'Ready to begin listening.'}
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-3 rounded-[1rem] border border-white/10 bg-black/16 px-3 py-2 text-xs text-white/74">
          {feedback.message}
        </div>
      ) : null}
    </section>
  );
}
