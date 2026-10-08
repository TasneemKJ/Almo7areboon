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
  const wait=status.reason==='food'?` · ${Math.ceil(status.waitSeconds)}s`:['blocked','capacity'].includes(status.reason)?' · wait':'';
  textIfChanged(cost,`${ERAS[p.age].units[kind].cost} food${wait}`);
  node.classList.toggle('recruit-ready',status.allowed);
  node.classList.toggle('teach',kind===0&&status.allowed&&((p.wins===0&&running&&!s.paused&&s.stats.deployed===0)||foodIsPiling(p,s)));
 }
}

/** The Hold and Advance gate buttons at their bases. */
function syncGates(gates:readonly HTMLButtonElement[],arena:ReturnType<typeof arenaLayout>,w:number,orders:ReturnType<typeof orderStatus>,running:boolean):void {
 const place=placeBox;
 for(const node of gates){
  const hold=node.dataset.fieldGate==='hold',x=(hold?39:411)*arena.scale;
  const size=Math.max(44,Math.min(88,72*arena.scale));
  place(node,{x:Math.max(0,Math.min(w-size,x-size/2)),y:Math.max(0,arena.groundY*arena.scale-48*arena.scale),width:size,height:Math.max(44,Math.min(90,65*arena.scale))});
  node.hidden=!running;node.setAttribute('aria-disabled',String(!orders.canCast));node.setAttribute('aria-pressed',String(orders.active===node.dataset.fieldGate));
  node.setAttribute('aria-label',`${hold?'Hold: protect troops and your gate':'Advance: stronger strikes and faster movement'}. Costs 60 momentum, lasts 10 seconds. ${orders.label}`);
  node.classList.toggle('order-ready',orders.canCast);
 }
}

/** Presentation ownership only. Every mutation still goes through main's guarded dispatch. */
export function createFieldController(root:HTMLElement){
 const find=(id:string)=>root.querySelector<HTMLElement>(`#${id}`)!;
 const world=find('world'),context=find('field-context'),cue=find('field-cue'),announcement=find('field-announcement'),cover=find('field-cover');
 const recruits=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-field-recruit]'));
 const gates=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-field-gate]'));
 const standard=find('field-standard') as HTMLButtonElement,supplies=find('field-supplies') as HTMLButtonElement,enemy=find('field-enemy') as HTMLButtonElement;
 let selected:number|'supplies'|'cover'|null=null,contextKey='',origin:HTMLElement|null=null;
 const pause=root.querySelector<HTMLElement>('[data-command="field-pause"]')!;
 const place=placeBox;
 const clear=()=>{selected=null;releaseFieldContext(context,origin,pause);enemy.classList.remove('selected');cover.classList.remove('selected');};
 return {
  clear,
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
   syncGates(gates,arena,w,orders,running);
   place(standard,plan.standard);place(supplies,plan.supplies);
   standard.hidden=!running||!s.chronicle?.enabled||s.stats.deployed===0;
   standard.setAttribute('aria-disabled',String(s.paused));standard.setAttribute('aria-pressed',String(s.chronicle?.rally??false));
   const rally=s.chronicle?.rally?`Release ${s.chronicle.gathered.length} gathered troops`:'Gather newly deployed troops at the standard';
   standard.setAttribute('aria-label',rally);textIfChanged(standard.querySelector<HTMLElement>('span')!,s.chronicle?.rally?'Release':'Gather');
   supplies.hidden=!running||s.stats.deployed===0;supplies.setAttribute('aria-label',skillCue(p,s,'food',game.canUseSkill('food')).label);
   const coverTarget=fieldCoverTarget(game,w,h);hideFieldTarget(cover,!coverTarget,pause);
   if(coverTarget)place(cover,coverTarget);
   const target=typeof selected==='number'?s.units.find(u=>u.id===selected&&u.side==='enemy'&&u.hp>0):s.units.find(u=>u.side==='enemy'&&u.hp>0);
   enemy.hidden=!running||!target;
   if(target){
    const size=48,x=target.x*.45*arena.scale,y=(arena.groundY+target.lane*arena.laneGap)*arena.scale;
    place(enemy,{x:Math.max(0,Math.min(w-size,x-size/2)),y:Math.max(0,Math.min(h-size,y-size)),width:size,height:size});enemy.dataset.enemyId=String(target.id);
   }
   if(!running||s.paused||(typeof selected==='number'&&!target)||(selected==='supplies'&&!game.canUseSkill('food'))||(selected==='cover'&&!coverTarget)||(typeof selected==='number'&&!game.canUseSkill('freeze')&&!game.canUseSkill('meteor')))clear();
   const nextKey=selected===null?'':typeof selected==='string'?selected:'enemy';
   if(nextKey!==contextKey){
    contextKey=nextKey;
    context.innerHTML=nextKey==='enemy'?'<button data-skill="freeze">Freeze</button><button data-skill="meteor">Meteor</button>':nextKey==='supplies'?'<button data-skill="food"></button><button data-command="field-dismiss">Back</button>':nextKey==='cover'?'<button data-skill="meteor">Meteor</button><button data-command="field-dismiss">Back</button>':'';
   }
   context.hidden=selected===null;enemy.classList.toggle('selected',typeof selected==='number');
   cover.classList.toggle('selected',selected==='cover');
   context.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(button=>{const skill=button.dataset.skill as Skill;button.disabled=!game.canUseSkill(skill);const label=skillCue(p,s,skill,!button.disabled).label;button.setAttribute('aria-label',label);if(skill==='food')textIfChanged(button,label.split(' · ')[0]);});
   const message=fieldGuidance(game);textIfChanged(cue,message);cue.hidden=!message;
   textIfChanged(announcement,fieldAnnouncement(message));
  },
 };
}
