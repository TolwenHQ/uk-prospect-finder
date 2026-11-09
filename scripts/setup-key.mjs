#!/usr/bin/env node
// Saves your Companies House API key to a .env file in the folder you run this from, then tests it.
// The key is never shown on screen or printed.
//
//   node scripts/setup-key.mjs                    asks you to paste it (hidden)
//   node scripts/setup-key.mjs --from-clipboard   reads it from your clipboard (copy the key first). This is the
//                                                 way to do it inside Claude Code, so the key never enters the chat.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { execFileSync } from 'node:child_process';
import { createClient } from './lib/companies-house.mjs';
import { FriendlyError } from './lib/env.mjs';

function askHidden(question) {
  return new Promise((done) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let asked = false;
    rl._writeToOutput = (s) => { if (!asked) { process.stdout.write(s); asked = true; } };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); done(answer.trim()); });
  });
}

function readClipboard() {
  const tries = process.platform === 'win32' ? [['powershell', ['-NoProfile', '-Command', 'Get-Clipboard']]]
    : process.platform === 'darwin' ? [['pbpaste', []]]
      : [['wl-paste', ['--no-newline']], ['xclip', ['-o', '-selection', 'clipboard']], ['xsel', ['--clipboard', '--output']]];
  for (const [cmd, args] of tries) {
    try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* try the next one */ }
  }
  throw new FriendlyError('Could not read your clipboard. Run this in a terminal instead and paste the key when asked:\n  node scripts/setup-key.mjs');
}

async function main() {
  const fromClipboard = process.argv.includes('--from-clipboard');
  const help = 'Get a key free at https://developer.company-information.service.gov.uk/ : Your applications, Create an application, Create new key, REST.';
  let key;
  if (fromClipboard) {
    key = readClipboard().split(/\s+/)[0] || '';
  } else {
    console.log('Paste your Companies House API key and press Enter.');
    console.log(`(${help})`);
    key = await askHidden('Key (hidden): ');
  }
  if (!/^[A-Za-z0-9-]{20,60}$/.test(key)) {
    throw new FriendlyError(`${fromClipboard ? 'What is on your clipboard' : 'That'} does not look like a Companies House key (a long string of letters, numbers and dashes). Copy the key again and retry. Nothing was saved.\n${help}`);
  }

  try {
    const ch = createClient({ key });
    await ch.advancedSearch({ company_name_includes: 'bakery', size: 1 });
  } catch (e) {
    throw new FriendlyError(`${e instanceof FriendlyError ? e.message : `Could not test the key: ${e.message}`}\nNothing was saved.`);
  }

  const envFile = resolve('.env');
  const lines = existsSync(envFile) ? readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('COMPANIES_HOUSE_API_KEY=')) : [];
  lines.push(`COMPANIES_HOUSE_API_KEY=${key}`);
  writeFileSync(envFile, lines.join('\n') + '\n');
  console.log(`Key works. Saved to ${envFile}`);
  if (fromClipboard) console.log('You can copy something else now, so the key is not left on your clipboard.');
  if (existsSync(resolve('.git')) && !(existsSync(resolve('.gitignore')) && /^\.env$/m.test(readFileSync(resolve('.gitignore'), 'utf8')))) {
    console.log('Warning: this folder is a git repository and .env is not in .gitignore. Add a line ".env" to .gitignore so the key is never committed.');
  }
}

main().catch((e) => {
  console.error(e instanceof FriendlyError ? e.message : `Something went wrong: ${e.message}`);
  process.exitCode = 1;
});
