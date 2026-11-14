import {ERAS,QUESTS,dailyReward,foodRate,localDay,unlockCost} from '../game/data.ts';
import {chronicleGuidance} from '../game/chronicle-combat.ts';
import {routeDefinition} from '../game/chronicle.ts';
import type {Game} from '../game/simulation.ts';
import type {Skill,UnitKind} from '../game/types.ts';
import {storybookArt} from '../view/storybook-art.ts';
import {updateOrderBanner} from './battle-orders.ts';
import {battleGuidance,baseHealthDisplay,compactNumber,foodIsPiling,waveAccessibleLabel,waveLabel} from './battle-hud.ts';
import {chapterPresentation} from './chapter-presentation.ts';
import {htmlIfChanged,textIfChanged} from './dom-state.ts';
import {nextGoalLabel} from './next-goal.ts';
import {skillCue} from './skill-cues.ts';
import {troopControlLabel} from './army-screen.ts';
import {tr} from './i18n.ts';

export interface HudView {
 root:HTMLElement;
 $:<T extends HTMLElement=HTMLElement>(id:string)=>T;
 game:Game;
 money:(value:number)=>string;
 coin:(value:number)=>string;
 manualPaused:boolean;
}

function syncEconomy({root,$,game,money,coin,manualPaused}:HudView):void {
 const p=game.profile,s=game.state;
 $('world').dataset.phase=s.phase;
 updateOrderBanner($('order-banner'),s);
 const artStyle=storybookArt(p.age)?'storybook':'legacy';
 if(root.dataset.artStyle!==artStyle)root.dataset.artStyle=artStyle;
  textIfChanged($('coins'),money(p.coins));textIfChanged($('gems'),money(p.gems));
  textIfChanged($('timeline'),tr(`TIMELINE ${p.timeline} · BATTLE ${p.enemyAge+1}`,`الخطّ الزمني ${p.timeline} · المعركة ${p.enemyAge+1}`));textIfChanged($('age-title'),chapterPresentation(p.age).title);
  textIfChanged($('scene-name'),chapterPresentation(p.age).subtitle);
  textIfChanged($('food-count'),Math.floor(s.food).toString());$('food-fill').style.width=`${s.food>=99?100:(s.food%1)*100}%`;
  textIfChanged($('production'),`${foodRate(p).toFixed(2)}${tr('/sec','/ث')}`);
  const food=game.upgradeStatus('food'),base=game.upgradeStatus('base');
  // Arabic reads right to left, so the "becomes" arrow points left.
  const max=tr(' · MAX',' · الأقصى'),arrow=tr(' → ',' ← ');
  textIfChanged($('food-level'),`${foodRate(p).toFixed(2)}${tr(' food/sec',' مؤونة/ث')}${food.nextValue===null?max:`${arrow}${food.nextValue.toFixed(2)}`}`);
  textIfChanged($('base-level'),`${tr('','الصمود ')}${compactNumber(s.playerMaxHp)}${tr(' health','')}${base.nextValue===null?max:`${arrow}${compactNumber(base.nextValue)}`}`);
  htmlIfChanged($('food-upgrade'),food.cost===null?tr('MAX','الأقصى'):coin(food.cost));htmlIfChanged($('base-upgrade'),base.cost===null?tr('MAX','الأقصى'):coin(base.cost));
  $('food-upgrade').setAttribute('aria-label',food.cost===null?tr('Food production fully upgraded','إنتاج المؤونة مطوَّر بالكامل'):tr(`Upgrade food production for ${food.cost} coins`,`طوّر إنتاج المؤونة مقابل ${food.cost} من النقود`));
  $('base-upgrade').setAttribute('aria-label',base.cost===null?tr('Base health fully upgraded','صمود الحصن مطوَّر بالكامل'):tr(`Upgrade base health for ${base.cost} coins`,`طوّر صمود الحصن مقابل ${base.cost} من النقود`));
  $('food-upgrade').toggleAttribute('disabled',!food.allowed);$('base-upgrade').toggleAttribute('disabled',!base.allowed);
  $('ready').hidden=s.phase!=='ready';$('pause-banner').hidden=!(manualPaused&&s.phase==='running');
  textIfChanged($('pause'),manualPaused?'▶':'Ⅱ');$('pause').setAttribute('aria-label',manualPaused?tr('Resume battle','تابع المعركة'):tr('Pause battle','أوقف المعركة مؤقّتاً'));
  $('pause').setAttribute('aria-pressed',String(manualPaused));$('pause').toggleAttribute('disabled',s.phase!=='running');
  textIfChanged($('speed'),`${p.speed}×`);$('speed').setAttribute('aria-label',tr(`Battle speed ${p.speed} times. Change speed.`,`سرعة المعركة ${p.speed}×. غيّر السرعة.`));
  $('battle-select').toggleAttribute('disabled',s.phase!=='ready');
}
function syncBattleStatus({$,game,manualPaused}:HudView):void {
 const p=game.profile,s=game.state;
  const wave=game.waveStatus();
  textIfChanged($('wave-label'),s.phase==='running'?waveLabel(wave,s.chronicle?.enabled?s.chronicle.objective:undefined):s.phase==='ready'?tr('CHOOSE YOUR ARMY','اختر جيشك'):tr('BATTLE COMPLETE','انتهت المعركة'));
  $('wave-label').setAttribute('aria-label',s.phase==='running'?`${tr('Inspect wave.','افحص الموجة.')} ${waveAccessibleLabel(wave,s.chronicle?.enabled?s.chronicle.objective:undefined)}`:$('wave-label').textContent??'');
  $('wave-label').toggleAttribute('disabled',s.phase!=='running');
  textIfChanged($('deploy-hint'),battleGuidance(p,s,wave.preview,game.deploymentStatus(0)));
  const health=baseHealthDisplay(s.playerHp,s.playerMaxHp);
  $('world').classList.toggle('base-danger',s.phase==='running'&&health.danger);
  textIfChanged($('base-status'),tr(`Your base: ${health.label}. Enemy base: ${baseHealthDisplay(s.enemyHp,s.enemyMaxHp).label}.`,`حصنك: ${health.label}. حصن العدوّ: ${baseHealthDisplay(s.enemyHp,s.enemyMaxHp).label}.`));
  textIfChanged($('game-status'),s.phase==='running'?(s.paused?tr('Battle paused.','المعركة متوقّفة.'):health.danger?tr('Your base is in danger.','حصنك في خطر.'):tr('Battle running.','المعركة جارية.')):s.phase==='ready'?tr('Ready. Start a battle.','جاهز. ابدأ معركة.'):s.phase==='won'?tr('Victory.','نصر.'):tr('Defeat. Your coins are safe.','هزيمة. نقودك في أمان.'));
}
function syncTroopButtons({root,game}:HudView):void {
 const p=game.profile,s=game.state;
  root.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach(button=>{
    const kind=Number(button.dataset.unit) as UnitKind,locked=!p.unlocked[kind],status=game.deploymentStatus(kind);
    button.disabled=locked?p.coins<unlockCost(kind,p):!status.allowed;
    button.classList.toggle('affordable',!button.disabled);
    button.classList.toggle('teach',kind===0&&!button.disabled&&((p.wins===0&&s.phase==='running'&&!s.paused&&s.stats.deployed===0)||foodIsPiling(p,s)));
    const label=troopControlLabel(p,kind,status);
    button.title=label;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    const fill=button.querySelector<HTMLElement>('.unit-fill');if(fill)fill.style.transform=`scaleX(${Math.max(0,Math.min(1,s.food/ERAS[p.age].units[kind].cost))})`;
  });
}
function syncSkillButtons({root,game}:HudView):void {
 const p=game.profile,s=game.state;
  root.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(button=>{
    const skill=button.dataset.skill as Skill,used=s.skillsUsed.includes(skill);
    button.disabled=!game.canUseSkill(skill);button.classList.toggle('used',used);
    const cue=skillCue(p,s,skill,!button.disabled);
    button.classList.toggle('skill-opportunity',cue.opportunity);
    button.classList.toggle('freeze-active',cue.activeEffect);
    button.title=cue.label;button.setAttribute('aria-label',cue.label);
    button.classList.toggle('badge-targets',/^\d+$/.test(cue.badge));
    const badge=button.querySelector('small');if(badge){badge.setAttribute('aria-hidden','true');textIfChanged(badge,cue.badge);}
  });
}
function syncGoals({$,game}:HudView):void {
 const p=game.profile,s=game.state,health=baseHealthDisplay(s.playerHp,s.playerMaxHp);
  const notification=$('quests').querySelector<HTMLElement>('.notification');
  if(notification)notification.hidden=!(dailyReward(p,localDay()).available||QUESTS.some(q=>p[q.stat]>=q.target&&!p.claimed.includes(q.id)));
  {const goal=nextGoalLabel(p,localDay()),journeyOpen=$('journey-open');textIfChanged(journeyOpen,goal.text);journeyOpen.setAttribute('aria-label',goal.label);}
  const story=s.chronicle;
  $('story-rally').hidden=!story?.enabled;
  $('story-rally').toggleAttribute('disabled',s.phase!=='running'||s.paused);
  $('story-rally').setAttribute('aria-pressed',String(story?.rally??false));
  textIfChanged($('story-rally'),story?.rally?tr(`Release ${story.gathered.length}/6`,`أطلق ${story.gathered.length}/6`):tr('Gather','اجمع'));
  if(story?.enabled){
    const instruction=chronicleGuidance(p,s);
    if(s.phase==='running'&&!s.paused&&(!health.danger)&&(story.route!=='road'||story.rally||p.unlocked[1]))textIfChanged($('deploy-hint'),instruction);
    textIfChanged($('story-ready-rule'),p.wins===0&&story.route==='road'?tr('Rima waits at the gate. Tap Battle, then send a defender. The company fights together.','ريما تنتظر عند البوّابة. انقر على «المعركة»، ثم أرسل مدافعاً. السريّة تقاتل معاً.'):routeDefinition(story.route).rule);

  }
}

/** Writes the battle HUD (resources, upgrades, status, troop and skill buttons, goals) from the current game state. */
export function syncBattleHud(view:HudView):void {
 syncEconomy(view);syncBattleStatus(view);syncTroopButtons(view);syncSkillButtons(view);syncGoals(view);
}
