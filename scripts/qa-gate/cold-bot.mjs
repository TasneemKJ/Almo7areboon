/**
 * Cold-play bot: acts only on what is visible and enabled, tapping like a new player (400 ms human gap per tap).
 * node scripts/qa-gate/cold-bot.mjs <en|ar> <minutes> [--fast]   (--fast turns on the game's own 2x speed in Settings
 * after the first victory). Writes <OUT>/bot-<lang>.json (metrics + log) and screenshots bot-<lang>-NNN-<tag>.png of
 * each newly seen screen.
 */
import {writeFileSync} from 'node:fs';
import {launch, newPhone, shot, tapControl, visibleControls, shellState, mixedLanguage, layoutProblems, webSpeak, BASE, OUT} from './lib.mjs';

const lang = process.argv[2] || 'en';
const minutes = Number(process.argv[3] || 15);
const fast = process.argv.includes('--fast');
const browser = await launch();
const {page, errors} = await newPhone(browser, {lang});

const T = () => (Date.now() - tPlay) / 1000;
let tPlay = Date.now();
const log = [], screens = new Map(), findings = {mixed: new Set(), clipped: new Set(), small: new Set(), web: new Set()};
const m = {lang, fast, taps: 0, tapsToFirstDeploy: null, firstDeployAt: null, firstEnemyHitAt: null, firstCoinsAt: null, firstVictoryAt: null, tapsToFirstVictory: null,
  victories: 0, defeats: 0, battlesStarted: 0, idle: [], stuck: [], introSeconds: null, firstDefeatAt: null, evolveSeenAt: null, campSeenAt: null, notes: []};
let lastChange = Date.now(), repeat = 0, lastTapKey = '', shotN = 0, lastMeaningful = Date.now(), idleStart = null, lastSig = '', sameSigSince = Date.now(), lastSave = null;
const save = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('almo7areboon.save.v1') || 'null'); } catch { return null; } }).catch(() => null);
const note = (msg) => { log.push(`${T().toFixed(1)}s ${msg}`); console.log(`${T().toFixed(1)}s ${msg}`); };

async function inspect(tag) {
  for (const t of await mixedLanguage(page, lang).catch(() => [])) findings.mixed.add(`${tag}: ${t}`);
  const lp = await layoutProblems(page).catch(() => ({clipped: [], small: []}));
  lp.clipped.forEach(t => findings.clipped.add(`${tag}: ${t}`)); lp.small.forEach(t => findings.small.add(`${tag}: ${t}`));
  for (const t of await webSpeak(page).catch(() => [])) findings.web.add(`${tag}: ${t}`);
}

const recent = [], loopFlagged = new Set();
async function tap(c, why) {
  await page.waitForTimeout(400);
  try { const how = await tapControl(page, c); if (how === 'scrolled') m.scrollTaps = (m.scrollTaps || 0) + 1; } catch (e) { note(`tap failed ${e.message}`); return false; }
  m.taps++; lastMeaningful = Date.now();
  const key = `${why}|${c.cmd}|${c.text.slice(0, 30)}|${lastSig}`;
  repeat = key === lastTapKey ? repeat + 1 : 0; lastTapKey = key;
  if (repeat === 12 && !/deploy|order|rally/.test(why)) { m.stuck.push({at: T(), kind: 'tap has no effect', control: c.text.slice(0, 60), cmd: c.cmd, screen: screens.get(lastSig)}); note(`NO-EFFECT x12: ${c.text.slice(0, 40)}`); await shot(page, `bot-${lang}-noeffect-${m.stuck.length}`); }
  note(`TAP ${why}: "${c.text.slice(0, 60)}" cmd=${c.cmd} ${JSON.stringify(c.data)}`);
  // A two-step loop (e.g. Continue -> paywall -> Close -> Continue) is a state the player cannot leave by following
  // the screen: 4 cycles of the same two commands, nothing else, is a stuck finding.
  recent.push(c.cmd || why); if (recent.length > 8) recent.shift();
  if (recent.length === 8 && new Set(recent).size === 2 && recent.every((k, i) => k === recent[i % 2]) && !/deploy|order|rally/.test(recent.join(' ')) && !loopFlagged.has(recent.slice(0, 2).join('>'))) { loopFlagged.add(recent.slice(0, 2).join('>')); m.stuck.push({at: T(), kind: 'two-step loop', control: recent.slice(0, 2).join(' > '), screen: screens.get(lastSig)}); note(`LOOP: ${recent.slice(0, 2).join(' > ')}`); }
  return true;
}

// Priority of actions in a dialog / screen, earliest wins. A new player reads the biggest, warmest button first.
const PRIORITY = ['session-continue', 'quest-claim', 'next', 'story-continue', 'continue-with-provision', 'camp-battle', 'start', 'retry', 'enter-world',
  'confirm-evolve', 'evolve', 'result-back', 'camp-return', 'close', 'camp-back'];
const AVOID = new Set(['settings', 'field-pause', 'reset', 'confirm-reset', 'import', 'export', 'confirm-import', 'buy-full-journey', 'buy-lamplighter-monthly', 'buy-lamplighter-yearly',
  'restore-purchases', 'manage-subscriptions', 'open-terms', 'open-privacy', 'confirm-prestige', 'confirm-leave-battle', 'session-temporary', 'home', 'story-abandon', 'watch-intro', 'watch-film', 'lamplighter', 'full-journey', 'save-recovery', 'speed', 'pause']);

let speedSet = false;
async function setSpeed2x() {
  // Settings -> speed control (game's own 2x option)
  const c = (await visibleControls(page)).find(c => c.cmd === 'field-pause' && c.onTop);
  if (!c) return false;
  await tap(c, 'pause for settings');
  await page.waitForTimeout(600);
  const s = (await visibleControls(page)).find(c => c.cmd === 'settings' && c.onTop && !c.disabled);
  if (s) { await tap(s, 'open settings'); await page.waitForTimeout(700); }
  // Battle speed is a native <select>: a person taps it and picks 2x from the iOS picker.
  const sp = page.locator('#preference-speed');
  if (await sp.count()) { await sp.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await sp.selectOption('2'); m.taps++; note('TAP speed 2x (native picker)'); speedSet = true; await shot(page, `bot-${lang}-speed-settings`); }
  else m.notes.push('could not find speed control in Settings');
  for (let i = 0; i < 3; i++) {
    const close = (await visibleControls(page)).find(c => ['close', 'field-resume', 'camp-back'].includes(c.cmd) && c.onTop && !c.disabled);
    await page.waitForTimeout(300);
    if (!close) break; await tap(close, 'close settings'); await page.waitForTimeout(500);
  }
  return speedSet;
}

await page.goto(BASE);
await page.waitForSelector('#entry-play:not([disabled])', {timeout: 30000});
await shot(page, `bot-${lang}-000-entry`); await inspect('entry');
tPlay = Date.now(); lastChange = Date.now();
await tap((await visibleControls(page)).find(c => c.id === 'entry-play'), 'Play');
const deadline = Date.now() + minutes * 60_000;
let prevPhase = '', introDone = false, battleId = -1, perBattle = {}, lastCue = '', campVisits = 0, dialogTaps = 0, defeatsSeenInCamp = 0, pendingGate = false;
let wantJournal = false, journalTried = false, journalStartTaps = 0, nextCompanyCoins = 400;
const cues = new Set(), visitedStations = new Set(), tried = new Set();

while (Date.now() < deadline) {
  await page.waitForTimeout(350);
  let s; try { s = await shellState(page); } catch { continue; }
  const all = await visibleControls(page).catch(() => []);
  const ctl = all.filter(c => c.onTop && !c.disabled);
  const sv = await save();
  // Metrics from save/progress
  if (sv) {
    if (lastSave && sv.coins > lastSave.coins && m.firstCoinsAt == null) { m.firstCoinsAt = T(); note(`FIRST COINS ${lastSave.coins}->${sv.coins}`); }
    if (lastSave && sv.wins > lastSave.wins) { m.victories++; if (m.firstVictoryAt == null) { m.firstVictoryAt = T(); m.tapsToFirstVictory = m.taps; note('FIRST VICTORY (save)'); } }
    lastSave = sv;
  }
  const intro = ctl.some(c => c.data.intro === 'skip');
  if (!intro && !introDone) { introDone = true; m.introSeconds = T(); note('intro ended'); }
  if (s.phase !== prevPhase) {
    note(`phase ${prevPhase} -> ${s.phase} modal=${s.modal} camp=${s.camp}`);
    if (s.phase === 'running' && prevPhase !== 'paused') m.battlesStarted++;
    if (s.phase === 'won' && m.firstVictoryAt == null) { m.firstVictoryAt = T(); m.tapsToFirstVictory = m.taps; note('FIRST VICTORY (phase)'); }
    if (s.phase === 'lost') { m.defeats++; if (m.firstDefeatAt == null) m.firstDefeatAt = T(); }
    prevPhase = s.phase;
  }
  if (m.firstDeployAt != null && m.firstEnemyHitAt == null && s.phase === 'running') {
    const hp = await page.evaluate(() => { const t = document.body.innerText + ' ' + [...document.querySelectorAll('.sr-only')].map(e => e.textContent).join(' '); const mm = t.match(/(?:Enemy base|حصن العدوّ):\s*([\d,]+)\s*\/\s*([\d,]+)/); return mm ? [mm[1], mm[2]] : null; }).catch(() => null);
    if (hp && hp[0] !== hp[1]) { m.firstEnemyHitAt = T(); note(`FIRST GATE DAMAGE ${hp[0]}/${hp[1]}`); }
  }
  // Enemy gate HP (only readable from the DOM labels if present)
  if (m.firstDeployAt != null && m.firstEnemyHitAt == null) {
    const hit = await page.evaluate(() => { const b = document.querySelector('[data-enemy-hp], .enemy-hp, #enemy-hp'); return b ? b.textContent : null; }).catch(() => null);
    if (hit) m.notes.push(`enemy hp label ${hit}`);
  }
  // New screen signature
  const sig = `${s.entry}|${s.phase}|${s.modal}|${s.camp}|${s.secondary}|` + ctl.filter(c => !c.data.fieldRecruit && !c.data.enemyId).map(c => c.cmd || c.data.intro || c.id || c.text.slice(0, 12)).sort().join(',');
  if (sig !== lastSig) {
    lastSig = sig; sameSigSince = Date.now();
    if (!screens.has(sig)) {
      const tag = `${s.camp ? 'camp' : s.phase || s.entry}${s.modal ? '-' + s.modal.split(' ')[0] : ''}`.replace(/[^a-z0-9-]/gi, '');
      const name = `bot-${lang}-${String(++shotN).padStart(3, '0')}-${tag}`;
      screens.set(sig, name); await shot(page, name); await inspect(name);
      note(`NEW SCREEN ${name} controls: ${ctl.map(c => `${c.cmd || c.data.intro || c.id || '?'}:"${c.text.slice(0, 30)}"`).join(' | ')}`);
      if (ctl.some(c => /evolv|تطور/i.test(c.text) || c.cmd === 'evolve' || c.cmd === 'camp-evolution') && m.evolveSeenAt == null) m.evolveSeenAt = T();
      if (s.camp && m.campSeenAt == null) m.campSeenAt = T();
    }
  }
  if (intro) { if (T() > 40) { const sk = ctl.find(c => c.data.intro === 'skip'); await tap(sk, 'skip (intro >40s)'); } continue; }

  // Choose an action.
  let act = null, why = '';
  const modalOpen = !!s.modal || s.secondary;
  const recruits = ctl.filter(c => c.data.fieldRecruit != null || c.data.unit != null); // tray cards (4258fd0) carry only data-unit
  const orders = ctl.filter(c => c.data.order);
  const named = ctl.filter(c => c.cmd && !AVOID.has(c.cmd));
  const now = Date.now();
  if (!modalOpen && s.phase === 'running') {
    if (battleId !== m.battlesStarted) { battleId = m.battlesStarted; perBattle = {supplies: false, enemy: false, rally: 0, order: 0}; }
    const cue = await page.evaluate(() => document.getElementById('field-cue')?.innerText || '').catch(() => '');
    if (cue && cue !== lastCue) { lastCue = cue; cues.add(cue); note(`CUE "${cue}"`); }
    const sup = ctl.find(c => c.id === 'field-supplies'), enemy = ctl.find(c => c.id === 'field-enemy'), rally = ctl.find(c => c.cmd === 'story-rally');
    const skills = ctl.filter(c => c.data.skill || (c.cmd && !['field-pause', 'story-rally'].includes(c.cmd) && !AVOID.has(c.cmd)));
    // 1. follow the on-screen instruction
    if (/supplies|المؤن/i.test(cue) && sup) { act = sup; why = 'cue supplies'; }
    else if (/(hold|advance|اثبت|تقدّم|تقدم)/i.test(cue) && orders.length) { act = orders[0]; why = 'cue order'; }
    else if (/(standard|gather|الراية|اجمع)/i.test(cue) && rally && now - perBattle.rally > 8000) { act = rally; why = 'cue rally'; perBattle.rally = now; }
    else if (/(enemy|عدو)/i.test(cue) && enemy && !perBattle.enemy) { act = enemy; why = 'cue enemy'; perBattle.enemy = true; }
    // 2. a context sheet opened by the last tap: use its action
    else if (skills.length) { act = skills[0]; why = `context ${skills[0].cmd || skills[0].data.skill}`; }
    // 3. deploy the waiting defender
    else if (recruits.length) { act = recruits.find(c => /wait|ready|glow|pulse|highlight|suggest/i.test(c.cls)) || recruits[m.taps % recruits.length]; why = 'deploy'; }
    else if (orders.length && now - perBattle.order > 10000) { act = orders[m.taps % orders.length]; why = 'order'; perBattle.order = now; }
    else if (sup && !perBattle.supplies) { act = sup; why = 'supplies'; perBattle.supplies = true; }
    else if (enemy && !perBattle.enemy) { act = enemy; why = 'curious enemy'; perBattle.enemy = true; }
    else if (rally && now - perBattle.rally > 25000) { act = rally; why = 'rally'; perBattle.rally = now; }
  } else if (s.camp && !modalOpen) {
    campVisits++;
    const stations = ctl.filter(c => c.data.campStation);
    const unvisited = stations.find(c => !visitedStations.has(c.data.campStation));
    const lostRecently = m.defeats > defeatsSeenInCamp;
    const heading = await page.evaluate(() => document.querySelector('.camp-heading')?.innerText || '').catch(() => '');
    const goalJournal = /Journal|الدفتر/.test(heading) && /Daily reward|مكافأة اليوم|ready|جاهز/i.test(heading);
    if (goalJournal && !journalTried) { wantJournal = true; journalTried = true; journalStartTaps = m.taps; }
    const coins = sv?.coins ?? 0;
    if (wantJournal && stations.find(c => c.data.campStation === 'journal')) { act = stations.find(c => c.data.campStation === 'journal'); why = 'follow Next goal: Journal'; dialogTaps = 0; visitedStations.add('journal'); }
    else if (coins >= nextCompanyCoins && stations.find(c => c.data.campStation === 'company') && visitedStations.has('company')) { nextCompanyCoins = coins * 2 + 200; act = stations.find(c => c.data.campStation === 'company'); why = `revisit company with ${coins} coins`; dialogTaps = 0; }
    else if (unvisited) { act = unvisited; why = `explore station ${unvisited.data.campStation}`; visitedStations.add(unvisited.data.campStation); dialogTaps = 0; }
    else if (lostRecently) { defeatsSeenInCamp = m.defeats; const st = stations.find(c => c.data.campStation === 'storehouse'); if (st) { act = st; why = 'after defeat: storehouse'; dialogTaps = 0; pendingGate = true; } }
    else if (pendingGate) { pendingGate = false; const st = stations.find(c => c.data.campStation === 'gate'); if (st) { act = st; why = 'after defeat: gate'; dialogTaps = 0; } }
    else if (campVisits % 4 === 0 && stations.length) { act = stations.find(c => c.data.campStation === 'journal') || stations[0]; why = 'periodic journal'; dialogTaps = 0; }
    if (!act) { act = named.find(c => c.cmd === 'camp-battle'); why = 'camp battle'; }
  } else if (modalOpen && (s.camp || s.secondary || /camp|journey|quest|evolution/i.test(s.modal))) {
    // inside a Camp station or Camp-owned screen: try what is offered (upgrade, unlock, claim), a few taps, then back
    const BACK = ['camp-back', 'close', 'camp-return'];
    const NAV_LATE = ['camp-evolution', 'camp-storybook', 'camp-chapters', 'result-details', 'journey'];
    const NAV_EARLY = ['camp-journal', 'quests'];
    const skip = c => ['camp-battle', 'camp-home', 'next', 'start', 'enter-world', 'journey-result', 'return-chapters', 'regroup-chapters', 'home'].includes(c.cmd) || /^choose-battle/.test(c.cmd) || BACK.includes(c.cmd);
    const offers = named.filter(c => !skip(c));
    const waitingRecruit = ctl.filter(c => c.data.campRecruit != null && /waiting|ينتظر/.test(c.text));
    const rank = c => c.cmd === 'quest-claim' || c.cmd === 'evolve' || c.cmd === 'confirm-evolve' ? 0 : c.data.campRecruit != null ? 1 : NAV_EARLY.includes(c.cmd) ? (wantJournal ? 2 : 4) : NAV_LATE.includes(c.cmd) ? 5 : 3;
    const unseen = [...offers, ...waitingRecruit].filter(c => !tried.has(c.cmd + c.text)).sort((a, b) => rank(a) - rank(b));
    if (dialogTaps < 14 && unseen.length) { act = unseen[0]; tried.add(act.cmd + act.text); why = `try ${act.cmd || 'recruit'}`; dialogTaps++; if (act.cmd === 'quest-claim') { wantJournal = false; m.claims = (m.claims || 0) + 1; if (m.firstClaimTaps == null) m.firstClaimTaps = m.taps + 1 - journalStartTaps; } }
    else { act = named.find(c => BACK.includes(c.cmd)) || ctl.find(c => BACK.includes(c.cmd)); why = 'back'; tried.clear(); }
  } else {
    for (const p of PRIORITY) { const c = named.find(c => c.cmd === p); if (c) { act = c; why = `cmd ${p}`; break; } }
    if (!act) {
      const other = named.filter(c => !['camp-home'].includes(c.cmd));
      if (other.length) { act = other.sort((a, b) => b.w * b.h - a.w * a.h)[0]; why = `largest ${act.cmd}`; }
      else {
        const big = ctl.filter(c => !AVOID.has(c.cmd) && c.cmd !== 'field-pause' && !c.data.enemyId && !c.data.fieldRecruit).sort((a, b) => b.w * b.h - a.w * a.h)[0];
        if (big && s.phase !== 'running') { act = big; why = 'largest uncommanded'; }
      }
    }
  }
  if (act) {
    const before = await page.evaluate(() => [document.querySelector('#field-food span')?.textContent, document.getElementById('modal-layer')?.hidden, document.getElementById('world')?.dataset.phase, document.querySelector('#modal-layer')?.innerText.length]).catch(() => null);
    await tap(act, why);
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => [document.querySelector('#field-food span')?.textContent, document.getElementById('modal-layer')?.hidden, document.getElementById('world')?.dataset.phase, document.querySelector('#modal-layer')?.innerText.length]).catch(() => null);
    const changed = JSON.stringify(before) !== JSON.stringify(after) || (why === 'deploy' && Number(after?.[0]) < Number(before?.[0]));
    if (changed) {
      const gap = (Date.now() - lastChange) / 1000;
      if (gap > 20) { m.idle.push({at: (lastChange - tPlay) / 1000, seconds: +gap.toFixed(1), screen: screens.get(lastSig), cue: lastCue}); note(`IDLE ${gap.toFixed(1)}s (no state-changing tap) cue="${lastCue}"`); }
      lastChange = Date.now();
    } else m.noopTaps = (m.noopTaps || 0) + 1;
    const deployBefore = 0;
    if (why === 'deploy' && m.firstDeployAt == null) { m.firstDeployAt = T(); m.tapsToFirstDeploy = m.taps; note('FIRST DEPLOY'); }
    // --quick-hands: a player who taps the waiting defender about 3 times a second while food lasts
    if (why === 'deploy' && process.argv.includes('--quick-hands')) for (let k = 0; k < 3; k++) { await page.waitForTimeout(250); await page.touchscreen.tap(act.x + act.w / 2, act.y + act.h / 2).catch(() => {}); m.taps++; }
    else if (why === 'deploy') await page.waitForTimeout(300);
    void deployBefore;
    idleStart = null;
    if (fast && !speedSet && m.firstVictoryAt != null && s.phase === 'running') await setSpeed2x();
  } else {
    if (!idleStart) idleStart = Date.now();
    // a screen with nothing to do and no battle running for 30 s is a dead end
    if (s.phase !== 'running' && (Date.now() - sameSigSince) > 30_000) {
      m.stuck.push({at: T(), screen: screens.get(lastSig), sig}); note(`STUCK on ${screens.get(lastSig)}`);
      sameSigSince = Date.now();
      const anyClose = all.find(c => ['close', 'camp-back', 'camp-return', 'home'].includes(c.cmd) && c.onTop && !c.disabled);
      if (anyClose) await tap(anyClose, 'escape stuck');
    }
  }
}
if (idleStart) { const d = (Date.now() - idleStart) / 1000; if (d > 20) m.idle.push({at: (idleStart - tPlay) / 1000, seconds: d, screen: screens.get(lastSig), open: true}); }
{ const gap = (Date.now() - lastChange) / 1000; if (gap > 20) m.idle.push({at: (lastChange - tPlay) / 1000, seconds: +gap.toFixed(1), open: true, cue: lastCue}); }
m.build = await page.evaluate(() => [...document.scripts].map(s => s.src).filter(Boolean).join(' '));
await shot(page, `bot-${lang}-999-final`);
m.finalSave = await save();
m.errors = errors; m.findings = Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, [...v]]));
m.screens = [...screens.values()]; m.cues = [...cues]; m.log = log;
writeFileSync(`${OUT}/bot-${lang}${fast ? '-fast' : ''}${process.argv.includes('--quick-hands') ? '-quick' : ''}.json`, JSON.stringify(m, null, 1));
console.log(JSON.stringify({...m, log: undefined, findings: undefined, finalSave: {coins: m.finalSave?.coins, gems: m.finalSave?.gems, wins: m.finalSave?.wins, age: m.finalSave?.age, furthestBattle: m.finalSave?.furthestBattle}}, null, 1));
await browser.close();
