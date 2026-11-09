// Step 3: search-free website discovery. Tries the obvious web addresses for a company name
// ("Brackenfold Plumbing Ltd" -> brackenfoldplumbing.co.uk, .com, .uk) and accepts one ONLY if its home page
// shows the company number, the registered postcode, or the business name together with its town.
// Respects robots.txt. It finds websites only, never email addresses.
//
// Limits, said plainly: a business whose site is at an unusual address will show as "no website found".
import { pageText } from './web.mjs';

const STOPWORDS = new Set(['ltd', 'limited', 'llp', 'plc', 'the', 'and', 'of', 'uk', 'co', 'company', 'group', 'services', 'service', 'solutions', 'contractors', 'contracting', 'enterprises', 'north', 'south', 'east', 'west']);

export function slugs(name, { keepBrackets = false } = {}) {
  const base = String(name).toLowerCase().replace(/&/g, ' and ').replace(/['’.]/g, '');
  const raw = (keepBrackets ? base.replace(/[()]/g, ' ') : base.replace(/\([^)]*\)/g, ' ')).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean).filter((w) => !['ltd', 'limited', 'llp', 'plc'].includes(w));
  // A very short name, e.g. "MM (Yorkshire) Ltd": include the words in brackets rather than guess nothing.
  if (!keepBrackets && raw.join('').length < 5 && /\(/.test(base)) return slugs(name, { keepBrackets: true });
  const core = raw.filter((w) => !STOPWORDS.has(w));
  const set = new Set();
  const add = (ws) => { const s = ws.join(''); if (s.length >= 5 && s.length <= 40) set.add(s); const h = ws.join('-'); if (ws.length > 1 && h.length <= 40) set.add(h); };
  add(raw.filter((w) => w !== 'the' && w !== 'and'));
  add(raw.filter((w) => w !== 'the'));
  if (core.length) add(core);
  if (core.length > 2) add(core.slice(0, 2));
  return [...set].slice(0, 6);
}

// A page naming lots of towns is a directory or national brand, not one local business.
const UK_TOWNS = ['manchester', 'liverpool', 'leeds', 'birmingham', 'london', 'bristol', 'sheffield', 'bradford', 'newcastle', 'glasgow', 'edinburgh', 'cardiff', 'nottingham', 'leicester', 'coventry', 'hull', 'york', 'plymouth', 'southampton', 'brighton', 'reading', 'derby', 'stoke', 'wolverhampton', 'norwich', 'swansea', 'belfast', 'aberdeen', 'oxford', 'cambridge'];
export const looksLikeDirectory = (low) => UK_TOWNS.filter((t) => low.includes(t)).length >= 8;

const PARKED = /(domain (is )?(for sale|parked)|buy this domain|this domain may be for sale|hugedomains|sedo|parkingcrew|bodis|domain has expired|account suspended|future home of)/i;

// Why this page belongs to this company, or null.
export function matchEvidence(company, html) {
  const text = pageText(html);
  if (PARKED.test(text.slice(0, 5000))) return null;
  const low = text.toLowerCase();
  const compact = low.replace(/\s+/g, '');
  const num = String(company.number || '');
  const pc = String(company.postcode || '').replace(/\s+/g, '').toLowerCase();
  const nameTokens = String(company.name).toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const town = String(company.town || '').toLowerCase().split(/[- ]/)[0];
  if (num && new RegExp(`\\b0?${num.replace(/^0+/, '')}\\b`, 'i').test(text) && /compan|regist|reg\.? ?no|number/i.test(text)) return `company number ${num} on page`;
  if (pc.length >= 5 && compact.includes(pc)) return `registered postcode ${company.postcode} on page`;
  if (nameTokens.length && nameTokens.every((w) => low.includes(w)) && town.length > 2 && low.includes(town) && !looksLikeDirectory(low)) return 'name and town on page';
  return null;
}

export async function probe(company, web, { tlds = ['co.uk', 'com', 'uk'] } = {}) {
  const rec = { tried: [], website: null, matchedBy: null, note: null };
  for (const s of slugs(company.name)) {
    for (const tld of tlds) {
      const host = `${s}.${tld}`;
      rec.tried.push(host);
      if (!(await web.resolves(host))) continue;
      let page = await web.get(`https://${host}/`);
      if (page.error || page.status >= 400) page = await web.get(`http://${host}/`);
      if (page.error || page.status >= 400) continue;
      if (!(await web.allowed(page.finalUrl).catch(() => true))) { rec.robotsBlocked = page.finalUrl; rec.note = `${host} exists but its robots.txt asks tools not to visit`; continue; }
      const by = matchEvidence(company, page.body);
      if (by) { rec.website = page.finalUrl; rec.matchedBy = by; return rec; }
    }
  }
  return rec;
}
