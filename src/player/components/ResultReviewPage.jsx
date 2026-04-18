import { formatScoreTime } from '../game-config.js';
import {
  getLanguageBadge,
  t
} from '../i18n.js';
import {
  getCountryNameByLocale,
  getTrackNameByLocale
} from '../track-locales.js';
import TrackHUD from './TrackHUD.jsx';

export default function ResultReviewPage({
  canReplay,
  challenge,
  dimensions,
  marker,
  onNextChallenge,
  onReplayAudio,
  onRetry,
  onToggleLocale,
  locale,
  result,
  telemetryPath
}) {
  const headline = result.localized?.headline ?? result.headline;
  const copy = result.localized?.copy ?? result.copy;
  const deltaLabel = result.localized?.deltaLabel ?? result.deltaLabel;
  const trackName = getTrackNameByLocale(challenge.trackName, locale);
  const countryName = getCountryNameByLocale(challenge.trackCountry, locale);
  const benchmarkSourceLabel = challenge.benchmarkSource === 'recorded'
    ? t(locale, 'benchmarkSourceRecorded')
    : t(locale, 'benchmarkSourceEstimated');

  return (
    <main
      className="result-review min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_18%),linear-gradient(180deg,#080b10_0%,#05070b_100%)] text-white"
      data-testid="result-review-page"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex justify-end">
          <button
            className="rounded-full border border-white/20 bg-black/24 px-4 py-2 text-xs font-medium text-white/88 backdrop-blur-xl transition hover:bg-black/36"
            onClick={onToggleLocale}
            type="button"
          >
            {getLanguageBadge(locale)}
          </button>
        </div>
        <header className="result-review__hero rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-6 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">{t(locale, 'resultEyebrow')}</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-[2.4rem] font-semibold leading-[0.92] tracking-[-0.08em] text-white sm:text-[3.2rem]">
                {headline}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
                {copy}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0c1016] transition hover:bg-white/92"
                onClick={onNextChallenge}
                type="button"
              >
                {t(locale, 'nextDuel')}
              </button>
              <button
                className="rounded-full border border-white/16 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                onClick={onRetry}
                type="button"
              >
                {t(locale, 'retry')}
              </button>
              <button
                className="rounded-full border border-white/16 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canReplay}
                onClick={onReplayAudio}
                type="button"
              >
                {t(locale, 'replayAudio')}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <TrackHUD
            challenge={challenge}
            dimensions={dimensions}
            locale={locale}
            marker={marker}
            telemetryPath={telemetryPath}
          />

          <aside className="grid gap-4">
            <section className="result-review__panel rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/48">{t(locale, 'debrief')}</p>
              <div className="mt-4 grid gap-3">
                <StatCard label={t(locale, 'player')} value={formatScoreTime(result.playerTimeMs)} />
                <StatCard
                  label={t(locale, 'max')}
                  value={formatScoreTime(result.benchmarkMs)}
                  hint={benchmarkSourceLabel}
                />
                <StatCard label={t(locale, 'gap')} value={deltaLabel} />
              </div>
            </section>

            <section className="result-review__panel rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/48">{t(locale, 'trackReveal')}</p>
              <div className="mt-4 grid gap-3">
                <RevealRow label={t(locale, 'circuit')} value={trackName} />
                <RevealRow label={t(locale, 'country')} value={countryName} />
                <RevealRow label={t(locale, 'driver')} value={`${challenge.driverName} #${challenge.driverNumber || '00'}`} />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function StatCard({ hint, label, value }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-black/18 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.06em] text-white">{value}</p>
      {hint ? (
        <p className="mt-2 text-[0.72rem] font-medium tracking-[0.04em] text-white/34">{hint}</p>
      ) : null}
    </div>
  );
}

function RevealRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-white/8 bg-black/12 px-4 py-3">
      <span className="text-[11px] uppercase tracking-[0.2em] text-white/42">{label}</span>
      <strong className="text-sm font-medium text-white/88">{value}</strong>
    </div>
  );
}
