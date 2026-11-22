#!/usr/bin/env node
/**
 * A few pictures (illustrated avatars, the strategy banner) are still loaded from Base44's
 * image server (media.base44.com). Run this ONCE on your computer to copy them into
 * public/images and point the code at the local copies:
 *
 *   node scripts/copy-base44-images.mjs
 *
 * Then commit the changed files and the new images.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/components/settings/IllustratedAvatar.jsx', 'src/pages/modules/strategy/StrategyDetail.jsx'];
const URL_RE = /https:\/\/media\.base44\.com\/images\/public\/[A-Za-z0-9]+\/([A-Za-z0-9_.-]+)/g;
const outDir = path.join(ROOT, 'public/images');
fs.mkdirSync(outDir, { recursive: true });

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  let code = fs.readFileSync(file, 'utf8');
  const urls = [...new Set([...code.matchAll(URL_RE)].map((m) => m[0]))];
  for (const url of urls) {
    const name = url.split('/').pop();
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Could not download ${url} (${res.status}) — left as is.`);
      continue;
    }
    fs.writeFileSync(path.join(outDir, name), Buffer.from(await res.arrayBuffer()));
    code = code.split(url).join(`/images/${name}`);
    console.log(`saved public/images/${name}`);
  }
  fs.writeFileSync(file, code);
}
console.log('Done.');
