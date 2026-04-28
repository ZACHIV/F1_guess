import { getLocaleLabel, normalizeLocale, SUPPORTED_LOCALES } from '../track-locales.js';

export default function LocalePicker({ locale, onChange }) {
  const normalizedLocale = normalizeLocale(locale);

  return (
    <label style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 'var(--radius-control)',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--color-text-muted)',
      cursor: 'pointer',
      transition: 'border-color 140ms var(--ease-standard)'
    }}>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Language
      </span>
      <select
        aria-label="Language"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '0 16px 0 0',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none'
        }}
        onChange={(event) => onChange?.(normalizeLocale(event.target.value))}
        value={normalizedLocale}
      >
        {SUPPORTED_LOCALES.map((value) => (
          <option
            key={value}
            value={value}
            style={{ background: 'var(--color-surface-deep)', color: '#fff' }}
          >
            {getLocaleLabel(value)}
          </option>
        ))}
      </select>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flex: 'none' }}>
        <path d="M2 3l3 4 3-4" />
      </svg>
    </label>
  );
}
