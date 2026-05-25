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
  return `Build a complete, production-ready website for the following local service business. This site runs on a full AI automation stack: GoHighLevel (GHL) CRM + AI Chat + Vapi Voice AI + automated follow-up sequences. Every section must DEMONSTRATE and PROVE these capabilities — not just mention them.

Business: ${payload.name}
Type: ${payload.type}
Owner: ${payload.owner || 'N/A'}
Phone: ${payload.phone}
Location: ${payload.location}
Stars: ${payload.stars} stars
Years in business: ${payload.years}
Services: ${payload.services}
Tone: ${payload.tone}
Primary color: ${payload.primaryColor}
Accent color: ${payload.accentColor}
Font: ${payload.font || 'modern sans-serif'}
Reviews: ${payload.reviews || 'none provided'}
Story: ${payload.story || ''}
Offer: ${payload.offer}
Call tracking number: ${payload.callTracking || payload.phone}

===========================
SECTION 1 — HERO
===========================
Sticky top nav: logo left, phone number center (click-to-call), "Book Now" button right.

Hero background: bold, high-contrast. Left side: headline + subhead + CTAs. Right side: phone mockup or animated chat widget preview showing a real conversation.

Headline — pick the strongest of these 3 pain points for a ${payload.type} business:
• "Stop Losing Jobs to Voicemail — Our AI Answers Every Call"
• "Your Competitors Book While You Sleep. Now You Can Too."
• "Every Missed Call Is a Job Gone. We Fixed That."

Subheadline: "AI-powered chat and voice that answers, qualifies, and books appointments 24/7 — even at 2am."

CTA 1 (primary, large): "Try the AI Demo Now" → opens live chat widget
CTA 2 (secondary): "Call ${payload.callTracking || payload.phone}"

Trust bar below hero: ★${payload.stars} stars · Licensed & Insured · Same-Day Available · AI-Powered 24/7

===========================
SECTION 2 — LIVE AI DEMO (most important section)
===========================
Headline: "See It Work — Right Now"
Subheadline: "This is the same AI your customers will talk to. Try it."

Two side-by-side demo cards:

CARD 1 — AI Chat Demo:
- Embedded live GHL chat widget (fully functional)
- Label above: "💬 Chat with our AI"
- Show a preview of the conversation script:
  AI: "Hi! I'm ${payload.name}'s AI assistant. Emergency or scheduling?"
  Customer: "My AC stopped working"
  AI: "I can help. Is this affecting your whole home or one zone?"
  Customer: "Whole home"
  AI: "Got it — urgent situation. Let me connect you or grab your info to dispatch fast."
- Below preview: "This AI collects name, phone, issue, and urgency — then books or escalates automatically"

CARD 2 — AI Voice Demo:
- Large microphone button: "🎙️ Call the AI Now"
- Powered by Vapi — initiates real voice call when clicked
- Label: "Hear exactly what your customers hear when they call after hours"
- Script preview:
  "Thank you for calling ${payload.name}! I'm your AI assistant. Are you experiencing an emergency or looking to schedule service?"
- Below: "Available 24/7. Qualifies leads. Books appointments. Escalates emergencies."

===========================
SECTION 3 — HOW THE AUTOMATION WORKS
===========================
Headline: "One System. Zero Missed Leads."
Subheadline: "Here's exactly what happens from the moment someone contacts you."

Animated 6-step horizontal flow (desktop) / vertical timeline (mobile):

Step 1 — 📞 Lead contacts you
Icon: phone/chat bubble. Text: "Customer calls, texts, or chats — any time, day or night"

Step 2 — 🤖 AI answers instantly
Icon: robot. Text: "Voice AI or chat AI picks up in under 3 seconds. No hold music. No voicemail."

Step 3 — ✅ AI qualifies the lead
Icon: checklist. Text: "Collects name, phone, service needed, urgency level, and location"

Step 4 — 🚨 Emergency routing
Icon: siren. Text: "True emergencies get escalated to a live tech immediately via call transfer"

Step 5 — 📅 Routine booking
Icon: calendar. Text: "Non-urgent leads see available slots and book directly — confirmation text sent instantly"

Step 6 — 🔄 GHL automation kicks in
Icon: lightning bolt. Text: "Contact added to CRM, pipeline updated, follow-up sequence starts, job reminder sent"

Below the flow: "Every lead captured. Every job tracked. Zero manual work."

===========================
SECTION 4 — THE FULL STACK (What You're Getting)
===========================
Headline: "Not Just a Website. A Complete Lead Machine."

4-column feature grid:

Column 1 — 🌐 Professional Website
- Mobile-first design
- Fast loading under 2 seconds
- SEO optimized for ${payload.location}
- Click-to-call on every page
- Built to convert visitors into booked jobs

Column 2 — 🤖 AI Chat (24/7)
- Powered by GoHighLevel
- Answers every chat instantly
- Qualifies leads with smart questions
- Books appointments automatically
- Escalates emergencies to live staff
- Syncs all conversations to your CRM

Column 3 — 🎙️ Voice AI (24/7)
- Powered by Vapi
- Answers calls after hours
- Natural conversation — not a robot menu
- Captures caller name, number, and issue
- Books or dispatches based on urgency
- Full call transcript saved to GHL

Column 4 — ⚡ GHL Automation
- All leads flow into one CRM
- Automated SMS follow-up within 2 minutes
- Appointment reminder sequences
- Review request automation after job complete
- Pipeline tracking from lead to closed job
- Monthly reporting dashboard

===========================
SECTION 5 — ROI CALCULATOR (interactive)
===========================
Headline: "How Much Are Missed Calls Costing You?"

Interactive calculator with sliders/inputs:
- "How many calls do you miss per week?" (slider: 1–20, default 5)
- "Average job value?" (input: default $350)
- "Close rate on answered calls?" (slider: 10–80%, default 40%)

Auto-calculates and displays:
- "Missed revenue per week: $X"
- "Missed revenue per month: $X"
- "Missed revenue per year: $X"
- Bold callout: "Our AI recovers most of this. Starting Day 1."

CTA below calculator: "Get Your Free AI Setup" → triggers chat widget

===========================
SECTION 6 — SERVICES
===========================
Grid of cards for: ${payload.services}
Each card: relevant icon + service name + 2-line description + "Get a Quote" button (opens chat widget pre-filled with that service)

===========================
SECTION 7 — BEFORE vs AFTER
===========================
Headline: "What Changes When You Add AI"

Two-column comparison table:

WITHOUT AI | WITH ${payload.name} AI
Calls go to voicemail after 5pm | AI answers every call 24/7
Leads wait until morning for callback | Leads booked in under 60 seconds
You lose jobs to competitors who answer | First to respond wins the job
Manual follow-up (or none) | Automated SMS within 2 minutes
No record of missed opportunities | Full CRM with every lead tracked
One person handles phones and jobs | AI handles phones, you handle jobs

===========================
SECTION 8 — SOCIAL PROOF
===========================
Star rating display: ${payload.stars} ★ with review count
3 featured review cards pulled from: ${payload.reviews || 'Google Reviews'}
Trust badges row: "Google Verified" · "Licensed & Insured" · "AI-Powered" · "${payload.years} Years in Business"

===========================
SECTION 9 — ABOUT
===========================
${payload.story || `${payload.name} has been serving ${payload.location} for ${payload.years} years. We added AI because we were tired of losing jobs to missed calls. Now we answer every lead — and so can you.`}

Photo placeholder: owner/team photo right side, story left side.

===========================
SECTION 10 — FAQ
===========================
Accordion-style. Minimum 6 questions:
1. "How does the AI know what to say?" — Trained specifically on ${payload.type} services and your business details.
2. "What if it's a real emergency?" — AI detects urgency and escalates to a live technician immediately via call transfer.
3. "Does the AI replace my staff?" — No. AI handles intake and booking. Your team handles the actual work.
4. "How fast does the AI respond?" — Under 3 seconds, every time, 24/7.
5. "What happens after someone books?" — They get an instant SMS confirmation. You get a notification. GHL updates the pipeline automatically.
6. "Can I see all my leads in one place?" — Yes — your GHL dashboard shows every contact, conversation, and booking in real time.

===========================
SECTION 11 — FINAL CTA BANNER
===========================
Bold full-width section, primary brand color background.
Headline: "Ready to Stop Missing Jobs?"
Subheadline: "Try the AI live — no commitment. See exactly what your customers will experience."
Two buttons: "Try AI Demo Now" (opens chat) · "Call ${payload.callTracking || payload.phone}"

===========================
SECTION 12 — FOOTER
===========================
Logo + tagline: "Powered by AI. Backed by ${payload.years} Years of Experience."
Columns: Services list · Contact info (${payload.phone}, ${payload.location}) · Quick links
Bottom bar: © ${payload.name} · Privacy Policy · "AI available 24/7"

===========================
TECHNICAL REQUIREMENTS
===========================
- React + Tailwind CSS
- Mobile-first responsive (test at 375px, 768px, 1280px)
- Sticky header always visible with phone + Book Now
- GHL chat widget script injected in <head>
- Vapi SDK: floating mic button fixed bottom-left, initiates voice call on click
- GHL calendar embed for inline booking
- ROI calculator: pure JavaScript, no external libs, updates in real time
- Google Analytics 4: track events — chat_opened, voice_call_started, booking_completed, cta_clicked
- Page speed: lazy load all images, no blocking scripts
- Meta title: "${payload.name} | ${payload.type} in ${payload.location} | 24/7 AI-Powered Service"
- Meta description: "AI answers every call and books every job for ${payload.name} in ${payload.location}. Try the live demo."
- OG image: 1200×630, brand colors, business name + "AI-Powered 24/7"

Colors: primary ${payload.primaryColor}, accent ${payload.accentColor}. Apply consistently across all CTAs, highlights, and section backgrounds.`;
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

function scrapePrompt(text: string) {
  return `You are extracting business information from a website's text content to pre-fill a site builder form.

Extract every useful detail from the text below. Output ONLY a JSON object with these exact keys. Use empty string "" if not found — never guess or make up data.

{
  "name": "business name",
  "type": "business type (e.g. HVAC, Plumber, Roofer)",
  "phone": "primary phone number",
  "location": "city, state",
  "services": "comma-separated list of services offered",
  "years": "years in business or founding year",
  "stars": "star rating if mentioned (e.g. 4.8)",
  "reviews": "notable review quotes or review summary",
  "story": "about section or owner story",
  "offer": "any special offer, guarantee, or lead magnet mentioned",
  "weaknesses": "what's missing: no online booking, no chat, poor mobile, outdated design, etc."
}

Website text:
${text.slice(0, 8000)}`;
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
      } else if (mode === 'scrape') {
        if (!payload.url) return err('Missing url in payload');
        let html: string;
        try {
          const res = await fetch(payload.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProspectAI/1.0)' },
            signal: AbortSignal.timeout(8000),
          });
          html = await res.text();
        } catch {
          return err('Could not fetch that URL. The site may block scrapers or be unavailable.');
        }
        // Strip HTML tags and collapse whitespace
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        prompt = scrapePrompt(text);
        const result = await callClaude(prompt, env.ANTHROPIC_API_KEY);
        return json({ result });
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
