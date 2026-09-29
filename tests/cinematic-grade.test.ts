import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyGrade,eraGrade,foregroundMist,gradeMatrix,keyLightRays,projectileGlow,stageGlow,teamHalo,vignetteStops} from '../src/view/cinematic-grade.ts';

const luma=([r,g,b]:readonly number[])=>.2126*r+.7152*g+.0722*b;
const chroma=(c:readonly number[])=>Math.max(...c)-Math.min(...c);

test('every chapter grade adds contrast and saturation without crushing blacks or clipping whites',()=>{
 for(let age=0;age<6;age++){
  const m=gradeMatrix(eraGrade(age));
  assert.equal(m.length,20);
  assert.deepEqual(m.slice(15),[0,0,0,1,0],'alpha row must stay identity');
  const black=applyGrade(m,[0,0,0]),white=applyGrade(m,[255,255,255]);
  assert.ok(Math.max(...black)<=24,`chapter ${age} lifts blacks too far`);
  assert.ok(luma(white)>=235,`chapter ${age} dims highlights`);
  const dark=applyGrade(m,[70,80,82]),light=applyGrade(m,[190,196,188]);
  assert.ok(luma(light)-luma(dark)>(190-80)*1.1,`chapter ${age} must widen the mid-tone range`);
  const swatches=[[150,132,112],[112,138,110],[108,124,150]] as const,mean=(f:(c:readonly number[])=>number)=>swatches.reduce((sum,c)=>sum+f(c),0)/swatches.length;
  assert.ok(mean(c=>chroma(applyGrade(m,c as unknown as [number,number,number])))>mean(chroma)*1.15,`chapter ${age} must enrich muted colour`);
  const deep=applyGrade(m,[18,20,22]),shadow=applyGrade(m,[42,46,50]);
  assert.ok(Math.max(...deep)>0,`chapter ${age} crushes deep shadow detail to black`);
  assert.ok(luma(shadow)-luma(deep)>=15,`chapter ${age} merges shadow steps`);
 }
});

test('grade values are bounded and chapter-indexed defensively',()=>{
 assert.equal(eraGrade(-1),eraGrade(0));assert.equal(eraGrade(9),eraGrade(0));assert.equal(eraGrade(Number.NaN),eraGrade(0));
 for(let age=0;age<6;age++){
  const g=eraGrade(age);
  assert.ok(g.saturation>=1&&g.saturation<=1.4);assert.ok(g.contrast>=1&&g.contrast<=1.3);
  for(const gain of g.gain)assert.ok(gain>.9&&gain<1.1);
  for(const lift of g.lift)assert.ok(lift>=0&&lift<=16);
  assert.ok(Object.isFrozen(g));
 }
});

test('stage vignette leaves the lane clear and darkens only the frame edges and empty foreground',()=>{
 for(let age=0;age<6;age++){
  const v=vignetteStops(age);
  assert.equal(v.stops[0][1],0);assert.equal(v.stops[1][1],0);
  assert.ok(v.stops[1][0]>=.3,'the clear centre must cover the lane');
  for(let i=1;i<v.stops.length;i++){assert.ok(v.stops[i][0]>=v.stops[i-1][0]);assert.ok(v.stops[i][1]>=v.stops[i-1][1]);}
  assert.ok(v.stops.at(-1)![1]<=.65&&v.floor<=.6,'edges recede but never black out');
  assert.ok(v.center.y>.5&&v.center.y<.7,'centre sits on the lane, not the sky');
 }
});

test('key light rays stay faint, reach the lane and hold still under reduced motion',()=>{
 for(let age=0;age<6;age++){
  const rays=keyLightRays(age,280,12,false);
  assert.ok(rays.length>=3&&rays.length<=6);
  for(const ray of rays){assert.ok(ray.alpha>0&&ray.alpha<=.06);assert.ok(ray.y1<280);assert.ok(ray.y2>=280&&ray.y3>=280);}
  assert.deepEqual(keyLightRays(age,280,0,true),keyLightRays(age,280,500,true));
 }
});

test('team beacons use distinct cool and warm hues and brighten as a base weakens',()=>{
 const full=stageGlow(0,280,0,true,1,1),hurt=stageGlow(0,280,0,true,.1,1);
 const player=(marks:readonly {x:number;alpha:number;color:number}[])=>marks.filter(m=>m.x===39);
 const enemy=full.filter(m=>m.x===411);
 assert.ok(player(full).length>=1&&enemy.length>=1);
 assert.notEqual(player(full)[0].color,enemy[0].color);
 assert.ok(player(hurt)[0].alpha>player(full)[0].alpha);
 for(const mark of stageGlow(3,280,99,false,0,0))assert.ok(mark.alpha<=.3);
});

test('team halos separate the armies and flare briefly on hit',()=>{
 const blue=teamHalo('player',0,1,0,false),red=teamHalo('enemy',0,1,0,false);
 assert.notEqual(blue.color,red.color);
 assert.ok(teamHalo('player',0,1,1,false).alpha>blue.alpha);
 assert.ok(teamHalo('player',2,1,0,false).rx>blue.rx);
 assert.notEqual(teamHalo('enemy',0,1,0,true).color,red.color);
 assert.ok(teamHalo('player',0,1,Number.POSITIVE_INFINITY,false).alpha<=.6);
 assert.ok(teamHalo('player',0,Number.NaN,0,false).rx>0);
});

test('only bright projectile shapes emit light and stones stay unlit',()=>{
 assert.equal(projectileGlow('stone','player').alpha,0);assert.equal(projectileGlow('sling','enemy').alpha,0);
 assert.ok(projectileGlow('meteor','player').radius>projectileGlow('bullet','player').radius);
 assert.notEqual(projectileGlow('energy','player').color,projectileGlow('energy','enemy').color);
 for(const shape of ['arrow','bullet','cannonball','shell','energy','meteor'])assert.ok(projectileGlow(shape,'player').alpha<=.6);
});

test('foreground mist stays below the lane and disappears when there is no foreground strip',()=>{
 for(let age=0;age<6;age++){
  const marks=foregroundMist(age,280,430,30,false);
  assert.equal(marks.length,4);
  for(const m of marks){assert.ok(m.y>280+30&&m.y<430);assert.ok(m.alpha<=.13);}
  assert.deepEqual(foregroundMist(age,280,430,0,true),foregroundMist(age,280,430,90,true));
 }
 assert.deepEqual(foregroundMist(0,280,300,0,false),[]);
});

test('battlefield applies the grade only on WebGL and keeps light layers additive and behind the HUD bars',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/renderer\.type===Phaser\.WEBGL/);
 assert.match(source,/postFX\.addColorMatrix\(\)/);
 assert.doesNotMatch(source,/addBloom/,'unthresholded bloom washes the whole frame');
 for(const layer of ['rays','stageLight','halos','glow'])assert.match(source,new RegExp(`this\\.${layer}=this\\.add\\.graphics\\(\\)\\.setBlendMode\\(Phaser\\.BlendModes\\.ADD\\)`));
 assert.ok(source.indexOf('this.glow=this.add.graphics()')<source.indexOf('this.bars=this.add.graphics()'),'health bars must draw above glow');
 assert.match(source,/private flare\([^)]*\):void \{\n\s+if\(this\.reduce\)return;/,'reduced motion must not flash');
 assert.match(source,/if\(!this\.reduce\)\{this\.cameras\.main\.shake\(100,\.0015\);this\.cameras\.main\.flash/);
});
