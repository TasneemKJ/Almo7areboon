import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import * as saves from '../src/game/save.ts';
import { CARD_DEFS, cardBonus, foodRate } from '../src/game/data.ts';
import { cardPackCost } from '../src/game/cards.ts';
const { defaultProfile, loadProfile, saveProfile, SAVE_KEY } = saves;
function storage() { const values = new Map<string,string>(); return { values, getItem: (k:string)=>values.get(k)??null, setItem: (k:string,v:string)=>{values.set(k,v);} }; }
function won(g:Game) {g.dispatch({type:'start'});g.state.enemyHp=0;g.step(1/60);}

test('P06: active game uses the complete 30-card collection',()=>{
 assert.equal(CARD_DEFS.length,30);assert.equal(new Game().profile.cards.length,30);
});
test('P07: discounted packs charge exactly once and keep their random stream on reload',()=>{
 const p=defaultProfile();p.gems=2000;const a=new Game(p);const b=new Game(p);
 assert.equal(a.dispatch({type:'summon',count:10}),true);
 assert.equal(a.profile.gems,2000-cardPackCost(10));assert.equal(a.profile.cards.reduce((a,b)=>a+b,0),10);
 b.dispatch({type:'summon',count:10});assert.deepEqual(a.profile,b.profile);
 const c=new Game(a.profile);a.dispatch({type:'summon'});c.dispatch({type:'summon'});assert.deepEqual(a.profile,c.profile);
});
test('P08: an unfillable pack cannot charge currency or advance randomness',()=>{
 const p=defaultProfile();p.gems=10000;p.cards.fill(1000);const g=new Game(p);const before=JSON.stringify(g.profile);
 assert.equal(g.dispatch({type:'summon',count:50}),false);assert.equal(JSON.stringify(g.profile),before);
});
test('P09: permanent food and base bonuses affect the actual battle',()=>{
 const plain=defaultProfile(),p=defaultProfile();p.cards[28]=1;p.cards[24]=1;
 const a=new Game(plain),b=new Game(p);assert.ok(b.state.playerMaxHp>a.state.playerMaxHp);assert.ok(foodRate(p)>foodRate(plain));
 a.dispatch({type:'start'});b.dispatch({type:'start'});a.step(.25);b.step(.25);assert.ok(b.state.food>a.state.food);
});
test('P10: six-card legacy saves migrate by stat without losing copies',()=>{
 const raw={...defaultProfile(),version:1,cards:[1,2,3,4,5,6]};const p=loadProfile({getItem:()=>JSON.stringify(raw)});
 assert.equal(p.version,3);assert.equal(p.cards.length,30);assert.equal(p.cards[18],1);assert.equal(p.cards[0],2);assert.equal(p.cards[8],3);assert.equal(p.cards[3],4);assert.equal(p.cards[17],5);assert.equal(p.cards[1],6);
});
test('P11: a saved victory restores its result without granting the rewards twice',()=>{
 const g=new Game();won(g);const before=JSON.stringify(g.profile);const h=new Game(g.profile);
 assert.equal(h.state.phase,'won');assert.equal(JSON.stringify(h.profile),before);h.step(.25);assert.equal(JSON.stringify(h.profile),before);
 assert.equal(h.dispatch({type:'next'}),true);assert.equal(h.profile.enemyAge,1);assert.equal(h.profile.pendingVictory,null);
});
test('P12: battle statistics count actions and reset independently of lifetime totals',()=>{
 const g=new Game();g.dispatch({type:'start'});g.dispatch({type:'spawn',kind:0});g.dispatch({type:'skill',skill:'food'});
 assert.equal(g.state.stats.deployed,1);assert.equal(g.state.stats.foodSpent,3);assert.equal(g.state.stats.skillsCast,1);
 g.state.playerHp=0;g.step(1/60);g.dispatch({type:'retry'});assert.equal(g.state.stats.deployed,0);assert.equal(g.profile.deployed,1);
});
test('P13: reported coins never exceed the amount credited at the wallet cap',()=>{
 const p=defaultProfile();p.coins=1e9-3;const g=new Game(p);won(g);assert.equal(g.state.earned,3);assert.equal(g.profile.coins,1e9);
 assert.equal(g.drainEvents().filter(e=>e.type==='coin').reduce((a,e)=>a+(e.amount??0),0),3);
});
test('P14: hit events expose their source and actual damage, not overkill',()=>{
 const g=new Game();g.dispatch({type:'start'});g.dispatch({type:'spawn',kind:0});g.state.units[0].x=900;g.state.enemyHp=1;g.drainEvents();g.step(1/60);
 const hit=g.drainEvents().find(e=>e.type==='hit');assert.equal(hit?.amount,1);assert.equal(hit?.target,'base');assert.equal(hit?.source?.kind,0);
});
test('P15: deployment explanations match pause, food and spawn congestion',()=>{
 const g=new Game();assert.equal(g.deploymentStatus(0).reason,'ready');g.dispatch({type:'start'});
 g.dispatch({type:'pause'});assert.equal(g.deploymentStatus(0).reason,'paused');g.dispatch({type:'pause'});
 g.state.food=0;assert.equal(g.deploymentStatus(0).reason,'food');assert.ok(g.deploymentStatus(0).waitSeconds>0);
 g.state.food=99;for(let i=0;i<9;i++)assert.equal(g.dispatch({type:'spawn',kind:0}),true);
 const food=g.state.food;assert.equal(g.deploymentStatus(0).reason,'blocked');assert.equal(g.dispatch({type:'spawn',kind:0}),false);assert.equal(g.state.food,food);
});
test('P16: skills with no effect are not consumed',()=>{
 const g=new Game();g.dispatch({type:'start'});assert.equal(g.dispatch({type:'skill',skill:'meteor'}),false);
 g.state.food=99;assert.equal(g.dispatch({type:'skill',skill:'food'}),false);assert.deepEqual(g.state.skillsUsed,[]);
});
test('P18: corrupt primary saves recover from a validated backup',()=>{
 assert.equal(typeof saves.loadProfileWithStatus,'function');const s=storage();const p=defaultProfile();p.coins=222;saveProfile(p,s);p.coins=333;saveProfile(p,s);s.setItem(SAVE_KEY,'broken');
 const loaded=saves.loadProfileWithStatus(s);assert.equal(loaded.status,'recovered');assert.equal(loaded.profile.coins,222);
});
test('P19: saving never overwrites an unsupported future-version profile',()=>{
 const s=storage();const future=JSON.stringify({...defaultProfile(),version:99,coins:987});s.setItem(SAVE_KEY,future);
 assert.equal(saveProfile(defaultProfile(),s),false);assert.equal(s.getItem(SAVE_KEY),future);
});
test('P29: upgrade status disables capped levels and predicts the real next value',()=>{
 const p=defaultProfile();p.coins=1e8;const g=new Game(p);const next=g.upgradeStatus('food');assert.equal(next.allowed,true);
 g.dispatch({type:'upgrade',stat:'food'});assert.equal(foodRate(g.profile),next.nextValue);g.profile.foodLevel=100;
 assert.equal(g.upgradeStatus('food').reason,'max');assert.equal(g.dispatch({type:'upgrade',stat:'food'}),false);
});
test('P30: next-wave countdown and cleared state derive from the actual battle',()=>{
 const g=new Game();assert.equal(g.waveStatus().nextIn,3);g.dispatch({type:'start'});for(let i=0;i<190;i++)g.step(1/60);
 assert.equal(g.waveStatus().spawned,1);assert.ok(g.waveStatus().nextIn!>0);assert.equal(g.waveStatus().cleared,false);
});

test('a save written mid-battle reloads ready: earnings and lifetime counts kept, the battle itself starts fresh', () => {
  const profile = saves.defaultProfile();
  profile.unlocked = [true, true, true];
  const game = new Game(profile);
  game.dispatch({ type: 'start' });
  for (let tick = 0; tick < 60 * 16; tick++) {
    if (tick % 90 === 0) game.dispatch({ type: 'spawn', kind: 0 });
    game.step(1 / 60);
  }
  assert.equal(game.state.phase, 'running');
  assert.ok(game.profile.coins > 0 && game.profile.kills > 0 && game.profile.deployed > 0, 'the battle earned something worth keeping');
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  assert.equal(saves.saveProfile(game.profile, storage), true);
  const reloaded = new Game(saves.loadProfile(storage));
  assert.equal(reloaded.state.phase, 'ready');
  assert.equal(reloaded.state.units.length, 0);
  assert.equal(reloaded.state.wave, 0);
  assert.equal(reloaded.state.time, 0);
  assert.equal(reloaded.state.food, 6);
  assert.deepEqual(reloaded.state.skillsUsed, []);
  assert.equal(reloaded.state.stats.deployed, 0, 'per-battle statistics start over');
  for (const key of ['coins', 'gems', 'kills', 'deployed', 'wins', 'foodLevel', 'baseLevel'] as const) assert.equal(reloaded.profile[key], game.profile[key], key);
  assert.equal(reloaded.profile.pendingVictory, null);
});
