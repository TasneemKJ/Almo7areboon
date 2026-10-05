import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {cacheStorybookDepth,paintStorybookDepth} from '../src/view/storybook-depth.ts';

const require=createRequire(import.meta.url);
const Commands=require('phaser/src/gameobjects/graphics/Commands.js');
const phaserSource=readFileSync(require.resolve('phaser/src/gameobjects/graphics/Graphics.js'),'utf8');
const ast=ts.createSourceFile('Graphics.js',phaserSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const methods:Record<string,string>={};
function visit(node:ts.Node){
 if(ts.isPropertyAssignment(node)&&['fillStyle','fillTriangle'].includes(node.name.getText(ast)))methods[node.name.getText(ast)]=node.initializer.getText(ast);
 ts.forEachChild(node,visit);
}
visit(ast);
assert.equal(Object.keys(methods).length,2,'test runs the pinned Phaser command writers, not a simulated encoding');
function decode(source:string,commandBuffer:number[]){
 const ast=ts.createSourceFile('layering.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const fn=ast.statements.find((node):node is ts.FunctionDeclaration=>ts.isFunctionDeclaration(node)&&node.name?.text==='paths');
 assert.ok(fn);
 const js=ts.transpileModule(`${fn.getText(ast)};globalThis.result=paths({commandBuffer});`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const context:any={commandBuffer};runInNewContext(js,context);return JSON.parse(JSON.stringify(context.result));
}

test('actual Phaser triangle commands roundtrip through the browser fixture decoder without becoming resident paths',()=>{
 const graphics:any={commandBuffer:[]};
 for(const [name,source] of Object.entries(methods))graphics[name]=runInNewContext(`(${source})`,{Commands});
 const mesh=cacheStorybookDepth(0,{placement:{x:-12,y:-90,scale:.6},cssWorldScale:.8,visibleSource:[20,150,900,800],hudSourceBounds:[[0,150,450,280]]});
 assert.ok(mesh.length>=20);paintStorybookDepth(graphics,mesh,2,false,[.12,.128]);
 const source=readFileSync(new URL('./fixtures/layering.ts',import.meta.url),'utf8'),decoded=decode(source,graphics.commandBuffer);
 assert.equal(decoded.triangles.length,mesh.length);assert.deepEqual(decoded.fills,[]);assert.deepEqual(decoded.strokes,[]);
 for(let i=0;i<mesh.length;i++){
  assert.deepEqual(decoded.triangles[i].points,mesh[i].points.map(p=>[p.x,p.y]));
  assert.equal(decoded.triangles[i].color,mesh[i].kind==='depth'?0x92b9c6:0xffd28a);
  assert.ok(decoded.triangles[i].alpha>0&&decoded.triangles[i].alpha<=.25);
 }
});

test('the actual browser fixture decoder rejects unhandled commands rather than silently hiding new geometry',()=>{
 const source=readFileSync(new URL('./fixtures/layering.ts',import.meta.url),'utf8');
 assert.throws(()=>decode(source,[999]),/Unexpected village Graphics command 999/);
});
