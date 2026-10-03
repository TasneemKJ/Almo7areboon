import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
const ids = [...workflow.matchAll(/id: (\w+)\n(?:[^\n]*\n)*?        continue-on-error: true/g)].map(match => match[1]);
const gate = new URL('../scripts/require-verification.mjs', import.meta.url);
function run(steps: unknown) {
  return spawnSync(process.execPath, [gate.pathname], {
    encoding: 'utf8', env: { ...process.env, VERIFICATION_STEPS: JSON.stringify(steps), REQUIRED_CHECKS: ids.join(' ') },
  });
}
const successful = Object.fromEntries(ids.map(id => [id, { outcome: 'success' }]));

test('CI aggregate accepts the complete successful verification run', () => {
  const result = run(successful);
  assert.equal(result.status, 0, result.stderr);
  for (const id of ids) assert.match(result.stdout, new RegExp(`${id}: success`));
});

test('CI aggregate rejects every failed, skipped, cancelled, or absent required check', () => {
  for (const id of ids) for (const outcome of ['failure', 'skipped', 'cancelled', 'unexpected', undefined]) {
    const steps = { ...successful, [id]: outcome ? { outcome, conclusion: 'success' } : undefined };
    const result = run(steps);
    assert.equal(result.status, 1, `${id}/${outcome}: ${result.stdout} ${result.stderr}`);
    assert.match(result.stdout + result.stderr, new RegExp(id));
  }
});

test('CI aggregate rejects missing or malformed outcome input', () => {
  assert.equal(run(null).status, 1);
  assert.equal(run([]).status, 1);
  const empty = spawnSync(process.execPath, [gate.pathname], { encoding: 'utf8', env: { ...process.env, VERIFICATION_STEPS: JSON.stringify(successful), REQUIRED_CHECKS: '' } });
  assert.equal(empty.status, 1);
  const result = spawnSync(process.execPath, [gate.pathname], { encoding: 'utf8', env: { ...process.env, VERIFICATION_STEPS: 'broken', REQUIRED_CHECKS: ids.join(' ') } });
  assert.equal(result.status, 1);
});

test('workflow always evaluates and includes every fallible verification check', () => {
  const final = workflow.slice(workflow.indexOf('      - name: Require passing checks'));
  assert.match(final, /if: always\(\)/);
  assert.match(final, /VERIFICATION_STEPS: \$\{\{ toJSON\(steps\) \}\}/);
  const required = final.match(/REQUIRED_CHECKS: ([\w ]+)/)?.[1].trim().split(/\s+/);
  assert.deepEqual(required?.sort(), ids.sort());
  assert.match(final, /node scripts\/require-verification\.mjs/);
});

test('deep verification runs automatically for pull requests and main pushes', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:\n'), workflow.indexOf('\npermissions:'));
  const block = (name: string) => {
    const match = triggers.match(new RegExp(`\\n  ${name}:(.*?)(?=\\n  [\\w-]+:|$)`, 's'));
    assert.ok(match, `${name} trigger is required`);
    return match[1].trim();
  };
  const pushBranches = block('push').match(/^branches: \[([^\]]+)\]$/)?.[1]
    .split(',').map(branch => branch.trim());
  assert.ok(pushBranches?.includes('main'), 'push must include the exact main branch');
  assert.ok(pushBranches?.every(branch => !branch.startsWith('!')), 'push branch filters must not contain exclusions');
  assert.equal(block('pull_request'), '', 'pull_request must not be narrowed by branches or event types');
  assert.equal(block('workflow_dispatch'), '', 'manual verification must remain available');
});
