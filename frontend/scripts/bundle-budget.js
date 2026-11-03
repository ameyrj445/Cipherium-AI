import { readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { gzipSync } from 'node:zlib';

export const INITIAL_JS_LIMIT = 250_000; // Decimal kB; strictly below 250 KB.

export function collectInitialFiles(manifest) {
  const visited = new Set();
  const files = new Set();
  const visit = (key) => {
    if (visited.has(key)) return;
    const chunk = manifest[key];
    if (!chunk?.file) throw new Error(`Missing manifest chunk: ${key}`);
    visited.add(key);
    if (/\.m?js$/.test(chunk.file)) files.add(chunk.file);
    for (const dependency of chunk.imports || []) visit(dependency);
    // dynamicImports are fetched only upon navigation, not at initial load.
  };
  const entries = Object.keys(manifest).filter(key => manifest[key].isEntry);
  if (!entries.length) throw new Error('No entry chunks in production manifest');
  entries.forEach(visit);
  return [...files].sort();
}

export function measureInitialJavaScript(dist) {
  const manifest = JSON.parse(readFileSync(resolve(dist, '.vite/manifest.json'), 'utf8'));
  const files = new Set(collectInitialFiles(manifest));
  const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
  if ((html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []).some(tag => {
    const content = tag.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    return content && !/\btype=["']application\/(?:ld\+)?json["']/i.test(tag);
  })) throw new Error('Inline initial JavaScript requires explicit budget accounting');
  // Include explicit HTML scripts/modulepreloads as well as the manifest closure.
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) || []) {
    if (/^<link/i.test(tag) && !/\brel=["']modulepreload["']/i.test(tag)) continue;
    const asset = tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
    if (!asset) continue;
    if (/^(?:https?:)?\/\//.test(asset)) throw new Error('External initial JS cannot be budgeted offline');
    files.add(asset.replace(/^\//, '').split(/[?#]/)[0]);
  }
  const chunks = [...files].sort().map(file => {
    const path = resolve(dist, file);
    const rel = relative(resolve(dist), path);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Invalid bundle path: ${file}`);
    const bytes = readFileSync(path);
    return { file, raw: bytes.length, gzip: gzipSync(bytes).length };
  });
  return { manifest, chunks, gzip: chunks.reduce((sum, chunk) => sum + chunk.gzip, 0) };
}

export function assertBudget(bytes, limit = INITIAL_JS_LIMIT) {
  if (!Number.isFinite(bytes) || bytes < 0 || bytes >= limit) {
    throw new Error(`Initial JavaScript is ${bytes} gzip bytes; must be below ${limit}`);
  }
}
