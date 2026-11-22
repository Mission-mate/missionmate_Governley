#!/usr/bin/env node
/**
 * One-time helper that copied the Base44 backend functions into Supabase Edge Functions.
 * Kept in the repo so the change is easy to review or repeat:
 *
 *   node scripts/port-base44-functions.mjs <path-to-base44-export>/base44
 *
 * For each function it:
 *   - renames entry.ts -> index.ts (Supabase convention)
 *   - swaps `import { createClientFromRequest } from 'npm:@base44/sdk@…'` for ../_shared/base44.ts
 *   - points ../../shared/ imports at ../_shared/
 *   - wraps the handler with serve() (CORS + caller check) instead of Deno.serve / export default
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(process.argv[2] || '');
const OUT = path.join(ROOT, 'supabase/functions');
// Called by the public membership form (/join), so they must work without signing in.
const PUBLIC = new Set(['getMembershipForm', 'submitMembershipForm']);

if (!fs.existsSync(path.join(SRC, 'functions'))) {
  console.error('Usage: node scripts/port-base44-functions.mjs <base44 folder containing functions/ and shared/>');
  process.exit(1);
}

const SDK_IMPORT = /import\s*\{\s*createClientFromRequest\s*\}\s*from\s*['"]npm:@base44\/sdk@[^'"]+['"];?/;

function convertShared(code) {
  if (/@base44\/sdk/.test(code)) throw new Error('shared file imports the Base44 SDK');
  return code;
}

function convertEntry(name, code) {
  if (!SDK_IMPORT.test(code)) throw new Error(`${name}: Base44 import not found`);
  code = code.replace(SDK_IMPORT, "import { createClientFromRequest, serve } from '../_shared/base44.ts';");
  code = code.replace(/(['"])\.\.\/\.\.\/shared\//g, '$1../_shared/');
  const opts = PUBLIC.has(name) ? ', { public: true }' : '';
  if (/\bDeno\.serve\(/.test(code)) {
    code = code.replace(/\bDeno\.serve\(/, 'serve(');
    if (opts) {
      const end = code.lastIndexOf('});');
      if (end < 0) throw new Error(`${name}: could not find the end of Deno.serve`);
      code = `${code.slice(0, end)}}${opts});${code.slice(end + 3)}`;
    }
  } else if (/export default async function\s*\(/.test(code)) {
    code = code.replace(/export default async function\s*\(/, 'export default async function handler(');
    code = `${code.trimEnd()}\n\nserve(handler${opts});\n`;
  } else {
    throw new Error(`${name}: no Deno.serve or export default handler`);
  }
  return code;
}

function convertSibling(code) {
  return code.replace(/(['"])\.\.\/\.\.\/shared\//g, '$1../_shared/');
}

fs.mkdirSync(path.join(OUT, '_shared'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'shared'))) {
  const code = fs.readFileSync(path.join(SRC, 'shared', f), 'utf8');
  fs.writeFileSync(path.join(OUT, '_shared', f), convertShared(code));
}

const ported = [];
for (const name of fs.readdirSync(path.join(SRC, 'functions')).sort()) {
  const dir = path.join(SRC, 'functions', name);
  if (!fs.statSync(dir).isDirectory()) continue;
  fs.mkdirSync(path.join(OUT, name), { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    if (f === 'entry.ts') fs.writeFileSync(path.join(OUT, name, 'index.ts'), convertEntry(name, code));
    else fs.writeFileSync(path.join(OUT, name, f), convertSibling(code));
  }
  ported.push(name);
}
console.log(`Ported ${ported.length} functions:`, ported.join(', '));
