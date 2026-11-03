import { spawn } from 'node:child_process';
import { open, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = await mkdtemp(path.join(tmpdir(), 'cipherium-journeys-'));
const logPath = path.join(logDir, 'backend.log');
const testLogPath = path.join(logDir, 'journeys.log');
const log = (await open(logPath, 'wx')).createWriteStream();
const testLog = (await open(testLogPath, 'wx')).createWriteStream();
let logError;
for (const stream of [log, testLog]) stream.on('error', error => { logError ??= error; });
const python = process.env.INTEGRATION_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
let backend;
let tests;
let stopping;

// Retain a completion promise from spawn onward. This handles missing executables
// and already-exited children without waiting for an event that happened earlier.
function launch(command, args, options) {
  const child = spawn(command, args, options);
  const owned = { child, settled: false, done: null };
  owned.done = new Promise(resolve => {
    const complete = result => {
      if (owned.settled) return;
      owned.settled = true;
      resolve(result);
    };
    child.once('error', error => complete({ error, code: null, signal: null }));
    child.once('close', (code, signal) => complete({ code, signal }));
  });
  child.stdin?.on('error', () => {}); // A child may exit before graceful shutdown.
  return owned;
}

async function waitFor(owned, milliseconds) {
  if (!owned || owned.settled) return true;
  let timer;
  const ended = await Promise.race([
    owned.done.then(() => true),
    new Promise(resolve => { timer = setTimeout(() => resolve(false), milliseconds); }),
  ]);
  clearTimeout(timer);
  return ended;
}

async function terminate(owned, graceful = false) {
  if (!owned || owned.settled || !owned.child.pid) return;
  if (graceful && owned.child.stdin?.writable) {
    // Python closes SQLite and removes its TemporaryDirectory on all platforms.
    owned.child.stdin.end('shutdown\n');
    if (await waitFor(owned, 10000)) return;
  }
  if (!owned.settled) owned.child.kill('SIGTERM');
  if (await waitFor(owned, 5000)) return;
  if (!owned.settled) owned.child.kill('SIGKILL');
  if (!(await waitFor(owned, 5000))) {
    throw new Error('An owned integration child did not stop; inspect retained diagnostics');
  }
}

async function closeLog(stream) {
  if (stream.destroyed || stream.writableFinished) return;
  await new Promise(resolve => {
    stream.once('finish', resolve);
    stream.once('error', resolve);
    stream.end();
  });
}

function stop() {
  stopping ??= (async () => {
    try { await terminate(tests); }
    finally {
      try { await terminate(backend, true); }
      finally { await Promise.all([closeLog(log), closeLog(testLog)]); }
    }
  })();
  return stopping;
}

for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(signal, () => {
    console.error(`Interrupted; diagnostics retained in ${logDir}`);
    stop().catch(error => console.error(error.message)).finally(() => process.exit(code));
  });
}

function readiness(owned) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    const timeout = setTimeout(() => complete(new Error('Backend did not become ready within 90 seconds')), 90000);
    const complete = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      owned.child.stdout.off('data', parse);
      if (error) reject(error); else resolve(value);
    };
    const parse = chunk => {
      buffer += chunk.toString();
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.startsWith('INTEGRATION_READY:')) {
          try { complete(null, JSON.parse(line.slice('INTEGRATION_READY:'.length))); }
          catch (error) { complete(error); }
        }
      }
      if (buffer.length > 65536) complete(new Error('Unexpected oversized backend startup line'));
    };
    owned.child.stdout.on('data', parse);
    owned.done.then(result => complete(result.error ?? new Error(`Backend exited before ready (${result.code ?? result.signal})`)));
  });
}

try {
  backend = launch(python, ['-u', path.join(frontend, 'integration/backend_server.py')], {
    cwd: frontend, env: { ...process.env, PYTHONUNBUFFERED: '1' }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  backend.child.stderr.pipe(log, { end: false });
  backend.child.stdout.pipe(log, { end: false });
  const ready = await readiness(backend);
  const parsed = new URL(ready.url);
  if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' ||
      parsed.username || parsed.password || parsed.search || parsed.hash ||
      parsed.pathname !== '/' || !parsed.port || Number(parsed.port) < 1 ||
      Number(parsed.port) > 65535 || ready.url !== parsed.origin) {
    throw new Error('Backend returned an invalid loopback URL');
  }
  const url = parsed.origin;
  console.log(`Real backend ready at ${url}; disposable database; external services disabled.`);
  tests = launch(process.execPath, [path.join(frontend, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.integration.config.js'], {
    cwd: frontend,
    env: { ...process.env, VITE_API_URL: url, CIPHERIUM_INTEGRATION_URL: url },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  tests.child.stdout.pipe(process.stdout, { end: false });
  tests.child.stderr.pipe(process.stderr, { end: false });
  tests.child.stdout.pipe(testLog, { end: false });
  tests.child.stderr.pipe(testLog, { end: false });
  const result = await Promise.race([
    tests.done,
    backend.done.then(value => { throw value.error ?? new Error(`Backend exited during journeys (${value.code ?? value.signal})`); }),
  ]);
  if (result.error) throw result.error;
  if (result.code !== 0) throw new Error(`Integration journeys failed (${result.code ?? result.signal})`);
  await stop();
  if (logError) throw logError;
  await rm(logDir, { recursive: true, force: true });
} catch (error) {
  console.error(error.message);
  console.error(`Diagnostics retained at ${logPath} and ${testLogPath} (test-only accounts/data).`);
  try { await stop(); } catch (cleanupError) { console.error(cleanupError.message); }
  process.exitCode = 1;
}
