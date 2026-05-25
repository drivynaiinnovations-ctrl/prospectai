import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import type { PipelineEntry } from '../types';

const STATUSES = [
  { value: 'not_contacted', label: 'Not Contacted', cls: '' },
  { value: 'contacted', label: 'Contacted', cls: 'status-interested' },
  { value: 'interested', label: 'Interested', cls: 'status-interested' },
  { value: 'call_booked', label: 'Call Booked', cls: 'status-interested' },
  { value: 'won', label: 'Won ✓', cls: 'status-won' },
  { value: 'lost', label: 'Lost', cls: 'status-lost' },
] as const;

type Status = typeof STATUSES[number]['value'];

export function Pipeline() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { setEntries(storage.getPipeline()); }, []);

  const update = (id: string, updates: Partial<PipelineEntry>) => {
    storage.updateEntry(id, updates);
    setEntries(storage.getPipeline());
  };

  const del = (id: string) => {
    storage.deleteEntry(id);
    setEntries(storage.getPipeline());
    setDeleteConfirm(null);
  };

  const exportCsv = () => {
    const headers = ['Company', 'Type', 'Score', 'Tier', 'Phone', 'Preview URL', 'Status', 'Date Contacted', 'Follow-up', 'Notes'];
    const rows = entries.map(e => [
      e.prospect.name, e.prospect.type, e.prospect.score, e.prospect.tier,
      e.prospect.phone, e.previewUrl, e.status, e.dateContacted, e.followUpDate, e.notes,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prospectai-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const stats = {
    total: entries.length,
    contacted: entries.filter(e => e.status !== 'not_contacted').length,
    interested: entries.filter(e => ['interested', 'call_booked'].includes(e.status)).length,
    won: entries.filter(e => e.status === 'won').length,
    rate: entries.length ? Math.round((entries.filter(e => e.status === 'won').length / entries.length) * 100) : 0,
  };

  const rowCls = (status: Status) => {
    if (status === 'won') return 'status-won';
    if (status === 'lost') return 'status-lost';
    if (['interested', 'call_booked'].includes(status)) return 'status-interested';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Pipeline</h1>
          <p className="text-text2 text-sm mt-1">Track every prospect from first touch to closed.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!entries.length}
          className="px-4 py-2 bg-surface border border-border text-text2 hover:text-text text-sm rounded-lg transition disabled:opacity-40"
        >
          Export CSV ↓
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, cls: 'text-text' },
          { label: 'Contacted', value: stats.contacted, cls: 'text-blue' },
          { label: 'Interested', value: stats.interested, cls: 'text-amber' },
          { label: 'Won', value: stats.won, cls: 'text-green' },
          { label: 'Conv. Rate', value: `${stats.rate}%`, cls: stats.rate > 0 ? 'text-green' : 'text-text2' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-display font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-text2 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16 text-text2">
          <p className="text-lg">No prospects in pipeline yet.</p>
          <p className="text-sm mt-1">Generate a prompt in Builder and click "Save to Pipeline".</p>
        </div>
      )}

      {/* Table */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className={`bg-surface border border-border rounded-xl overflow-hidden ${rowCls(entry.status)}`}>
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface2 transition"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text">{entry.prospect.name}</span>
                    <span className="text-xs text-text2">{entry.prospect.type}</span>
                    <span className={`text-xs font-bold score-${entry.prospect.tier.toLowerCase()}`}>
                      {entry.prospect.tier} · {entry.prospect.score}pts
                    </span>
                    {entry.prospect.phone && <span className="text-xs text-text2">📞 {entry.prospect.phone}</span>}
                  </div>
                  {entry.previewUrl && (
                    <a href={entry.previewUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="text-xs text-accent hover:underline truncate block mt-0.5">{entry.previewUrl}</a>
                  )}
                </div>
                <select
                  value={entry.status}
                  onChange={e => { e.stopPropagation(); update(entry.id, { status: e.target.value as Status }); }}
                  onClick={e => e.stopPropagation()}
                  className="bg-surface2 border border-border rounded-lg px-2 py-1 text-xs text-text focus:outline-none focus:border-accent"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span className="text-text3 text-xs">{expandedId === entry.id ? '▲' : '▼'}</span>
              </div>

              {expandedId === entry.id && (
                <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-text2 mb-1">Preview URL</label>
                      <input
                        type="url"
                        value={entry.previewUrl}
                        onChange={e => update(entry.id, { previewUrl: e.target.value })}
                        className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                        placeholder="https://preview.pages.dev"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text2 mb-1">Date Contacted</label>
                      <input
                        type="date"
                        value={entry.dateContacted}
                        onChange={e => update(entry.id, { dateContacted: e.target.value })}
                        className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text2 mb-1">Follow-up Date</label>
                      <input
                        type="date"
                        value={entry.followUpDate}
                        onChange={e => update(entry.id, { followUpDate: e.target.value })}
                        className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text2 mb-1">Notes</label>
                    <textarea
                      value={entry.notes}
                      onChange={e => update(entry.id, { notes: e.target.value })}
                      rows={2}
                      className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-xs text-text focus:outline-none focus:border-accent resize-none"
                      placeholder="Any notes about this prospect…"
                    />
                  </div>
                  {entry.generatedPrompt && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-text2 hover:text-text">View Generated Prompt</summary>
                      <pre className="mt-2 bg-surface2 rounded p-3 text-text font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">{entry.generatedPrompt}</pre>
                    </details>
                  )}
                  <div className="flex justify-end">
                    {deleteConfirm === entry.id ? (
                      <div className="flex gap-2">
                        <span className="text-xs text-text2 self-center">Sure?</span>
                        <button onClick={() => del(entry.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-surface2 text-text2 text-xs rounded-lg border border-border">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(entry.id)} className="px-3 py-1 text-red-400 text-xs hover:text-red-300 transition">Delete →</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
