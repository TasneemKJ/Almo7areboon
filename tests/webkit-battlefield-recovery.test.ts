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

test('accepted Battle start refreshes after the running layout is committed', () => {
  const actionStart = main.indexOf('function action(a:Action):boolean');
  const actionEnd = main.indexOf('\nfunction update(', actionStart);
  assert.ok(actionStart >= 0 && actionEnd > actionStart, 'action source is present');
  const action = main.slice(actionStart, actionEnd);
  const domUpdate = action.indexOf('update(true);');
  const refresh = action.indexOf("if(a.type==='start')renderer.refresh();");
  assert.ok(domUpdate >= 0 && refresh > domUpdate, 'the surface refresh runs only after the accepted start updates the running DOM');
  assert.doesNotMatch(action, /reload|new Phaser\.Game/, 'recovery must not reload or recreate the game');
});
