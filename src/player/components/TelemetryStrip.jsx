const ITEMS = [
  { label: 'Speed', key: 'speed', unit: 'km/h', icon: '⚡' },
  { label: 'Gear', key: 'n_gear', unit: 'gear', icon: '⚙' },
  { label: 'Throttle', key: 'throttle', unit: '%', icon: '◉' },
  { label: 'RPM', key: 'rpm', unit: 'rev', icon: '↻' }
];

export default function TelemetryStrip({ hudState }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {ITEMS.map(({ label, key, unit, icon }) => (
        <div className="telemetry-card" key={key}>
          <span className="telemetry-card__label">{icon} {label}</span>
          <strong className="telemetry-card__value">{hudState?.[key] ?? '-'}</strong>
          <span className="telemetry-card__unit">{unit}</span>
        </div>
      ))}
    </section>
  );
}
