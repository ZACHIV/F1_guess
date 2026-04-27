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
      className="interaction-dock rounded-[1.8rem] border border-[rgba(244,233,226,0.12)] bg-[linear-gradient(180deg,rgba(31,21,21,0.86),rgba(15,11,11,0.82))] p-4 text-white shadow-[0_24px_54px_rgba(0,0,0,0.28)] backdrop-blur-[26px]"
      data-testid="interaction-dock"
    >
      {runState === 'idle' ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="hud-label">audio duel protocol</p>
              <h2 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.05em] text-[#fff7f2]">
                Listen first. Lock the circuit before the benchmark falls.
              </h2>
            </div>
            <span className="rounded-full border border-[rgba(244,233,226,0.12)] bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/54">
              round idle
            </span>
          </div>
          <button
            className="rounded-[1.1rem] bg-[linear-gradient(135deg,#fde4d6,#f0c4af_40%,#d8a38d_100%)] px-5 py-4 text-base font-semibold text-[#1c1311] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            disabled={!canStart}
            onClick={onStart}
            type="button"
          >
            {t(locale, 'startDuel')}
          </button>
          <div className="grid grid-cols-[minmax(0,1fr)_106px] items-end gap-3">
            <p className="rounded-[1rem] border border-[rgba(244,233,226,0.08)] bg-black/14 px-4 py-3 text-[0.78rem] leading-5 text-white/56">
              {t(locale, 'idleHelper')}
            </p>
            <div className="flex justify-end">
              {timer}
            </div>
          </div>
        </div>
      ) : null}

      {runState === 'live' ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="hud-label">live recognition</p>
              <h2 className="mt-2 text-[1.32rem] font-semibold tracking-[-0.05em] text-[#fff7f2]">
                Catch the braking pattern and commit your guess.
              </h2>
            </div>
            <span className="rounded-full border border-[rgba(244,233,226,0.12)] bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/54">
              signal live
            </span>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-2 rounded-[1.25rem] border border-[rgba(244,233,226,0.1)] bg-black/16 p-2">
              <input
                aria-label="Circuit guess"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[1rem] text-white outline-none placeholder:text-white/22"
                onChange={(event) => onAnswerChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onAnswerSubmit();
                  }
                }}
                placeholder={t(locale, 'answerPlaceholder')}
                value={answerValue}
              />
              <button
                className={`rounded-[1rem] px-5 py-3 text-sm font-semibold transition ${
                  isSubmitError
                    ? 'bg-[#d93d43] text-white shadow-[0_12px_30px_rgba(217,61,67,0.3)]'
                    : 'bg-[linear-gradient(135deg,#fde4d6,#f0c4af_40%,#d8a38d_100%)] text-[#1c1311] shadow-[0_14px_30px_rgba(216,163,141,0.22)] hover:-translate-y-0.5'
                }`}
                onClick={onAnswerSubmit}
                type="button"
              >
                {isSubmitError ? t(locale, 'wrong') : t(locale, 'submit')}
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_108px] items-start gap-3">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-[rgba(244,233,226,0.14)] bg-white/7 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
                    onClick={onTogglePlayback}
                    type="button"
                  >
                    {isPlaying ? t(locale, 'pause') : canResume ? t(locale, 'resume') : t(locale, 'pause')}
                  </button>
                  <button
                    className="shrink-0 rounded-full border border-[rgba(244,233,226,0.14)] bg-white/7 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
                    onClick={onReplay}
                    type="button"
                  >
                    {t(locale, 'replay')}
                  </button>
                </div>

                <button
                  className="w-fit rounded-full border border-[#ff8d8d]/26 bg-[#55161b]/44 px-4 py-2.5 text-sm font-medium text-[#ffd8d8] transition hover:border-[#ff9d9d]/36 hover:bg-[#6a1b21]/58"
                  onClick={onSurrender}
                  type="button"
                >
                  {t(locale, 'surrender')}
                </button>
              </div>

              <div className="flex justify-end pt-1">
                {timer}
              </div>
            </div>
          </div>

          {t(locale, 'liveHelper') ? (
            <p className="rounded-[1rem] border border-[rgba(244,233,226,0.08)] bg-black/12 px-4 py-3 text-[0.78rem] leading-5 text-white/56">
              {t(locale, 'liveHelper')}
            </p>
          ) : null}

          {feedback ? (
            <p
              aria-live="polite"
              className={`rounded-[1rem] border px-4 py-3 text-[0.82rem] leading-6 ${
                feedback.kind === 'miss'
                  ? 'border-[#f0d2a0]/30 bg-[#5f4522]/26 text-[#f8e7c3]'
                  : 'border-[#ff8d8d]/26 bg-[#55161b]/44 text-[#ffd8d8]'
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
