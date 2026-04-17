export default function TrackHUD({
  challenge,
  telemetryPath,
  marker,
  dimensions
}) {
  return (
    <section
      className="glass-panel relative overflow-hidden rounded-[30px] border border-white/12 p-4"
      data-testid="track-hud"
    >
      <div className="absolute left-4 top-4 h-24 w-24 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute right-4 top-6 h-20 w-20 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="hud-label">debrief trace</p>
            <h2 className="mt-2 text-[1.15rem] font-semibold leading-tight text-white">
              {challenge.trackName}
            </h2>
            <p className="mt-2 max-w-[18rem] text-sm leading-6 text-stone-300/85">
              Revealed only after the duel ends. Scrub the clip and read the corner geometry.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
              {challenge.trackCountry || 'Unknown venue'}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,8,12,0.9),rgba(11,16,24,0.66))] p-4">
          <img
            alt={`${challenge.trackName} reference`}
            className="absolute inset-0 h-full w-full object-contain p-4 opacity-[0.08] invert"
            src={challenge.trackSvgSrc}
          />
          <svg
            className="relative z-10 h-[240px] w-full"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          >
            <path
              className="fill-none stroke-white/10"
              d={telemetryPath}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="18"
            />
            <path
              className="fill-none stroke-white drop-shadow-[0_0_14px_rgba(255,255,255,0.42)]"
              d={telemetryPath}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="8"
            />
            <circle cx={marker.x} cy={marker.y} fill="rgba(255,124,39,0.25)" r="14" />
            <circle cx={marker.x} cy={marker.y} fill="#ff6d2f" r="5.5" stroke="#fff2e8" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
