import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {storybookArt} from '../src/view/storybook-art.ts';
import {villageFrame} from '../src/view/village-life.ts';
import {createVillageMood} from '../src/view/village-mood.ts';
import {villageVerdictFrame} from '../src/view/village-verdict.ts';

// Execute the actual production storybook branch with its real village model.
// Only the Graphics/scene boundary is recorded; no alternate render path exists.
const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('battlefield.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
let method:ts.MethodDeclaration|undefined;
function visit(node:ts.Node){if(ts.isMethodDeclaration(node)&&node.name.getText(ast)==='drawAtmosphere')method=node;ts.forEachChild(node,visit);}
visit(ast);assert.ok(method);
const js=ts.transpileModule(`class Subject { ${method!.getText(ast)} }; globalThis.Subject=Subject;`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const viewport={placement:{x:0,y:0,scale:1},cssWorldScale:1,visibleSource:[0,0,900,1000] as const,hudSourceBounds:[]};
async function execute(age=0,reduced=false,time=0){
 const depth=await import(new URL('../src/view/storybook-depth.ts',import.meta.url).href).catch(()=>({cacheStorybookDepth:()=>[],paintStorybookDepth:()=>0}));
 const triangles:any[]=[],polygons:any[]=[];let color=0,alpha=0;
 const graphics:any={clear(){triangles.length=0;polygons.length=0;return this;},fillStyle(c:number,a:number){color=c;alpha=a;return this;},fillTriangle(...coords:number[]){triangles.push({color,alpha,coords});return this;},fillPoints(points:any){polygons.push({color,alpha,points});return this;},lineStyle(){return this;},lineBetween(){return this;}};
 const game={profile:{age},state:{phase:'running',paused:false}},before=structuredClone(game);
 const context:any={storybookArt,villageFrame,villageVerdictFrame,...depth,game,options:{},navigator:{webdriver:false}};
 runInNewContext(js,context);const subject=new context.Subject();
 const quiet=createVillageMood();Object.assign(subject,{ambience:graphics,streak:{clear(){}},stars:{setVisible(){}},clouds:{setVisible(){}},mist:{setVisible(){}},stageLight:{length:0,setVisible(){}},villageViewport:viewport,storybookDepth:depth.cacheStorybookDepth(age,viewport),quietVillage:quiet,clock:time,reduce:reduced,aftermath:null,waveArrival:null,orderFrame:null,musterFrame:null});
 subject.drawAtmosphere();assert.deepEqual(game,before);
 return {triangles,polygons,subject,mesh:subject.storybookDepth};
}

test('actual storybook branch paints visible cached First Fires triangles before residents',async()=>{
 const frame=await execute(0,false,2);assert.ok(frame.triangles.length>=20,'actual shipped storybook branch must paint its authored depth mesh');assert.ok(frame.triangles.length<=120);assert.ok(frame.polygons.length>0,'existing habitation remains');
 assert.ok(frame.triangles.some(t=>t.color===0x92b9c6),'cool valley air is actually rendered');assert.ok(frame.triangles.some(t=>t.color===0xffd28a),'two grounded practical reflections are actually rendered');
});

test('actual storybook draw retains chapter isolation and static reduced-motion output',async()=>{
 for(const age of [1,2,3,4,5])assert.deepEqual((await execute(age)).triangles,[]);
 const a=await execute(0,true,0),b=await execute(0,true,30),c=await execute(0,true,999);assert.ok(a.triangles.length>0);assert.deepEqual(a.triangles,b.triangles);assert.deepEqual(a.triangles,c.triangles);
});
