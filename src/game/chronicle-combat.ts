import { BATTLE_TIME_EPSILON } from './battle-time.ts';
import { createChronicle, routeDefinition, timelineVariant, veteranName, type MissionObjective, type RouteId } from './chronicle.ts';
import type { Profile, BattleState, Unit, GameEvent, Skill } from './types.ts';

export type ChronicleCue = 'rally' | 'covered' | 'breach' | 'shatter' | 'bell-warning' | 'bell-ring' | 'bell-stilled' | 'captain' | 'landmark' | 'rescued';
export interface ChronicleUnitMarks {
  storyVeteran?: 0 | 1; storyBoss?: boolean; storyShadow?: boolean;
  brittleUntil?: number; breachedUntil?: number; chargeReady?: boolean;
}
export interface ChronicleBattle {
  enabled: boolean; route: RouteId; objective: MissionObjective; rally: boolean; gathered: number[];
  veteranIds: [number | null, number | null]; shieldUntil: number; revealUntil: number;
  cart: {x:number;hp:number;maxHp:number}; rescued:boolean; rescueProgress:number; lightSeconds:number;
  landmark: {kind:'none'|'cover'|'supply'|'lantern';x:number;owner:'neutral'|'player'|'enemy';capture:number;pulse:number;broken:boolean};
  boss: {spawned:boolean;id:number|null;windupUntil:number;nextRing:number;interrupts:number;rings:number};
  coveredHits:number;shatters:number;settled:boolean;
}
export type ChronicleLandmarkPhase = 'neutral'|'claiming-player'|'claiming-enemy'|'contested'|'held-player'|'held-enemy'|'broken';
export interface ChronicleLandmarkStatus {
  kind: Exclude<ChronicleBattle['landmark']['kind'],'none'>; x:number;
  owner: ChronicleBattle['landmark']['owner']; capture:number; threshold:number; progress:number;
  playerCount:number; enemyCount:number; phase:ChronicleLandmarkPhase;
}
export interface ChronicleHost { hurt(unit:Unit,damage:number):number; spawnEnemy(kind:0|1|2):Unit|undefined; emit(event:GameEvent):void; }
const progress=(p:Profile)=>p.chronicle??createChronicle(p.timeline,p.enemyAge);
const alive=(unit:Unit)=>unit.hp>0;
const distance=(a:Unit,b:Unit)=>Math.hypot(a.x-b.x,(a.lane-b.lane)*10);
const active=(s:BattleState)=>s.phase==='running'&&!s.paused&&s.chronicle?.enabled===true;
const source=(u:Unit)=>({id:u.id,x:u.x,lane:u.lane,side:u.side,age:u.age,kind:u.kind});
const unitsNear=(s:BattleState,x:number,side:'player'|'enemy',radius=85)=>s.units.filter(u=>u.side===side&&alive(u)&&Number.isFinite(u.x)&&Math.abs(u.x-x)<=radius);
function cue(host:ChronicleHost,storyCue:ChronicleCue,x=500,amount=0,unit?:Unit):void {
  host.emit({type:'hit',storyCue,x,lane:unit?.lane??1,side:unit?.side??'player',amount,...(unit?{source:source(unit)}:{})});
}
export function createChronicleBattle(p:Profile):ChronicleBattle {
  const c=progress(p),route=c.chapter===p.enemyAge?c.route:'road',objective=routeDefinition(route).objective;
  const variant=timelineVariant(p.timeline),health=120*1.65**p.age;
  const kind=objective==='light'?'lantern':objective==='escort'?'cover':objective==='hold'?'supply':variant.id==='overgrown'&&route==='road'?'cover':'none';
  return {enabled:c.enabled,route,objective,rally:false,gathered:[],veteranIds:[null,null],shieldUntil:0,revealUntil:0,
    cart:{x:objective==='rescue'?620:210,hp:health,maxHp:health},rescued:false,rescueProgress:0,lightSeconds:0,
    landmark:{kind,x:500,owner:'neutral',capture:0,pulse:0,broken:false},
    boss:{spawned:false,id:null,windupUntil:0,nextRing:variant.id==='unlit'?10:14,interrupts:0,rings:0},coveredHits:0,shatters:0,settled:false};
}
/** One sanitized landmark contract shared by simulation, guidance, and presentation. */
export function chronicleLandmarkStatus(p:Profile,s:BattleState):ChronicleLandmarkStatus|null {
  const landmark=s.chronicle?.landmark;
  if(!s.chronicle?.enabled||!landmark||landmark.kind==='none')return null;
  const kind=(['cover','supply','lantern'] as const).includes(landmark.kind)?landmark.kind:'cover';
  const x=Number.isFinite(landmark.x)?Math.min(1000,Math.max(0,landmark.x)):500;
  const threshold=timelineVariant(p.timeline).id==='unlit'&&kind==='lantern'?4:3;
  const capture=Number.isFinite(landmark.capture)?Math.min(threshold,Math.max(-threshold,landmark.capture)):0;
  const owner=landmark.owner==='player'||landmark.owner==='enemy'?landmark.owner:'neutral';
  const playerCount=unitsNear(s,x,'player').length,enemyCount=unitsNear(s,x,'enemy').length;
  let phase:ChronicleLandmarkPhase;
  if(landmark.broken)phase='broken';
  else if(playerCount&&enemyCount)phase='contested';
  else if(playerCount)phase=owner==='player'&&capture>=threshold-1e-9?'held-player':'claiming-player';
  else if(enemyCount)phase=owner==='enemy'&&capture<=-threshold+1e-9?'held-enemy':'claiming-enemy';
  else phase=owner==='player'?'held-player':owner==='enemy'?'held-enemy':'neutral';
  let progress=Math.abs(capture)/threshold;
  if(phase==='claiming-player')progress=owner==='enemy'?(capture+threshold)/(threshold*2):Math.max(0,capture/threshold);
  if(phase==='claiming-enemy')progress=owner==='player'?(threshold-capture)/(threshold*2):Math.max(0,-capture/threshold);
  if(!playerCount&&!enemyCount&&owner==='player'&&capture<threshold-1e-9)progress=(threshold-capture)/(threshold*2);
  if(!playerCount&&!enemyCount&&owner==='enemy'&&capture>-threshold+1e-9)progress=(capture+threshold)/(threshold*2);
  if(phase==='neutral'||phase==='contested')progress=Math.abs(capture)/threshold;
  if(phase==='broken')progress=0;
  return {kind,x,owner,capture,threshold,progress:Math.min(1,Math.max(0,progress)),playerCount,enemyCount,phase};
}
export function chronicleStartingFood(p:Profile):number {
  const c=progress(p);if(!c.enabled)return 0;
  const provision=c.preparation==='bread'?3:0,cart=c.choices[p.enemyAge]==='cart'?2:0,ally=timelineVariant(p.timeline).id==='ally'?2:0;
  const reserve=c.expedition?Math.min(12,Math.max(0,c.expedition.reserve))+(c.expedition.provision==='supplies'?2:0):0;
  return Math.min(20,provision+cart+ally+reserve);
}
export function chronicleGateFactor(p:Profile):number { const c=progress(p);return c.enabled&&(c.preparation==='repair'||c.expedition?.provision==='shelter')?1.15:1; }
export function chronicleSpawn(p:Profile,s:BattleState,u:Unit):void {
  const c=s.chronicle;if(!c?.enabled)return;
  if(u.side==='player'){
    progress(p).tutorial=Math.max(progress(p).tutorial,u.kind===0?1:u.kind===1?2:0);
    if((u.kind===0||u.kind===1)&&c.veteranIds[u.kind]===null){u.storyVeteran=u.kind as 0|1;c.veteranIds[u.kind]=u.id;}
    if(c.rally&&c.gathered.length<6)c.gathered.push(u.id);
    if(progress(p).tale==='empty-bowl'&&s.food<1)c.shieldUntil=Math.max(c.shieldUntil,s.time+2);
  }else if(c.objective==='light'||timelineVariant(p.timeline).id==='unlit'&&c.objective==='boss')u.storyShadow=true;
}
function release(p:Profile,s:BattleState):void {
  const c=s.chronicle!;
  if(progress(p).tale==='borrowed-bell')for(const u of s.units)if(c.gathered.includes(u.id)&&alive(u))u.chargeReady=true;
  c.rally=false;c.gathered=[];
}
export function toggleRally(p:Profile,s:BattleState):boolean {
  if(!active(s))return false;
  if(s.chronicle!.rally)release(p,s);else {s.chronicle!.rally=true;s.chronicle!.gathered=[];}
  return true;
}
export function rallyPosition(s:BattleState,u:Unit):number|null {
  const c=s.chronicle;if(!c?.enabled||!c.rally||u.side!=='player')return null;
  const index=c.gathered.indexOf(u.id);return index<0?null:240-Math.floor(index/3)*24;
}
/** Automatic lane occupation, not another movement button on a small phone. */
export function chronicleMovementLimit(s:BattleState,u:Unit):number|null {
  const assembly=rallyPosition(s,u);if(assembly!==null)return assembly;
  const c=s.chronicle;
  if(c?.enabled&&c.objective==='light'&&c.lightSeconds<18&&u.side==='player'&&u.kind===0&&u.x>=430&&u.x<=520)return 480;
  return null;
}
/** Shared authoritative relationship query for combat and presentation. */
export function chronicleProtector(s:BattleState,target:Unit,includeBreached=false):Unit|undefined {
  if(target.kind!==1||!Number.isFinite(s.time)||!Number.isFinite(target.x)||!Number.isFinite(target.lane))return;
  const direction=target.side==='player'?1:-1;
  let best:Unit|undefined;
  for(const u of s.units){
    if(u.side!==target.side||u.kind!==0||!alive(u)||!Number.isFinite(u.x)||!Number.isFinite(u.lane)||u.breachedUntil!==undefined&&!Number.isFinite(u.breachedUntil)||!includeBreached&&(u.breachedUntil??0)>s.time||Math.abs(u.lane-target.lane)>1||(u.x-target.x)*direction<=0||(u.x-target.x)*direction>70)continue;
    if(!best||Math.abs(u.x-target.x)<Math.abs(best.x-target.x)||Math.abs(u.x-target.x)===Math.abs(best.x-target.x)&&(Math.abs(u.lane-target.lane)<Math.abs(best.lane-target.lane)||Math.abs(u.lane-target.lane)===Math.abs(best.lane-target.lane)&&u.id<best.id))best=u;
  }
  return best;
}
export function chronicleDamage(p:Profile,s:BattleState,attacker:Unit,target:Unit,damage:number,secondary=false):number {
  if(!Number.isFinite(damage)||damage<=0)return 0;
  const c=s.chronicle;if(!c?.enabled)return damage;
  let factor=1;
  // resolveRoleHit applied the ordinary 25% self-guard first. Breach removes it temporarily.
  if(attacker.kind===1&&target.kind===0&&(target.breachedUntil??0)>s.time)factor/=0.75;
  if(target.kind===1){
    const protectedBy=chronicleProtector(s,target)!==undefined;
    if(protectedBy)factor*=target.side==='player'&&(progress(p).veterans[0]??0)>=3?0.60:0.65;
  }
  if(target.side==='player'&&c.shieldUntil>s.time)factor*=0.65;
  if(!c.landmark.broken&&c.landmark.kind==='cover'&&c.landmark.owner===target.side&&Math.abs(target.x-c.landmark.x)<=65)factor*=timelineVariant(p.timeline).id==='overgrown'?0.7:0.8;
  const lit=c.revealUntil>s.time||c.landmark.kind==='lantern'&&c.landmark.owner==='player'&&Math.abs(target.x-c.landmark.x)<190;
  if(target.storyShadow&&lit)factor*=1.2;
  if(attacker.storyShadow&&(c.revealUntil>s.time||c.landmark.owner==='player'&&Math.abs(attacker.x-c.landmark.x)<190))factor*=0.8;
  if(attacker.side==='player'&&attacker.chargeReady&&!secondary)factor*=1.3;
  return damage*factor;
}
export function chronicleBaseDamage(s:BattleState,attacker:'player'|'enemy',damage:number):number { return attacker==='enemy'&&s.chronicle?.enabled&&s.chronicle.shieldUntil>s.time?damage*0.65:damage; }
export function chronicleAfterHit(p:Profile,s:BattleState,attacker:Unit,target:Unit,damage:number,secondary:boolean,host:ChronicleHost):void {
  const c=s.chronicle;if(!c?.enabled||secondary)return;
  attacker.chargeReady=false;
  if(target.kind===1&&chronicleProtector(s,target)!==undefined){c.coveredHits++;cue(host,'covered',target.x,0,target);}
  if(attacker.kind===2&&target.kind===0&&target.hp>0){target.breachedUntil=s.time+2;cue(host,'breach',target.x,0,attacker);}
  if(attacker.side==='player'&&attacker.kind===2){
    if(target.id===c.boss.id&&c.boss.windupUntil>s.time){c.boss.windupUntil=0;c.boss.nextRing=s.time+10;c.boss.interrupts++;cue(host,'bell-stilled',target.x,0,attacker);}
    if((target.brittleUntil??0)>s.time){
      target.brittleUntil=0;c.shatters++;
      const neighbours=s.units.filter(u=>u.side==='enemy'&&alive(u)&&u.id!==target.id&&distance(u,target)<=65).sort((a,b)=>distance(a,target)-distance(b,target)||a.id-b.id).slice(0,2);
      for(const u of neighbours){const actual=host.hurt(u,damage*0.35);host.emit({type:'hit',storyCue:'shatter',trait:'sweep',x:u.x,lane:u.lane,side:'player',source:source(attacker),target:'unit',amount:actual});}
      if(!neighbours.length)cue(host,'shatter',target.x,0,attacker);
    }
  }
}
export function chronicleSkill(p:Profile,s:BattleState,skill:Skill):void {
  const c=s.chronicle;if(!c?.enabled)return;
  if(skill==='freeze')for(const u of s.units)if(u.side==='enemy'&&alive(u))u.brittleUntil=s.freezeUntil;
  if(skill==='meteor'&&c.landmark.kind==='cover')c.landmark.broken=true;
  if(skill==='food'&&c.rally&&progress(p).tale==='borrowed-bell')release(p,s);
}
/** Called by the existing once-per-battle skill transaction, never directly by the UI. */
export function captainSkill(p:Profile,s:BattleState):boolean {
  const c=s.chronicle;if(!c?.enabled)return false;
  const captain=progress(p).captain;if(captain==='none')return false;
  if(captain==='gatekeeper')c.shieldUntil=s.time+6;
  else {c.revealUntil=s.time+6;c.boss.windupUntil=0;c.boss.nextRing=Math.max(c.boss.nextRing,s.time+6);}
  return true;
}
export function chronicleTick(p:Profile,s:BattleState,dt:number,host:ChronicleHost):void {
  if(!active(s)||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,0.25);const c=s.chronicle!,variant=timelineVariant(p.timeline);
  c.gathered=c.gathered.filter(id=>s.units.some(u=>u.id===id&&alive(u)));
  if(c.rally&&c.gathered.length===6&&c.gathered.every(id=>{const u=s.units.find(actor=>actor.id===id)!;return u.x>=(rallyPosition(s,u)??0)-0.5;})){release(p,s);cue(host,'rally',235);}
  const near=(x:number,side:'player'|'enemy',radius=85)=>unitsNear(s,x,side,radius);
  if(c.landmark.kind!=='none'&&!c.landmark.broken){
    const status=chronicleLandmarkStatus(p,s)!;
    const friends=status.playerCount,enemies=status.enemyCount,threshold=status.threshold;
    c.landmark.x=status.x;c.landmark.capture=status.capture;
    const owner=c.landmark.owner;
    if(friends&&!enemies)c.landmark.capture=Math.min(threshold,c.landmark.capture+dt);
    if(enemies&&!friends)c.landmark.capture=Math.max(-threshold,c.landmark.capture-dt);
    if(c.landmark.capture>=threshold-1e-9)c.landmark.owner='player';else if(c.landmark.capture<=-threshold+1e-9)c.landmark.owner='enemy';
    if(owner!==c.landmark.owner)cue(host,'landmark',c.landmark.x);
    if(c.landmark.owner==='player'){
      if(c.landmark.kind==='lantern'&&friends&&!enemies)c.lightSeconds=Math.min(18,c.lightSeconds+dt);
      if(c.landmark.kind==='supply'){c.landmark.pulse+=dt;if(c.landmark.pulse>=5){s.food=Math.min(99,s.food+1);c.landmark.pulse-=5;}}
      if(progress(p).tale==='olive-thread'&&friends&&!enemies){const mend=2*1.65**p.age*dt;s.playerHp=Math.min(s.playerMaxHp,s.playerHp+mend);c.cart.hp=Math.min(c.cart.maxHp,c.cart.hp+mend);}
    }
  }
  if(c.objective==='escort'){
    const enemies=near(c.cart.x,'enemy',70),friends=near(c.cart.x,'player',110);
    if(friends.length&&!enemies.length)c.cart.x=Math.min(790,c.cart.x+38*dt);
    if(enemies.length){const damage=Math.min(c.cart.hp,5*1.65**p.enemyAge*Math.min(2,enemies.length)*dt);c.cart.hp-=damage;s.stats.damageTaken+=damage;}
  }
  if(c.objective==='rescue'){
    if(!c.rescued){
      if(near(620,'player').length&&!near(620,'enemy').length)c.rescueProgress=Math.min(4,c.rescueProgress+dt);
      if(c.rescueProgress>=4-1e-9){c.rescued=true;cue(host,'rescued',620);}
    }else if(!near(c.cart.x,'enemy',70).length)c.cart.x=Math.max(150,c.cart.x-55*dt);
  }
  if(c.objective==='boss'){
    if(!c.boss.spawned&&s.time>=6){
      const keeper=host.spawnEnemy(2);
      if(keeper){keeper.storyBoss=true;keeper.hp*=3;keeper.maxHp=keeper.hp;c.boss.id=keeper.id;c.boss.spawned=true;}
    }
    const keeper=s.units.find(u=>u.id===c.boss.id&&alive(u));
    if(keeper&&c.revealUntil<=s.time){
      if(c.boss.windupUntil>0&&s.time>=c.boss.windupUntil){
        // Even a long fight creates at most eight special coat reinforcements.
        if(c.boss.rings<4)for(let i=0;i<2;i++){const coat=host.spawnEnemy(0);if(coat)coat.storyShadow=true;}
        c.boss.rings++;c.boss.windupUntil=0;c.boss.nextRing=s.time+12;cue(host,'bell-ring',keeper.x,0,keeper);
      }else if(c.boss.windupUntil===0&&s.time>=c.boss.nextRing){
        const warning=progress(p).choices[p.enemyAge]==='scout'?5:4;
        c.boss.windupUntil=s.time+warning;cue(host,'bell-warning',keeper.x,0,keeper);
      }
    }
  }
}
/** Loss wins simultaneous-outcome ties. A side objective cannot be skipped by killing the gate. */
export function chronicleOutcome(p:Profile,s:BattleState):'won'|'lost'|null {
  if(s.playerHp<=0)return 'lost';
  const c=s.chronicle;if(!c?.enabled)return s.enemyHp<=0?'won':null;
  if(c.objective==='escort')return c.cart.hp<=0?'lost':c.cart.x>=790?'won':null;
  if(c.objective==='hold')return s.time>=75-BATTLE_TIME_EPSILON?'won':null;
  if(c.objective==='rescue')return c.rescued&&c.cart.x<=150?'won':null;
  if(c.objective==='light')return s.enemyHp<=0&&c.lightSeconds>=18-1e-9?'won':null;
  if(c.objective==='boss')return c.boss.spawned&&!s.units.some(u=>u.id===c.boss.id&&alive(u))&&s.enemyHp<=0?'won':null;
  return s.enemyHp<=0?'won':null;
}
export function chronicleGuidance(p:Profile,s:BattleState):string {
  const c=s.chronicle;if(!c?.enabled)return '';
  if(s.phase==='ready')return routeDefinition(c.route).rule;
  const landmark=chronicleLandmarkStatus(p,s),landmarkName=landmark?.kind==='lantern'?'lantern':landmark?.kind==='supply'?'supplies':'road shelter';
  if(landmark&&landmark.phase!=='broken'){
    if(landmark.phase==='contested')return `${landmarkName[0]!.toUpperCase()+landmarkName.slice(1)} contested · clear nearby enemies to keep claiming`;
    if(landmark.phase==='claiming-player'&&landmark.owner!=='player')return `${landmark.owner==='enemy'?'Reclaiming':'Claiming'} ${landmarkName} · ${Math.max(0,landmark.threshold-landmark.capture).toFixed(1)} seconds left`;
    if(landmark.phase==='claiming-enemy')return `Enemy claiming ${landmarkName} · ${Math.max(0,landmark.threshold+landmark.capture).toFixed(1)} seconds to take it · contest the ground`;
    if(landmark.owner!=='player'&&c.objective==='light'){
      const remaining=Math.max(0,landmark.threshold-landmark.capture),seconds=Number.isInteger(remaining)?String(remaining):remaining.toFixed(1);
      return `${landmark.owner==='enemy'?'Reclaim':'Claim'} the lantern · stand beside it uncontested for ${seconds} ${remaining===1?'second':'seconds'}`;
    }
  }
  if(c.objective==='escort')return `Flour cart ${Math.round((c.cart.x-210)/580*100)}% · ${Math.ceil(c.cart.hp)}/${Math.ceil(c.cart.maxHp)} health`;
  if(c.objective==='hold')return `Keep the courtyard safe · ${Math.max(0,Math.ceil(75-s.time-BATTLE_TIME_EPSILON))} seconds left`;
  if(c.objective==='rescue')return c.rescued?`Scout returning home · ${Math.round((620-c.cart.x)/470*100)}%`:`Free the scout · ${c.rescueProgress.toFixed(1)}/4 seconds beside the cage`;
  if(c.objective==='light')return `Lantern ${Math.floor(c.lightSeconds+BATTLE_TIME_EPSILON)}/18 seconds · then break the gate`;
  if(c.objective==='boss')return c.boss.windupUntil>s.time?`Bell ringing in ${Math.ceil(c.boss.windupUntil-s.time)}s · interrupt with a heavy strike`:`Bell Keeper · ${c.boss.interrupts} interrupted ${c.boss.interrupts===1?'ring':'rings'}`;
  if((s.stats.deployedByKind[0]??0)===0)return 'Deploy a defender before ranged troops; defenders protect them.';
  if((s.stats.deployedByKind[1]??0)===0)return 'Send a ranged troop behind a defender; the defender protects it.';
  if(c.rally)return `Gathering ${c.gathered.length}/6 · release when your company is ready`;
  if(progress(p).tutorial<4&&!s.skillsUsed.includes('freeze'))return 'Freeze a gathering, then let a heavy warrior shatter it.';
  const role=s.units.find(u=>u.side==='player'&&u.storyVeteran!==undefined);
  return role?`${veteranName(role.storyVeteran!,progress(p).veterans[role.storyVeteran!])} keeps watch. Choose the moment to rally.`:'Gather, protect, and choose the moment to push.';
}
