import {
  getCountryNameByLocale,
  getTrackNameByLocale
} from '../track-locales.js';
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
  const unknownVenue = t(locale, 'unknownVenue');

  return (
    <section
      className="glass-panel relative flex min-h-[560px] flex-col overflow-hidden rounded-[30px] border border-[rgba(244,233,226,0.12)] bg-[linear-gradient(180deg,rgba(26,17,17,0.84),rgba(15,11,11,0.78))] p-4 lg:min-h-[620px]"
      data-testid="track-hud"
    >
      <div className="absolute left-4 top-4 h-24 w-24 rounded-full bg-[#f0c4af]/14 blur-3xl" />
      <div className="absolute right-4 top-6 h-20 w-20 rounded-full bg-[#e1bfb3]/10 blur-3xl" />
      <div className="hud-grid absolute inset-0 opacity-60" />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="hud-label">{headerLabel}</p>
            <h2 className="mt-2 text-[1.15rem] font-semibold leading-tight text-white">
              {trackName}
            </h2>
            <p className="mt-2 max-w-[18rem] text-sm leading-6 text-stone-300/85">
              {description}
            </p>
          </div>
          <div className="rounded-full border border-[rgba(244,233,226,0.1)] bg-white/5 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
              {countryName || unknownVenue}
            </p>
          </div>
        </div>

        <div
          className="track-hud__viewport relative flex-1 overflow-hidden rounded-[26px] border border-[rgba(244,233,226,0.1)] bg-[linear-gradient(180deg,rgba(12,9,9,0.92),rgba(20,14,14,0.78))] p-4"
          data-testid="track-hud-viewport"
        >
          <div className="hud-grid absolute inset-0 opacity-50" />
          <svg
            className="relative z-10 h-full min-h-[320px] w-full lg:min-h-[420px]"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              className="fill-none stroke-white/10"
              d={telemetryPath}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="18"
            />
            <path
              className="fill-none stroke-[rgba(246,238,232,0.95)] drop-shadow-[0_0_14px_rgba(255,245,239,0.22)]"
              d={telemetryPath}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="8"
            />
            <circle cx={marker.x} cy={marker.y} fill="rgba(240,196,175,0.18)" r="14" />
            <circle cx={marker.x} cy={marker.y} fill="#f0c4af" r="5.5" stroke="#fff2e8" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
