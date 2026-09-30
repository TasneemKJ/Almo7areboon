import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('native audio review exposes separate browser and offline modes without initializing a browser for help',()=>{
 const help=spawnSync(process.execPath,['scripts/review-audio.mjs','--browser','--help'],{encoding:'utf8'});
 assert.equal(help.status,0,help.stderr);assert.match(help.stdout,/--browser/);assert.match(help.stdout,/--offline/);
 const conflicting=spawnSync(process.execPath,['scripts/review-audio.mjs','--browser','--offline'],{encoding:'utf8'});
 assert.notEqual(conflicting.status,0);assert.match(conflicting.stderr,/Choose exactly one/);
});
