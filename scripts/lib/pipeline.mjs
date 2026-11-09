// The whole prospect-finder run: search, filter, probe for a website, check it, score it, write the report.
// Everything that talks to the network comes in through `ctx`, so tests and the demo can run offline.
import { sicCodes, matchSector } from './sectors.mjs';
import { inArea, ageWindow, dropReason, profileDropReason, titleCase, postcodeOf } from './filter.mjs';
import { probe } from './domain-probe.mjs';
import { checkSite } from './site-check.mjs';
import { scoreCompany, ranker } from './score.mjs';
import { writeReport } from './report.mjs';

// A stable pseudo-random order, so the same search gives the same sample.
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(n, queue.length) }, async () => { for (let it = queue.shift(); it; it = queue.shift()) await fn(it); }));
}

export async function findProspects(opts, ctx) {
  const { ch, web, log = console.log, now = new Date() } = ctx;
  const date = opts.date || now.toISOString().slice(0, 10);
  const window = ageWindow(opts.age, now);
  const codes = sicCodes(opts.sectors);
  const dropReasons = {};
  const bump = (k) => { dropReasons[k] = (dropReasons[k] || 0) + 1; };

  // 1. Search Companies House.
  log(`1/5 Searching Companies House for ${opts.sectors.map((s) => s.label).join(', ')} in ${opts.areas.map((a) => a.value).join(', ')} (incorporated ${window.incorporatedFrom} to ${window.incorporatedTo})...`);
  const found = new Map();
  for (const area of opts.areas) {
    let start = 0; let hits = 0; let pages = 0; let inThisArea = 0;
    do {
      const res = await ch.advancedSearch({
        company_status: 'active', company_type: 'ltd,llp,plc', location: area.value, sic_codes: codes.join(','),
        incorporated_from: window.incorporatedFrom, incorporated_to: window.incorporatedTo, size: 500, start_index: start,
      });
      hits = res?.hits ?? 0;
      const items = res?.items ?? [];
      for (const c of items) if (inArea(area, c.registered_office_address) && !found.has(c.company_number)) { found.set(c.company_number, c); inThisArea++; }
      start += items.length; pages++;
      if (!items.length) break;
    } while (start < hits && pages < 10);
    log(`    ${area.value}: ${inThisArea} companies registered in the area`);
  }

  // 2. Filter: active, limited types, age range, sector, not holding companies or chains.
  const candidates = [];
  for (const c of found.values()) {
    const sector = matchSector(opts.sectors, c.company_name, c.sic_codes);
    const why = dropReason(c, { window }) || (sector ? null : 'not in the chosen sectors');
    if (why) { bump(why.replace(/ \(.*\)$/, '')); continue; }
    candidates.push({ c, sector });
  }
  const order = opts.rank === 'oldest' ? (a, b) => String(a.c.date_of_creation).localeCompare(String(b.c.date_of_creation))
    : opts.rank === 'newest' ? (a, b) => String(b.c.date_of_creation).localeCompare(String(a.c.date_of_creation))
      : (a, b) => hash(a.c.company_number) - hash(b.c.company_number);
  candidates.sort(order);
  log(`2/5 Filtering: ${candidates.length} possible, checking company records (up to ${opts.limit})...`);

  const kept = [];
  let checked = 0;
  for (const { c, sector } of candidates) {
    if (kept.length >= opts.limit) break;
    checked++;
    const p = await ch.profile(c.company_number);
    const why = profileDropReason(p);
    if (why) { bump(why.replace(/ \(.*\)$/, '')); continue; }
    const a = c.registered_office_address || {};
    kept.push({
      number: c.company_number, companyName: c.company_name, name: titleCase(c.company_name), type: p.type,
      incorporated: c.date_of_creation, sector: sector.label, sic: (c.sic_codes || []).join(' '),
      town: titleCase(a.locality || a.address_line_2 || ''), postcode: postcodeOf(a), district: postcodeOf(a).split(' ')[0],
      chLink: `https://find-and-update.company-information.service.gov.uk/company/${c.company_number}`,
    });
  }
  const notChecked = candidates.length - checked; // matched, but over --limit this run

  // 3 and 4. Look for each company's website, then check it.
  log(`3/5 Looking for websites for ${kept.length} companies...`);
  const results = new Map();
  await pool(kept, 4, async (k) => {
    const pr = await probe(k, web, { tlds: opts.tlds });
    const site = pr.website ? await checkSite(pr.website, web) : null;
    results.set(k.number, { probe: pr, site });
    log(`    ${k.name}: ${pr.website ? pr.website : pr.robotsBlocked ? 'site found, robots.txt says no' : 'no website found'}`);
  });
  log('4/5 Checked each site for HTTPS, phone layout, contact details and copyright year.');

  // 5. Score and write.
  const rows = kept.map((k) => {
    const r = results.get(k.number);
    const s = scoreCompany(r, { now });
    return { ...k, website: r.probe.website || r.probe.robotsBlocked || '', matchedBy: r.probe.matchedBy || '', ...s, checked: date };
  }).sort(ranker(opts.rank)).map((r, i) => ({ ...r, rank: i + 1 }));

  const meta = {
    date, demo: !!opts.demo, preset: opts.preset, sectors: opts.sectors.map((s) => s.label).join(', '),
    areas: opts.areas.map((a) => a.value).join(', '), age: `${opts.age.min} to ${opts.age.max >= 100 ? 'any' : opts.age.max} years`,
    found: found.size, dropped: Object.values(dropReasons).reduce((x, y) => x + y, 0), dropReasons, notChecked,
  };
  const files = writeReport(rows, meta, opts.outDir);
  log(`5/5 Scored and ranked ${rows.length} companies (Companies House requests: ${ch.requests}).`);
  return { rows, meta, files };
}
