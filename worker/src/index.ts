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
  return `You are an expert at writing Lovable.dev / Bolt.new prompts for local service business websites powered by GoHighLevel (GHL) AI automation.

The CORE MISSION of this site: capture every lead 24/7 using AI chat and AI voice, qualify them automatically, and book them directly into the calendar — so the business never misses a job again, even at 2am.

Build a complete, production-ready Lovable.dev prompt for:

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
Font: ${payload.font || 'modern sans-serif'}
Aesthetic: ${payload.aesthetic || 'clean and professional'}
Reviews: ${payload.reviews || 'none provided'}
Story: ${payload.story || 'none provided'}
Lead offer: ${payload.offer}
Call tracking number: ${payload.callTracking || payload.phone}

---

HERO SECTION — The headline must be built around these 3 pain points specific to a ${payload.type} business:
1. Missed calls = missed revenue (most ${payload.type} jobs go to whoever answers first)
2. Leads go cold overnight (no one following up after hours)
3. Competitors are already using AI to answer, qualify, and book while you sleep

Write THREE headline variations targeting these pain points. Use direct, punchy language. Example structures:
- "Stop Losing Jobs to Voicemail"
- "Your Next Customer Called at 11pm. Did You Answer?"
- "AI Answers Every Call. Books Every Job. 24/7."

The hero subheading should explain the solution in one sentence: AI chat + AI voice that qualifies leads and books appointments automatically — day or night.

Primary CTA button: "Get a Free AI Demo" (triggers the AI chat widget)
Secondary CTA: "Call Now: ${payload.callTracking || payload.phone}"

---

LEAD CAPTURE & AI QUALIFICATION FLOW (most important section):
Build a visually prominent section explaining the 24/7 AI system. Show a 4-step flow:
Step 1 — Visitor lands on site (any time, day or night)
Step 2 — AI Chat OR AI Voice greets them, asks: What do you need help with today?
Step 3 — AI qualifies: collects name, phone, issue type, urgency level, location
Step 4 — Emergency? Escalates to live call via Vapi. Routine? Books directly into GHL calendar and sends confirmation text.

Style this as a clean timeline or icon-card flow. Headline: "Never Miss Another Lead — We Run 24/7"

---

AI CHAT WIDGET (bottom-right corner, always visible):
- Powered by GHL conversational AI
- Opens with: "Hi! I'm [Business Name]'s AI assistant. Are you dealing with an emergency or looking to schedule service?"
- Collects: name → phone → issue description → urgency
- If EMERGENCY: shows Vapi voice call button + phone number prominently
- If ROUTINE: shows available time slots from GHL calendar, confirms booking, sends SMS confirmation
- Widget color matches primary brand color

---

VAPI VOICE AI BUTTON (floating, visible on all pages):
- Microphone icon button fixed bottom-left
- Label: "Talk to AI Now"
- On click: initiates Vapi voice call
- Voice agent introduces itself, runs the same qualification script as the chat widget
- Ends with booking confirmation or escalation to live staff

---

SERVICES SECTION:
Grid of service cards for: ${payload.services}
Each card: icon + service name + 1-line description + "Get a Quote" button (triggers chat widget)

---

SOCIAL PROOF / TRUST STRIP:
- Star rating: ${payload.stars} stars
- Reviews: ${payload.reviews}
- Badges: "Licensed & Insured", "Same-Day Service Available", "AI-Powered 24/7 Support"
- Years in business: ${payload.years}

---

WHY US SECTION — 3 columns:
1. "We Answer 24/7" — AI never sleeps. Your competitors' voicemail does.
2. "Book in 60 Seconds" — Our AI qualifies and schedules while you're on the job.
3. "Real Pros, Real Fast" — ${payload.years} years serving ${payload.location}.

---

ABOUT / STORY:
${payload.story || `${payload.name} has been serving ${payload.location} for ${payload.years} years. We built this AI system because we were tired of losing jobs to missed calls.`}

---

FAQ SECTION (5 questions minimum):
- "How does the AI chat work?"
- "Can the AI handle emergencies?"
- "What happens after I book online?"
- "Is my information secure?"
- "Do I talk to a real person or AI?" (answer: AI qualifies, real pros do the work)

---

FOOTER:
- Logo + tagline: "Powered by AI. Backed by Experience."
- Phone: ${payload.callTracking || payload.phone}
- Location: ${payload.location}
- Links: Services, About, Book Now, Privacy Policy
- "AI chat available 24/7" badge

---

TECHNICAL REQUIREMENTS:
- Mobile-first, fully responsive
- Sticky header with phone number + "Book Now" CTA always visible
- GHL embed for calendar booking widget
- Vapi SDK integrated (voice call button)
- GHL chat widget script in <head>
- Google Analytics 4 + conversion events on: chat open, call click, form submit, booking complete
- Page load < 2s (lazy load images, no heavy libraries)
- Meta title: "${payload.name} | ${payload.type} in ${payload.location} | AI-Powered 24/7 Service"
- OG image configured for social sharing

Write the complete Lovable.dev prompt now. Be extremely specific about layout, copy, colors (primary: ${payload.primaryColor}, accent: ${payload.accentColor}), component structure, and GHL/Vapi integration. The prompt must be copy-paste ready with zero ambiguity.`;
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
