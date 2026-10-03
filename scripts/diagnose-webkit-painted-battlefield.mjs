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
  firstBlankStage: null,
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
    window.__qaRender = { contexts: [], events: [], raf: 0, resize: [], commands: { clear: 0, drawArrays: 0, drawElements: 0 } };
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const context = originalGetContext.call(this, type, ...args);
      if (/^webgl2?$/.test(String(type)) && context && !window.__qaRender.contexts.includes(context)) {
        window.__qaRender.contexts.push(context);
        for (const name of ['clear', 'drawArrays', 'drawElements']) {
          const original = context[name].bind(context);
          context[name] = (...callArgs) => {
            window.__qaRender.commands[name] += 1;
            return original(...callArgs);
          };
        }
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
        commands: { ...(window.__qaRender?.commands ?? {}) },
      };
    });
  }

  async function capture(label, persist = true) {
    await twoFrames();
    const path = `${output}/${label}.png`;
    const screenshot = await page.screenshot(persist ? { path } : {});
    const metrics = await imageMetrics(screenshot);
    const sample = {
      label,
      painted: metrics.rgbStddev >= paintedStddevMin,
      metrics,
      telemetry: await telemetry(),
    };
    report.captures.push(sample);
    if (!persist && !sample.painted) writeFileSync(path, screenshot);
    return sample;
  }

  async function cycle(iteration) {
    const prefix = String(iteration).padStart(2, '0');
    await tap('[data-command="start"]');
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
    let sample = await capture(`${prefix}-after-start`, false);
    if (!sample.painted) return sample;
    await tap('#pause');
    await page.waitForFunction(() => document.querySelector('#pause')?.getAttribute('aria-pressed') === 'true');
    sample = await capture(`${prefix}-after-pause`, false);
    if (!sample.painted) return sample;
    for (const tab of ['cards', 'skills', 'evolution', 'battle']) {
      await tap(`.bottom-nav [data-tab="${tab}"]`);
    }
    sample = await capture(`${prefix}-after-tabs`, false);
    if (!sample.painted) return sample;
    await tap('[data-command="settings"]');
    await tap('[data-command="retreat"]');
    await page.getByRole('heading', { name: 'REGROUP', exact: true }).waitFor();
    await tap('[data-command="retry"]');
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'ready');
    return capture(`${prefix}-after-retry`, false);
  }

  const initial = await capture('00-before');
  assert.ok(initial.painted, `Initial battlefield must be painted; stddev=${initial.metrics.rgbStddev}`);

  for (let iteration = 1; iteration <= 20; iteration += 1) {
    const sample = await cycle(iteration);
    if (!sample.painted) {
      report.firstBlank = iteration;
      report.firstBlankStage = sample.label;
      break;
    }
  }
  if (report.firstBlank === null) await capture('20-after');

  if (report.firstBlank !== null) {
    const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    if (await page.locator('#world').getAttribute('data-phase') === 'ready') {
      await tap('[data-command="start"]');
      await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
    }
    await tap('[data-unit="0"]');
    await page.waitForTimeout(500);
    if (await page.locator('#pause').getAttribute('aria-pressed') !== 'true') await tap('#pause');
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

    await page.locator('#battlefield canvas').evaluate(canvas => {
      const width = canvas.style.width;
      canvas.style.width = `${canvas.getBoundingClientRect().width + 1}px`;
      void canvas.offsetWidth;
      canvas.style.width = width;
    });
    report.recovery.push({ action: 'canvas-css-size-nudge', sample: await capture('recovery-canvas-css-size') });

    await page.locator('#battlefield canvas').evaluate(canvas => {
      const visibility = canvas.style.visibility;
      canvas.style.visibility = 'hidden';
      void canvas.offsetWidth;
      canvas.style.visibility = visibility;
    });
    report.recovery.push({ action: 'canvas-visibility-toggle', sample: await capture('recovery-canvas-visibility') });

    await page.locator('#battlefield canvas').evaluate(canvas => {
      const display = canvas.style.display;
      canvas.style.display = 'none';
      void canvas.offsetWidth;
      canvas.style.display = display;
    });
    report.recovery.push({ action: 'canvas-display-toggle', sample: await capture('recovery-canvas-display') });

    await page.locator('#battlefield canvas').evaluate(canvas => {
      const parent = canvas.parentNode;
      const next = canvas.nextSibling;
      parent.removeChild(canvas);
      parent.insertBefore(canvas, next);
    });
    report.recovery.push({ action: 'canvas-dom-reattach', sample: await capture('recovery-canvas-reattach') });

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
    firstBlankStage: report.firstBlankStage,
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
