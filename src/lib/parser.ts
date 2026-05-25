import type { Prospect } from '../types';

function field(block: string, key: string): string {
  const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : '';
}

export function parseProspects(text: string): Prospect[] {
  const blocks = text.split('QUALIFY_START').slice(1);
  const prospects: Prospect[] = [];

  for (const raw of blocks) {
    const block = raw.split('QUALIFY_END')[0].trim();
    if (!block) continue;

    const name = field(block, 'name');
    if (!name) continue;

    const tier = (field(block, 'tier') || 'COLD').toUpperCase() as 'HOT' | 'WARM' | 'COLD';
    const signalsRaw = field(block, 'signals');

    prospects.push({
      rank: parseInt(field(block, 'rank')) || prospects.length + 1,
      name,
      score: parseInt(field(block, 'score')) || 0,
      tier,
      type: field(block, 'type') || 'Business',
      phone: field(block, 'phone').replace(/^none$/i, ''),
      website: field(block, 'website').replace(/^none$/i, ''),
      signals: signalsRaw ? signalsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
      reason: field(block, 'reason'),
    });
  }

  return prospects;
}

export function parseOutreach(text: string): { call: string; email: string; text: string } {
  const extract = (startTag: string, endTag: string) => {
    const s = text.indexOf(startTag);
    if (s === -1) return '';
    const from = s + startTag.length;
    const e = text.indexOf(endTag, from);
    return (e > -1 ? text.slice(from, e) : text.slice(from)).trim();
  };
  return {
    call: extract('CALL_START', 'CALL_END'),
    email: extract('EMAIL_START', 'EMAIL_END'),
    text: extract('TEXT_START', 'TEXT_END'),
  };
}

export function parseSumUp(text: string): Record<string, string> {
  // Worker returns JSON for sumup
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
      return {
        SERVICES: parsed.services || '',
        LOCATION: parsed.location || '',
        YEARS_IN_BUSINESS: parsed.years || '',
        STAR_RATING: parsed.reviews?.match(/[\d.]+/)?.[0] || '',
        REVIEW_COUNT: parsed.reviews?.match(/(\d+)\s*review/i)?.[1] || '',
        TOP_REVIEW_1: '',
        TOP_REVIEW_2: '',
        TOP_REVIEW_3: '',
        OFFER: parsed.offer || '',
        BUSINESS_NAME: parsed.name || '',
        PHONE: parsed.phone || '',
      };
    }
  } catch { /* fall through to labeled parsing */ }

  const fields = [
    'BUSINESS_NAME', 'TAGLINE', 'LOCATION', 'PHONE', 'EMAIL',
    'BUSINESS_TYPE', 'STAR_RATING', 'REVIEW_COUNT', 'YEARS_IN_BUSINESS',
    'SERVICES', 'TOP_REVIEW_1', 'TOP_REVIEW_2', 'TOP_REVIEW_3', 'OFFER', 'LICENSES',
  ];
  const result: Record<string, string> = {};
  fields.forEach(f => {
    const m = text.match(new RegExp(f + ':\\s*([^\\n]+)'));
    const val = m ? m[1].trim() : '';
    result[f] = val.toLowerCase() === 'not found' ? '' : val;
  });
  return result;
}
