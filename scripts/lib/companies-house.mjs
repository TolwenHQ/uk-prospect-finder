// Companies House public data API client (https://developer.company-information.service.gov.uk/).
// Uses YOUR free API key. The key is only ever sent in the Authorization header: never printed or logged.
//
// Rate limit: Companies House allows 600 requests per 5 minutes. This client waits at least 700 ms between
// requests (at most about 430 per 5 minutes), so a run stays well under the limit.
import { FriendlyError } from './env.mjs';

const BASE = 'https://api.company-information.service.gov.uk';

// Company types that count as "corporate subscribers" under UK PECR: cold marketing email to them is allowed
// (with sender identification and an opt-out). Sole traders and partnerships are NOT here, on purpose.
export const CORPORATE_TYPES = new Set([
  'ltd', // private limited company
  'plc', // public limited company
  'llp', // limited liability partnership
  'private-limited-guarant-nsc', // private limited by guarantee
  'private-limited-guarant-nsc-limited-exemption',
  'private-limited-shares-section-30-exemption',
]);
export const isCorporateSubscriber = (type) => CORPORATE_TYPES.has(String(type || '').trim().toLowerCase());

export function createClient({ key, fetch = globalThis.fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now(), minGapMs = 700 } = {}) {
  if (!key) throw new FriendlyError('No Companies House API key.');
  const auth = 'Basic ' + Buffer.from(key + ':').toString('base64');
  let last = -Infinity;
  let requests = 0;

  async function get(path, params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)).toString();
    const url = `${BASE}${path}${qs ? '?' + qs : ''}`;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const wait = last + minGapMs - now();
      if (wait > 0) await sleep(wait);
      last = now();
      requests++;
      let r;
      try {
        r = await fetch(url, { headers: { Authorization: auth, Accept: 'application/json' } });
      } catch {
        if (attempt === 5) throw new FriendlyError('Could not reach Companies House. Check your internet connection and try again.');
        await sleep(2000 * attempt);
        continue;
      }
      if (r.status === 404) return null;
      if (r.status === 401 || r.status === 403) {
        throw new FriendlyError('Companies House did not accept your API key. Check it was copied in full (no spaces) and that it is a REST key for the Live environment.');
      }
      if (r.status === 429) { await sleep(60000); continue; } // over the limit: wait a minute
      if (r.status >= 500) { await sleep(3000 * attempt); continue; }
      if (!r.ok) {
        const err = new Error(`Companies House answered ${r.status} on ${path}`); // never include headers here
        err.status = r.status;
        throw err;
      }
      const text = await r.text();
      return text ? JSON.parse(text) : null;
    }
    throw new FriendlyError('Companies House is busy or down right now. Try again in a few minutes.');
  }

  async function advancedSearch(params) {
    try {
      return await get('/advanced-search/companies', params);
    } catch (e) {
      // If the API refuses a comma-separated company_type list, search one type at a time instead.
      if (e.status === 400 && String(params.company_type || '').includes(',')) {
        const merged = { hits: 0, items: [] };
        for (const t of params.company_type.split(',')) {
          const res = await get('/advanced-search/companies', { ...params, company_type: t });
          merged.hits += res?.hits ?? 0;
          merged.items.push(...(res?.items ?? []));
        }
        return merged;
      }
      throw e;
    }
  }

  return {
    advancedSearch,
    profile: (number) => get(`/company/${encodeURIComponent(number)}`),
    get requests() { return requests; },
  };
}
