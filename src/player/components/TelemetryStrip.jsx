const ITEMS = [
  ['Speed', 'speed', 'km/h'],
  ['Gear', 'n_gear', 'gear'],
  ['Throttle', 'throttle', '%'],
  ['RPM', 'rpm', 'rev']
];

export default function TelemetryStrip({ hudState }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {ITEMS.map(([label, key, suffix]) => (
        <article
          className="glass-panel rounded-[24px] border border-white/12 px-4 py-3"
          key={key}
        >
          <p className="hud-label">{label}</p>
          <strong className="mt-2 block text-[1.45rem] font-semibold text-white">
            {hudState?.[key] ?? '-'}
          </strong>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-stone-400">{suffix}</p>
        </article>
      ))}
    </section>
  );
}
