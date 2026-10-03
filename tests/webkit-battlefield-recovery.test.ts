import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { battlefieldRendererMode } from '../src/view/renderer-policy.ts';

test('Safari and every iOS browser use the reliable Canvas renderer path', () => {
  const safariMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
  const webkitLinux = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
  const safariIphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1';
  const chromeIpad = 'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0.0.0 Mobile/15E148 Safari/604.1';
  for (const userAgent of [safariMac, webkitLinux, safariIphone, chromeIpad]) {
    assert.equal(battlefieldRendererMode(userAgent), 'canvas');
  }
});

test('Chromium, Edge, Firefox, and unknown agents retain automatic rendering', () => {
  const chrome = 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36';
  const edge = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0';
  const firefox = 'Mozilla/5.0 (Android 16; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0';
  for (const userAgent of [chrome, edge, firefox, '', 'Almo7areboon shell']) {
    assert.equal(battlefieldRendererMode(userAgent), 'auto');
  }
});

test('battlefield applies the renderer policy without lifecycle recreation hooks', () => {
  const battlefield = readFileSync(new URL('../src/view/battlefield.ts', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  assert.match(battlefield, /battlefieldRendererMode\(navigator\.userAgent\)==='canvas'\?Phaser\.CANVAS:Phaser\.AUTO/);
  assert.match(battlefield, /\):\{destroy\(\):void\}/, 'the view keeps one normal lifetime owner');
  assert.doesNotMatch(main, /renderer\.refresh\(\)/, 'phase and tab changes must not churn the live renderer');
});

test('mobile WebKit verification fails on an unpainted stress frame', () => {
  const mobile = readFileSync(new URL('../scripts/verify-mobile.mjs', import.meta.url), 'utf8');
  assert.match(mobile, /async function verifyPaintedWebkitBattlefield\(browser\)/);
  assert.match(mobile, /async\(\{encoded,roi,label\}\)=>/);
  assert.match(mobile, /roi:\{x:45,y:180,width:300,height:220\},label\}/);
  assert.match(mobile, /assert\.ok\(sample\.rgbStddev>=\.15/);
  assert.match(mobile, /if\(engine==='webkit'\)await verifyPaintedWebkitBattlefield\(browser\)/);
  assert.match(mobile, /painted\(`cycle-\$\{cycle\}`,cycle===10\|\|cycle===20\)/);
});
