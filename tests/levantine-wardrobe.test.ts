import test from 'node:test';
import assert from 'node:assert/strict';
import {unitSvg,unitSheetSvg} from '../src/view/unit-illustrations.ts';
async function wardrobe(){
 const path='../src/view/levantine-wardrobe.ts';
 const m=await import(path).catch(()=>null);
 assert.ok(m,'the six chapter wardrobes must exist as actual rendering code');
 return m;
}
test('wardrobe uses six distinct layered constructions rather than a repeated generic costume',async()=>{
 const m=await wardrobe();
 const garments=Array.from({length:6},(_,age)=>m.garmentSvg(age,0,'player','u'));
 const hats=Array.from({length:6},(_,age)=>m.headwearSvg(age,0,'player','u'));
 assert.equal(new Set(garments).size,6);assert.equal(new Set(hats).size,6);
 for(const svg of [...garments,...hats]){assert.match(svg,/<path/);assert.doesNotMatch(svg,/NaN|undefined|<image|<script/);}
});
test('skin tones vary by character role but never by faction',async()=>{
 const m=await wardrobe();const tones=new Set();
 for(let age=0;age<6;age++)for(let kind=0;kind<3;kind++){
  const tone=m.skinPalette(age,kind);tones.add(tone.join());
  const a=unitSvg(age,kind as 0|1|2,'player'),b=unitSvg(age,kind as 0|1|2,'enemy');
  assert.deepEqual([...a.matchAll(/id="us"[^]*?<\/linearGradient>/g)].map(x=>x[0]),[...b.matchAll(/id="us"[^]*?<\/linearGradient>/g)].map(x=>x[0]));
  assert.ok(a.includes(tone[0])&&a.includes(tone[1]));
 }
 assert.ok(tones.size>=3);
});
test('source portraits and all six atlas cells contain their real chapter garment',async()=>{
 const m=await wardrobe();
 for(const age of [0,1,2,3,4,5])for(const kind of [0,1] as const){
  const garment=m.garmentSvg(age,kind,'player','u');
  assert.ok(unitSvg(age,kind).includes(garment));
  const sheet=unitSheetSvg(age,kind,'player');
  assert.equal(sheet.split(garment).length-1,6);
 }
});
test('historic-town clothing has an open coat, woven sash and restrained trim without sacred text',async()=>{
 const m=await wardrobe(),svg=m.garmentSvg(3,0,'player','u');
 assert.match(svg,/data-cut="open-coat"/);assert.match(svg,/data-detail="woven-sash"/);
 assert.doesNotMatch(svg,/<text|<image/);
 assert.notEqual(svg,m.garmentSvg(3,0,'enemy','u'));
});
test('invalid wardrobe indices fall back without malformed geometry',async()=>{
 const m=await wardrobe();
 for(const age of [-1,10,NaN,Infinity]){
  assert.equal(m.garmentSvg(age,0,'player','u'),m.garmentSvg(0,0,'player','u'));
  assert.deepEqual(m.skinPalette(age,0),m.skinPalette(0,0));
 }
});
