import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const battlefield = readFileSync(new URL('../src/view/battlefield.ts', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');

test('battlefield mount exposes a bounded same-size presentation refresh', () => {
  assert.match(
    battlefield,
    /options:[\s\S]*\):\{refresh\(\):void;destroy\(\):void\}/,
    'the owner needs an explicit refresh without recreating the Phaser game',
  );
  assert.match(
    battlefield,
    /const refresh=\(\)=>\{if\(disposed\)return;const width=element\.clientWidth,height=element\.clientHeight;if\(width<=0\|\|height<=0\)return;renderer\.scale\.resize\(Math\.round\(width\*pixelRatio\),Math\.round\(height\*pixelRatio\)\);\};/,
    'refresh must reset the existing canvas backing surface at its current bounded size',
  );
  assert.match(
    battlefield,
    /const observer=new ResizeObserver\(refresh\);observer\.observe\(element\);\s*return \{refresh,destroy\(\)/,
    'native resizes and explicit visibility recovery must share one resize owner',
  );
});

test('returning to Battle refreshes after the view is exposed', () => {
  const switchStart = main.indexOf('function switchTab(tab:string)');
  const switchEnd = main.indexOf('\nfunction renderScreen', switchStart);
  assert.ok(switchStart >= 0 && switchEnd > switchStart, 'switchTab source is present');
  const switchTab = main.slice(switchStart, switchEnd);
  const exposed = switchTab.indexOf("$('battle-view').setAttribute('aria-hidden',String(tab!=='battle'));");
  const refresh = switchTab.indexOf("if(tab==='battle')renderer.refresh();");
  assert.ok(exposed >= 0 && refresh > exposed, 'the surface refresh runs only after Battle is exposed');
  assert.doesNotMatch(switchTab, /reload|new Phaser\.Game/, 'recovery must not reload or recreate the game');
});
