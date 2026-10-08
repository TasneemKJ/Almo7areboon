import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const scripts = [
  ['capture-browser-review.mjs', { headless: true }],
  ['capture-layering-review.mjs', { headless: true }],
  ['capture-mastery-review.mjs', { headless: true, timeout: 30000 }],
  ['capture-upgrade-text-review.mjs', { headless: true }],
  ['verify-save-sessions.mjs', { headless: true, timeout: 30000 }],
] as const;

for (const [script, defaults] of scripts) {
  test(`${script} honors an explicit Chromium executable and preserves launch defaults`, () => {
    const source = ts.createSourceFile(script, readFileSync(new URL(`../scripts/${script}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
    const options: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'chromium.launch') {
        options.push(node.arguments[0].getText(source));
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.equal(options.length, 1, 'exercise the review entry point launch');
    for (const executablePath of [undefined, '', '/explicit/chromium']) {
      const actual = runInNewContext(`(${options[0]})`, { process: { env: { CHROMIUM_PATH: executablePath } } });
      assert.deepEqual(JSON.parse(JSON.stringify(actual)), {
        ...defaults,
        ...(executablePath ? { executablePath } : {}),
      });
    }
  });
}

test('browser review enters through native Home Play before requiring the battlefield', () => {
  const source = readFileSync(new URL('../scripts/capture-browser-review.mjs', import.meta.url), 'utf8');
  const navigation = source.indexOf("await page.goto(reviewOrigin,{waitUntil:'networkidle'});", source.indexOf("const output='artifacts/browser-review'"));
  const visibleBattlefield = source.indexOf("await page.waitForSelector('#battlefield canvas');", navigation);
  const setup = source.slice(navigation, visibleBattlefield);
  assert.match(setup, /await page\.getByRole\('button',\{name:'Play',exact:true\}\)\.click\(\)/,
    'fresh Home requires a native Play action before checking battlefield visibility');
});
