import { useState } from 'react';
import { Nav } from './components/Nav';
import { SettingsPage } from './pages/Settings';
import { Qualifier } from './pages/Qualifier';
import { Builder } from './pages/Builder';
import { Outreach } from './pages/Outreach';
import { Pipeline } from './pages/Pipeline';
import type { Prospect } from './types';

const PAGE_MAP: Record<string, number> = {
  qualifier: 0, builder: 1, outreach: 2, pipeline: 3, settings: 4,
};
const PAGE_IDS = ['qualifier', 'builder', 'outreach', 'pipeline', 'settings'];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  qualifier: { title: 'Prospect Qualifier', subtitle: 'Score and rank local businesses by opportunity.' },
  builder:   { title: 'Site Builder', subtitle: 'Generate a production-ready Lovable prompt.' },
  outreach:  { title: 'Outreach Generator', subtitle: 'Create a call script, email, and text for any prospect.' },
  pipeline:  { title: 'Pipeline', subtitle: 'Track every prospect from first touch to closed.' },
  settings:  { title: 'Settings', subtitle: 'Configure your worker URL and sender info.' },
};

export default function App() {
  const [pageIdx, setPageIdx] = useState(0);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const handleSelectProspect = (p: Prospect) => {
    setSelectedProspect(p);
    setPageIdx(1);
  };

  const handleNav = (id: string) => {
    setPageIdx(PAGE_MAP[id] ?? 0);
  };

  const currentId = PAGE_IDS[pageIdx];
  const { title, subtitle } = PAGE_TITLES[currentId];

  return (
    <div className="min-h-screen bg-bg flex">
      <Nav current={currentId} onNav={handleNav} />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 ml-56 min-h-screen flex flex-col">

        {/* Top bar */}
        <header className="bg-surface border-b border-border px-[15%] py-4 sticky top-0 z-40 shadow-sm">
          <h1 className="text-xl font-bold text-text">{title}</h1>
          <p className="text-sm text-text2 mt-0.5">{subtitle}</p>
        </header>

        {/* Page content */}
        <main className="flex-1 px-[15%] py-8">
          {pageIdx === 0 && <Qualifier onSelectProspect={handleSelectProspect} />}
          {pageIdx === 1 && <Builder selectedProspect={selectedProspect} />}
          {pageIdx === 2 && <Outreach />}
          {pageIdx === 3 && <Pipeline />}
          {pageIdx === 4 && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
