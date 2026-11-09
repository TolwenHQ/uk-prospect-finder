// Tests use FICTIONAL fixture data only (scripts/demo/fixtures.mjs). Nothing goes online.
// Run: npm test   (or: node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { createClient, isCorporateSubscriber } from '../scripts/lib/companies-house.mjs';
import { createWeb, parseRobots, isAllowed } from '../scripts/lib/web.mjs';
import { parseSectors, matchSector, sicCodes } from '../scripts/lib/sectors.mjs';
import { parseAreas, inArea, parseAge, ageWindow, dropReason, profileDropReason } from '../scripts/lib/filter.mjs';
import { slugs, matchEvidence, looksLikeDirectory } from '../scripts/lib/domain-probe.mjs';
import { pageFacts } from '../scripts/lib/site-check.mjs';
import { scoreCompany, STATUS } from '../scripts/lib/score.mjs';
import { findProspects } from '../scripts/lib/pipeline.mjs';
import { readEnv, keyHelp } from '../scripts/lib/env.mjs';
import { fakeFetch, fakeResolve } from '../scripts/demo/fake-network.mjs';
import { SEARCH_ITEMS } from '../scripts/demo/fixtures.mjs';

const CLI = fileURLToPath(new URL('../scripts/find-prospects.mjs', import.meta.url));
const NOW = new Date('2026-11-08T12:00:00Z');
const tmp = () => mkdtempSync(join(tmpdir(), 'upf-test-'));

test('PECR gate: only Ltd, LLP, PLC and companies limited by guarantee count as corporate subscribers', () => {
  for (const t of ['ltd', 'llp', 'plc', 'LTD', 'private-limited-guarant-nsc']) assert.equal(isCorporateSubscriber(t), true, t);
  for (const t of ['private-unlimited', 'limited-partnership', 'scottish-partnership', 'sole-trader', '', undefined, 'other']) assert.equal(isCorporateSubscriber(t), false, String(t));
});

test('sectors: plain English and SIC codes', () => {
  const s = parseSectors('plumbers, electricians, 96020');
  assert.deepEqual(s.map((x) => x.key), ['plumbing', 'electrical', '96020']);
  assert.deepEqual(sicCodes(s), ['43220', '43210', '96020']);
  assert.equal(parseSectors('dog groomers')[0].key, 'dog-grooming');
  assert.throws(() => parseSectors('astronauts'), /don't know the sector "astronauts"/);
  assert.throws(() => parseSectors(''), /Say which sector/);
});

test('sectors: broad SIC codes also need a matching word in the name', () => {
  const s = parseSectors('dog groomers');
  assert.ok(matchSector(s, 'PAWS AND CLAWS LTD', ['96090']));
  assert.equal(matchSector(s, 'ACME CONSULTING LTD', ['96090']), null);
});

test('areas: postcode districts match exactly, towns by address', () => {
  const [ls1] = parseAreas('ls1');
  assert.deepEqual(ls1, { kind: 'district', value: 'LS1' });
  assert.equal(inArea(ls1, { postal_code: 'LS1 4AB' }), true);
  assert.equal(inArea(ls1, { postal_code: 'LS10 4AB' }), false);
  const [town] = parseAreas('Demoton');
  assert.equal(town.kind, 'town');
  assert.equal(inArea(town, { locality: 'Demoton', postal_code: 'ZZ1 1AA' }), true);
  assert.equal(inArea(town, { locality: 'Othertown', postal_code: 'ZZ2 1AA' }), false);
});

test('age range becomes an incorporation window', () => {
  assert.deepEqual(parseAge('2-15'), { min: 2, max: 15 });
  assert.deepEqual(parseAge('15-2'), { min: 2, max: 15 });
  assert.deepEqual(parseAge('5+'), { min: 5, max: 100 });
  assert.throws(() => parseAge('old'), /not understood/);
  assert.deepEqual(ageWindow({ min: 2, max: 15 }, NOW), { incorporatedFrom: '2011-11-08', incorporatedTo: '2024-11-08' });
});

test('filters drop the right companies', () => {
  const byNum = Object.fromEntries(SEARCH_ITEMS.map((c) => [c.company_number, c]));
  assert.equal(dropReason(byNum.ZZ000002), null);
  assert.match(dropReason(byNum.ZZ000006), /holding/);
  assert.match(dropReason(byNum.ZZ000008), /not a limited company/);
  assert.match(dropReason({ ...byNum.ZZ000002, company_status: 'dissolved' }), /not active/);
  assert.match(dropReason(byNum.ZZ000002, { window: { incorporatedFrom: '2020-01-01', incorporatedTo: '2026-01-01' } }), /age range/);
  assert.match(dropReason({ ...byNum.ZZ000002, company_name: 'SUBWAY DEMOTON LTD' }), /chain/);
  assert.match(profileDropReason({ company_status: 'active', type: 'ltd', accounts: { last_accounts: { type: 'dormant' } } }), /dormant/);
  assert.match(profileDropReason({ company_status: 'active', type: 'ltd', has_insolvency_history: true }), /insolvency/);
  assert.equal(profileDropReason({ company_status: 'active', type: 'llp' }), null);
});

test('Companies House client: waits at least 700 ms between requests, sends the key only in the header', async () => {
  const calls = [];
  let clock = 0;
  const ch = createClient({ key: 'test-key-123', fetch: fakeFetch({ calls }), now: () => clock, sleep: async (ms) => { clock += ms; } });
  await ch.advancedSearch({ location: 'ZZ1' });
  for (let i = 0; i < 5; i++) await ch.profile('ZZ000001');
  assert.equal(ch.requests, 6);
  assert.ok(clock >= 5 * 700, `clock ${clock}`);
  for (const c of calls) {
    assert.ok(!c.url.includes('test-key-123'), 'key must never be in a URL');
    assert.equal(c.headers.Authorization, 'Basic ' + Buffer.from('test-key-123:').toString('base64'));
  }
});

test('Companies House client: a rejected key gives a plain-English error', async () => {
  const fetch = async (url) => ({ status: 401, ok: false, url, text: async () => '' });
  const ch = createClient({ key: 'bad', fetch, sleep: async () => {} });
  await assert.rejects(() => ch.profile('ZZ000001'), /did not accept your API key/);
});

test('robots.txt: our own rules win over "*", longest match wins', () => {
  const rules = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: tolwen-prospect-finder\nDisallow: /private\nAllow: /private/ok');
  assert.equal(isAllowed(rules, '/'), true);
  assert.equal(isAllowed(rules, '/private/x'), false);
  assert.equal(isAllowed(rules, '/private/ok/page'), true);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow: /'), '/'), false);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow:'), '/'), true);
});

test('domain probe: candidate addresses and the identity check', () => {
  assert.ok(slugs('Brackenfold Plumbing & Heating Ltd').includes('brackenfoldplumbing'));
  assert.ok(slugs('ZQ (Demoton) Ltd').includes('zqdemoton'), 'very short names fall back to the words in brackets');
  assert.ok(!slugs('Quillmoor Joinery (Demoton) Ltd').some((s) => s.includes('demoton')), 'brackets are left out when the name is long enough');
  assert.match(scoreCompany({ probe: { website: null, tried: [] } }).reasons[0], /too short to guess/);
  const co = { name: 'Ottercombe Hair Studio', number: 'ZZ000005', postcode: 'ZZ1 6JK', town: 'Demoton' };
  assert.equal(matchEvidence(co, '<p>Ottercombe Hair Studio, High Street, Demoton</p>'), 'name and town on page');
  assert.equal(matchEvidence(co, '<p>Ottercombe Hair Studio</p>'), null, 'name alone is not enough');
  assert.equal(matchEvidence(co, '<p>Visit us at ZZ1 6JK</p>'), 'registered postcode ZZ1 6JK on page');
  assert.equal(matchEvidence(co, '<p>Company number ZZ000005</p>'), 'company number ZZ000005 on page');
  assert.equal(matchEvidence(co, '<p>This domain is for sale. Ottercombe Hair Studio Demoton</p>'), null);
  assert.equal(looksLikeDirectory('london leeds york hull derby stoke bristol oxford cambridge'), true);
});

test('site check facts: https, viewport, contact details, copyright year', () => {
  const f = pageFacts('<html><head><meta name="viewport" content="width=device-width"></head><body><a href="tel:01632960000">Call</a> © 2019-2023</body></html>', 'https://a.example/', 'https://a.example/');
  assert.equal(f.https, true);
  assert.equal(f.viewport, true);
  assert.equal(f.contact.phone, true);
  assert.equal(f.copyrightYear, 2023);
  const g = pageFacts('<html><body>Hello</body></html>', 'http://b.example/', 'http://b.example/');
  assert.equal(g.https, false);
  assert.equal(g.viewport, false);
  assert.equal(g.contact.any, false);
  assert.equal(pageFacts('<html><script src="https://static.wixstatic.com/x.js"></script></html>', 'https://c.example/', 'https://c.example/').viewport, null, 'site builders: unknown, not "no"');
});

test('scoring: every status has a reason, and weaker sites score higher', () => {
  const none = scoreCompany({ probe: { website: null, tried: ['x.co.uk'] } }, { now: NOW });
  const weak = scoreCompany({ probe: { website: 'http://x.example/' }, site: { https: false, viewport: false, contact: { any: false }, copyrightYear: 2015, words: 300 } }, { now: NOW });
  const fine = scoreCompany({ probe: { website: 'https://x.example/' }, site: { https: true, redirectsToHttps: true, viewport: true, contact: { any: true, phone: true }, copyrightYear: 2026, words: 400 } }, { now: NOW });
  const dead = scoreCompany({ probe: { website: 'https://x.example/' }, site: { error: 'ENOTFOUND: x' } }, { now: NOW });
  assert.equal(none.status, STATUS.NONE);
  assert.equal(weak.status, STATUS.WEAK);
  assert.equal(fine.status, STATUS.OK);
  assert.equal(dead.status, STATUS.DEAD);
  assert.ok(dead.score > weak.score && weak.score > fine.score);
  for (const r of [none, weak, fine, dead]) assert.ok(r.reasons.length && r.reasons.every((x) => x.length > 10));
});

test('end to end on fixtures: right companies, right order, files written, no personal data', async () => {
  const out = tmp();
  try {
    const fetch = fakeFetch();
    const ch = createClient({ key: 'demo', fetch, minGapMs: 0 });
    const web = createWeb({ fetch, resolve: fakeResolve(), perHostGapMs: 0 });
    const { rows, files, meta } = await findProspects({
      sectors: parseSectors('plumbing, electrical, roofing, joinery, hair, cleaning, landscaping, building'),
      areas: parseAreas('ZZ1'), age: parseAge('0-30'), limit: 25, outDir: out, tlds: ['example'], rank: 'website-need',
    }, { ch, web, now: NOW, log: () => {} });
    const nums = rows.map((r) => r.number);
    assert.deepEqual(nums.slice(0, 3), ['ZZ000004', 'ZZ000002', 'ZZ000001']);
    for (const dropped of ['ZZ000006', 'ZZ000008', 'ZZ000009', 'ZZ000011', 'ZZ000012']) assert.ok(!nums.includes(dropped), dropped);
    assert.ok(rows.every((r) => ['ltd', 'llp', 'plc'].includes(r.type)));
    assert.equal(meta.found, 11);
    const csv = readFileSync(files.csv, 'utf8');
    const md = readFileSync(files.md, 'utf8');
    assert.match(csv, /^"rank","company","company number"/);
    assert.match(md, /DEMO: fictional companies|# Prospects 2026-11-08/);
    assert.match(md, /Before you contact anyone/);
    assert.doesNotMatch(csv + md, /Station Road|Mill Yard|director/i, 'no street addresses or people in the output');
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('limit: only that many companies are checked', async () => {
  const fetch = fakeFetch();
  const out = tmp();
  try {
    const { rows, meta } = await findProspects({
      sectors: parseSectors('plumbing, electrical, roofing, joinery, hair, cleaning, landscaping'), areas: parseAreas('ZZ1'), age: parseAge('0-30'),
      limit: 2, outDir: out, tlds: ['example'],
    }, { ch: createClient({ key: 'demo', fetch, minGapMs: 0 }), web: createWeb({ fetch, resolve: fakeResolve(), perHostGapMs: 0 }), now: NOW, log: () => {} });
    assert.equal(rows.length, 2);
    assert.ok(meta.notChecked > 0);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('missing key: the CLI explains how to get one and exits with an error', () => {
  const dir = tmp();
  try {
    const r = spawnSync(process.execPath, [CLI, '--sector', 'plumbing', '--area', 'ZZ1'], { cwd: dir, encoding: 'utf8', env: { ...process.env, COMPANIES_HOUSE_API_KEY: '' } });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /No Companies House API key found/);
    assert.match(r.stderr, /developer\.company-information\.service\.gov\.uk/);
    writeFileSync(join(dir, '.env.txt'), 'COMPANIES_HOUSE_API_KEY=abc');
    assert.match(keyHelp(dir), /Rename the file to just "\.env"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('.env is read from the folder you run in', () => {
  const dir = tmp();
  try {
    writeFileSync(join(dir, '.env'), '﻿OTHER=1\nUPF_TEST_KEY="from-file"\n');
    assert.equal(readEnv('UPF_TEST_KEY', { cwd: dir }), 'from-file');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('CLI: --demo runs offline and --list-sectors works', () => {
  const dir = tmp();
  try {
    const out = execFileSync(process.execPath, [CLI, '--demo'], { cwd: dir, encoding: 'utf8' });
    assert.match(out, /DEMO MODE/);
    assert.match(out, /Fernhallow Roofing/);
    assert.match(execFileSync(process.execPath, [CLI, '--list-sectors'], { encoding: 'utf8' }), /plumbing\s+Plumbing and heating/);
    const bad = spawnSync(process.execPath, [CLI, '--demo', '--sector', 'astronauts'], { cwd: dir, encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /don't know the sector/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
