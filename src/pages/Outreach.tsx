import { useState, useEffect } from 'react';
import { callClaude } from '../lib/api';
import { parseOutreach } from '../lib/parser';
import { storage } from '../lib/storage';
import { CopyButton } from '../components/CopyButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import type { PipelineEntry } from '../types';

export function Outreach() {
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ call: string; email: string; text: string } | null>(null);
  const [tab, setTab] = useState<'call' | 'email' | 'text'>('call');
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    setPipeline(storage.getPipeline());
    setSettings(storage.getSettings());
  }, []);

  const selected = pipeline.find(e => e.id === selectedId);

  const generate = async () => {
    if (!selected) { setError('Select a prospect from the pipeline'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const s = storage.getSettings();
      const raw = await callClaude('outreach', {
        name: selected.prospect.name,
        type: selected.prospect.type,
        signals: selected.prospect.signals.join(', '),
        previewUrl,
        senderName: s.senderName,
        senderPhone: s.senderPhone,
        context,
      }, s);
      setResult(parseOutreach(raw));
      if (previewUrl) {
        storage.updateEntry(selectedId, { previewUrl });
        setPipeline(storage.getPipeline());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const emailLines = result?.email.split('\n') || [];
  const subjectLine = emailLines.find(l => l.toLowerCase().startsWith('subject:'))?.replace(/^subject:\s*/i, '') || '';
  const emailBody = emailLines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();

  const textCount = result?.text.length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Outreach Generator</h1>
        <p className="text-text2 text-sm mt-1">Generate a call script, email, and text for any pipeline prospect.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Select Prospect from Pipeline</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
          >
            <option value="">— Choose a prospect —</option>
            {pipeline.map(e => (
              <option key={e.id} value={e.id}>
                {e.prospect.name} ({e.prospect.tier} · {e.prospect.score}pts)
              </option>
            ))}
          </select>
          {pipeline.length === 0 && <p className="text-text3 text-xs mt-1">No pipeline entries yet. Generate a prompt in Builder and save it.</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Preview Site URL</label>
          <input
            type="url"
            value={previewUrl}
            onChange={e => setPreviewUrl(e.target.value)}
            placeholder="https://their-preview.pages.dev"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text3 focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Additional Context (optional)</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Anything specific to mention — recent event, seasonal offer, competitor they just lost to…"
            rows={3}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text3 focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {settings.senderName && (
          <p className="text-xs text-text2">Sending as: <span className="text-text">{settings.senderName}</span> · {settings.senderPhone}</p>
        )}

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        <button
          onClick={generate}
          disabled={loading || !selectedId}
          className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-40"
        >
          {loading ? 'Generating…' : 'Generate Outreach →'}
        </button>
      </div>

      {loading && <LoadingSpinner label="Claude is writing your outreach…" />}

      {result && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex border-b border-border">
            {(['call', 'email', 'text'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition capitalize ${
                  tab === t ? 'bg-accent/10 text-accent border-b-2 border-accent' : 'text-text2 hover:text-text'
                }`}
              >
                {t === 'call' ? '📞 Call Script' : t === 'email' ? '✉️ Email' : `💬 Text (${textCount}/160)`}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'call' && (
              <div className="space-y-3">
                <div className="flex justify-end"><CopyButton text={result.call} /></div>
                <pre className="text-sm text-text font-mono whitespace-pre-wrap leading-relaxed">{result.call}</pre>
              </div>
            )}

            {tab === 'email' && (
              <div className="space-y-4">
                {subjectLine && (
                  <div className="flex items-center gap-3 p-3 bg-surface2 rounded-lg">
                    <span className="text-xs text-text2 uppercase tracking-wider shrink-0">Subject:</span>
                    <span className="text-sm text-text font-medium flex-1">{subjectLine}</span>
                    <CopyButton text={subjectLine} label="Copy Subject" />
                  </div>
                )}
                <div className="flex justify-end"><CopyButton text={emailBody} label="Copy Body" /></div>
                <pre className="text-sm text-text font-mono whitespace-pre-wrap leading-relaxed">{emailBody}</pre>
              </div>
            )}

            {tab === 'text' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${textCount > 160 ? 'text-red-400' : 'text-text2'}`}>
                    {textCount}/160 characters {textCount > 160 && '⚠️ Too long'}
                  </span>
                  <CopyButton text={result.text} />
                </div>
                <div className="bg-surface2 rounded-xl p-4 text-sm text-text">{result.text}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
