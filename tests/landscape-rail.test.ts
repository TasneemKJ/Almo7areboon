import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const rail = readFileSync('src/ui/landscape-rail.css', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');

test('landscape phones get a side rail: battlefield left, whole command deck right, no page scroll', () => {
  const block = rail.slice(rail.indexOf('@media (orientation:landscape) and (max-height:540px) and (min-width:600px)'));
  assert.ok(block.length > 100, 'landscape media query present');
  assert.match(block, /\.battle-view \{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,1fr\) var\(--rail\)/);
  assert.match(block, /\.world \{ grid-column:1; grid-row:1 \/ -1;/);
  assert.match(block, /\.deployment \{[^}]*grid-column:2; grid-row:1;[^}]*overflow-y:auto/);
  assert.match(block, /\.upgrades \{ grid-column:2; grid-row:2;/);
  assert.match(block, /:root, :root body, :root #app \{[^}]*overflow:hidden/);
  assert.match(block, /\.bottom-nav \{[^}]*position:relative;[^}]*transform:none/);
});
test('the rail sheet loads after every other sheet so its viewport rules win', () => {
  const imports = [...main.matchAll(/^import '\.\/ui\/([\w-]+)\.css';/gm)].map(m => m[1]);
  assert.equal(imports.at(-1), 'landscape-rail');
});
test('Gather keeps its own space under the troop cards and tall phones never push the deck under navigation', () => {
  assert.match(rail, /\.chronicle-command-row \{ margin-top:6px; \}/);
  assert.match(readFileSync('src/ui/battle-banner.css', 'utf8'), /\.world \{ min-height:clamp\(200px,calc\(100dvh - 400px\),690px\); \}/);
});
test('result screen states the seal requirement once, then the attempt', async () => {
  const { resultsHtml } = await import('../src/ui/results-screen.ts');
  const { Game } = await import('../src/game/simulation.ts');
  const g = new Game(); g.state.phase = 'lost'; g.state.time = 81;
  const html = resultsHtml(g.profile, g.state);
  const requirement = 'Win within 1:15.';
  assert.equal(html.split(requirement).length - 1, 1, 'requirement appears once');
  assert.match(html, /Attempt: 1:21 · target at most 1:15\./);
});
test('share metadata points at a real 1200x630 preview image', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /property="og:image" content="\.\/og-image\.jpg"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const jpg = readFileSync('public/og-image.jpg');
  assert.equal(jpg[0], 0xff); assert.equal(jpg[1], 0xd8);
  assert.ok(jpg.length < 200_000);
});
test('result screen Journey button names the next real reward', async () => {
  const { resultsHtml } = await import('../src/ui/results-screen.ts');
  const { Game } = await import('../src/game/simulation.ts');
  const { localDay } = await import('../src/game/data.ts');
  const g = new Game(); g.profile.dailyDay = localDay(); g.profile.wins = 3; g.state.phase = 'lost';
  assert.match(resultsHtml(g.profile, g.state), /data-command="journey" aria-label="Your journey\. A milestone is ready: claim 100 gems\.">Your journey · Claim 100 gems</);
});
test('wave label sits in the sky band, not above the skill row over the lane', () => {
  assert.match(rail, /\.battle-meta>\.wave-inspect \{\s*left:50%; bottom:auto; transform:translateX\(-50%\);\s*top:calc\(100px/);
});
test('short landscape dialogs drop the empty header band', () => {
  assert.match(rail, /\.dialog:has\(>\.dialog-dismiss\) \{ padding-top:4px;/);
  assert.match(rail, /\.dialog>\.dialog-dismiss\+\.eyebrow \{ margin-top:-40px;/);
  assert.doesNotMatch(rail, /\.dialog>\.dialog-dismiss>\.close-button \{ position:absolute;/);
});
test('first-Freeze cue appears when three enemies gather and Freeze is unused', async () => {
  const { battleGuidance } = await import('../src/ui/battle-hud.ts');
  const { Game } = await import('../src/game/simulation.ts');
  const g = new Game(); g.state.phase = 'running'; g.state.food = 50;
  g.state.stats.deployed = 3;
  const enemy = () => ({ ...(g.state.units[0] ?? {}), side: 'enemy', hp: 10 } as any);
  g.state.units = [enemy(), enemy(), enemy(), { ...enemy(), side: 'player' }, { ...enemy(), side: 'player' }, { ...enemy(), side: 'player' }];
  assert.match(battleGuidance(g.profile, g.state), /Tap Freeze to hold them/);
  g.state.skillsUsed.push('freeze');
  assert.doesNotMatch(battleGuidance(g.profile, g.state), /Tap Freeze to hold them/);
  g.state.skillsUsed.length = 0; g.profile.wins = 9;
  assert.doesNotMatch(battleGuidance(g.profile, g.state), /Tap Freeze to hold them/);
});
test('evolution plays a one-shot card reveal that restarts on a second evolution', () => {
  assert.match(main, /deck\.dataset\.evolveReveal=deck\.dataset\.evolveReveal==='a'\?'b':'a'/);
  assert.match(rail, /\.unit-cards\[data-evolve-reveal="a"\] \.unit-card \{ animation:evolve-reveal-a/);
  assert.match(rail, /\.unit-cards\[data-evolve-reveal="b"\] \.unit-card \{ animation:evolve-reveal-b/);
});

test('first-Meteor cue appears after Freeze when three enemies gather and Meteor is unused', async () => {
  const { battleGuidance } = await import('../src/ui/battle-hud.ts');
  const { Game } = await import('../src/game/simulation.ts');
  const g = new Game(); g.state.phase = 'running'; g.state.food = 50; g.state.time = 30;
  g.state.stats.deployed = 3; g.state.stats.skillsCast = 1;
  const enemy = () => ({ ...(g.state.units[0] ?? {}), side: 'enemy', hp: 10 } as any);
  g.state.units = [enemy(), enemy(), enemy(), { ...enemy(), side: 'player' }, { ...enemy(), side: 'player' }, { ...enemy(), side: 'player' }];
  assert.doesNotMatch(battleGuidance(g.profile, g.state), /Tap Meteor/);
  g.state.skillsUsed.push('freeze');
  assert.match(battleGuidance(g.profile, g.state), /Tap Meteor to hit every one/);
  g.state.skillsUsed.push('meteor');
  assert.doesNotMatch(battleGuidance(g.profile, g.state), /Tap Meteor/);
  g.state.skillsUsed.pop(); g.profile.wins = 9;
  assert.doesNotMatch(battleGuidance(g.profile, g.state), /Tap Meteor/);
});
