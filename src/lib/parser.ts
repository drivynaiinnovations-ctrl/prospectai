import type { Prospect } from '../types';

export function parseProspects(text: string): Prospect[] {
  const start = text.indexOf('QUALIFY_START');
  const end = text.indexOf('QUALIFY_END');
  if (start === -1) return [];

  const block = text.slice(start + 13, end > -1 ? end : undefined).trim();

  return block
    .split('\n')
    .filter(l => l.trim() && l.includes('|'))
    .map(line => {
      const get = (key: string) => {
        const m = line.match(new RegExp(key + ':\\s*([^|\\n]+)'));
        return m ? m[1].trim() : '';
      };
      const rm = line.match(/^\s*(\d+)\.\s*(.+?)\s*\|/);
      const tier = (get('TIER') || 'COLD').toUpperCase() as 'HOT' | 'WARM' | 'COLD';
      return {
        rank: rm ? parseInt(rm[1]) : 0,
        name: rm ? rm[2].trim() : 'Unknown',
        score: parseInt(get('SCORE')) || 0,
        tier,
        type: get('TYPE') || 'Business',
        phone: get('PHONE') || '',
        website: get('WEBSITE') || '',
        signals: get('SIGNALS').split(',').map(s => s.trim()).filter(Boolean),
        reason: get('REASON') || '',
      };
    })
    .filter(p => p.name && p.name !== 'Unknown');
}

export function parseOutreach(text: string): { call: string; email: string; text: string } {
  const extract = (start: string, next?: string) => {
    const s = text.indexOf(start);
    if (s === -1) return '';
    const from = s + start.length;
    const e = next ? text.indexOf(next, from) : -1;
    return (e > -1 ? text.slice(from, e) : text.slice(from)).trim();
  };
  return {
    call: extract('CALL_SCRIPT', 'EMAIL'),
    email: extract('EMAIL', 'TEXT_MESSAGE'),
    text: extract('TEXT_MESSAGE'),
  };
}

export function parseSumUp(text: string): Record<string, string> {
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
