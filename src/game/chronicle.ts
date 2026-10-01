/** Bounded, serializable folktale progression. No clock, renderer or storage ownership here. */
export type RouteId = 'road' | 'escort' | 'watch' | 'scout' | 'lantern' | 'bell' | 'whisper';
export type CaptainId = 'none' | 'gatekeeper' | 'lantern';
export type TaleId = 'none' | 'empty-bowl' | 'borrowed-bell' | 'olive-thread';
export type Preparation = 'none' | 'bread' | 'repair';
export type ChapterChoice = 'none' | 'cart' | 'scout';
export type MissionObjective = 'siege' | 'escort' | 'hold' | 'rescue' | 'light' | 'boss';
export type CommanderId = 'rush' | 'volley' | 'bulwark';
export interface Expedition { stage: 0 | 1 | 2; chapter: number; reserve: number; provision: 'supplies' | 'shelter'; }
export interface ChronicleProgress {
  version: 1; timeline: number; chapter: number; enabled: boolean; route: RouteId;
  clears: number[]; choices: ChapterChoice[]; captain: CaptainId; tale: TaleId; preparation: Preparation;
  restoration: number; veterans: [number, number]; discoveries: number; tutorial: number;
  expedition: Expedition | null; expeditionsWon: number;
}
export interface ChronicleContext { timeline: number; enemyAge: number; furthestBattle: number; }
export interface ChronicleVictory { deployedByKind: readonly number[]; survivingRoles: readonly boolean[]; food?: number; }
export interface RouteDefinition { id: RouteId; name: string; objective: MissionObjective; rule: string; reward: string; duration: number; }
export const ROUTES: readonly RouteDefinition[] = Object.freeze([
  { id:'road', name:'The old road', objective:'siege', rule:'Break the opposing gate. Gather your company before a coordinated push.', reward:'A chapter seal and a place in the tale.', duration:0 },
  { id:'escort', name:'The flour cart', objective:'escort', rule:'Escort the cart to the far courtyard. It moves with nearby friends and stops under threat.', reward:'The first rescued cart supplies later battles in this chapter.', duration:0 },
  { id:'watch', name:'The last watch', objective:'hold', rule:'Keep your gate standing for 75 seconds while the courtyard empties.', reward:'A victory for the people who got away.', duration:75 },
  { id:'scout', name:'The crooked alley', objective:'rescue', rule:'Hold the scout’s cage for four seconds, then escort the scout home.', reward:'The first rescued scout reveals the Bell Keeper’s preparations.', duration:0 },
  { id:'lantern', name:'The unlit path', objective:'light', rule:'Hold the lantern for 18 seconds in total, then break the enemy gate. Its light weakens shadow troops.', reward:'An optional night tale, never required to advance.', duration:18 },
  { id:'bell', name:'The Bell Keeper', objective:'boss', rule:'A heavy strike interrupts the bell’s wind-up. Defeat its keeper and break the gate.', reward:'A chapter finale with an interruptible, visible rule.', duration:0 },
  { id:'whisper', name:'The missing page', objective:'rescue', rule:'Follow the cat to the forgotten courtyard. Free the neighbour who was left behind and bring them home.', reward:'The three discoveries become a playable epilogue.', duration:0 },
]);
export const CAPTAINS = Object.freeze([
  { id:'none' as const, name:'The whole company', skill:'Food Drop', description:'Keep the original ten-food reinforcement skill.' },
  { id:'gatekeeper' as const, name:'Sitt Salma, gatekeeper', skill:'Stand together', description:'Replace Food Drop: protect the company and gate for six seconds.' },
  { id:'lantern' as const, name:'Younes, lantern-mender', skill:'Borrowed dawn', description:'Replace Food Drop: reveal shadows and still the bell for six seconds.' },
]);
export const TALES = Object.freeze([
  { id:'none' as const, name:'An unwritten page', description:'No featured tale. Your collected cards still apply.' },
  { id:'empty-bowl' as const, name:'The Empty Bowl', description:'Spending your last food shields your company for two seconds.' },
  { id:'borrowed-bell' as const, name:'The Borrowed Bell', description:'Released rally troops deal a stronger first strike, once each.' },
  { id:'olive-thread' as const, name:'The Olive Thread', description:'While friends hold a landmark, the cart and the gate mend slowly.' },
]);
export const DISCOVERIES = Object.freeze([
  { id:'door' as const, bit:1, name:'The mark on the door', text:'Someone has drawn a bell with no tongue. Under it: “A loud thing can still be lonely.”' },
  { id:'roof' as const, bit:2, name:'The crooked roof tile', text:'A strip of olive cloth is tucked beneath the tile. The same stitch holds Salma’s old buckler together.' },
  { id:'cat' as const, bit:4, name:'The cat who waited', text:'The cat finally moves. Beneath its paws is the missing page: the bell was meant to bring everyone home.' },
]);
export type DiscoveryId = typeof DISCOVERIES[number]['id'];
const routeIds = ROUTES.map(route=>route.id);
const chapterValid = (value: number) => Number.isInteger(value) && value >= 0 && value < 6;
const finite = (value: unknown, fallback: number, low: number, high: number) => typeof value==='number' && Number.isFinite(value) ? Math.max(low,Math.min(high,Math.floor(value))) : fallback;
const mask = (value: unknown, high: number) => typeof value==='number' && Number.isInteger(value) && value>=0 && value<=high ? value : 0;
const object = (value: unknown): Record<string,unknown> => value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
const copy = (c: ChronicleProgress): ChronicleProgress => ({...c,clears:[...c.clears],choices:[...c.choices],veterans:[...c.veterans],expedition:c.expedition?{...c.expedition}:null});
export function createChronicle(timeline=1, chapter=0): ChronicleProgress {
  return {version:1,timeline:finite(timeline,1,1,1000),chapter:finite(chapter,0,0,5),enabled:true,route:'road',clears:Array(6).fill(0),choices:Array<ChapterChoice>(6).fill('none'),captain:'none',tale:'none',preparation:'none',restoration:0,veterans:[0,0],discoveries:0,tutorial:0,expedition:null,expeditionsWon:0};
}
export function normalizeChronicle(value: unknown, timeline: number, chapter: number): ChronicleProgress {
  const result=createChronicle(timeline,chapter), data=object(value);
  if(data.version!==1)return result;
  result.enabled=data.enabled!==false;
  result.restoration=mask(data.restoration,7);
  const veterans=Array.isArray(data.veterans)?data.veterans:[];
  result.veterans=[finite(veterans[0],0,0,99),finite(veterans[1],0,0,99)];
  result.discoveries=mask(data.discoveries,7);
  result.tutorial=finite(data.tutorial,0,0,4);
  result.expeditionsWon=finite(data.expeditionsWon,0,0,999);
  if(data.timeline===result.timeline){
    result.clears=Array.from({length:6},(_,index)=>mask(Array.isArray(data.clears)?data.clears[index]:0,127));
    result.choices=Array.from({length:6},(_,index)=>{const choice=Array.isArray(data.choices)?data.choices[index]:null;return choice==='cart'||choice==='scout'?choice:'none';});
    if(data.chapter===result.chapter && routeIds.includes(data.route as RouteId))result.route=data.route as RouteId;
    const run=object(data.expedition);
    if([0,1,2].includes(run.stage as number)&&chapterValid(run.chapter as number)){
      result.expedition={stage:run.stage as Expedition['stage'],chapter:run.chapter as number,reserve:finite(run.reserve,0,0,12),provision:run.provision==='shelter'?'shelter':'supplies'};
      // Saved expeditions own their chapter and route until explicitly abandoned.
      result.chapter=result.expedition.chapter;
      result.route=expeditionRoute(result.expedition.stage);
    }
  }
  if(CAPTAINS.some(c=>c.id===data.captain)&&captainAvailable(result,data.captain as CaptainId))result.captain=data.captain as CaptainId;
  if(TALES.some(t=>t.id===data.tale)&&taleAvailable(result,data.tale as TaleId))result.tale=data.tale as TaleId;
  if(preparationAvailable(result,data.preparation as Preparation))result.preparation=data.preparation as Preparation;
  return result;
}
export function routeDefinition(route: RouteId): RouteDefinition { return ROUTES.find(item=>item.id===route)??ROUTES[0]; }
export function routeBit(route: RouteId): number { const index=routeIds.indexOf(route);return index<0?0:1<<index; }
export function distinctVictories(c: ChronicleProgress): number { return c.clears.reduce((sum,value)=>sum+Array.from({length:7},(_,i)=>(value>>i)&1).reduce((a,b)=>a+b,0),0); }
export function routeAvailable(c: ChronicleProgress, route: RouteId, chapter: number, furthest: number): boolean {
  if(!chapterValid(chapter)||!Number.isInteger(furthest)||chapter>furthest||!routeIds.includes(route))return false;
  if(c.expedition)return chapter===c.expedition.chapter && route===expeditionRoute(c.expedition.stage);
  if(route==='whisper')return c.discoveries===7;
  if(route==='bell')return (c.clears[chapter]??0)!==0;
  if(route==='lantern')return (c.clears[chapter]??0)!==0||c.discoveries!==0;
  return true;
}
export function chooseRoute(c: ChronicleProgress, route: RouteId, chapter: number, furthest: number): ChronicleProgress | null {
  if(c.expedition||!routeAvailable(c,route,chapter,furthest))return null;
  return {...copy(c),enabled:true,route,chapter};
}
export function captainAvailable(c: ChronicleProgress, id: CaptainId): boolean { return id==='none'||id==='gatekeeper'||id==='lantern'&&(c.choices.includes('scout')||(c.restoration&2)!==0); }
export function chooseCaptain(c: ChronicleProgress, id: CaptainId): ChronicleProgress | null { return captainAvailable(c,id)?{...copy(c),captain:id}:null; }
export function taleAvailable(c: ChronicleProgress, id: TaleId): boolean {
  return id==='none'||id==='empty-bowl'&&c.restoration!==0||id==='borrowed-bell'&&(distinctVictories(c)>=3||(c.restoration&2)!==0)||id==='olive-thread'&&c.discoveries===7;
}
export function chooseTale(c: ChronicleProgress, id: TaleId): ChronicleProgress | null { return taleAvailable(c,id)?{...copy(c),tale:id}:null; }
export function preparationAvailable(c: ChronicleProgress, id: Preparation): boolean { return id==='none'||id==='bread'&&(c.restoration&1)!==0||id==='repair'&&(c.restoration&4)!==0; }
export function recordChronicleWin(c: ChronicleProgress, context: ChronicleContext, victory: ChronicleVictory): ChronicleProgress {
  const next=copy(c), chapter=context.enemyAge;
  if(!chapterValid(chapter)||context.timeline!==c.timeline)return next;
  next.clears[chapter]=(next.clears[chapter]??0)|routeBit(next.route);
  if(next.choices[chapter]==='none'){
    if(next.route==='escort')next.choices[chapter]='cart';
    if(next.route==='scout')next.choices[chapter]='scout';
  }
  const count=distinctVictories(next);
  next.restoration|=(count>=1?1:0)|(count>=3?2:0)|(count>=6?4:0);
  next.veterans=next.veterans.map((wins,index)=>Math.min(99,wins+((victory.deployedByKind[index]??0)>0&&victory.survivingRoles[index]?1:0))) as [number,number];
  next.tutorial=4;
  if(next.expedition)next.expedition.reserve=finite(victory.food,0,0,12);
  return next;
}
export function discover(c: ChronicleProgress, id: DiscoveryId, safe: boolean): ChronicleProgress | null {
  const item=DISCOVERIES.find(clue=>clue.id===id);
  if(!safe||!item||(c.discoveries&item.bit)!==0)return null;
  return {...copy(c),discoveries:c.discoveries|item.bit};
}
const expeditionRoute = (stage: number): RouteId => (['escort','watch','bell'] as const)[stage]??'escort';
export function beginExpedition(c: ChronicleProgress, chapter: number, furthest: number): ChronicleProgress | null {
  if(c.expedition||!chapterValid(chapter)||chapter>furthest||c.restoration===0)return null;
  return {...copy(c),chapter,route:'escort',enabled:true,expedition:{stage:0,chapter,reserve:0,provision:'supplies'}};
}
export function continueExpedition(c: ChronicleProgress, won: boolean): ChronicleProgress | null {
  if(!won||!c.expedition)return null;
  if(c.expedition.stage===2)return {...copy(c),route:'road',expedition:null,expeditionsWon:Math.min(999,c.expeditionsWon+1)};
  const stage=(c.expedition.stage+1) as Expedition['stage'];
  return {...copy(c),route:expeditionRoute(stage),expedition:{...c.expedition,stage}};
}
export function abandonExpedition(c: ChronicleProgress): ChronicleProgress { return {...copy(c),route:'road',expedition:null}; }
export function timelineVariant(timeline: number): {id:'hearth'|'unlit'|'overgrown'|'ally';name:string;description:string} {
  const variants=[
    {id:'hearth' as const,name:'The first telling',description:'A warm courtyard, a crooked road, and a bell that will not sleep.'},
    {id:'unlit' as const,name:'The lamps were never lit',description:'Lanterns take longer to claim; the Bell Keeper begins its warning sooner.'},
    {id:'overgrown' as const,name:'The olive roots remember',description:'Supply cover is stronger, and heavy enemy processions arrive later.'},
    {id:'ally' as const,name:'An unlikely neighbour',description:'A former rival shares provisions; ranged commanders send fewer opening troops.'},
  ];
  const n=finite(timeline,1,1,1000);return variants[n===1?0:1+(n-2)%3];
}
export function commanderFor(c: ChronicleProgress, chapter: number): {id:CommanderId;name:string;description:string} {
  const records=[
    {id:'rush' as const,name:'Abu Firas, the impatient',description:'Quick, staggered charges. A held formation outlasts his first rush.'},
    {id:'volley' as const,name:'The meticulous aunt',description:'A defender screens her ranged company. Break the screen before it gathers.'},
    {id:'bulwark' as const,name:'The slow procession',description:'A heavy front with ranged support. Save a brittle strike for the gathering.'},
  ];
  const index=c.route==='watch'?0:c.route==='scout'?1:c.route==='bell'?2:finite(chapter,0,0,5)%3;
  return records[index];
}
interface Wave { readonly time:number; readonly intent:CommanderId; readonly members:readonly {readonly kind:0|1|2;readonly delay:number}[]; }
/** Deterministic, bounded variations on the existing authored schedule, never input-reactive AI. */
export function chronicleEncounter<T extends {readonly age:number;readonly waves:readonly Wave[]}>(base:T,c:ChronicleProgress,chapter:number): {age:number;waves:Wave[]} {
  const persona=commanderFor(c,chapter), variant=timelineVariant(c.timeline);
  if(!c.enabled||c.route==='road'&&variant.id==='hearth')return {age:base.age,waves:base.waves.map(w=>({...w,members:w.members.map(m=>({...m}))}))};
  const waves=base.waves.map((wave,index):Wave=>{
    let members=wave.members.map(member=>({...member}));
    if(persona.id==='rush'&&index<2)members=[{kind:0,delay:0},...(index===1?[{kind:0 as const,delay:1}]:[])];
    if(persona.id==='volley'&&index%2===1)members=[{kind:0,delay:0},{kind:1,delay:1.4}];
    if(persona.id==='bulwark'&&index>=2)members=[{kind:2,delay:0},{kind:1,delay:1.7}];
    if(variant.id==='ally'&&index===0)members=members.slice(0,1);
    const delay=variant.id==='overgrown'&&persona.id==='bulwark'?4:0;
    return {time:Math.max(3,wave.time+delay),intent:persona.id,members:members.slice(0,5)};
  });
  return {age:base.age,waves};
}
export function veteranName(role: number, victories: number): string {
  if(role===0)return victories>=3?'Rima of the Patched Buckler':'Rima, the steady hand';
  return victories>=3?'Nabil of the Counting Stones':'Nabil, the nervous thrower';
}
export type ChronicleAction =
  | {type:'rally'}
  | {type:'chronicle-route';route:RouteId;battle:number}
  | {type:'chronicle-captain';captain:CaptainId}
  | {type:'chronicle-tale';tale:TaleId}
  | {type:'chronicle-preparation';preparation:Preparation}
  | {type:'chronicle-discover';discovery:DiscoveryId}
  | {type:'chronicle-expedition';battle:number}
  | {type:'chronicle-continue'|'chronicle-abandon'}
  | {type:'chronicle-provision';provision:'supplies'|'shelter'};

/** A terminal receipt is deliberately smaller than the transient battlefield. */
export interface ChronicleReceipt {
 route:RouteId;enemyHp:number;cartX:number;cartHp:number;cartMaxHp:number;rescued:boolean;
 rescueProgress:number;lightSeconds:number;bossDefeated:boolean;interrupts:number;coveredHits:number;shatters:number;
}
export function normalizeChronicleReceipt(value:unknown,route:RouteId):ChronicleReceipt|undefined {
 const d=object(value);if(d.route!==route||!routeIds.includes(route))return undefined;
 const bounded=(v:unknown,lo:number,hi:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):lo;
 return {route,enemyHp:bounded(d.enemyHp,0,1e12),cartX:bounded(d.cartX,90,910),cartHp:bounded(d.cartHp,0,1e6),cartMaxHp:bounded(d.cartMaxHp,1,1e6),rescued:d.rescued===true,rescueProgress:bounded(d.rescueProgress,0,4),lightSeconds:bounded(d.lightSeconds,0,18),bossDefeated:d.bossDefeated===true,interrupts:finite(d.interrupts,0,0,1e5),coveredHits:finite(d.coveredHits,0,0,1e6),shatters:finite(d.shatters,0,0,1e6)};
}
