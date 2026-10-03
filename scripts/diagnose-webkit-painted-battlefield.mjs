import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { extname, resolve, sep } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { webkit } from 'playwright';
import { preparedChronicleProfile } from './simulate-chronicle.ts';
import { BACKUP_KEY, SAVE_KEY } from '../src/game/save.ts';

const output = process.env.QA_OUT ?? 'artifacts/webkit-painted-diagnostic';
const revision = process.env.QA_REVISION ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const viewport = { width: 390, height: 844 };
const roi = { x: 45, y: 180, width: 300, height: 220 };
const paintedStddevMin = 0.15;
mkdirSync(output, { recursive: true });

const root = resolve('dist');
const mime = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  response.setHeader('Cache-Control', 'no-store');
  if (pathname === '/__seed') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><title>QA seed</title>');
    return;
  }
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const origin = `http://127.0.0.1:${server.address().port}`;

const report = {
  revision,
  browser: null,
  viewport,
  oracle: {
    roi,
    paintedStddevMin,
    provenance: 'Fresh current-build artifacts separated painted 0.236249 from blank 0.0777012 at this fixed mobile viewport.',
  },
  started: new Date().toISOString(),
  errors: [],
  captures: [],
  firstBlank: null,
  simulationAdvancedWhileBlank: null,
  recovery: [],
};

let browser;
let context;
try {
  browser = await webkit.launch({ headless: true });
  report.browser = browser.version();
  context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  context.setDefaultTimeout(12_000);
  await context.addInitScript(() => {
    window.__qaRender = { contexts: [], events: [], raf: 0, resize: [] };
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const context = originalGetContext.call(this, type, ...args);
      if (/^webgl2?$/.test(String(type)) && context && !window.__qaRender.contexts.includes(context)) {
        window.__qaRender.contexts.push(context);
        this.addEventListener('webglcontextlost', event => {
          window.__qaRender.events.push({ type: 'lost', at: performance.now(), prevented: event.defaultPrevented });
        });
        this.addEventListener('webglcontextrestored', () => {
          window.__qaRender.events.push({ type: 'restored', at: performance.now() });
        });
      }
      return context;
    };
    const tick = () => {
      window.__qaRender.raf += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({ type: 'console', message: message.text() });
  });

  const profile = preparedChronicleProfile();
  Object.assign(profile, { motion: 'reduced', sound: false });
  await page.goto(`${origin}/__seed`);
  await page.evaluate(({ profile, saveKey, backupKey }) => {
    localStorage.setItem(saveKey, JSON.stringify(profile));
    localStorage.setItem(backupKey, JSON.stringify(profile));
  }, { profile, saveKey: SAVE_KEY, backupKey: BACKUP_KEY });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'ready');
  await page.evaluate(() => {
    const battlefield = document.querySelector('#battlefield');
    if (!battlefield) return;
    window.__qaBattlefieldResizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        window.__qaRender.resize.push({
          at: performance.now(),
          width: rect.width,
          height: rect.height,
        });
      }
    });
    window.__qaBattlefieldResizeObserver.observe(battlefield);
  });

  const twoFrames = () => page.evaluate(() => new Promise(resolveFrame => {
    requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
  }));
  const tap = selector => page.locator(selector).tap();

  async function imageMetrics(buffer) {
    return page.evaluate(async ({ encoded, roi }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${encoded}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context2d = canvas.getContext('2d', { willReadFrequently: true });
      context2d.drawImage(image, 0, 0);
      const pixels = context2d.getImageData(roi.x, roi.y, roi.width, roi.height).data;
      let count = 0;
      let sum = 0;
      let sumSquares = 0;
      const quantized = new Set();
      for (let index = 0; index < pixels.length; index += 4) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        quantized.add(`${r >> 4},${g >> 4},${b >> 4}`);
        for (const channel of [r, g, b]) {
          const value = channel / 255;
          count += 1;
          sum += value;
          sumSquares += value * value;
        }
      }
      const mean = sum / count;
      return {
        width: image.width,
        height: image.height,
        rgbStddev: Math.sqrt(Math.max(0, sumSquares / count - mean * mean)),
        quantizedColors: quantized.size,
      };
    }, { encoded: buffer.toString('base64'), roi });
  }

  async function telemetry() {
    return page.evaluate(() => {
      const battlefield = document.querySelector('#battlefield');
      const view = document.querySelector('#battle-view');
      const canvas = battlefield?.querySelector('canvas');
      const rect = canvas?.getBoundingClientRect();
      const style = canvas ? getComputedStyle(canvas) : null;
      const viewStyle = view ? getComputedStyle(view) : null;
      return {
        phase: document.querySelector('#world')?.dataset.phase ?? null,
        visibilityState: document.visibilityState,
        canvas: canvas ? {
          connected: canvas.isConnected,
          buffer: [canvas.width, canvas.height],
          rect: rect && [rect.x, rect.y, rect.width, rect.height],
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
        } : null,
        battleView: view ? {
          hidden: view.hidden,
          inert: view.inert,
          ariaHidden: view.getAttribute('aria-hidden'),
          display: viewStyle.display,
          visibility: viewStyle.visibility,
          opacity: viewStyle.opacity,
        } : null,
        raf: window.__qaRender?.raf ?? null,
        resize: window.__qaRender?.resize?.slice(-12) ?? [],
        webgl: (window.__qaRender?.contexts ?? []).map(gl => ({
          lost: gl.isContextLost(),
          drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
        })),
        contextEvents: window.__qaRender?.events ?? [],
      };
    });
  }

  async function capture(label) {
    await twoFrames();
    const path = `${output}/${label}.png`;
    const screenshot = await page.screenshot({ path });
    const metrics = await imageMetrics(screenshot);
    const sample = {
      label,
      painted: metrics.rgbStddev >= paintedStddevMin,
      metrics,
      telemetry: await telemetry(),
    };
    report.captures.push(sample);
    return sample;
  }

  async function cycle() {
    await tap('[data-command="start"]');
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
    await tap('#pause');
    await page.waitForFunction(() => document.querySelector('#pause')?.getAttribute('aria-pressed') === 'true');
    for (const tab of ['cards', 'skills', 'evolution', 'battle']) {
      await tap(`.bottom-nav [data-tab="${tab}"]`);
    }
    await tap('[data-command="settings"]');
    await tap('[data-command="retreat"]');
    await page.getByRole('heading', { name: 'REGROUP', exact: true }).waitFor();
    await tap('[data-command="retry"]');
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'ready');
  }

  const initial = await capture('00-before');
  assert.ok(initial.painted, `Initial battlefield must be painted; stddev=${initial.metrics.rgbStddev}`);

  for (let iteration = 1; iteration <= 20; iteration += 1) {
    await cycle();
    const sample = await capture(`${String(iteration).padStart(2, '0')}-cycle`);
    if (!sample.painted) {
      report.firstBlank = iteration;
      break;
    }
  }

  if (report.firstBlank !== null) {
    const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    await tap('[data-command="start"]');
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
    await tap('[data-unit="0"]');
    await page.waitForTimeout(500);
    await tap('#pause');
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    report.simulationAdvancedWhileBlank = after.deployed === before.deployed + 1;
    await capture('blank-after-deploy');

    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    report.recovery.push({ action: 'window-resize', sample: await capture('recovery-window-resize') });

    await page.setViewportSize({ width: 391, height: 844 });
    await page.setViewportSize(viewport);
    report.recovery.push({ action: 'viewport-nudge', sample: await capture('recovery-viewport-nudge') });

    await tap('.bottom-nav [data-tab="cards"]');
    await tap('.bottom-nav [data-tab="battle"]');
    report.recovery.push({ action: 'tab-roundtrip', sample: await capture('recovery-tab-roundtrip') });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'ready');
    report.recovery.push({ action: 'reload', sample: await capture('recovery-reload') });
  }

  report.finished = new Date().toISOString();
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    revision,
    browser: report.browser,
    firstBlank: report.firstBlank,
    simulationAdvancedWhileBlank: report.simulationAdvancedWhileBlank,
    errors: report.errors,
    recovery: report.recovery.map(item => ({
      action: item.action,
      painted: item.sample.painted,
      stddev: item.sample.metrics.rgbStddev,
    })),
  }, null, 2));

  assert.equal(report.firstBlank, null, 'Battlefield must remain visibly painted through 20 legitimate navigation cycles');
} catch (error) {
  report.finished = new Date().toISOString();
  report.failure = error.stack ?? String(error);
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  server.closeAllConnections();
  await new Promise(resolveClose => server.close(resolveClose));
}
