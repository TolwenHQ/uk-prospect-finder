// Polite web access for the domain probe and the site check: an honest user agent, timeouts, robots.txt,
// and a pause between requests to the same site. Public pages only; nothing is ever submitted.
import { promises as dns } from 'node:dns';

export const USER_AGENT = 'tolwen-prospect-finder/1.0 (+https://github.com/TolwenHQ/uk-prospect-finder)';
const UA_TOKEN = 'tolwen-prospect-finder';

export function createWeb({ fetch = globalThis.fetch, resolve = (h) => dns.lookup(h).then(() => true, () => false), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), perHostGapMs = 1000 } = {}) {
  const lastHit = new Map();
  const robotsCache = new Map();

  async function get(url, ms = 15000) {
    let host = '';
    try { host = new URL(url).host; } catch { return { error: 'bad address' }; }
    const wait = (lastHit.get(host) || 0) + perHostGapMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastHit.set(host, Date.now());
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' } });
      const body = (await r.text()).slice(0, 2_000_000);
      return { status: r.status, finalUrl: r.url || url, body };
    } catch (e) {
      return { error: (e.cause?.code || e.name || 'error') + ': ' + String(e.cause?.message || e.message).slice(0, 120) };
    } finally { clearTimeout(t); }
  }

  // robots.txt: rules for our own name if present, otherwise for "*". Longest match wins; Allow wins a tie.
  async function allowed(url) {
    const u = new URL(url);
    if (!robotsCache.has(u.origin)) robotsCache.set(u.origin, get(`${u.origin}/robots.txt`, 8000).then((r) => (r.status === 200 && !/<html/i.test(r.body.slice(0, 500)) ? parseRobots(r.body) : [])));
    return isAllowed(await robotsCache.get(u.origin), u.pathname + u.search);
  }

  return { get, allowed, resolves: (host) => resolve(host) };
}

export function parseRobots(text) {
  const groups = []; let current = null; let lastWasAgent = false;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2].trim();
    if (k === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(v.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (current && (k === 'allow' || k === 'disallow')) current.rules.push({ allow: k === 'allow', path: v });
  }
  const mine = groups.filter((g) => g.agents.some((a) => a === UA_TOKEN));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules).filter((r) => r.path !== '' || !r.allow);
}

export function isAllowed(rules, path) {
  let best = null;
  for (const r of rules) {
    if (r.path === '') continue; // "Disallow:" with nothing means allow everything
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

export const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
export const pageText = (html) => String(html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;|&#160;/g, ' ').replace(/&copy;/g, '©').replace(/\s+/g, ' ');
