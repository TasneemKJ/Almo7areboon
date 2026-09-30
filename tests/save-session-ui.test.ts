import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSessionDialogHtml, temporarySessionNotice } from '../src/ui/save-session-screen.ts';

// A temporary escape on a blocked tab would bypass exclusive ownership.
for (const [status, title, label] of [
  ['blocked', 'Game open in another tab', 'CONTINUE HERE'],
  ['conflict', 'Your save changed in another tab', 'LOAD SAVED PROGRESS'],
] as const) test(`${status} permits retry and rescue export without a temporary bypass`, () => {
  const html = saveSessionDialogHtml(status);
  assert.match(html, new RegExp(title));
  assert.match(html, new RegExp(`data-command="session-continue"[^>]*>${label}`));
  assert.match(html, /data-command="export"[^>]*>EXPORT THIS SESSION/);
  assert.doesNotMatch(html, /session-temporary|data-command="close"|onclick=/);
});
test('unavailable saving offers explicit temporary play and retry', () => {
  const html = saveSessionDialogHtml('unavailable');
  assert.match(html, /Saving is unavailable/);
  assert.match(html, /data-command="session-continue"[^>]*>TRY SAVING AGAIN/);
  assert.match(html, /data-command="session-temporary"[^>]*>PLAY WITHOUT SAVING/);
  assert.match(html, /data-command="export"/);
});
test('future saves offer only explicit temporary play and export', () => {
  const html = saveSessionDialogHtml('unsupported');
  assert.match(html, /This save needs a newer game version/);
  assert.match(html, /Temporary play will not replace it/);
  assert.match(html, /data-command="session-temporary"/);
  assert.match(html, /data-command="export"/);
  assert.doesNotMatch(html, /session-continue|data-command="close"/);
});
test('ordinary and temporary states do not produce a blocking recovery dialog', () => {
  for (const status of ['starting', 'active', 'temporary', 'suspended', 'disposed'] as const) assert.equal(saveSessionDialogHtml(status), '');
  assert.equal(temporarySessionNotice, 'Temporary play — progress is not saved.');
});

test('a retry that hits the same problem is acknowledged instead of silently repeating the dialog', () => {
  assert.doesNotMatch(saveSessionDialogHtml('blocked'), /session-retry/);
  assert.match(saveSessionDialogHtml('blocked', true), /Still open in another tab\. Close that tab, then try again\./);
  assert.match(saveSessionDialogHtml('unavailable', true), /Saving is still unavailable in this browser\./);
  assert.doesNotMatch(saveSessionDialogHtml('conflict', true), /session-retry/, 'a conflict is resolved by reloading, not by waiting');
  assert.doesNotMatch(saveSessionDialogHtml('unsupported', true), /session-retry/);
  assert.equal(saveSessionDialogHtml('active', true), '');
});
