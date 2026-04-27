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
          className="glass-panel rounded-[24px] border border-[rgba(244,233,226,0.12)] bg-[linear-gradient(180deg,rgba(26,17,17,0.84),rgba(15,11,11,0.72))] px-4 py-3"
          key={key}
        >
          <p className="hud-label">debrief {label}</p>
          <strong className="mt-2 block text-[1.45rem] font-semibold text-white">
            {hudState?.[key] ?? '-'}
          </strong>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-stone-400">{suffix}</p>
        </article>
      ))}
    </section>
  );
}
