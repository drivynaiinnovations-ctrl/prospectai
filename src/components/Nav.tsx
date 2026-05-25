const PAGES = [
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'qualifier', label: 'Qualifier', icon: '🔍' },
  { id: 'builder', label: 'Builder', icon: '🏗️' },
  { id: 'outreach', label: 'Outreach', icon: '📨' },
  { id: 'pipeline', label: 'Pipeline', icon: '📊' },
];

interface NavProps {
  current: string;
  onNav: (page: string) => void;
}

export function Nav({ current, onNav }: NavProps) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface border-b border-border h-14 flex items-center px-4 gap-1">
      <span className="font-display font-bold text-accent text-lg mr-4">ProspectAI</span>
      <div className="flex gap-1">
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => onNav(p.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              current === p.id
                ? 'bg-accent text-white'
                : 'text-text2 hover:text-text hover:bg-surface2'
            }`}
          >
            <span className="mr-1">{p.icon}</span>
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
