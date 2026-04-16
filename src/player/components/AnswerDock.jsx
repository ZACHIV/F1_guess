import { useDeferredValue, useMemo } from 'react';
import { getAcceptedAnswers, isChallengeAnswerCorrect, normalizeAnswer } from '../answer-utils.js';

export default function AnswerDock({
  challenge,
  mode,
  answerValue,
  onAnswerChange,
  onAnswerSubmit,
  feedback
}) {
  const deferredAnswer = useDeferredValue(answerValue);
  const acceptedAnswers = useMemo(() => getAcceptedAnswers(challenge), [challenge]);
  const answerPreview = normalizeAnswer(deferredAnswer);

  if (mode === 'debug') {
    return (
      <section className="glass-panel mt-auto rounded-[28px] border border-white/12 p-4" data-testid="answer-dock">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="hud-label">debug mode</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Quick choice validation</h3>
          </div>
          <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-orange-200">
            Studio assist
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {(challenge.options?.length ? challenge.options : [challenge.trackName]).map((option) => {
            const isCorrect = isChallengeAnswerCorrect(challenge, option);

            return (
              <button
                className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4 text-left text-sm text-stone-100 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
                key={option}
                onClick={() => onAnswerSubmit(option, isCorrect)}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>

        <FeedbackLine feedback={feedback} />
      </section>
    );
  }

  return (
    <section className="glass-panel mt-auto rounded-[28px] border border-white/12 p-4" data-testid="answer-dock">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="hud-label">formal mode</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Name the circuit your way</h3>
        </div>
        <p className="max-w-[8rem] text-right text-[11px] uppercase tracking-[0.18em] text-stone-400">
          Country, circuit, alias all count
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/10 bg-black/25 p-2">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-stone-500"
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="Try Canada, Montreal, COTA..."
          value={answerValue}
        />
        <button
          className="rounded-full bg-[linear-gradient(135deg,#ff7c39,#ff9a4d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,124,57,0.32)] transition hover:-translate-y-0.5"
          onClick={() => onAnswerSubmit(answerValue, isChallengeAnswerCorrect(challenge, answerValue))}
          type="button"
        >
          Submit
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-400">
        <span>{answerPreview ? `Normalized: ${answerPreview}` : 'Awaiting answer'}</span>
        <span>{acceptedAnswers.length} accepted labels</span>
      </div>

      <FeedbackLine feedback={feedback} />
    </section>
  );
}

function FeedbackLine({ feedback }) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
        feedback.correct
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
          : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
      }`}
    >
      {feedback.message}
    </div>
  );
}
