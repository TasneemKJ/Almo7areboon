import './style.css';
import { Game } from './game/simulation.ts';
import { ERAS, foodRate, foodUpgradeCost, baseUpgradeCost, unlockCost, cardBonus, CARD_DEFS, QUESTS } from './game/data.ts';
import { loadProfile, saveProfile } from './game/save.ts';
import type { Action, GameEvent, GamePort, Skill, UnitKind } from './game/types.ts';
import { mountBattlefield } from './view/battlefield.ts';
import { unitPortrait } from './view/art.ts';
import { icon } from './view/icons.ts';
import { sound, unlockAudio } from './view/audio.ts';

const game = new Game(loadProfile());
const root = document.querySelector<HTMLDivElement>('#app')!;
let activeTab = 'battle', modal: string|null = null, manualPaused = false, speed = 1;
let lastUpdate = 0, lastSave = 0, resultShown = '', toastTimer = 0, savedWarning = false;
const money=(n:number)=>n>=1000000?`${(n/1000000).toFixed(1)}m`:n>=10000?`${(n/1000).toFixed(1)}k`:Math.floor(n).toLocaleString('en-US');
const coin=(n:number)=>`${icon('coin')}<span>${money(n)}</span>`;
root.innerHTML = `
<main class="game-shell" aria-label="Almo7areboon">
  <div id="battle-view" class="battle-view">
    <section class="world" aria-label="Battlefield">
      <div id="battlefield"></div>
      <div class="stage"><div id="timeline" class="eyebrow"></div><h1 id="age-title"></h1><div class="stage-progress" id="stage-progress"></div></div>
      <div class="world-tools"><button id="quests" class="square-button" data-command="quests" aria-label="Quests">${icon('quest')}<i class="notification"></i></button><button class="square-button" data-command="settings" aria-label="Settings">${icon('gear')}</button></div>
      <div class="battle-meta"><span id="wave-label"></span><div class="battle-toggles"><button id="speed" data-command="speed" aria-label="Change battle speed">1×</button><button id="pause" data-command="pause" aria-label="Pause battle">Ⅱ</button></div></div>
      <div id="ready" class="ready"><div class="ready-title">YOUR ARMY. YOUR ERA.</div><button class="big-button green" data-command="start">BATTLE ${icon('battle')}</button><p>Destroy the enemy base!</p></div>
      <div id="pause-banner" class="pause-banner" hidden>PAUSED</div>
      <div class="battle-skills" id="battle-skills"></div>
    </section>
    <section class="deployment" aria-label="Deploy your army">
      <div class="food-line"><div class="food-total">${icon('food')}<strong id="food-count">6</strong><div class="food-meter"><i id="food-fill"></i></div></div><span id="production"></span></div>
      <div class="unit-cards" id="unit-cards"></div>
      <div class="deploy-hint" id="deploy-hint">Tap a troop to send it into battle</div>
    </section>
    <section class="upgrades" aria-label="Army upgrades"><div class="upgrade-row"><div class="upgrade-label">${icon('food')}<div>Food Production<small id="food-level"></small></div></div><button id="food-upgrade" class="buy-button" data-command="upgrade-food"></button></div><div class="upgrade-row"><div class="upgrade-label">${icon('heart')}<div>Base Health<small id="base-level"></small></div></div><button id="base-upgrade" class="buy-button" data-command="upgrade-base"></button></div></section>
  </div>
  <header class="resources"><div class="currency">${icon('coin')}<span id="coins">0</span></div><button class="currency gems" data-command="quests" aria-label="Gems and quests">${icon('gem')}<span id="gems">100</span></button><div class="game-wordmark">ALMO7AREBOON</div></header>
  <section id="secondary-screen" class="secondary-screen" hidden></section>
  <nav class="bottom-nav" aria-label="Game screens">${[['battle','Battle'],['evolution','Evolution'],['cards','Cards'],['skills','Skills']].map(([id,label])=>`<button data-tab="${id}" class="nav-item ${id==='battle'?'active':''}" aria-label="${label}" aria-current="${id==='battle'?'page':'false'}">${icon(id)}<span>${label}</span></button>`).join('')}</nav>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-layer" class="modal-layer" hidden></div>
</main>`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;

function persist(){if(!saveProfile(game.profile)&&!savedWarning){savedWarning=true;toast('Saving is unavailable in this browser. Keep this tab open.');}}
function toast(message:string){$('toast').textContent=message;$('toast').classList.add('visible');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function syncPause(){game.state.paused=manualPaused||activeTab!=='battle'||modal!==null||document.hidden;}
function action(a:Action){unlockAudio();const ok=game.dispatch(a);if(ok){persist();syncPause();rebuildArmy();update(true);if(activeTab!=='battle')renderScreen();}return ok;}
function rebuildArmy(){
  const age=game.profile.age,era=ERAS[age];
  $('unit-cards').innerHTML=era.units.map((u,i)=>`<button class="unit-card ${game.profile.unlocked[i]?'':'locked'}" data-unit="${i}" aria-label="${game.profile.unlocked[i]?`Deploy ${u.name}, ${u.cost} food`:`Unlock ${u.name}, ${unlockCost(i as UnitKind)} coins`}"><span class="unit-name">${u.name}</span><img alt="" src="${unitPortrait(age,i as UnitKind)}"/><span class="unit-price">${game.profile.unlocked[i]?icon('food')+u.cost:icon('lock')+`<span>${money(unlockCost(i as UnitKind))}</span>${icon('coin')}`}</span><span class="unit-fill"></span></button>`).join('');
  $('battle-skills').innerHTML=([['freeze','freeze'],['meteor','meteor'],['food','food']] as const).map(([id,symbol])=>`<button class="skill-circle ${id}" data-skill="${id}" aria-label="${id==='food'?'Food drop':id==='freeze'?'Freeze enemies':'Meteor strike'}">${icon(symbol)}<small>${id==='food'?'+10':id==='freeze'?'❄':'✦'}</small></button>`).join('');
  $('stage-progress').innerHTML=ERAS.map((_,i)=>`<span class="${i<game.profile.enemyAge?'complete':i===game.profile.enemyAge?'current':''}">${i<game.profile.enemyAge?'✓':i+1}</span>`).join('');
}
function update(force=false){
  const now=performance.now();if(!force&&now-lastUpdate<80)return;lastUpdate=now;
  const p=game.profile,s=game.state;
  $('coins').textContent=money(p.coins);$('gems').textContent=money(p.gems);
  $('timeline').textContent=`TIMELINE ${p.timeline} · BATTLE ${p.enemyAge+1}`;$('age-title').textContent=ERAS[p.age].name;
  $('food-count').textContent=Math.floor(s.food).toString();$('food-fill').style.width=`${(s.food%1)*100}%`;$('production').textContent=`${foodRate(p).toFixed(2)}/sec`;
  $('food-level').textContent=`${foodRate(p).toFixed(2)} food/sec · Level ${p.foodLevel+1}`;$('base-level').textContent=`${Math.ceil(s.playerMaxHp)} health · Level ${p.baseLevel+1}`;
  $('food-upgrade').innerHTML=coin(foodUpgradeCost(p));$('base-upgrade').innerHTML=coin(baseUpgradeCost(p));
  ($('food-upgrade') as HTMLButtonElement).disabled=p.coins<foodUpgradeCost(p);
  ($('base-upgrade') as HTMLButtonElement).disabled=p.coins<baseUpgradeCost(p);
  $('ready').hidden=s.phase!=='ready';$('pause-banner').hidden=!(manualPaused&&s.phase==='running');
  $('pause').textContent=manualPaused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',manualPaused?'Resume battle':'Pause battle');
  $('wave-label').innerHTML=s.phase==='running'?`<i class="live-dot"></i> WAVE ${Math.max(1,s.wave)} / ${s.totalWaves}`:`${icon('flag')} ${s.phase==='ready'?'READY FOR BATTLE':s.phase==='won'?'ENEMY BASE DESTROYED':'REGROUP YOUR ARMY'}`;
  $('deploy-hint').textContent=s.phase==='ready'?'Build your army. Conquer the ages.':s.phase==='running'?'Save food to deploy a stronger army':'Upgrade your army and battle again';
  document.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach(b=>{const i=Number(b.dataset.unit) as UnitKind;const locked=!p.unlocked[i];b.disabled=locked?p.coins<unlockCost(i):s.phase!=='running'||s.food<ERAS[p.age].units[i].cost||s.paused;b.classList.toggle('affordable',!b.disabled);(b.querySelector('.unit-fill') as HTMLElement).style.transform=`scaleX(${Math.min(1,s.food/ERAS[p.age].units[i].cost)})`;});
  document.querySelectorAll<HTMLButtonElement>('[data-skill]').forEach(b=>{const used=s.skillsUsed.includes(b.dataset.skill as Skill);b.disabled=s.phase!=='running'||used||s.paused;b.classList.toggle('used',used);});
  if((s.phase==='won'||s.phase==='lost')&&resultShown!==s.phase){resultShown=s.phase;showResult();}
  if(s.phase==='ready'||s.phase==='running')resultShown='';
  if(now-lastSave>5000){persist();lastSave=now;}
}

function switchTab(tab:string){activeTab=tab;document.querySelectorAll<HTMLElement>('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');});$('secondary-screen').hidden=tab==='battle';syncPause();renderScreen();update(true);}
function renderScreen(){
  const p=game.profile;let html='';
  if(activeTab==='evolution'){
    const next=ERAS[p.age+1],cost=ERAS[p.age].evolveCost;
    html=`<div class="screen-heading"><span class="eyebrow">CONQUER HISTORY</span><h2>Evolution</h2><p>New age. Stronger army.</p></div><div class="era-list">${ERAS.map((era,i)=>`<div class="era-row ${i===p.age?'selected':''} ${i>p.age?'future':''}"><span class="era-number">${i<p.age?'✓':i+1}</span><div class="era-picture"><img src="${unitPortrait(i,2)}" alt="${era.units[2].name}"/></div><div class="era-copy"><small>${era.year}</small><h3>${era.name}</h3><p>${i===p.age?'YOUR CURRENT AGE':i<p.age?'CONQUERED':era.units[0].name+' · '+era.units[2].name}</p></div>${i===p.age?`<span class="current-badge">NOW</span>`:i>p.age?icon('lock'):icon('flag')}</div>`).join('')}</div><div class="screen-bottom"><p>${next?`Evolve to the <strong>${next.name}</strong>. Food upgrades and troop unlocks restart.`:'Win the final battle to begin a new timeline.'}</p><button class="big-button green" data-command="evolve" ${!next||p.coins<cost||p.age>p.enemyAge||game.state.phase==='running'?'disabled':''}>${next?`EVOLVE ${coin(cost)}`:'FINAL AGE'}</button>${next?`<small>${game.state.phase==='running'?'Finish the current battle to evolve.':p.age>p.enemyAge?'Defeat the enemy to continue evolving.':'Your cards and gems stay with you.'}</small>`:''}</div>`;
  }else if(activeTab==='cards'){
    const bonus=cardBonus(p);
    html=`<div class="screen-heading"><span class="eyebrow">PERMANENT POWER</span><h2>Cards</h2><p>Collect cards. Strengthen every warrior.</p></div><div class="bonus-strip"><span>${icon('battle')} Damage <b>×${bonus.damage.toFixed(2)}</b></span><span>${icon('heart')} Health <b>×${bonus.health.toFixed(2)}</b></span></div><div class="collection-grid">${CARD_DEFS.map((card,i)=>`<article class="collection-card ${p.cards[i]?'owned':'unowned'}" style="--card-color:${card.color}"><div class="rarity">${i<2?'COMMON':i<4?'RARE':'EPIC'}</div><div class="card-art">${icon(card.icon)}</div><h3>${card.name}</h3><p>${card.description}</p><div class="card-level">${p.cards[i]?`LEVEL ${p.cards[i]}`:'NOT DISCOVERED'}</div></article>`).join('')}</div><div class="screen-bottom"><button class="big-button blue" data-command="summon" ${p.gems<100?'disabled':''}>SUMMON A CARD ${icon('gem')} 100</button><small>Duplicates level up. All bonuses apply automatically.</small></div>`;
  }else if(activeTab==='skills'){
    html=`<div class="screen-heading"><span class="eyebrow">TURN THE TIDE</span><h2>Battle skills</h2><p>The right move can change everything.</p></div><div class="skill-list">${[{id:'freeze',name:'Freeze',tag:'CONTROL',copy:'Freeze every enemy for 7 seconds. Give your army time to strike.',color:'#73bbdb'},{id:'meteor',name:'Meteor',tag:'DAMAGE',copy:'Hit every enemy on the battlefield. Best saved for a big wave.',color:'#de805d'},{id:'food',name:'Food Drop',tag:'SUPPORT',copy:'Gain 10 food instantly. Deploy reinforcements when you need them.',color:'#97bc6a'}].map(s=>`<article class="skill-detail"><div class="skill-art" style="background:${s.color}">${icon(s.id)}</div><div><small>${s.tag}</small><h3>${s.name}</h3><p>${s.copy}</p><span class="skill-rule">ONCE PER BATTLE</span></div></article>`).join('')}</div><div class="skill-note">${icon('battle')}<p>Use the three skill buttons above your army during a battle. Each skill refreshes when a new battle begins.</p></div><button class="big-button green" data-tab="battle">BACK TO BATTLE ${icon('arrow')}</button>`;
  }
  if(activeTab!=='battle')$('secondary-screen').innerHTML=html;
}
let focusBefore:HTMLElement|null=null;
function showModal(id:string,html:string){if(!modal)focusBefore=document.activeElement as HTMLElement;modal=id;const layer=$('modal-layer');layer.hidden=false;layer.innerHTML=`<section class="dialog ${id==='result'?'result-dialog':''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${id!=='result'?`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`:''}${html}</section>`;syncPause();requestAnimationFrame(()=>layer.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus());}
function closeModal(){modal=null;$('modal-layer').hidden=true;$('modal-layer').innerHTML='';syncPause();focusBefore?.focus();update(true);}
function showResult(){
  const won=game.state.phase==='won';persist();
  showModal('result',`<div class="result-emblem ${won?'':'defeat'}">${icon(won?'trophy':'shield')}</div><span class="eyebrow">${won?'THE BATTLE IS YOURS':'LIVE TO FIGHT AGAIN'}</span><h2 id="dialog-title">${won?'VICTORY!':'DEFEAT'}</h2><p>${won?'Enemy base destroyed. On to the next age!':'Your army will come back stronger.'}</p><div class="reward"><span>BATTLE EARNINGS</span><strong>${coin(game.state.earned)}</strong><small>Already added to your coins</small></div><button class="big-button ${won?'green':'blue'}" data-command="${won?'next':'retry'}">${won?'CONTINUE':'UPGRADE & RETRY'} ${icon('arrow')}</button>`);
}
function showSettings(){showModal('settings',`<span class="eyebrow">ALMO7AREBOON</span><h2 id="dialog-title">Settings</h2><button class="setting-row" data-command="sound">${icon('sound')} Sound effects <b>${game.profile.sound?'ON':'OFF'}</b></button><button class="setting-row" data-command="speed">${icon('evolution')} Battle speed <b>${speed}×</b></button><div class="help-box"><h3>How to play</h3><p>Food makes warriors. Tap a unit to deploy it. Your army fights automatically.</p><p>Earn coins, improve food production, unlock troops, and destroy the enemy base.</p><p>Keep ranged troops behind your front line. Save food and deploy together.</p><small>Keyboard: 1–3 troops · Q / W / E skills · Space pause</small></div><div class="save-note">Progress saves automatically on this device.</div>`);}
function showQuests(){const p=game.profile;showModal('quests',`<span class="eyebrow">EARN YOUR GLORY</span><h2 id="dialog-title">Quests</h2><p>Complete milestones to earn gems for cards.</p><div class="quest-list">${QUESTS.map(q=>{const count=p[q.stat],done=count>=q.target,claimed=p.claimed.includes(q.id);return `<div class="quest-row"><div><h3>${q.title}</h3><div class="quest-meter"><i style="width:${Math.min(100,count/q.target*100)}%"></i></div><small>${Math.min(count,q.target)} / ${q.target}</small></div><button class="buy-button" data-claim="${q.id}" ${!done||claimed?'disabled':''}>${claimed?'✓':icon('gem')+q.reward}</button></div>`;}).join('')}</div>`);}

root.addEventListener('click',e=>{
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;unlockAudio();
  if(b.dataset.tab){switchTab(b.dataset.tab);return;}
  if(b.dataset.unit){const i=Number(b.dataset.unit) as UnitKind;if(!game.profile.unlocked[i]){if(action({type:'unlock',kind:i}))toast(`${ERAS[game.profile.age].units[i].name} unlocked!`);}else action({type:'spawn',kind:i});return;}
  if(b.dataset.skill){action({type:'skill',skill:b.dataset.skill as Skill});return;}
  if(b.dataset.claim){if(action({type:'claim',id:b.dataset.claim}))showQuests();return;}
  switch(b.dataset.command){
    case 'start':manualPaused=false;action({type:'start'});break;
    case 'upgrade-food':action({type:'upgrade',stat:'food'});break;
    case 'upgrade-base':action({type:'upgrade',stat:'base'});break;
    case 'evolve':if(action({type:'evolve'})){switchTab('battle');toast(`Welcome to the ${ERAS[game.profile.age].name}!`);}break;
    case 'next':case 'retry':{const cmd=b.dataset.command;closeModal();manualPaused=false;action({type:cmd});switchTab('battle');break;}
    case 'summon':{const before=[...game.profile.cards];if(action({type:'summon'})){const i=game.profile.cards.findIndex((n,i)=>n>before[i]);const c=CARD_DEFS[i];showModal('summon',`<span class="eyebrow">${before[i]?'CARD UPGRADED':'NEW CARD DISCOVERED'}</span><h2 id="dialog-title">${c.name}</h2><div class="summoned-card" style="background:${c.color}">${icon(c.icon)}</div><h3>LEVEL ${game.profile.cards[i]}</h3><p>${c.description}</p><button class="big-button blue" data-command="close">COLLECT ${icon('cards')}</button>`);}break;}
    case 'pause':manualPaused=!manualPaused;syncPause();update(true);break;
    case 'speed':speed=speed===1?2:1;$('speed').textContent=`${speed}×`;if(modal==='settings')showSettings();break;
    case 'settings':showSettings();break;
    case 'quests':showQuests();break;
    case 'sound':game.profile.sound=!game.profile.sound;persist();showSettings();break;
    case 'close':closeModal();break;
  }
});
document.addEventListener('keydown',e=>{
  if(modal){if(e.key==='Escape'&&modal!=='result'){closeModal();e.preventDefault();}if(e.key==='Tab'){const buttons=Array.from($('modal-layer').querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){last?.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first?.focus();e.preventDefault();}}return;}
  if(activeTab!=='battle'||e.repeat||e.target instanceof HTMLInputElement)return;
  if(['1','2','3'].includes(e.key)){e.preventDefault();action({type:'spawn',kind:(Number(e.key)-1) as UnitKind});}
  if(['q','w','e'].includes(e.key.toLowerCase())){const skills:Skill[]=['freeze','meteor','food'];action({type:'skill',skill:skills[['q','w','e'].indexOf(e.key.toLowerCase())]});}
  if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();if(game.state.phase==='ready')action({type:'start'});else{manualPaused=!manualPaused;syncPause();update(true);}}
});
document.addEventListener('visibilitychange',()=>{syncPause();if(document.hidden)persist();});
window.addEventListener('pagehide',persist);
function events(events:GameEvent[]){const played=new Set<string>();for(const event of events){if(!played.has(event.type)){sound(event.type,game.profile.sound);played.add(event.type);}}}
const port:GamePort={get profile(){return game.profile;},get state(){return game.state;},dispatch:a=>game.dispatch(a),step:dt=>{syncPause();game.step(dt*speed);},drainEvents:()=>game.drainEvents()};
rebuildArmy();update(true);
const renderer=mountBattlefield($('battlefield'),port,()=>update(),events);
if(import.meta.hot)import.meta.hot.dispose(()=>renderer.destroy());
