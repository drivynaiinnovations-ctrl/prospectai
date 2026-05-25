import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import type { Settings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    senderName: '', senderPhone: '', workerUrl: '', defaultServiceType: 'HVAC',
  });
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const save = () => {
    storage.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    if (!settings.workerUrl) return;
    setTestStatus('testing');
    setLatency(null);
    const start = Date.now();
    try {
      const res = await fetch(settings.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'qualify', payload: { mapsData: 'ping' } }),
      });
      setLatency(Date.now() - start);
      setTestStatus(res.status < 500 ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
      setLatency(Date.now() - start);
    }
  };

  const field = (label: string, key: keyof Settings, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={settings[key]}
        onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
      />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Settings</h1>
        <p className="text-text2 text-sm mt-1">Configure your worker URL and sender info. These persist in localStorage.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Your Info</h2>
        {field('Your Name', 'senderName', 'text', 'e.g. Jordan')}
        {field('Your Phone', 'senderPhone', 'tel', 'e.g. (301) 555-0100')}
        {field('Default Service Type', 'defaultServiceType', 'text', 'e.g. HVAC, Plumbing, Roofing')}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Cloudflare Worker</h2>
        <div>
          <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Worker URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={settings.workerUrl}
              onChange={e => { setSettings(s => ({ ...s, workerUrl: e.target.value })); setTestStatus('idle'); }}
              placeholder="https://prospectai-worker.YOUR_SUBDOMAIN.workers.dev"
              className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            />
            {testStatus === 'ok' && <span className="text-green text-lg self-center">✓</span>}
            {testStatus === 'fail' && <span className="text-red-400 text-lg self-center">✗</span>}
          </div>
        </div>
        <button
          onClick={testConnection}
          disabled={!settings.workerUrl || testStatus === 'testing'}
          className="px-4 py-2 bg-surface2 border border-border text-text2 hover:text-text text-sm rounded-lg transition disabled:opacity-40"
        >
          {testStatus === 'testing' ? 'Testing…' : 'Test Connection'}
        </button>
        {latency !== null && (
          <p className={`text-xs ${testStatus === 'ok' ? 'text-green' : 'text-red-400'}`}>
            {testStatus === 'ok' ? `✓ Connected in ${latency}ms` : `✗ Failed after ${latency}ms`}
          </p>
        )}
        <div className="bg-surface2 rounded-lg p-3 text-xs text-text2 space-y-1">
          <p className="font-semibold text-text">Deploy the worker first:</p>
          <code className="block font-mono text-accent">cd worker</code>
          <code className="block font-mono text-accent">wrangler secret put ANTHROPIC_API_KEY</code>
          <code className="block font-mono text-accent">wrangler deploy</code>
          <p className="mt-2">Then paste the worker URL above.</p>
        </div>
      </div>

      <button
        onClick={save}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
          saved ? 'bg-green/20 text-green border border-green/40' : 'bg-accent text-white hover:opacity-90'
        }`}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
