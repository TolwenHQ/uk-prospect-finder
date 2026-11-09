// Step 4: a basic check of a business's own home page. Is there a site at all, does it use HTTPS, is it set up
// for phones (mobile viewport), are contact details visible, and what copyright year does the footer show.
// One or two requests per site; robots.txt respected; nothing submitted.
import { pageText, hostOf } from './web.mjs';

const PARKED = /(domain (is )?(for sale|parked)|buy this domain|this domain may be for sale|hugedomains|dan\.com|afternic|sedo(parking)?|parkingcrew|bodis|domain has expired|renew (this|your) domain|account (has been )?suspended|website (is )?coming soon|under construction|it works!|index of \/|default web site page|future home of something)/i;
const SPAM = /\b(casino|slots?|gambling|betting|poker|jackpot|viagra|cialis|payday loans?|escort|porn|xxx|crypto ?trading|judi|togel|situs|gacor)\b/gi;
// Site builders that add the mobile viewport with JavaScript; raw HTML can wrongly look "not mobile-friendly".
const BUILDER = /wixstatic|wix\.com|squarespace|shopify|webflow|godaddy|websitebuilder|weebly|jimdo|duda/i;

export function pageFacts(html, finalUrl, requestedUrl) {
  const text = pageText(html);
  const years = [...String(html).matchAll(/(?:©|&copy;|copyright)[^<]{0,40}?((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)].map((m) => Number(m[2] || m[1]));
  const builder = (String(html).match(BUILDER) || [null])[0];
  const viewport = /<meta[^>]+name=["']?viewport["']?/i.test(html);
  const tel = /href=["']tel:/i.test(html) || /(?<![\d])(?:\+44\s?|0)\d{2,4}[\s-]?\d{3}[\s-]?\d{3,4}(?![\d])/.test(text);
  const email = /href=["']mailto:/i.test(html) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const contactPage = /<a[^>]+href=["'][^"']*(contact|get-in-touch|enquir)[^"']*["']/i.test(html);
  const spamHits = (text.match(SPAM) || []).length;
  return {
    https: String(finalUrl).startsWith('https:'),
    offsite: hostOf(finalUrl) !== hostOf(requestedUrl),
    title: (String(html).match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
    viewport: viewport ? true : builder ? null : false, // null = can't tell from raw HTML (site builder)
    builder: builder ? builder.replace(/\..*/, '') : null,
    contact: { phone: tel, email, contactPage, any: tel || email || contactPage },
    copyrightYear: years.length ? Math.max(...years) : null,
    parked: PARKED.test(text.slice(0, 20000)),
    spam: spamHits > 3,
    words: text.split(/\s+/).filter(Boolean).length,
  };
}

export async function checkSite(url, web) {
  const row = { url, checkedAt: new Date().toISOString() };
  if (!(await web.allowed(url).catch(() => true))) { row.robotsBlocked = true; return row; }
  const page = await web.get(url);
  if (page.error) { row.error = page.error; return row; }
  row.status = page.status;
  row.finalUrl = page.finalUrl;
  if (page.status >= 400) return row;
  Object.assign(row, pageFacts(page.body, page.finalUrl, url));
  // An https site should also catch people who type http:// and move them to https.
  if (row.https && !row.offsite) {
    const h = await web.get(url.replace(/^https:/, 'http:'), 10000);
    row.redirectsToHttps = !h.error ? String(h.finalUrl).startsWith('https:') : null;
  }
  return row;
}
