// Step 6: write prospects-<date>.csv and prospects-<date>.md (best first, with the reason for each score).
// Business details only: no director names, no home addresses, no personal data.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const COLS = [
  ['rank', 'rank'], ['company', 'name'], ['company number', 'number'], ['company type', 'type'], ['incorporated', 'incorporated'],
  ['sector', 'sector'], ['sic codes', 'sic'], ['town', 'town'], ['postcode district', 'district'], ['website', 'website'],
  ['website found by', 'matchedBy'], ['status', 'status'], ['score 0-100', 'score'], ['reasons', 'reasons'], ['checked', 'checked'],
  ['companies house link', 'chLink'],
];
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function toCsv(rows) {
  return [COLS.map((c) => q(c[0])).join(','), ...rows.map((r) => COLS.map(([, k]) => q(Array.isArray(r[k]) ? r[k].join(' ') : r[k])).join(','))].join('\r\n') + '\r\n';
}

export function toMarkdown(rows, meta) {
  const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
  const lines = [
    `# Prospects ${meta.date}${meta.demo ? ' (DEMO: fictional companies)' : ''}`,
    '',
    `Sector: ${meta.sectors}. Area: ${meta.areas}. Company age: ${meta.age}. Preset: ${meta.preset || 'none'}.`,
    '',
    `Active limited companies only (Ltd, LLP, PLC), from Companies House. ${meta.found} matched the search, ${meta.dropped} were filtered out, ${rows.length} were checked.`,
    'Nobody has been contacted. Scores describe what an automated check saw on one day: look before you rely on them.',
    '',
    '| # | Company | Town | Website | Status | Score | Why |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.rank} | ${cell(r.name)} ([${r.number}](${r.chLink})) | ${cell(r.town)} | ${r.website ? cell(r.website) : 'none found'} | ${r.status} | ${r.score} | ${cell(r.reasons.join(' '))} |`),
    '',
    '## Filtered out',
    '',
    ...(Object.entries(meta.dropReasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`)),
    ...(Object.keys(meta.dropReasons).length ? [] : ['- none']),
    '',
    '## Before you contact anyone',
    '',
    '- Cold marketing email in the UK (PECR) is only allowed to corporate subscribers: limited companies, LLPs and PLCs. This list contains only those. Never cold email a sole trader or partnership without consent.',
    '- Say who you are in every email, give a working way to opt out, and keep a suppression list of anyone who says no.',
    '- Only use contact details the business publishes itself. Check phone numbers against TPS and CTPS before calling.',
    '',
  ];
  return lines.join('\n');
}

export function writeReport(rows, meta, outDir) {
  mkdirSync(outDir, { recursive: true });
  let base = join(outDir, `prospects-${meta.date}${meta.demo ? '-demo' : ''}`);
  for (let k = 2; existsSync(base + '.csv'); k++) base = join(outDir, `prospects-${meta.date}${meta.demo ? '-demo' : ''}-${k}`);
  writeFileSync(base + '.csv', toCsv(rows));
  writeFileSync(base + '.md', toMarkdown(rows, meta));
  return { csv: base + '.csv', md: base + '.md' };
}
