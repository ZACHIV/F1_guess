import LocalePicker from './LocalePicker.jsx';

const NAV_ITEMS = [
  { id: 'play', label: 'Play', href: '/guess.html' },
  { id: 'practice', label: 'Practice', href: '/guess.html' },
  { id: 'challenges', label: 'Challenges', href: '/' },
  { id: 'stats', label: 'Stats', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' }
];

export default function DashboardHeader({ activeNav = 'play', locale, onLocaleChange, galleryHref = '/' }) {
  return (
    <header className="top-nav">
      <a href={galleryHref} className="top-nav__brand" style={{ textDecoration: 'none' }}>
        F1.GUESS
      </a>

      <nav className="top-nav__links">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`nav-link${item.id === activeNav ? ' active' : ''}`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a
          href={galleryHref}
          className="button-ghost"
        >
          Gallery
        </a>
        <LocalePicker locale={locale} onChange={onLocaleChange} />
      </div>
    </header>
  );
}
