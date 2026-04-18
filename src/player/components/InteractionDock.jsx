export default function InteractionDock({
  answerValue,
  canStart,
  canResume,
  isPlaying,
  onAnswerChange,
  onReplay,
  onAnswerSubmit,
  onStart,
  onSurrender,
  onTogglePlayback,
  runState,
  submitState,
  timer
}) {
  const isSubmitError = submitState === 'error';

  return (
    <section
      className="interaction-dock rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(12,16,22,0.84),rgba(8,11,16,0.72))] p-4 text-white shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[26px]"
      data-testid="interaction-dock"
    >
      {runState === 'idle' ? (
        <div className="grid gap-4">
          <button
            className="rounded-[1.1rem] bg-[linear-gradient(135deg,#fff1da,#ff9e58_44%,#ff6a3d_100%)] px-5 py-4 text-base font-semibold text-[#17110c] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            disabled={!canStart}
            onClick={onStart}
            type="button"
          >
            Start Duel
          </button>
          <div className="grid grid-cols-[minmax(0,1fr)_106px] items-end gap-3">
            <p className="rounded-[1rem] border border-white/8 bg-black/12 px-4 py-3 text-[0.78rem] leading-5 text-white/56">
              Press start, listen to the onboard, then submit the circuit name, city, country, or alias.
            </p>
            <div className="flex justify-end">
              {timer}
            </div>
          </div>
        </div>
      ) : null}

      {runState === 'live' ? (
        <div className="grid gap-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-black/16 p-2">
              <input
                aria-label="Circuit guess"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[1rem] text-white outline-none placeholder:text-white/22"
                onChange={(event) => onAnswerChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onAnswerSubmit();
                  }
                }}
                placeholder="e.g. COTA"
                value={answerValue}
              />
              <button
                className={`rounded-[1rem] px-5 py-3 text-sm font-semibold transition ${
                  isSubmitError
                    ? 'bg-[#d93d43] text-white shadow-[0_12px_30px_rgba(217,61,67,0.3)]'
                    : 'bg-[linear-gradient(135deg,#fff1da,#ff9e58_44%,#ff6a3d_100%)] text-[#17110c] shadow-[0_14px_30px_rgba(255,106,61,0.22)] hover:-translate-y-0.5'
                }`}
                onClick={onAnswerSubmit}
                type="button"
              >
                {isSubmitError ? 'Wrong' : 'Submit'}
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_108px] items-start gap-3">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-white/14 bg-white/7 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
                    onClick={onTogglePlayback}
                    type="button"
                  >
                    {isPlaying ? 'Pause' : canResume ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    className="shrink-0 rounded-full border border-white/14 bg-white/7 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
                    onClick={onReplay}
                    type="button"
                  >
                    Replay
                  </button>
                </div>

                <button
                  className="w-fit rounded-full border border-[#ff8d8d]/26 bg-[#55161b]/44 px-4 py-2.5 text-sm font-medium text-[#ffd8d8] transition hover:border-[#ff9d9d]/36 hover:bg-[#6a1b21]/58"
                  onClick={onSurrender}
                  type="button"
                >
                  Surrender
                </button>
              </div>

              <div className="flex justify-end pt-1">
                {timer}
              </div>
            </div>
          </div>

          <p className="rounded-[1rem] border border-white/8 bg-black/12 px-4 py-3 text-[0.78rem] leading-5 text-white/56">
            Listen for the shape of the lap, then submit the circuit name, city, country, or alias before giving up.
          </p>
        </div>
      ) : null}
    </section>
  );
}
