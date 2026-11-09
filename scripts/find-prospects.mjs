#!/usr/bin/env node
// Tolwen Prospect Finder: find active UK limited companies in an area and sector, and flag which have no website
// or a weak one. Writes prospects-<date>.csv and prospects-<date>.md into ./prospects (or --out).
//
//   node scripts/find-prospects.mjs --sector plumbing --area LS6,LS7
//   node scripts/find-prospects.mjs --preset web-design --area "Harrogate" --limit 40
//   node scripts/find-prospects.mjs --demo             (fictional data, no key needed, nothing goes online)
//   node scripts/find-prospects.mjs --list-sectors
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { readEnv, keyHelp, FriendlyError, TOOL_ROOT } from './lib/env.mjs';
import { createClient } from './lib/companies-house.mjs';
import { createWeb } from './lib/web.mjs';
import { parseSectors, listSectors } from './lib/sectors.mjs';
import { parseAreas, parseAge } from './lib/filter.mjs';
import { findProspects } from './lib/pipeline.mjs';

const HELP = `Tolwen Prospect Finder: find active UK limited companies with no website or a weak one.

Usage:
  node scripts/find-prospects.mjs --sector <trades or SIC codes> --area <postcode districts or a town> [options]

Options:
  --sector   plumbing, electrical, "dog groomers", 43220 ...   (see --list-sectors)
  --area     LS6,LS7  or  "Harrogate"
  --age      company age in years, e.g. 2-15 or 5+               (default 0-30)
  --limit    how many companies to check                         (default 25, max 200)
  --preset   ${presetNames().join(' | ')}
  --out      folder for the results                              (default ./prospects)
  --demo     run on fictional demo data (no key, nothing goes online)
  --list-sectors   show every sector name you can use
`;

function presetNames() {
  try { return readdirSync(join(TOOL_ROOT, 'presets')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)); } catch { return []; }
}
function loadPreset(name) {
  const f = join(TOOL_ROOT, 'presets', `${name}.json`);
  if (!existsSync(f)) throw new FriendlyError(`There is no preset called "${name}". Choose one of: ${presetNames().join(', ')}.`);
  return JSON.parse(readFileSync(f, 'utf8'));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { (out._ ||= []).push(a); continue; }
    const [k, inline] = a.slice(2).split(/=(.*)/s);
    if (inline !== undefined) out[k] = inline;
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { console.log(HELP); return; }
  if (args['list-sectors']) { console.log('Sectors you can use with --sector (or pass any 5-digit SIC code):\n' + listSectors()); return; }

  const [major] = process.versions.node.split('.').map(Number);
  if (major < 18) throw new FriendlyError(`This tool needs Node.js 18 or newer (you have ${process.versions.node}). Install the LTS version from https://nodejs.org/`);

  const demo = !!args.demo;
  const preset = args.preset ? loadPreset(args.preset) : null;
  let { DEMO_DEFAULTS } = demo ? await import('./demo/fixtures.mjs') : {};
  const sectorInput = args.sector || preset?.sectors?.join(', ') || DEMO_DEFAULTS?.sector;
  const areaInput = args.area || DEMO_DEFAULTS?.area;
  let sectors; let areas; let age;
  try {
    sectors = parseSectors(sectorInput);
    areas = parseAreas(areaInput);
    age = parseAge(args.age ?? preset?.age ?? DEMO_DEFAULTS?.age ?? '0-30');
  } catch (e) { throw new FriendlyError(e.message); }
  const limit = Math.min(200, Math.max(1, Number(args.limit ?? preset?.limit ?? 25) || 25));
  const outDir = resolve(args.out || 'prospects');

  let ch; let web;
  if (demo) {
    const { fakeFetch, fakeResolve } = await import('./demo/fake-network.mjs');
    const fetch = fakeFetch();
    ch = createClient({ key: 'demo', fetch, minGapMs: 120 });
    web = createWeb({ fetch, resolve: fakeResolve(), perHostGapMs: 0 });
    console.log('DEMO MODE: fictional companies and websites, nothing is sent over the internet.\n');
  } else {
    const key = readEnv('COMPANIES_HOUSE_API_KEY');
    if (!key) throw new FriendlyError(keyHelp());
    ch = createClient({ key });
    web = createWeb();
  }

  const { rows, meta, files } = await findProspects({
    sectors, areas, age, limit, outDir, demo, rank: preset?.rank || 'website-need', preset: preset?.name,
    tlds: demo ? ['example'] : ['co.uk', 'com', 'uk'],
  }, { ch, web });

  console.log('');
  if (!rows.length) {
    console.log('No matching companies this time. Try a wider area (more postcode districts), a wider --age, or more sectors.');
  } else {
    const w = Math.min(34, Math.max(...rows.map((r) => r.name.length)));
    console.log(`Top ${Math.min(10, rows.length)} of ${rows.length}, best first:`);
    for (const r of rows.slice(0, 10)) console.log(`  ${String(r.rank).padStart(2)}. ${r.name.slice(0, w).padEnd(w)}  ${String(r.score).padStart(3)}  ${r.status}`);
    if (meta.notChecked > 0) console.log(`\n${meta.notChecked} more matched but were not checked this run. Raise --limit to check more.`);
  }
  const show = (f) => { const r = relative(process.cwd(), f); return r && !r.startsWith('..') && !isAbsolute(r) ? r : f; };
  console.log(`\nSaved:\n  ${show(files.md)}\n  ${show(files.csv)}`);
  console.log('\nNobody has been contacted. Before you email anyone, read the compliance notes in the README.');
}

main().catch((e) => {
  if (e instanceof FriendlyError) console.error('\n' + e.message);
  else console.error(`\nSomething went wrong: ${e.message}\nIf it keeps happening, open an issue at https://github.com/TolwenHQ/uk-prospect-finder/issues (don't paste your API key).`);
  process.exitCode = 1;
});
