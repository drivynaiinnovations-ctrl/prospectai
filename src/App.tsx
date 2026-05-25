import { useState } from 'react';
import { Nav } from './components/Nav';
import { SettingsPage } from './pages/Settings';
import { Qualifier } from './pages/Qualifier';
import { Builder } from './pages/Builder';
import { Outreach } from './pages/Outreach';
import { Pipeline } from './pages/Pipeline';
import type { Prospect } from './types';

const PAGE_MAP: Record<string, number> = {
  settings: 0, qualifier: 1, builder: 2, outreach: 3, pipeline: 4,
};
const PAGE_IDS = ['settings', 'qualifier', 'builder', 'outreach', 'pipeline'];

export default function App() {
  const [pageIdx, setPageIdx] = useState(1);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const handleSelectProspect = (p: Prospect) => {
    setSelectedProspect(p);
    setPageIdx(2);
  };

  const handleNav = (id: string) => {
    setPageIdx(PAGE_MAP[id] ?? 1);
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <Nav current={PAGE_IDS[pageIdx]} onNav={handleNav} />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12">
        {pageIdx === 0 && <SettingsPage />}
        {pageIdx === 1 && <Qualifier onSelectProspect={handleSelectProspect} />}
        {pageIdx === 2 && <Builder selectedProspect={selectedProspect} />}
        {pageIdx === 3 && <Outreach />}
        {pageIdx === 4 && <Pipeline />}
      </main>
    </div>
  );
}
