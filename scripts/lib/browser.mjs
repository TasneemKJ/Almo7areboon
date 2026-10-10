/**
 * Shared browser helpers for the review scripts: one Chromium launcher (CHROMIUM_PATH reuses an installed browser) and the
 * small set of steps every journey takes through the current shell (entry screen, world, field pause, Camp).
 */
import {chromium} from 'playwright';

export function launchChromium(options = {}) {
  return chromium.launch({headless: true, ...options, ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {})});
}

/** Click on desktop pages, tap on touch pages, so each script exercises the input its context has. */
export async function press(page, selector, options = {}) {
  const touch = await page.evaluate(() => matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  // The modal tap guard drops a second touch within 350ms near the first when it lands in a newly opened dialog
  // (a ghost tap). A person cannot tap that fast between dialogs either, so touch steps leave a human gap.
  if (touch) { await page.waitForTimeout(400); await page.tap(selector, options); } else await page.click(selector, options);
}

/** The entry screen is ready once its first action is enabled (the battlefield has mounted). */
export async function waitForEntry(page, timeout = 30000) {
  await page.waitForSelector('#entry-play:not([disabled])', {timeout});
}

/** Play from the entry screen: the world opens and a ready battle starts. */
export async function enterWorld(page, timeout = 30000) {
  await waitForEntry(page, timeout);
  await press(page, '#entry-play');
  await page.waitForFunction(() => document.getElementById('app')?.dataset.entry === 'play', null, {timeout});
}

/** Camp from the entry screen (offered once the profile has played). */
export async function enterCamp(page, timeout = 30000) {
  await waitForEntry(page, timeout);
  await page.waitForSelector('#entry-secondary[data-command=home-camp]:not([hidden]):not([disabled])', {timeout});
  await press(page, '#entry-secondary');
  await page.waitForSelector('#camp-view:not([hidden]) [data-command=camp-battle]', {timeout});
}

export const phase = page => page.getAttribute('#world', 'data-phase').catch(() => null);

/** Open the field pause dialog in a running battle. */
export async function pauseField(page) {
  await press(page, '[data-command=field-pause]');
  await page.waitForSelector('.dialog [data-command=field-resume]');
}

export async function resumeField(page) {
  await press(page, '[data-command=field-resume]');
  await page.waitForFunction(() => document.getElementById('modal-layer')?.hidden);
}

/** Close whatever dialog is open with its own Close/Back control, falling back to Escape. */
export async function dismissDialog(page) {
  const close = page.locator('#modal-layer:not([hidden]) [data-command=close], #modal-layer:not([hidden]) [data-command=camp-back]').first();
  if (await close.isVisible().catch(() => false)) await close.click(); else await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
}

const shell = page => page.evaluate(() => {
  const app = document.getElementById('app'), layer = document.getElementById('modal-layer');
  return {entry: app?.dataset.entry, mode: app?.dataset.fieldMode, modal: layer && !layer.hidden, camp: !document.getElementById('camp-view')?.hidden};
});

/** Back to the entry screen from Camp, a Camp-owned screen, the field pause or a result. */
export async function goHome(page) {
  for (let step = 0; step < 4; step++) {
    const now = await shell(page);
    if (now.entry !== 'play') return;
    const target = ['#modal-layer:not([hidden]) [data-command=home]', '[data-command=camp-return]', '#modal-layer:not([hidden]) [data-command=camp-back]', '[data-command=camp-home]']
      .map(selector => page.locator(selector).first());
    let pressed = false;
    for (const locator of target) if (await locator.isVisible().catch(() => false)) { await locator.click(); pressed = true; break; }
    if (!pressed && now.mode === 'field') await pauseField(page);
    await page.waitForTimeout(250);
  }
}

/** Settings from wherever the player is: the entry screen, Camp, a dialog, or the field pause in battle. */
export async function openSettings(page) {
  const dialog = page.locator('#modal-layer:not([hidden]) .preferences-dialog');
  for (let step = 0; step < 4 && (await shell(page)).modal && !(await dialog.isVisible()); step++) {
    const settings = page.locator('#modal-layer:not([hidden]) [data-command=settings]').first();
    if (await settings.isVisible().catch(() => false)) { await settings.click(); break; }
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  }
  if (await dialog.isVisible()) return;
  const now = await shell(page);
  if (now.entry === 'play' && now.mode === 'field' && !now.modal) await pauseField(page);
  else if (now.entry === 'play' && now.mode !== 'field') await goHome(page);
  await page.locator('#entry-settings:visible, #modal-layer:not([hidden]) [data-command=settings]').first().click();
  await dialog.waitFor();
}

/** Camp stations: storehouse, gate, company, journal. */
export async function openCampStation(page, station) {
  if ((await shell(page)).entry !== 'play') await enterCamp(page);
  await press(page, `[data-camp-station=${station}]`);
  await page.waitForSelector('#modal-layer:not([hidden]) .camp-dialog');
}

/** Evolution through Camp: Your company, then Evolution. */
export async function openEvolution(page) {
  await openCampStation(page, 'company');
  await press(page, '[data-command=camp-evolution]');
  await page.waitForSelector('#secondary-screen:not([hidden]) [data-command=camp-return]');
}

/** The company journal (Journey) through Camp: Journal, then Company journal. */
export async function openJourney(page) {
  await openCampStation(page, 'journal');
  await press(page, '[data-command=camp-journal]');
  await page.waitForSelector('#modal-layer:not([hidden]) [data-journey-tab=cards]');
}

/** The card collection through the journal's "Strengthen your collection". */
export async function openCards(page) {
  await openJourney(page);
  await press(page, '[data-journey-tab=cards]');
  await page.waitForSelector('#secondary-screen:not([hidden]) [data-pack]');
}

/** Quests through the journal. */
export async function openQuests(page) {
  await openJourney(page);
  await press(page, '#modal-layer [data-command=quests]');
  await page.waitForSelector('#modal-layer:not([hidden]) .quest-record-dialog');
}

/**
 * A free local port in this repo's review range 4700-4799 (REVIEW_PORT wins), so self-served reviews never collide with
 * other servers on a shared machine.
 */
export async function freePort({fromEnv = true} = {}) {
  if (fromEnv && process.env.REVIEW_PORT) return Number(process.env.REVIEW_PORT);
  const {createServer} = await import('node:net');
  const tryPort = port => new Promise(resolve => {
    const server = createServer().once('error', () => resolve(false)).listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
  const start = 4700 + Math.floor(Math.random() * 100);
  for (let offset = 0; offset < 100; offset++) { const port = 4700 + (start - 4700 + offset) % 100; if (await tryPort(port)) return port; }
  throw new Error('No free review port in 4700-4799');
}
