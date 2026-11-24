import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entryScreenHtml, entryStageParts, entryStageHtml } from '../src/ui/entry-screen.ts';
import { defaultProfile } from '../src/game/save.ts';
import { storybookArt } from '../src/view/storybook-art.ts';

const css = readFileSync('src/ui/simple-entry.css', 'utf8');
const tablet = readFileSync('src/ui/tablet.css', 'utf8');

test('Home stands the player\'s own gate (their army\'s chapter) on the next battle\'s ground', () => {
  const fresh = defaultProfile();
  assert.equal(entryStageParts(fresh).gate, `${storybookArt(0)!.folder}/shelter-hd.webp`);
  assert.equal(entryStageParts({ ...fresh, age: 2 }).gate, '/art/storybook/harbor/shelter-hd.webp', 'the gate is the army\'s chapter, not the rival\'s');
  assert.equal(entryStageParts({ age: 99 }).gate, '/art/storybook/courtyards/shelter-hd.webp', 'a bad age clamps');
});

test('Home draws no troop sprite at any progress (owner trope call, 2026-11-24), and the scene is decorative', () => {
  const html = entryScreenHtml({ ...defaultProfile(), age: 2, unlocked: [true, true, true] });
  assert.match(html, /<div id="entry-stage" class="entry-stage" aria-hidden="true">/);
  for (let age = 0; age < 6; age++) {
    const stage = entryStageHtml({ age });
    assert.doesNotMatch(stage, /-strip\.webp|-portrait\.webp|entry-troop/, `chapter ${age + 1}`);
  }
  assert.doesNotMatch(html, /-strip\.webp|-portrait\.webp/);
  assert.doesNotMatch(css, /\.entry-troop/);
});

test('Home keeps the scene live: navigation repaints it with the save', () => {
  const nav = readFileSync('src/app/navigation.ts', 'utf8');
  assert.match(nav, /htmlIfChanged\(\$\('entry-stage'\),entryStageHtml\(ports\.sessionState\.game\.profile\)\)/);
});

test('the scrim sits only behind the words, and the scene stands on the plate\'s own ground line above the actions', () => {
  assert.match(css, /\.entry-copy::before\{[^}]*radial-gradient\(closest-side/);
  assert.doesNotMatch(css, /\.entry-screen::before\{[^}]*linear-gradient\(180deg,rgba\(5,22,23,\.66\)/, 'the old full-height top veil is gone');
  assert.match(css, /--foot:min\(calc\(\(100dvh - var\(--plate\)\) \/ 2 \+ \.68 \* var\(--plate\)\),calc\(100dvh - var\(--act\)\)\)/);
  assert.match(css, /\.entry-art\{[^}]*object-position:50% 50%/, 'cover centred, so the 68% ground line holds');
});

test('a tablet Home fills the screen with tablet type, never a phone column', () => {
  assert.match(css, /#app\[data-entry="home"\] \.game-shell\{[^}]*max-width:none;width:100%/);
  const block = css.slice(css.indexOf('@media(min-width:700px) and (min-height:700px)'));
  assert.match(block, /\.entry-copy h1\{font-size:clamp\(60px/);
  assert.match(block, /#entry-subtitle\{font-size:19px\}/);
  assert.match(block, /\.entry-actions \.big-button\{min-height:66px;font-size:24px/);
});

test('a tall tablet frame is the whole screen, so Home and the field (sized at 100dvh) are never cut off', () => {
  assert.match(readFileSync('src/style.css', 'utf8'), /@media\(min-width:600px\) and \(min-height:930px\) \{ #app \{height:100dvh;max-height:none;\}/);
});

test('the field grows on a tablet: HUD, pause and tray type, loaded before the phone landscape rail', () => {
  assert.match(tablet, /@media \(min-width:700px\) and \(min-height:700px\)/);
  assert.match(tablet, /\.stage h1\{font-size:31px\}/);
  assert.match(tablet, /\.field-chrome button\{min-width:56px;min-height:56px/);
  assert.match(tablet, /html\[lang\] #app[^{]*\.unit-name\{[^}]*font-size:17px/);
  const main = readFileSync('src/main.ts', 'utf8');
  const imports = [...main.matchAll(/^import '\.\/ui\/([\w-]+)\.css';/gm)].map(m => m[1]);
  assert.deepEqual(imports.slice(-2), ['tablet', 'landscape-rail']);
});

test('the iOS app runs on iPad in portrait, full screen', () => {
  const project = readFileSync('ios/Almo7areboon.xcodeproj/project.pbxproj', 'utf8');
  const families = [...project.matchAll(/TARGETED_DEVICE_FAMILY = ([^;]+);/g)].map(m => m[1]);
  assert.ok(families.length >= 2 && families.every(f => f === '"1,2"'), `families ${families}`);
  const ipad = [...project.matchAll(/INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "([^"]+)";/g)].map(m => m[1]);
  assert.equal(ipad.length, 2, 'Debug and Release');
  for (const o of ipad) assert.equal(o, 'UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown');
  assert.equal([...project.matchAll(/INFOPLIST_KEY_UIRequiresFullScreen = YES;/g)].length, 2);
});

test('the goal pill marks a ready banner with its own class, never the shell\'s .ready (which made it a screen-sized disc)', () => {
  assert.doesNotMatch(readFileSync('src/ui/world-play.css', 'utf8'), /\.field-goal-pill\.ready\b/);
  assert.doesNotMatch(readFileSync('src/ui/field-controller.ts', 'utf8'), /goal\.classList\.toggle\('ready'/);
});

test('dialogs grow on a tablet as one piece and stay inside the screen', () => {
  assert.match(tablet, /#modal-layer \.dialog\{zoom:1\.28;max-height:calc\(\(100dvh - 48px[^}]*\/ 1\.28\)\}/);
});
