// Step 2: which Companies House results count as prospects. Active, limited company types only, inside the
// area and age range, and not a holding company, chain or franchise.
import { isCorporateSubscriber } from './companies-house.mjs';

// Names that are holding, property or investment vehicles rather than trading businesses.
export const HOLDING_NAME = /\b(holdings?|investments?|properties|property|estates?|ventures|capital|group|nominees?)\b/i;
export const HOLDING_SIC = new Set(['64209', '64205', '64301', '64303', '64999', '70100', '99999', '74990']);

// National brands and franchises: their websites are run centrally.
export const CHAIN_NAME = /\b(franchis\w*|domino'?s|subway|costa|greggs|papa john'?s|starbucks|kfc|mcdonald'?s|burger king|pizza hut|wimpy|toni ?& ?guy|regis|supercuts|anytime fitness|snap fitness|pure ?gym|the gym group|jd gym|bannatyne|premier inn|travelodge|holiday inn|best western|molly maid|ovenclean|oven wizards|mr ?rubbish|timpson|mydentist|bupa|specsavers|vision express|british gas|homeserve|dyno|metro rod|lanes group)\b/i;

// UK postcode district, e.g. LS6, M1, SW1A, EH12.
export const DISTRICT = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export function parseAreas(input) {
  const parts = String(input || '').split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Say which area to search, for example --area LS6 (postcode districts, comma-separated) or --area "Harrogate" (a town).');
  return parts.map((p) => (DISTRICT.test(p.toUpperCase().replace(/\s+/g, '')) ? { kind: 'district', value: p.toUpperCase().replace(/\s+/g, '') } : { kind: 'town', value: p }));
}

export const postcodeOf = (addr) => String(addr?.postal_code || '').toUpperCase().replace(/\s+/g, ' ').trim();

export function inArea(area, addr) {
  if (area.kind === 'district') return new RegExp(`^${area.value}\\s?\\d[A-Z]{2}$`).test(postcodeOf(addr)) || new RegExp(`^${area.value}\\s`).test(postcodeOf(addr) + ' ');
  const text = [addr?.address_line_1, addr?.address_line_2, addr?.locality, addr?.region].join(' ').toLowerCase();
  return text.includes(area.value.toLowerCase());
}

// "2-15" -> { min: 2, max: 15 } in years. "0-1" is companies under a year old. "5+" is 5 years or older.
export function parseAge(input) {
  if (input === undefined || input === null || input === '') return { min: 0, max: 100 };
  const s = String(input).trim();
  let m = s.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (m) { const a = Number(m[1]); const b = Number(m[2]); return { min: Math.min(a, b), max: Math.max(a, b) }; }
  m = s.match(/^(\d+(?:\.\d+)?)\s*\+$/);
  if (m) return { min: Number(m[1]), max: 100 };
  throw new Error(`Company age "${s}" not understood. Use a range in years like --age 2-15, or --age 5+ for five years or older.`);
}

const iso = (d) => d.toISOString().slice(0, 10);
export function ageWindow(age, now = new Date()) {
  const back = (years) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - Math.round(years * 12)); return iso(d); };
  return { incorporatedFrom: back(age.max), incorporatedTo: back(age.min) };
}

// Cheap checks on a search result (no extra API calls). Returns a reason to drop it, or null.
export function dropReason(c, { window } = {}) {
  if (c.company_status && c.company_status !== 'active') return `not active (${c.company_status})`;
  if (!isCorporateSubscriber(c.company_type)) return `not a limited company (${c.company_type || 'unknown type'})`;
  if (window && c.date_of_creation && (c.date_of_creation < window.incorporatedFrom || c.date_of_creation > window.incorporatedTo)) return 'outside the age range';
  if ((c.sic_codes || []).some((s) => HOLDING_SIC.has(s)) || HOLDING_NAME.test(c.company_name || '')) return 'holding, property or dormant-style company';
  if (CHAIN_NAME.test(c.company_name || '')) return 'chain or franchise';
  return null;
}

// Checks on the full company profile (one API call each). Returns a reason to drop it, or null.
export function profileDropReason(p) {
  if (!p) return 'profile not found';
  if (p.company_status !== 'active') return `not active (${p.company_status})`;
  if (p.company_status_detail && /strike|liquidation|administration/i.test(p.company_status_detail)) return `status: ${p.company_status_detail}`;
  if (!isCorporateSubscriber(p.type)) return `not a limited company (${p.type})`;
  if (p.has_insolvency_history) return 'insolvency history';
  if (p.accounts?.last_accounts?.type === 'dormant') return 'dormant (last accounts filed as dormant)';
  return null;
}

export const titleCase = (s) => String(s || '').toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Ltd|Limited|Llp|Plc)\b\.?/g, '').replace(/\s+/g, ' ').trim();
