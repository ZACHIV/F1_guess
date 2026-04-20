import {
  getLocaleLabel,
  normalizeLocale,
  SUPPORTED_LOCALES
} from '../track-locales.js';

export default function LocalePicker({ locale, onChange }) {
  const normalizedLocale = normalizeLocale(locale);

  return (
    <label className="inline-flex items-center rounded-full border border-white/20 bg-black/24 px-3 py-2 text-xs font-medium text-white/88 backdrop-blur-xl transition hover:bg-black/36">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        className="bg-transparent pr-5 text-xs font-medium text-white outline-none"
        onChange={(event) => onChange?.(normalizeLocale(event.target.value))}
        value={normalizedLocale}
      >
        {SUPPORTED_LOCALES.map((value) => (
          <option className="bg-[#05070b] text-white" key={value} value={value}>
            {getLocaleLabel(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
