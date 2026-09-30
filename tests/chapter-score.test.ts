import test from 'node:test';
import assert from 'node:assert/strict';
async function scores(){const path='../src/view/chapter-score.ts';const m=await import(path).catch(()=>null);assert.ok(m,'authored chapter score export required');return m.CHAPTER_SCORES;}
test('six bounded authored scores preserve roots, contour and an exposed four-second rest',async()=>{
 const all=await scores();assert.equal(all.length,6);assert.deepEqual(all.map((s:any)=>s.root),[146.83,130.81,146.83,130.81,110,146.83]);
 const schedules=new Set();
 for(const s of all){
  assert.ok(s.plucks.length>=3&&s.plucks.length<=6);assert.ok(s.answers.length<=2);
  assert.deepEqual(s.plucks.slice(0,3).map((n:any)=>n.semitones-s.plucks[0].semitones),[0,3,2]);
  const times=[0,...[...s.plucks,...s.answers].map((n:any)=>{assert.ok(Number.isFinite(n.at)&&n.at>=0&&n.at<24);assert.ok(Number.isFinite(n.decay)&&n.decay>0);assert.ok(Number.isFinite(n.semitones));return n.at;}).sort((a,b)=>a-b),24];
  assert.ok(times.some((at,i)=>i>0&&at-times[i-1]>=4),'at least four seconds without a new pitched attack');
  schedules.add(JSON.stringify([s.plucks,s.answers]));
 }
 assert.equal(schedules.size,6);
});
test('authored chapter schedules match the approved initial composition',async()=>{
 const all=await scores();
 assert.deepEqual(all.map((s:any)=>s.plucks.map((n:any)=>[n.at,n.semitones])),[
  [[1.2,0],[3.2,3],[5.2,2],[14,0]],[[1,0],[1.8,3],[6.4,2],[13,7],[13.8,5]],[[1.2,0],[4,3],[6.2,2],[15,-12]],[[1,0],[2.1,3],[5,2],[13,7],[14.4,5]],[[1.2,-12],[4.2,-9],[7.2,-10]],[[1,0],[3,3],[5.2,2],[13,7],[16,5]],
 ]);
 assert.deepEqual(all.map((s:any)=>s.answers.map((n:any)=>[n.at,n.semitones])),[[[18.5,12]],[[19,12]],[[19.5,7]],[[19,12]],[[18,0]],[[20.5,12]]]);
});
