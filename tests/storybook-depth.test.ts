import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {arenaLayout,landscapePlacement} from '../src/view/visual-theme.ts';

const load=async()=>{const result=await import(new URL('../src/view/storybook-depth.ts',import.meta.url).href).catch(()=>null);assert.ok(result,'source-registered depth model must exist');return result;};
const viewport={placement:{x:0,y:0,scale:1},cssWorldScale:1,visibleSource:[0,0,900,1000] as const,hudSourceBounds:[] as readonly (readonly number[])[]};
const area=(points:readonly any[])=>Math.abs(points.reduce((a,p,i)=>a+p.x*points[(i+1)%points.length].y-p.y*points[(i+1)%points.length].x,0))/2;
function inside(p:any,tri:readonly any[]){const sides=tri.map((a,i)=>{const b=tri[(i+1)%tri.length];return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);});return sides.every(x=>x>=-1e-8)||sides.every(x=>x<=1e-8);}
function clippedArea(polygon:readonly any[],rect:readonly number[]){
 let points=polygon.slice();
 for(const [axis,value,sign] of [['x',rect[0],1],['y',rect[1],1],['x',rect[2],-1],['y',rect[3],-1]] as const){
  const next:any[]=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],aa=(a[axis]-value)*sign,bb=(b[axis]-value)*sign;if(aa>=0)next.push(a);if((aa>=0)!==(bb>=0)){const t=aa/(aa-bb);next.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}points=next;
 }return points.length>=3?area(points):0;
}
const paint=(m:any,mesh:any,time=0,reduced=false,lamps=[.14,.14])=>{let alpha=0,color=0;const output:any[]=[];m.paintStorybookDepth({fillStyle(c:number,a:number){color=c;alpha=a;},fillTriangle(...coords:number[]){output.push({color,alpha,coords});}},mesh,time,reduced,lamps);return output;};

test('First Fires geometry belongs to the inspected plate, with two readable depth pockets and two reflected surfaces',async()=>{
 const m=await load(),mesh=m.cacheStorybookDepth(0,viewport);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../public/art/storybook/village.webp',import.meta.url))).digest('hex'),'325061301c965463fa5b2221f82ed5a52001e1b2ecea1bf9e6fcfcc8a1f98d5b');
 assert.ok(mesh.length>=20&&mesh.length<=120);assert.equal(new Set(mesh.filter((t:any)=>t.kind==='depth').map((t:any)=>t.region)).size,2);assert.equal(new Set(mesh.filter((t:any)=>t.kind==='reflection').map((t:any)=>t.region)).size,2);
 const depth=mesh.filter((t:any)=>t.kind==='depth'),reflection=mesh.filter((t:any)=>t.kind==='reflection');
 assert.ok(depth.reduce((n:number,t:any)=>n+area(t.points),0)>5000,'air must cover a meaningful hill area');assert.ok(reflection.reduce((n:number,t:any)=>n+area(t.points),0)>300,'grounded light is a surface rather than a single dot');
 for(const point of [{x:525,y:305},{x:695,y:350}])assert.ok(depth.some((t:any)=>inside(point,t.points)),'both actual hill pockets receive depth');
 for(const point of [{x:219,y:513},{x:788,y:550}])assert.ok(reflection.some((t:any)=>inside(point,t.points)),'light lands on two independently measured masonry surfaces');
});

test('authored triangles exclude protected cypresses, roofs, distant homes and the gold path',async()=>{
 const m=await load(),mesh=m.cacheStorybookDepth(0,viewport);
 const protectedRects=[[333,246,364,376],[432,284,448,320],[450,301,461,332],[678,267,696,316],[798,319,824,408],[840,226,875,400],[584,338,608,356],[753,241,811,299],[590,366,622,376],[645,382,667,391],[715,391,735,400],[453,350,486,383],[720,356,786,390],[229,350,245,376],[730,466,748,489],[233,489,279,558],[722,515,768,579]];
 for(const triangle of mesh)for(const rect of protectedRects)assert.ok(clippedArea(triangle.points,rect)<1e-7,`${triangle.region} covers a protected ink/surface rectangle ${rect}`);
});

test('crop and every partially outside HUD rectangle clip real triangles with a two-pixel source-safe margin',async()=>{
 const m=await load();for(const crop of [[450,275,730,390],[0,400,900,580],[650,280,790,380]]){
  const hud=[[-10,300,545,330],[682,342,707,370]];const input={...viewport,visibleSource:crop,hudSourceBounds:hud},before=structuredClone(input),mesh=m.cacheStorybookDepth(0,input);assert.deepEqual(input,before);assert.ok(mesh.length<=120);
  for(const triangle of mesh){assert.ok(Math.abs(clippedArea(triangle.points,crop)-area(triangle.points))<1e-6);for(const rect of hud)assert.ok(clippedArea(triangle.points,[rect[0]-2,rect[1]-2,rect[2]+2,rect[3]+2])<1e-7);}
 }
});

test('uniform source registration follows portrait and cropped landscape without reusing geometry across chapters',async()=>{
 const m=await load(),original=m.cacheStorybookDepth(0,viewport);
 for(const [width,height] of [[320,300],[390,430],[450,430],[320,180]]){
  const layout=arenaLayout(width,height),placement=landscapePlacement(450,layout.height,layout.groundY),mesh=m.cacheStorybookDepth(0,{...viewport,placement,cssWorldScale:width/450});assert.equal(mesh.length,original.length);
  for(let i=0;i<mesh.length;i++)for(let j=0;j<3;j++){assert.ok(Math.abs(mesh[i].points[j].x-(placement.x+original[i].points[j].x*placement.scale))<1e-8);assert.ok(Math.abs(mesh[i].points[j].y-(placement.y+original[i].points[j].y*placement.scale))<1e-8);}
 }
 for(const age of [1,2,3,4,5,-1,NaN,Infinity,.5,6])assert.deepEqual(m.cacheStorybookDepth(age,viewport),[]);
});

test('invalid placement/crop/HUD data fails closed rather than painting unregistered or nonfinite marks',async()=>{
 const m=await load();for(const bad of [NaN,Infinity,-Infinity])for(const key of ['x','y','scale'])assert.deepEqual(m.cacheStorybookDepth(0,{...viewport,placement:{...viewport.placement,[key]:bad}}),[]);
 for(const crop of [[0,0,NaN,1000],[0,500,900,400],[10,10,10,10]])assert.deepEqual(m.cacheStorybookDepth(0,{...viewport,visibleSource:crop}),[]);
 for(const hudSourceBounds of [[[0,0,NaN,1000]],Array.from({length:65},()=>[0,0,900,1000])])assert.deepEqual(m.cacheStorybookDepth(0,{...viewport,hudSourceBounds}),[]);
});

test('painting reuses immutable geometry, bounds fills/alphas and freezes all decoration under reduced motion',async()=>{
 const m=await load(),mesh=m.cacheStorybookDepth(0,viewport),before=structuredClone(mesh);assert.ok(Object.isFrozen(mesh));
 const still=paint(m,mesh,0,true);for(const time of [30,999,NaN,Infinity])assert.deepEqual(paint(m,mesh,time,true),still);
 for(const time of [0,30,999,NaN,Infinity]){const output=paint(m,mesh,time,false,[NaN,Infinity]);assert.ok(output.length<=120);for(const mark of output){assert.ok(mark.coords.every(Number.isFinite));assert.ok(mark.alpha>0&&mark.alpha<=.25);}}
 assert.deepEqual(mesh,before);assert.notDeepEqual(paint(m,mesh,0),paint(m,mesh,30),'ordinary air has one restrained shared-clock breath');
});

test('sparse HUD lists fail closed rather than throwing while building a cached mask',async()=>{
 const m=await load();
 assert.deepEqual(m.cacheStorybookDepth(0,{...viewport,hudSourceBounds:Array(1)}),[]);
 assert.deepEqual(m.cacheStorybookDepth(0,{...viewport,hudSourceBounds:[,[-10,300,545,330]]}),[]);
});
