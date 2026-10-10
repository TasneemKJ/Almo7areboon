// Reuse the current app fixture without registering its existing tests twice.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const fixtureUrl = new URL('../main-integration.test.ts', import.meta.url);
const source = readFileSync(fixtureUrl, 'utf8');
const ast = ts.createSourceFile('fixture.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const firstTest = ast.statements.find(node => ts.isExpressionStatement(node)
  && ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)
  && node.expression.expression.text === 'test');
assert.ok(firstTest, 'The shared integration fixture must precede its tests');
assert.ok(ast.statements.some(node => ts.isFunctionDeclaration(node)
  && node.name?.text === 'harness' && node.end <= firstTest.getFullStart()), 'The real fixture must be available');
let prefix = source.slice(0, firstTest.getFullStart());
const imports = ast.statements.filter(ts.isImportDeclaration)
  .filter(node => node.end <= prefix.length);
for (const node of imports.reverse()) {
  assert.ok(ts.isStringLiteral(node.moduleSpecifier));
  const specifier = node.moduleSpecifier.text;
  const resolved = specifier.startsWith('.') ? new URL(specifier, fixtureUrl).href
    : specifier.startsWith('node:') ? specifier : import.meta.resolve(specifier);
  prefix = prefix.slice(0, node.moduleSpecifier.getStart(ast)) + JSON.stringify(resolved)
    + prefix.slice(node.moduleSpecifier.end);
}
const result = ts.transpileModule(prefix + '\nexport { harness };\n', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true,
});
assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
export const { harness } = await import('data:text/javascript;base64,' + Buffer.from(result.outputText).toString('base64'));
