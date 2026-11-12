/** Bounded, serializable folktale progression. No clock, renderer or storage ownership here. */
import { tr } from './locale.ts';
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
// Display text is read through getters, so each access speaks the current language (ids stay English).
export const ROUTES: readonly RouteDefinition[] = Object.freeze([
  { id:'road', get name(){return tr('The old road','الطريق القديم');}, objective:'siege', get rule(){return tr('Break the opposing gate. Gather your company before a coordinated push.','حطّم بوّابة العدوّ. اجمع سريّتك قبل أن تندفعوا معاً.');}, get reward(){return tr('A chapter seal and a place in the tale.','ختمُ الفصل، ومكانٌ في الحكاية.');}, duration:0 },
  { id:'escort', get name(){return tr('The flour cart','عربة الطحين');}, objective:'escort', get rule(){return tr('Escort the cart to the far courtyard. It moves with nearby friends and stops under threat.','رافِق العربة إلى الساحة البعيدة. تسير حين يكون رفاقها قربها، وتقف إذا داهمها الخطر.');}, get reward(){return tr('The first rescued cart supplies later battles in this chapter.','أوّل عربة تنقذها تمدّ معارك هذا الفصل اللاحقة بالمؤونة.');}, duration:0 },
  { id:'watch', get name(){return tr('The last watch','الحراسة الأخيرة');}, objective:'hold', get rule(){return tr('Keep your gate standing for 75 seconds while the courtyard empties.','أبقِ بوّابتك صامدة 75 ثانية ريثما تخلو الساحة.');}, get reward(){return tr('A victory for the people who got away.','نصرٌ لمن نجوا بأرواحهم.');}, duration:75 },
  { id:'scout', get name(){return tr('The crooked alley','الزقاق الأعوج');}, objective:'rescue', get rule(){return tr('Hold the scout’s cage for four seconds, then escort the scout home.','اثبُت عند قفص الكشّاف أربع ثوانٍ، ثم رافِقه إلى البيت.');}, get reward(){return tr('The first rescued scout reveals the Bell Keeper’s preparations.','أوّل كشّاف تنقذه يكشف لك ما يُعدّه حارس الجرس.');}, duration:0 },
  { id:'lantern', get name(){return tr('The unlit path','الدرب المعتم');}, objective:'light', get rule(){return tr('Hold the lantern for 18 seconds in total, then break the enemy gate. Its light weakens shadow troops.','احرس القنديل 18 ثانية في المجموع، ثم حطّم بوّابة العدوّ. نوره يُضعف جنود الظلّ.');}, get reward(){return tr('An optional night tale, never required to advance.','حكايةٌ ليلية اختيارية، لا تحتاجها لتتقدّم.');}, duration:18 },
  { id:'bell', get name(){return tr('The Bell Keeper','حارس الجرس');}, objective:'boss', get rule(){return tr('A heavy strike interrupts the bell’s wind-up. Defeat its keeper and break the gate.','ضربةٌ ثقيلة تقطع على الجرس استعداده للرنين. اهزم حارسه وحطّم البوّابة.');}, get reward(){return tr('A chapter finale with an interruptible, visible rule.','خاتمةٌ للفصل، بقاعدةٍ واضحة يمكنك أن تقطعها.');}, duration:0 },
  { id:'whisper', get name(){return tr('The missing page','الصفحة الضائعة');}, objective:'rescue', get rule(){return tr('Follow the cat to the forgotten courtyard. Free the neighbour who was left behind and bring them home.','اتبع القطّة إلى الساحة المنسيّة. حرّر الجار الذي بقي وراءنا وأعِده إلى البيت.');}, get reward(){return tr('The three discoveries become a playable epilogue.','تصير الاكتشافات الثلاثة خاتمةً تلعبها.');}, duration:0 },
]);
export const CAPTAINS = Object.freeze([
  { id:'none' as const, get name(){return tr('The whole company','السريّة كلّها');}, get skill(){return tr('Food Drop','إمداد المؤونة');}, get description(){return tr('Keep the original ten-food reinforcement skill.','احتفظ بمهارة الإمداد الأصلية: عشرٌ من المؤونة.');} },
  { id:'gatekeeper' as const, get name(){return tr('Sitt Salma, gatekeeper','ستّ سلمى، حارسة البوّابة');}, get skill(){return tr('Stand together','كتفاً إلى كتف');}, get description(){return tr('Replace Food Drop: protect the company and gate for six seconds.','بدل إمداد المؤونة: احمِ السريّة والبوّابة ستّ ثوانٍ.');} },
  { id:'lantern' as const, get name(){return tr('Younes, lantern-mender','يونس، مُصلح القناديل');}, get skill(){return tr('Borrowed dawn','فجرٌ مستعار');}, get description(){return tr('Replace Food Drop: reveal shadows and still the bell for six seconds.','بدل إمداد المؤونة: اكشف الظلال وأسكِت الجرس ستّ ثوانٍ.');} },
]);
export const TALES = Object.freeze([
  { id:'none' as const, get name(){return tr('An unwritten page','صفحةٌ لم تُكتب');}, get description(){return tr('No featured tale. Your collected cards still apply.','لا حكاية مختارة. بطاقاتك المجموعة تبقى فعّالة.');} },
  { id:'empty-bowl' as const, get name(){return tr('The Empty Bowl','الصحن الفارغ');}, get description(){return tr('Spending your last food shields your company for two seconds.','حين تنفق آخر مؤونتك، تُحمى سريّتك ثانيتين.');} },
  { id:'borrowed-bell' as const, get name(){return tr('The Borrowed Bell','الجرس المستعار');}, get description(){return tr('Released rally troops deal a stronger first strike, once each.','الجنود الذين تطلقهم بعد التجمّع يضربون ضربتهم الأولى أقوى، مرّةً لكلّ واحد.');} },
  { id:'olive-thread' as const, get name(){return tr('The Olive Thread','خيط الزيتون');}, get description(){return tr('While friends hold a landmark, the cart and the gate mend slowly.','ما دام رفاقك يمسكون موضعاً، تُرمَّم العربة والبوّابة على مهل.');} },
]);
export const DISCOVERIES = Object.freeze([
  { id:'door' as const, bit:1, get name(){return tr('The mark on the door','العلامة على الباب');}, get text(){return tr('Someone has drawn a bell with no tongue. Under it: “A loud thing can still be lonely.”','رسم أحدهم جرساً بلا لسان، وكتب تحته: «قد يكون العالي الصوت وحيداً.»');} },
  { id:'roof' as const, bit:2, get name(){return tr('The crooked roof tile','القرميدة المائلة');}, get text(){return tr('A strip of olive cloth is tucked beneath the tile. The same stitch holds Salma’s old buckler together.','تحت القرميدة شريطٌ من قماشٍ زيتونيّ، بالغرزة نفسها التي تمسك ترس سلمى القديم.');} },
  { id:'cat' as const, bit:4, get name(){return tr('The cat who waited','القطّة التي انتظرت');}, get text(){return tr('The cat finally moves. Beneath its paws is the missing page: the bell was meant to bring everyone home.','أخيراً تتحرّك القطّة. تحت مخالبها الصفحة الضائعة: كان الجرس يُقرَع ليعود الجميع إلى البيت.');} },
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
    {id:'hearth' as const,name:tr('The first telling','الحكاية الأولى'),description:tr('A warm courtyard, a crooked road, and a bell that will not sleep.','ساحةٌ دافئة، ودربٌ أعوج، وجرسٌ لا ينام.')},
    {id:'unlit' as const,name:tr('The lamps were never lit','القناديل لم تُضأ قطّ'),description:tr('Lanterns take longer to claim; the Bell Keeper begins its warning sooner.','الاستيلاء على القناديل يطول، وحارس الجرس يُنذر أبكر.')},
    {id:'overgrown' as const,name:tr('The olive roots remember','جذور الزيتون تتذكّر'),description:tr('Supply cover is stronger, and heavy enemy processions arrive later.','غطاء المؤونة أمتن، ومواكب العدوّ الثقيلة تتأخّر.')},
    {id:'ally' as const,name:tr('An unlikely neighbour','جارٌ لم يكن في الحسبان'),description:tr('A former rival shares provisions; ranged commanders send fewer opening troops.','خصمٌ قديم يقاسمك المؤونة، وقادة الرماية يرسلون جنوداً أقلّ في البداية.')},
  ];
  const n=finite(timeline,1,1,1000);return variants[n===1?0:1+(n-2)%3];
}
export function commanderFor(c: ChronicleProgress, chapter: number): {id:CommanderId;name:string;description:string} {
  const records=[
    {id:'rush' as const,name:tr('Abu Firas, the impatient','أبو فراس، قليل الصبر'),description:tr('Quick, staggered charges. A held formation outlasts his first rush.','هجماتٌ سريعة متتابعة. الصفّ الثابت يصمد بعد اندفاعته الأولى.')},
    {id:'volley' as const,name:tr('The meticulous aunt','الخالة الدقيقة'),description:tr('A defender screens her ranged company. Break the screen before it gathers.','مدافعٌ يستر رُماتها. اخترق الستار قبل أن يتجمّعوا.')},
    {id:'bulwark' as const,name:tr('The slow procession','الموكب البطيء'),description:tr('A heavy front with ranged support. Save a brittle strike for the gathering.','مقدّمةٌ ثقيلة يسندها الرماة. احتفظ بالتجميد وضربةٍ تكسره حين يتجمّعون.')},
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
  if(role===0)return victories>=3?tr('Rima of the Patched Buckler','ريما صاحبة الترس المرقّع'):tr('Rima, the steady hand','ريما، اليد الثابتة');
  return victories>=3?tr('Nabil of the Counting Stones','نبيل صاحب حصى العدّ'):tr('Nabil, the nervous thrower','نبيل، الرامي القلِق');
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
