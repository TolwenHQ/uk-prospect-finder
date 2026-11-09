// Reads settings such as COMPANIES_HOUSE_API_KEY from the environment or a .env file.
// Looks in: the environment, then .env in the folder you run from, then .env next to this tool.
// Values are returned to the caller only: never print, log or write them anywhere.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOOL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// An error meant for a non-coder: printed on its own, without a stack trace.
export class FriendlyError extends Error {}

export function envFiles(cwd = process.cwd()) {
  return [...new Set([resolve(cwd, '.env'), resolve(TOOL_ROOT, '.env')])];
}

export function readEnv(name, { cwd = process.cwd() } = {}) {
  if (process.env[name] && process.env[name].trim()) return process.env[name].trim();
  for (const f of envFiles(cwd)) {
    if (!existsSync(f)) continue;
    const line = readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/).find((l) => l.trim().startsWith(name + '='));
    if (!line) continue;
    const v = line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    if (v) return v;
  }
  return '';
}

export function keyHelp(cwd = process.cwd()) {
  const notepad = [resolve(cwd, '.env.txt'), resolve(TOOL_ROOT, '.env.txt')].find((f) => existsSync(f));
  return [
    'No Companies House API key found.',
    '',
    notepad ? `Found ${notepad}: Windows Notepad added ".txt". Rename the file to just ".env" and try again.\n` : '',
    'The key is free. To get one (about 5 minutes):',
    '  1. Go to https://developer.company-information.service.gov.uk/ and create an account.',
    '  2. Choose "Your applications", then "Create an application" (any name, choose the Live environment).',
    '  3. Choose "Create new key", pick "REST", and copy the key.',
    '',
    'In Claude Code: copy the key, then tell Claude "I have copied my Companies House key". It saves it without the key entering the chat.',
    '',
    'In a terminal: run this and paste the key when asked:',
    `  node "${resolve(TOOL_ROOT, 'scripts', 'setup-key.mjs')}"`,
    '',
    'Or make a file called .env in this folder containing one line:',
    '  COMPANIES_HOUSE_API_KEY=your-key-here',
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}
