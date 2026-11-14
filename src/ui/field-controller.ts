import {fieldGuidance,fieldAnnouncement} from './field-guidance.ts';
import {fieldCoverTarget} from './field-cover.ts';
import {foodIsPiling} from './battle-hud.ts';
import {releaseFieldContext,hideFieldTarget} from './field-focus.ts';
import type {Game} from '../game/simulation.ts';
import type {Skill,UnitKind} from '../game/types.ts';
import {ERAS} from '../game/data.ts';
import {campLayout,campRecruits,type CampTarget} from '../view/world-camp.ts';
import {arenaLayout} from '../view/visual-theme.ts';
import {troopControlLabel} from './army-screen.ts';
import {orderStatus} from './battle-orders.ts';
import {skillCue} from './skill-cues.ts';
import {textIfChanged} from './dom-state.ts';
import {fieldFoodReadout} from './field-controls.ts';
import {gateChoiceLabel,gateLabelLift} from './field-gate-label.ts';
import {storybookArt} from '../view/storybook-art.ts';
import {secondsShort} from './battle-hud.ts';
import {tr} from './i18n.ts';
import {bannerView} from './banner-gesture.ts';
import {LAMP_REACH,duskSight} from '../game/dusk-raid.ts';
import {lang} from '../game/locale.ts';

const placeBox=(node:HTMLElement,rect:CampTarget|{x:number;y:number;width:number;height:number})=>{
  const value=`left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px`;
  if(node.getAttribute('style')!==value)node.setAttribute('style',value);
};

/** Physical recruit buttons: position, explanation of availability, cost and teaching ring. */
function syncRecruits(recruits:readonly HTMLButtonElement[],plan:ReturnType<typeof campLayout>,available:readonly number[],game:Game,running:boolean):void {
 const place=placeBox,p=game.profile,s=game.state;
 for(const node of recruits){
  const kind=Number(node.dataset.fieldRecruit) as UnitKind,status=game.deploymentStatus(kind);
  node.hidden=!running||!available.includes(kind);place(node,plan.recruits[kind]);
  // An unavailable physical recruit remains focusable so waiting/capacity has an explanation.
  node.disabled=false;node.setAttribute('aria-disabled',String(!status.allowed));
  node.setAttribute('aria-label',troopControlLabel(p,kind,status));node.title=troopControlLabel(p,kind,status);
  const cost=node.querySelector<HTMLElement>('.recruit-cost')!;
  const wait=status.reason==='food'?` · ${secondsShort(Math.ceil(status.waitSeconds))}`:['blocked','capacity'].includes(status.reason)?tr(' · wait',' · انتظر'):'';
  textIfChanged(cost,`${ERAS[p.age].units[kind].cost}${tr(' food',' مؤونة')}${wait}`);
  node.classList.toggle('recruit-ready',status.allowed);
  node.classList.toggle('teach',kind===0&&status.allowed&&((p.wins===0&&running&&!s.paused&&s.stats.deployed===0)||foodIsPiling(p,s)));
 }
}

/** The Hold and Advance gate buttons at their bases. */
function syncGates(gates:readonly HTMLButtonElement[],arena:ReturnType<typeof arenaLayout>,w:number,orders:ReturnType<typeof orderStatus>,running:boolean,ages:{player:number;enemy:number}):void {
 for(const node of gates){
  const hold=node.dataset.fieldGate==='hold',x=(hold?39:411)*arena.scale;
  const size=Math.max(44,Math.min(88,72*arena.scale));
  // The revealed label rises above the base health bar instead of covering it (see world-play.css).
  const lift=gateLabelLift(arena.scale,!!storybookArt(hold?ages.player:ages.enemy));
  const value=`left:${Math.max(0,Math.min(w-size,x-size/2))}px;top:${Math.max(0,arena.groundY*arena.scale-48*arena.scale)}px;width:${size}px;height:${Math.max(44,Math.min(90,65*arena.scale))}px;--gate-label-lift:${lift}px`;
  if(node.getAttribute('style')!==value)node.setAttribute('style',value);
  node.hidden=!running;node.setAttribute('aria-disabled',String(!orders.canCast));node.setAttribute('aria-pressed',String(orders.active===node.dataset.fieldGate));
  node.setAttribute('aria-label',`${hold?tr('Hold: protect troops and your gate','اثبُت: احمِ جندك وبوّابتك'):tr('Advance: stronger strikes and faster movement','تقدّم: ضربات أقوى وحركة أسرع')}. ${tr('Costs 60 momentum, lasts 10 seconds.','يكلّف 60 من الزخم ويدوم 10 ثوانٍ.')} ${orders.label}`);
  node.classList.toggle('order-ready',orders.canCast);
  const label=node.querySelector<HTMLElement>('.world-target-name');
  if(label)textIfChanged(label,gateChoiceLabel(hold?'hold':'advance',orders.canCast,orders.active===node.dataset.fieldGate));
 }
}

/** The planted company banner: its place, and momentum shown as lit cloth (see banner-gesture.ts). */
function syncBanner(node:HTMLElement,rect:CampTarget,s:Game['state'],running:boolean):void {
 // After a raid turned back the banner stays a moment and settles back into the ground (the held breath).
 const settling=!!s.dusk&&s.phase==='won';node.hidden=!running&&!settling;node.classList.toggle('settling',settling);
 const view=bannerView(s),order=view.order??'none';
 if(node.dataset.ready!==String(view.ready))node.dataset.ready=String(view.ready);
 if(node.dataset.order!==order)node.dataset.order=order;
 const steps=String(view.steps);if(node.dataset.steps!==steps)node.dataset.steps=steps;
 // The drag offset lives on the inner .banner-carry, so rewriting the outer box never drops a finger's carry.
 const style=`left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;--cloth:${view.cloth.toFixed(3)}`;
 if(node.getAttribute('style')!==style)node.setAttribute('style',style);
}

/** The dusk raid's dark: a veil with a pool of light at each hung lamp (game/dusk-raid.ts), and its one line while lamps are hung. */
export const DUSK_LINE={en:'Lamps do not fight, but they give away whoever creeps in.',ar:'القناديل لا تقاتل، لكنها تفضح من يتسلّل.'} as const;
/** The held breath after a raid turned back (DUSK_HELD_BREATH_MS): the one line over the quiet field. */
export const DUSK_AFTER_LINE={en:'The lamps held. The raiders are gone.',ar:'صمدت القناديل، ورحل المغيرون.'} as const;
function syncDusk(veil:HTMLElement,tale:HTMLElement,s:Game['state'],arena:ReturnType<typeof arenaLayout>):void {
 const dusk=s.dusk&&(s.phase==='ready'||s.phase==='running')?s.dusk:null;
 veil.hidden=!dusk;
 if(dusk){
  const at=(i:number)=>dusk.lamps[i]===undefined?'-999px':`${(dusk.lamps[i]*.45*arena.scale).toFixed(1)}px`;
  const style=`--l1:${at(0)};--l2:${at(1)};--l3:${at(2)};--gy:${(arena.groundY*arena.scale).toFixed(1)}px;--reach:${(LAMP_REACH*.45*arena.scale).toFixed(1)}px`;
  if(veil.getAttribute('style')!==style)veil.setAttribute('style',style);
 }
 const held=!!s.dusk&&s.phase==='won',telling=held||!!dusk&&(s.phase==='ready'||s.time<5);
 if(telling){const line=(held?DUSK_AFTER_LINE:DUSK_LINE)[lang()];textIfChanged(tale,line);tale.dataset.dusk='true';tale.hidden=false;}
 else if(tale.dataset.dusk){delete tale.dataset.dusk;tale.hidden=true;}
}

/** Presentation ownership only. Every mutation still goes through main's guarded dispatch. */
export function createFieldController(root:HTMLElement){
 const find=(id:string)=>root.querySelector<HTMLElement>(`#${id}`)!;
 const veil=find('dusk-veil'),tale=find('field-tale'),world=find('world'),context=find('field-context'),cue=find('field-cue'),food=find('field-food'),announcement=find('field-announcement'),cover=find('field-cover');
 const recruits=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-field-recruit]'));
 const gates=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-field-gate]'));
 const banner=find('field-banner'),standard=find('field-standard') as HTMLButtonElement,supplies=find('field-supplies') as HTMLButtonElement,enemy=find('field-enemy') as HTMLButtonElement;
 let selected:number|'supplies'|'cover'|null=null,contextKey='',origin:HTMLElement|null=null;
 const pause=root.querySelector<HTMLElement>('[data-command="field-pause"]')!;
 const place=placeBox;
 const clear=()=>{selected=null;releaseFieldContext(context,origin,pause);enemy.classList.remove('selected');cover.classList.remove('selected');};
 return {
  clear,
  /** Whether a tactical choice (enemy, supplies, cover) is open: a field tap then only closes it. */
  isOpen:()=>selected!==null,
  select(kind:string,game:Game){
   if(game.state.phase!=='running'||game.state.paused)return;
   if(kind==='supplies'){selected='supplies';origin=supplies;}
   else if(kind==='cover'&&!cover.hidden&&game.canUseSkill('meteor')){selected='cover';origin=cover;}
   else if(kind==='enemy'){const id=Number(enemy.dataset.enemyId);if(game.state.units.some(u=>u.id===id&&u.side==='enemy'&&u.hp>0)){selected=id;origin=enemy;}}
   this.update(game);
  },
  update(game:Game){
   const p=game.profile,s=game.state,w=world.clientWidth,h=world.clientHeight;
   if(!w||!h)return;
   const plan=campLayout(w,h),arena=arenaLayout(w,h),available=campRecruits(p),orders=orderStatus(s),running=s.phase==='running';
   syncRecruits(recruits,plan,available,game,running);
   syncGates(gates,arena,w,orders,running,{player:p.age,enemy:p.enemyAge});
   place(supplies,plan.supplies);
   // Gather lives on your own camp (the gate shelter on the left), where the gathered company waits.
   {const size=Math.max(56,Math.min(96,80*arena.scale)),top=Math.max(0,arena.groundY*arena.scale-62*arena.scale);place(standard,{x:0,y:top,width:size,height:Math.max(56,Math.min(96,74*arena.scale))});}
   syncBanner(banner,plan.banner,s,running);
   standard.hidden=!running||!s.chronicle?.enabled||s.stats.deployed===0;
   standard.setAttribute('aria-disabled',String(s.paused));standard.setAttribute('aria-pressed',String(s.chronicle?.rally??false));
   const rally=s.chronicle?.rally?tr(`Release ${s.chronicle.gathered.length} gathered troops`,`أطلق الجند المجتمعين (${s.chronicle.gathered.length})`):tr('Gather newly deployed troops at your camp','اجمع الجند الجدد عند مخيّمك');
   standard.setAttribute('aria-label',rally);textIfChanged(standard.querySelector<HTMLElement>('span')!,s.chronicle?.rally?tr(`Release ${s.chronicle.gathered.length}/6`,`أطلق ${s.chronicle.gathered.length}/6`):tr('Gather','اجمع'));
   supplies.hidden=!running||s.stats.deployed===0;supplies.setAttribute('aria-label',skillCue(p,s,'food',game.canUseSkill('food')).label);
   const coverTarget=fieldCoverTarget(game,w,h);hideFieldTarget(cover,!coverTarget,pause);
   if(coverTarget)place(cover,coverTarget);
   const target=typeof selected==='number'?s.units.find(u=>u.id===selected&&u.side==='enemy'&&u.hp>0):s.units.find(u=>u.side==='enemy'&&u.hp>0&&duskSight(s,u.x)>=1);
   enemy.hidden=!running||!target;
   if(target){
    const size=48,x=target.x*.45*arena.scale,y=(arena.groundY+target.lane*arena.laneGap)*arena.scale;
    place(enemy,{x:Math.max(0,Math.min(w-size,x-size/2)),y:Math.max(0,Math.min(h-size,y-size)),width:size,height:size});enemy.dataset.enemyId=String(target.id);
   }
   if(!running||s.paused||(typeof selected==='number'&&!target)||(selected==='supplies'&&!game.canUseSkill('food'))||(selected==='cover'&&!coverTarget)||(typeof selected==='number'&&!game.canUseSkill('freeze')&&!game.canUseSkill('meteor')))clear();
   const nextKey=selected===null?'':typeof selected==='string'?selected:'enemy';
   if(nextKey!==contextKey){
    contextKey=nextKey;
    const freeze=`<button data-skill="freeze">${tr('Freeze','التجميد')}</button>`,meteor=`<button data-skill="meteor">${tr('Meteor','النيزك')}</button>`,back=`<button data-command="field-dismiss">${tr('Back','رجوع')}</button>`;
    context.innerHTML=nextKey==='enemy'?freeze+meteor:nextKey==='supplies'?'<button data-skill="food"></button>'+back:nextKey==='cover'?meteor+back:'';
   }
   context.hidden=selected===null;enemy.classList.toggle('selected',typeof selected==='number');
   cover.classList.toggle('selected',selected==='cover');
   context.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(button=>{const skill=button.dataset.skill as Skill;button.disabled=!game.canUseSkill(skill);const label=skillCue(p,s,skill,!button.disabled).label;button.setAttribute('aria-label',label);if(skill==='food')textIfChanged(button,label.split(' · ')[0]);});
   syncDusk(veil,tale,s,arena);
   const message=fieldGuidance(game);textIfChanged(cue,message);cue.hidden=!message;
   textIfChanged(announcement,fieldAnnouncement(message));
   const readout=fieldFoodReadout(s.food);food.hidden=!running;textIfChanged(food.querySelector<HTMLElement>('span')!,readout.text);
   if(food.getAttribute('aria-label')!==readout.label)food.setAttribute('aria-label',readout.label);food.classList.toggle('full',readout.full);
  },
 };
}
