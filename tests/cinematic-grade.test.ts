import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyGrade,eraGrade,foregroundMist,gradeMatrix,gradePixels,vignetteAlphaAt,keyLightRays,projectileGlow,stageGlow,teamHalo,vignetteStops} from '../src/view/cinematic-grade.ts';

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

test('outposts and the lane stay outside the vignette while corners recede',()=>{
 for(let age=0;age<6;age++){
  for(const u of [39/450,.5,411/450])assert.equal(vignetteAlphaAt(age,u,.66),0,`chapter ${age} darkens the fight at u=${u.toFixed(2)}`);
  assert.ok(vignetteAlphaAt(age,0,0)>=.3&&vignetteAlphaAt(age,1,1)>=.3,`chapter ${age} corners must recede`);
 }
});

test('baked pixel grade matches the matrix and leaves transparency alone',()=>{
 const m=gradeMatrix(eraGrade(3)),data=new Uint8ClampedArray([150,132,112,255, 9,9,9,0, 40,44,48,128]);
 gradePixels(data,m);
 assert.deepEqual([...data.slice(0,3)],applyGrade(m,[150,132,112]).map(Math.round));
 assert.deepEqual([...data.slice(4,8)],[9,9,9,0]);
 assert.equal(data[11],128,'alpha is never graded');
});

test('battlefield bakes the grade into static art instead of paying a per-frame post pass',()=>{
 const source=battlefieldSource();
 assert.doesNotMatch(source,/postFX|addBloom/,'full-screen post passes cost ~20% frame rate on software GL');
 assert.match(source,/gradePixels\(pixels\.data,matrix\)/);
 assert.match(source,/catch\{\/\* keep the ungraded/,'a tainted canvas must fall back, not crash');
 assert.match(source,/bakeGrade\(this,this\.graded,this\.layout,p\.age\);bakeGrade\(this,this\.graded,this\.layout,p\.enemyAge\)/);
 assert.match(source,/globalCompositeOperation='source-atop'/,'baked vignette must not paint into transparent foreground pixels');
 assert.match(source,/keyLightRays\(age,groundY,0,true\)/,'baked rays use the still, reduced-motion composition');
 assert.doesNotMatch(source,/this\.vignette|this\.rays/,'no full-screen blended layers per frame');
 for(const layer of ['halos','glow'])assert.match(source,new RegExp(`this\\.${layer}=this\\.add\\.graphics\\(\\)\\.setBlendMode\\(Phaser\\.BlendModes\\.ADD\\)`));
 assert.ok(source.indexOf('this.glow=this.add.graphics()')<source.indexOf('this.bars=this.add.graphics()'),'health bars must draw above glow');
 assert.match(source,/function flare\([^)]*\):void \{\n\s+if\(host\.reduce\(\)\)return;/,'reduced motion must not flash');
 assert.match(source,/if\(!this\.reduce\)\{this\.effects\.cameraKick\(100,\.0015,4\);this\.cameras\.main\.flash/);
});

test('bright chapters keep a dimmer road pool so troops stay darker than the lane',()=>{
 for(const age of [0,1,2])assert.ok(eraGrade(age).stage.alpha<eraGrade(age+3).stage.alpha,`chapter ${age} road pool washes out the army`);
});

test('combat text and skill feedback stay legible against bright skies',()=>{
 const source=battlefieldSource();
 assert.match(source,/\.setShadow\(0,2,'#08171d'/,'floating numbers need a drop shadow');
 assert.match(source,/fontSize:large\?'22px':heavy\?'15px':'13px'/);
 assert.match(source,/if\(!this\.reduce\)this\.cameras\.main\.flash\(220,170,240,255\)/,'freeze flash respects reduced motion');
 assert.doesNotMatch(source,/lineBetween\(95,this\.layout\.groundY\+34,355/,'the hairline frozen marker was replaced');
 const css=readFileSync(new URL('../src/ui/era-glow.css',import.meta.url),'utf8'),main=mainSource();
 assert.ok(main.indexOf("./ui/era-glow.css")>main.indexOf("./ui/combat-focus.css"),'era glow must load last to win the cascade');
 assert.match(css,/background:radial-gradient\(ellipse at 50% 78%,#7bada8[^;]+;\n background:radial-gradient\([^;]*color-mix/,'plain gradient must precede the color-mix one as a fallback');
 assert.match(css,/\.unit-card\.affordable img \{ animation:card-ready [.\d]+s ease-out 1; \}/,'ready cue is a one-shot pop, not an infinite loop');
 assert.doesNotMatch(css,/infinite/);
 assert.match(css,/\.unit-card\.affordable \{\n border-color:#ffe2a0;/,'the ready signal colour is constant across chapters');
 const material=readFileSync(new URL('../src/ui/material-language.css',import.meta.url),'utf8');
 const enamel=material.match(/\.skill-circle \{[^}]*box-shadow:([^;]+);/)![1];
 const glow=css.match(/\.skill-circle:not\(:disabled\):not\(\.used\) \{ box-shadow:([^;]+);/)![1];
 assert.ok(glow.startsWith(enamel),'skill glow must extend, not replace, the enamel shadow stack');
});

test('skill banners are never evicted by the damage-number cap',()=>{
 const source=battlefieldSource();
 assert.match(source,/banner:large\}/);
 assert.match(source,/const numbers=floaters\.filter\(f=>!f\.banner\);\n\s+if\(numbers\.length>24\)/);
 assert.doesNotMatch(source,/if\(this\.floaters\.length>24\)this\.floaters\.shift\(\)/);
});
