// Fast PR gate: every unit test except the slow campaign/simulation suites. `npm test` still runs all of them.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const slow = new Set(['campaign', 'battle-termination', 'prestige-campaign', 'verification-gate', 'chronicle-routes', 'soundscape']);
const files = readdirSync('tests').filter(f => f.endsWith('.test.ts') && !slow.has(f.replace('.test.ts', ''))).map(f => `tests/${f}`);
process.exit(spawnSync(process.execPath, ['--experimental-strip-types', '--test', ...files], { stdio: 'inherit' }).status ?? 1);
