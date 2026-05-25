const PAGES = [
  { id: 'qualifier', label: 'Qualifier', icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
      <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd"/>
    </svg>
  )},
  { id: 'builder', label: 'Builder', icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
    </svg>
  )},
  { id: 'outreach', label: 'Outreach', icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
    </svg>
  )},
  { id: 'pipeline', label: 'Pipeline', icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  )},
  { id: 'settings', label: 'Settings', icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  )},
];

interface NavProps {
  current: string;
  onNav: (page: string) => void;
}

export function Nav({ current, onNav }: NavProps) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen w-56 flex flex-col z-50"
      style={{ background: '#33475B', boxShadow: '2px 0 8px rgba(0,0,0,0.15)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: '#FF7A59' }}>
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: '#FFFFFF' }}>ProspectAI</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => onNav(p.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all text-left"
            style={
              current === p.id
                ? { background: '#FF7A59', color: '#FFFFFF' }
                : { color: '#CBD5E1', background: 'transparent' }
            }
            onMouseEnter={e => {
              if (current !== p.id) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={e => {
              if (current !== p.id) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#CBD5E1';
              }
            }}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>v1.0 · ProspectAI</p>
      </div>
    </aside>
  );
}
