import Anthropic from '@anthropic-ai/sdk';

export interface Env {
  ANTHROPIC_API_KEY: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

// ── Prompts ──────────────────────────────────────────────────────────────────

function qualifyPrompt(mapsData: string) {
  return `You are a prospect qualification AI for a web/AI agency selling to local service businesses.

Analyze the Google Maps data below. For each business, score it based on these signals:
- No website: +25 pts
- Weak/outdated website: +18 pts
- No online booking: +15 pts
- No AI chat/voice: +15 pts
- No automation: +12 pts
- Low reviews (<20): +8 pts
- Low rating (<4.0): +5 pts
- No social media: +5 pts

Tier thresholds: HOT = 40+ pts, WARM = 20–39 pts, COLD = <20 pts

Output ONLY valid data in this exact format for EACH business found:

QUALIFY_START
name: [Business Name]
type: [Business Type e.g. HVAC, Plumber, Roofer]
phone: [phone or "none"]
website: [url or "none"]
score: [number]
tier: [HOT|WARM|COLD]
rank: [1-based rank by score]
signals: [comma-separated list of signals detected]
reason: [2-sentence explanation of why this score]
QUALIFY_END

Google Maps Data:
${mapsData}`;
}

function sumUpPrompt(payload: Record<string, string>) {
  return `You are analyzing a local business's online presence to help build a website pitch.

Business: ${payload.name} (${payload.type})
Phone: ${payload.phone}
Raw research notes: ${payload.rawText}

Extract and summarize:
1. Owner/contact name (if mentioned)
2. Key services offered
3. Current weaknesses (no website, poor reviews, no booking, etc.)
4. Any existing website URL
5. Review count and rating if visible
6. Years in business if mentioned

Output as a clean JSON object:
{
  "owner": "...",
  "services": "...",
  "weaknesses": "...",
  "website": "...",
  "reviews": "...",
  "years": "..."
}`;
}

function buildPrompt(payload: Record<string, string>) {
  return `You are an expert at writing Lovable.dev / Bolt.new prompts for local service business websites.

Create a comprehensive, detailed prompt to build a complete, production-ready website for:

Business: ${payload.name}
Type: ${payload.type}
Owner: ${payload.owner || 'N/A'}
Phone: ${payload.phone}
Location: ${payload.location}
Stars: ${payload.stars}
Years in business: ${payload.years}
Services: ${payload.services}
Tone: ${payload.tone}
Primary color: ${payload.primaryColor}
Accent color: ${payload.accentColor}
Font preference: ${payload.font || 'modern sans-serif'}
Aesthetic: ${payload.aesthetic || 'clean and professional'}
Reviews: ${payload.reviews || 'none provided'}
Story: ${payload.story || 'none provided'}
Offer: ${payload.offer}
Call tracking number: ${payload.callTracking || payload.phone}
Headline A: ${payload.headlineA || ''}
Headline B: ${payload.headlineB || ''}

Layers to include:
- Hero section: ${payload.layerHero}
- Services section: ${payload.layerServices}
- Testimonials: ${payload.layerTestimonials}
- About section: ${payload.layerAbout}
- FAQ section: ${payload.layerFaq}
- Contact/CTA: ${payload.layerContact}

Mandatory features to include:
- AI chat widget (AlexChat)
- Vapi voice AI call button
- Online booking/appointment form
- Mobile-first responsive design
- Google Analytics ready
- Fast loading (optimized images)

Write the full Lovable.dev prompt now. Be specific about layout, colors, copy, and functionality. The prompt should be copy-paste ready.`;
}

function outreachPrompt(payload: Record<string, string>) {
  return `You are a sales expert writing outreach for a local web/AI agency.

Prospect: ${payload.name} (${payload.type})
Pain signals: ${payload.signals}
Preview site URL: ${payload.previewUrl || 'not built yet'}
Sender name: ${payload.senderName || 'our team'}
Sender phone: ${payload.senderPhone || ''}
Additional context: ${payload.context || 'none'}

Write three separate pieces of outreach. Be conversational, local, and specific to their pain signals. Never sound generic.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

CALL_START
[Write a natural 60-90 second cold call script. Include opener, pain point hook, value prop, and soft close asking for 15 minutes.]
CALL_END

EMAIL_START
Subject: [subject line]
[Write a 4-6 sentence cold email. Subject line on first line as "Subject: ...". Personal, specific, one clear CTA.]
EMAIL_END

TEXT_START
[Write a single SMS under 160 characters. Casual, specific, with a question to start a conversation.]
TEXT_END`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return err('Method not allowed', 405);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return err('ANTHROPIC_API_KEY not configured', 500);
    }

    let body: { mode: string; payload: Record<string, string> };
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON');
    }

    const { mode, payload } = body;
    if (!mode || !payload) return err('Missing mode or payload');

    let prompt: string;
    try {
      if (mode === 'qualify') {
        prompt = qualifyPrompt(payload.mapsData || '');
      } else if (mode === 'sumup') {
        prompt = sumUpPrompt(payload);
      } else if (mode === 'build') {
        prompt = buildPrompt(payload);
      } else if (mode === 'outreach') {
        prompt = outreachPrompt(payload);
      } else {
        return err(`Unknown mode: ${mode}`);
      }

      const result = await callClaude(prompt, env.ANTHROPIC_API_KEY);
      return json({ result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return err(msg, 500);
    }
  },
};
