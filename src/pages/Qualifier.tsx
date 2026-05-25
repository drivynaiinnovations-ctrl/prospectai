import { useState, useEffect } from 'react';
import { callClaude } from '../lib/api';
import { parseProspects } from '../lib/parser';
import { storage } from '../lib/storage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Prospect } from '../types';

const SESSION_KEY = 'prospectai_prospects';

const SIGNALS = [
  { label: 'No website', pts: 25, color: 'pill-red' },
  { label: 'Weak/outdated website', pts: 18, color: 'pill-red' },
  { label: 'No online booking', pts: 15, color: 'pill-amber' },
  { label: 'No AI chat/voice', pts: 15, color: 'pill-amber' },
  { label: 'No automation', pts: 12, color: 'pill-amber' },
  { label: 'Low reviews (<20)', pts: 8, color: 'pill-gray' },
  { label: 'Low rating (<4.0)', pts: 5, color: 'pill-gray' },
  { label: 'No social media', pts: 5, color: 'pill-gray' },
];

interface QualifierProps {
  onSelectProspect: (p: Prospect) => void;
}

export function Qualifier({ onSelectProspect }: QualifierProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prospects, setProspects] = useState<Prospect[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setProspects(JSON.parse(saved));
  }, []);

  const score = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const settings = storage.getSettings();
      const result = await callClaude('qualify', { mapsData: input }, settings);
      const parsed = parseProspects(result);
      if (!parsed.length) throw new Error('No prospects parsed. Check the input format.');
      const sorted = parsed.sort((a, b) => b.score - a.score);
      setProspects(sorted);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sorted));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const tierCounts = {
    HOT: prospects.filter(p => p.tier === 'HOT').length,
    WARM: prospects.filter(p => p.tier === 'WARM').length,
    COLD: prospects.filter(p => p.tier === 'COLD').length,
  };

  const pillClass = (signal: string) => {
    const s = signal.toLowerCase();
    if (s.includes('website') || s.includes('no website')) return 'pill-red';
    if (s.includes('booking') || s.includes('ai') || s.includes('automation')) return 'pill-amber';
    return 'pill-gray';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Prospect Qualifier</h1>
        <p className="text-text2 text-sm mt-1">Paste Google Maps results below. Claude scores each business as HOT / WARM / COLD.</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {SIGNALS.map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-lg p-2 text-center">
            <div className={`text-xs font-bold mb-0.5 ${s.pts >= 20 ? 'text-red-400' : s.pts >= 10 ? 'text-amber' : 'text-text3'}`}>+{s.pts}</div>
            <div className="text-[10px] text-text2 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste raw Google Maps business listings here — names, addresses, reviews, websites, etc."
          rows={8}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text3 focus:outline-none focus:border-accent resize-none font-mono"
        />
        <button
          onClick={score}
          disabled={loading || !input.trim()}
          className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-40"
        >
          {loading ? 'Scoring…' : 'Score Prospects →'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
      {loading && <LoadingSpinner label="Claude is scoring prospects…" />}

      {!loading && prospects.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="score-hot font-bold">{tierCounts.HOT} HOT</span>
            <span className="score-warm font-bold">{tierCounts.WARM} WARM</span>
            <span className="score-cold font-bold">{tierCounts.COLD} COLD</span>
            <span className="text-text2">{prospects.length} total</span>
          </div>

          <div className="space-y-3">
            {prospects.map(p => (
              <div key={p.name} className={`bg-surface border border-border rounded-xl p-4 tier-${p.tier.toLowerCase()}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-text3 text-xs">#{p.rank}</span>
                      <h3 className="font-semibold text-text">{p.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded score-${p.tier.toLowerCase()}`}>
                        {p.tier} · {p.score}pts
                      </span>
                      <span className="text-xs text-text2">{p.type}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-text2 flex-wrap">
                      {p.phone && <span>📞 {p.phone}</span>}
                      {p.website && p.website !== 'none' && <span>🌐 {p.website}</span>}
                    </div>
                    <p className="text-xs text-text2 mt-2 leading-relaxed">{p.reason}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.signals.map(s => (
                        <span key={s} className={`pill text-xs px-2 py-0.5 rounded-full ${pillClass(s)}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectProspect(p)}
                    className="shrink-0 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
                  >
                    Build Site →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
