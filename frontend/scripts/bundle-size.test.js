import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { collectInitialFiles, measureInitialJavaScript, assertBudget } from './bundle-budget.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('production initial JS, including every transitive static import, is below 250KB gzip', () => {
  const result = measureInitialJavaScript(dist); // Missing/stale-less build must fail, never skip.
  console.log(JSON.stringify({ chunks: result.chunks, initialGzipBytes: result.gzip }, null, 2));
  assertBudget(result.gzip);
  for (const view of ['AnalyticsFullView', 'KnowledgeGraphView', 'AdminView']) {
    const chunk = result.manifest[`src/components/${view}.jsx`];
    assert.ok(chunk?.isDynamicEntry, `${view} must remain a lazy chunk`);
    assert.ok(!result.chunks.some(({ file }) => file === chunk.file), `${view} must not be eagerly loaded`);
  }
});

test('budget fails at the boundary, not only above it', () => {
  assert.doesNotThrow(() => assertBudget(249999));
  for (const bytes of [250000, 250001, NaN, -1]) assert.throws(() => assertBudget(bytes));
});

test('static closure includes shared chunks once, handles cycles, and excludes lazy imports', () => {
  assert.deepEqual(collectInitialFiles({
    main: { isEntry: true, file: 'main.js', imports: ['shared', 'other'], dynamicImports: ['lazy'] },
    shared: { file: 'shared.js', imports: ['main'] },
    other: { file: 'other.js', imports: ['shared'] },
    lazy: { file: 'lazy.js' },
  }), ['main.js', 'other.js', 'shared.js']);
  assert.throws(() => collectInitialFiles({}));
  assert.throws(() => collectInitialFiles({ main: { isEntry: true, file: 'main.js', imports: ['missing'] } }));
});

test('measurement fails closed for missing artifacts and includes HTML-only modulepreloads', async () => {
  const { mkdtempSync, writeFileSync, mkdirSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { gzipSync } = await import('node:zlib');
  const root = mkdtempSync(join(tmpdir(), 'cipherium-budget-'));
  try {
    assert.throws(() => measureInitialJavaScript(root));
    mkdirSync(join(root, '.vite'));
    writeFileSync(join(root, '.vite/manifest.json'), JSON.stringify({ main: { isEntry: true, file: 'main.js' } }));
    writeFileSync(join(root, 'main.js'), 'console.log("main")');
    writeFileSync(join(root, 'extra.js'), 'console.log("extra")');
    writeFileSync(join(root, 'index.html'), '<script src="/main.js"></script><link rel="modulepreload" href="/extra.js">');
    const result = measureInitialJavaScript(root);
    assert.equal(result.chunks.length, 2);
    assert.equal(result.gzip, gzipSync('console.log("main")').length + gzipSync('console.log("extra")').length);
    writeFileSync(join(root, 'index.html'), '<script src="https://example.test/thirdparty.js"></script>');
    assert.throws(() => measureInitialJavaScript(root), /External/);
    writeFileSync(join(root, 'index.html'), '<script>console.log("inline")</script>');
    assert.throws(() => measureInitialJavaScript(root), /Inline/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
