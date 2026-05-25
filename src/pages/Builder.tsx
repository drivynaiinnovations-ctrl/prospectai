import { useState, useEffect } from 'react';
import { callClaude } from '../lib/api';
import { parseSumUp } from '../lib/parser';
import { storage } from '../lib/storage';
import { CopyButton } from '../components/CopyButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { DEFAULT_LAYERS, MANDATORY_FEATURES } from '../types';
import type { Prospect, BuilderState, LayerConfig } from '../types';

const SESSION_KEY = 'prospectai_prospects';

const TONES = ['Professional & Trustworthy', 'Friendly & Local', 'Bold & Direct', 'Premium & Exclusive', 'Urgent & Action-Oriented'];

interface BuilderProps {
  selectedProspect: Prospect | null;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', rows = 0 }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; rows?: number;
}) {
  const cls = "w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text3 focus:outline-none focus:border-accent";
  return (
    <div>
      <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">{label}</label>
      {rows > 0
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cls + ' resize-none'} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function LayerToggle({ label, featureKey, layers, toggle, locked }: {
  label: string; featureKey: keyof LayerConfig;
  layers: LayerConfig; toggle: (k: keyof LayerConfig) => void; locked: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm cursor-pointer ${locked ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={layers[featureKey]}
        onChange={() => !locked && toggle(featureKey)}
        disabled={locked}
        className="accent-accent"
      />
      <span className="text-text">{label}</span>
      {locked && <span className="text-text3 text-xs">🔒</span>}
    </label>
  );
}

export function Builder({ selectedProspect }: BuilderProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(selectedProspect);
  const [rawText, setRawText] = useState('');
  const [sumLoading, setSumLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [saved, setSaved] = useState(false);
  const [layers, setLayers] = useState<LayerConfig>(DEFAULT_LAYERS);
  const [openLayer, setOpenLayer] = useState<number | null>(0);

  const [state, setState] = useState<BuilderState>({
    owner: '', phone: '', location: '', stars: '', years: '', services: '',
    tone: TONES[0], primaryColor: '#00BCD4', accentColor: '#FF6B35',
    font: '', aesthetic: '', reviews: '', story: '', offer: 'free estimate',
    callTracking: '', headlineA: '', headlineB: '',
  });

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setProspects(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (selectedProspect) {
      setActiveProspect(selectedProspect);
      setState(s => ({
        ...s,
        phone: selectedProspect.phone,
        callTracking: selectedProspect.phone,
      }));
    }
  }, [selectedProspect]);

  const set = (key: keyof BuilderState) => (v: string) => setState(s => ({ ...s, [key]: v }));

  const toggleLayer = (k: keyof LayerConfig) => {
    if (MANDATORY_FEATURES.includes(k)) return;
    setLayers(l => ({ ...l, [k]: !l[k] }));
  };

  const sumUp = async () => {
    if (!rawText.trim()) return;
    setSumLoading(true);
    setError('');
    try {
      const settings = storage.getSettings();
      const result = await callClaude('sumup', { rawText }, settings);
      const parsed = parseSumUp(result);
      setState(s => ({
        ...s,
        phone: parsed.PHONE || s.phone,
        location: parsed.LOCATION || s.location,
        stars: parsed.STAR_RATING ? `${parsed.STAR_RATING} stars, ${parsed.REVIEW_COUNT} reviews` : s.stars,
        years: parsed.YEARS_IN_BUSINESS || s.years,
        services: parsed.SERVICES || s.services,
        reviews: [parsed.TOP_REVIEW_1, parsed.TOP_REVIEW_2, parsed.TOP_REVIEW_3].filter(Boolean).join('\n\n'),
        offer: parsed.OFFER || s.offer,
      }));
      if (parsed.BUSINESS_NAME && activeProspect) {
        setActiveProspect(p => p ? { ...p, name: parsed.BUSINESS_NAME || p.name } : p);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sum up failed');
    } finally {
      setSumLoading(false);
    }
  };

  const generate = async () => {
    if (!activeProspect) { setError('Select a prospect first'); return; }
    setGenLoading(true);
    setError('');
    setOutput('');
    try {
      const settings = storage.getSettings();
      const activeLayerNames = (Object.keys(layers) as (keyof LayerConfig)[])
        .filter(k => layers[k]).join(', ');
      const result = await callClaude('buildPrompt', {
        name: activeProspect.name,
        type: activeProspect.type,
        signals: activeProspect.signals.join(', '),
        ...state,
        activeLayers: activeLayerNames,
        activeFeatures: activeLayerNames,
      }, settings);
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenLoading(false);
    }
  };

  const saveToPipeline = () => {
    if (!activeProspect || !output) return;
    storage.addEntry({
      id: `${activeProspect.name}-${Date.now()}`,
      prospect: activeProspect,
      previewUrl: '',
      status: 'not_contacted',
      method: '',
      dateContacted: '',
      followUpDate: '',
      notes: '',
      generatedPrompt: output,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const LAYER_DEFS = [
    {
      title: 'Layer 1 — Business Foundation',
      features: [
        ['businessId', 'Business Identity'], ['location', 'Location'], ['bizType', 'Business Type'],
        ['goal', 'Primary Goal'], ['visitorStates', 'Visitor States (Emergency vs Planning)'],
        ['objectionMap', 'Objection Map'], ['competitorRef', 'Competitor Reference'],
      ],
    },
    {
      title: 'Layer 2 — Brand & Visual DNA',
      features: [
        ['hexCodes', 'Hex Color Codes'], ['fontRefs', 'Font References'],
        ['aestheticRef', 'Aesthetic Reference Brands'], ['photoDir', 'Photography Direction'],
        ['animSpec', 'Animation Spec'], ['toneVoice', 'Tone & Voice'],
      ],
    },
    {
      title: 'Layer 3 — Conversion Architecture',
      features: [
        ['heroSection', 'Hero Section'], ['trustStrip', 'Trust Strip'],
        ['problemSolution', 'Problem/Solution Block'], ['services', 'Services Grid'],
        ['socialProof', 'Social Proof / Reviews'], ['whyUs', 'Why Us'],
        ['teamBlock', 'Team/About'], ['leadCapture', 'Lead Capture'],
        ['finalCta', 'Final CTA'], ['footer', 'Footer'],
        ['originStory', 'Origin Story'], ['copyRules', 'Copy Rules'],
      ],
    },
    {
      title: 'Layer 4 — Technical Spec',
      features: [
        ['techStack', 'Tech Stack'], ['vapiVoice', 'Vapi Voice Agent'],
        ['aiChat', 'AI Chat Triage'], ['emergencyEscalation', 'Emergency Escalation'],
        ['demoModal', 'Demo Modal'], ['animations', 'Animations'],
        ['scrollReveal', 'Scroll Reveal'], ['mobileFirst', 'Mobile-First'],
        ['stickyPhone', 'Sticky Phone'], ['cssVars', 'CSS Custom Properties'],
        ['seoMeta', 'SEO Meta'], ['deployNotes', 'Deploy Notes'],
      ],
    },
    {
      title: 'Layer 5 — Success Metrics',
      features: [
        ['callTracking', 'Call Tracking'], ['formTracking', 'Form Tracking'],
        ['convTarget', 'Conversion Target'], ['abTest', 'A/B Test'],
        ['ctaEvents', 'CTA Analytics Events'], ['qualityBar', 'Quality Bar 9.5/10'],
      ],
    },
  ] as const;

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Left: Prospect selector */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-text2 uppercase tracking-wider mb-2">Select Prospect</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {prospects.filter(p => p.tier !== 'COLD').slice(0, 10).map(p => (
              <button
                key={p.name}
                onClick={() => { setActiveProspect(p); setState(s => ({ ...s, phone: p.phone, callTracking: p.phone })); }}
                className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                  activeProspect?.name === p.name
                    ? 'border-accent bg-accent/10 text-text'
                    : 'border-border bg-surface hover:border-border2 text-text2'
                }`}
              >
                <div className="font-medium text-text">{p.name}</div>
                <div className={`text-xs font-bold score-${p.tier.toLowerCase()}`}>{p.tier} · {p.score}pts</div>
              </button>
            ))}
            {prospects.length === 0 && (
              <p className="text-text3 text-xs">No prospects yet. Run the Qualifier first.</p>
            )}
          </div>
        </div>

        {/* Layer toggles */}
        <div className="space-y-2">
          {LAYER_DEFS.map((layer, li) => (
            <div key={layer.title} className="bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenLayer(openLayer === li ? null : li)}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-text hover:bg-surface2 transition flex justify-between"
              >
                <span>{layer.title}</span>
                <span className="text-text3">{openLayer === li ? '▲' : '▼'}</span>
              </button>
              {openLayer === li && (
                <div className="px-3 pb-3 space-y-1.5">
                  {layer.features.map(([key, label]) => (
                    <LayerToggle
                      key={key}
                      label={label as string}
                      featureKey={key as keyof LayerConfig}
                      layers={layers}
                      toggle={toggleLayer}
                      locked={MANDATORY_FEATURES.includes(key as keyof LayerConfig)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Fields + output */}
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            {activeProspect ? activeProspect.name : 'Builder'}
          </h1>
          <p className="text-text2 text-sm">Fill in the fields below, then generate the master prompt.</p>
        </div>

        {/* Sum Up */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Sum Up Business Info</h3>
            <button
              onClick={sumUp}
              disabled={sumLoading || !rawText.trim()}
              className="px-3 py-1.5 bg-blue/20 text-blue text-xs font-semibold rounded-lg hover:bg-blue/30 transition disabled:opacity-40"
            >
              {sumLoading ? 'Extracting…' : 'Sum Up →'}
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste raw business page text, Google listing, or website copy here — Claude extracts name, phone, reviews, services, etc."
            rows={4}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text3 focus:outline-none focus:border-accent resize-none font-mono"
          />
        </div>

        {/* Layer 1 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Owner Name" value={state.owner} onChange={set('owner')} placeholder="e.g. Mike Johnson" />
          <Field label="Phone" value={state.phone} onChange={set('phone')} type="tel" placeholder="(301) 555-0100" />
          <Field label="Location" value={state.location} onChange={set('location')} placeholder="Silver Spring, MD" />
          <Field label="Stars + Reviews" value={state.stars} onChange={set('stars')} placeholder="4.8 stars, 142 reviews" />
          <Field label="Years in Business" value={state.years} onChange={set('years')} placeholder="e.g. 12" />
          <Field label="Call Tracking #" value={state.callTracking} onChange={set('callTracking')} type="tel" placeholder="(301) 555-0100" />
        </div>

        <Field label="Services (comma-separated)" value={state.services} onChange={set('services')} placeholder="AC repair, furnace install, duct cleaning…" />

        {/* Layer 2 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={state.primaryColor} onChange={e => set('primaryColor')(e.target.value)} className="h-9 w-12 rounded border border-border bg-surface2 cursor-pointer" />
              <input type="text" value={state.primaryColor} onChange={e => set('primaryColor')(e.target.value)} className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Accent Color</label>
            <div className="flex gap-2">
              <input type="color" value={state.accentColor} onChange={e => set('accentColor')(e.target.value)} className="h-9 w-12 rounded border border-border bg-surface2 cursor-pointer" />
              <input type="text" value={state.accentColor} onChange={e => set('accentColor')(e.target.value)} className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent" />
            </div>
          </div>
          <Field label="Font Preference" value={state.font} onChange={set('font')} placeholder="e.g. Syne + DM Sans" />
          <Field label="Aesthetic Reference" value={state.aesthetic} onChange={set('aesthetic')} placeholder="e.g. ServiceTitan meets Apple" />
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text2 uppercase tracking-wider mb-1">Tone</label>
            <select
              value={state.tone}
              onChange={e => set('tone')(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            >
              {TONES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Layer 3 */}
        <Field label="Real Reviews (paste 3–6)" value={state.reviews} onChange={set('reviews')} rows={5} placeholder="Paste real Google reviews here — one per paragraph" />
        <Field label="Origin Story" value={state.story} onChange={set('story')} rows={3} placeholder="How/why the business was started, owner background…" />
        <Field label="Lead Capture Offer" value={state.offer} onChange={set('offer')} placeholder="e.g. free estimate, free inspection, $50 off first service" />

        {/* Layer 5 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Hero Headline A" value={state.headlineA} onChange={set('headlineA')} placeholder="Your AC Isn't Broken. Yet." />
          <Field label="Hero Headline B" value={state.headlineB} onChange={set('headlineB')} placeholder="Same-Day HVAC. No Runaround." />
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        <button
          onClick={generate}
          disabled={genLoading || !activeProspect}
          className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-40"
        >
          {genLoading ? 'Generating…' : 'Generate Master Prompt →'}
        </button>

        {genLoading && <LoadingSpinner label="Claude is crafting the master prompt…" />}

        {output && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Generated Master Prompt</h3>
              <div className="flex gap-2">
                <CopyButton text={output} label="Copy Prompt" />
                <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-surface2 border border-border text-text2 hover:text-text text-xs rounded-lg transition">Open Bolt.new ↗</a>
                <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-surface2 border border-border text-text2 hover:text-text text-xs rounded-lg transition">Open Lovable ↗</a>
              </div>
            </div>
            <pre className="bg-surface border border-border rounded-xl p-4 text-xs text-text font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">{output}</pre>
            <button
              onClick={saveToPipeline}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                saved ? 'bg-green/20 text-green border border-green/40' : 'bg-surface2 border border-border text-text hover:border-accent'
              }`}
            >
              {saved ? '✓ Saved to Pipeline!' : 'Save to Pipeline →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
