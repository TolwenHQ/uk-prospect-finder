// An offline stand-in for the internet, built from the fictional fixtures. Used by --demo and the tests.
import { SEARCH_ITEMS, PROFILES, SITES } from './fixtures.mjs';

const response = (status, body, url) => ({ status, ok: status >= 200 && status < 300, url, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });

export function fakeFetch({ searchItems = SEARCH_ITEMS, profiles = PROFILES, sites = SITES, calls = [] } = {}) {
  return async (url, init = {}) => {
    calls.push({ url: String(url), at: Date.now(), headers: init.headers });
    const u = new URL(url);
    if (u.hostname === 'api.company-information.service.gov.uk') {
      if (!/^Basic /.test(init.headers?.Authorization || '')) return response(401, { error: 'no key' }, url);
      if (u.pathname === '/advanced-search/companies') {
        const start = Number(u.searchParams.get('start_index') || 0);
        const size = Number(u.searchParams.get('size') || 20);
        return response(200, { hits: searchItems.length, items: searchItems.slice(start, start + size), kind: 'search#advanced-search' }, url);
      }
      const m = u.pathname.match(/^\/company\/([A-Z0-9]+)$/);
      if (m) return profiles[m[1]] ? response(200, profiles[m[1]], url) : response(404, {}, url);
      return response(404, {}, url);
    }
    const site = sites[u.hostname];
    if (!site) { const e = new TypeError('fetch failed'); e.cause = { code: 'ENOTFOUND', message: `getaddrinfo ENOTFOUND ${u.hostname}` }; throw e; }
    if (u.protocol === 'https:' && !site.https) { const e = new TypeError('fetch failed'); e.cause = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' }; throw e; }
    const finalBase = u.protocol === 'http:' && site.httpRedirects ? `https://${u.host}` : `${u.protocol}//${u.host}`;
    if (u.pathname === '/robots.txt') return site.robots ? response(200, site.robots, `${finalBase}/robots.txt`) : response(404, 'not found', `${finalBase}/robots.txt`);
    if (u.pathname === '/') return response(site.status || 200, site.html, `${finalBase}/`);
    return response(404, 'not found', `${finalBase}${u.pathname}`);
  };
}

export const fakeResolve = (sites = SITES) => async (host) => Object.prototype.hasOwnProperty.call(sites, host);
