import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/receipt-harness.ts';

test('accepted discovery stays in expanded receipt and shows the newly found story',()=>{
 const h=harness(),c=h.context;
 c.game.dispatch({type:'start'});c.game.state.enemyHp=0;c.game.step(1/60);
 assert.equal(c.game.state.phase,'won');c.showResult();c.showResultDetails();
 const receipt=JSON.stringify(c.game.profile.pendingVictory),coins=c.game.profile.coins,opened:string[]=[];
 c.$('modal-layer').querySelector=(selector:string)=>selector==='.story-discoveries'&&c.dialogHtml.includes('story-discoveries')?{setAttribute:(name:string)=>opened.push(name)}:null;
 h.clickData({storyDiscovery:'door'});
 assert.equal(c.modal,'result');assert.equal(c.resultDetailsOpen,true);
 assert.match(c.dialogHtml,/story-discoveries/);assert.match(c.dialogHtml,/mark on the door.*found/s);assert.deepEqual(opened,['open']);
 assert.equal(c.game.profile.coins,coins);assert.equal(JSON.stringify(c.game.profile.pendingVictory),receipt);
});

test('accepted summon followed by save conflict does not deny its settled gem cost',()=>{
 const h=harness(),c=h.context,messages:string[]=[];c.activeTab='cards';c.game.profile.gems=100;
 c.toast=(message:string)=>messages.push(message);c.playSummonAudio=()=>{};
 c.session.save=()=>{c.session.status='conflict';c.sessionReady=false;c.sessionPresentation('conflict');return {ok:false,reason:'conflict'};};
 h.clickData({pack:'1'});
 assert.equal(c.game.profile.gems,0);assert.equal(c.game.profile.summonCount,1);assert.equal(c.modal,'session');
 assert.deepEqual(messages,[],'recovery owns the settled transaction; no false unspent-gems notice');
});

for(const modal of ['settings','save-recovery'])test(`late save failure and recovery update the stable ${modal} warning`,()=>{
 const h=harness(),c=h.context;c.modal=modal;
 const id=modal==='settings'?'preference-status':'recovery-status',node=c.$(id);
 node.textContent='Progress saves in this browser.';const html=c.$('modal-layer').innerHTML,version=c.modalVersion;
 c.document.activeElement=node;const before=JSON.stringify(c.game.profile);
 c.session.save=()=>({ok:false,reason:'write-failed'});c.persist();
 assert.match(node.textContent,/Saving is unavailable/);
 c.session.save=()=>({ok:true});c.persist();assert.doesNotMatch(node.textContent,/Saving is unavailable/);
 assert.equal(c.document.activeElement,node);assert.equal(c.$('modal-layer').innerHTML,html);assert.equal(c.modalVersion,version);
 assert.equal(JSON.stringify(c.game.profile),before);
});

test('Escape from a final-timeline compact expedition cannot silently retry its held receipt',()=>{
 const h=harness(),c=h.context;c.game.profile.timeline=1000;c.game.profile.age=5;c.game.profile.enemyAge=5;c.game.profile.furthestBattle=5;c.game.profile.mastery.timeline=1000;c.game.profile.chronicle.timeline=1000;
 c.game.profile.chronicle.restoration=1;
 assert.equal(c.game.dispatch({type:'chronicle-expedition',battle:5}),true);c.game.dispatch({type:'start'});
 c.game.state.chronicle.cart.x=790;c.game.step(1/60);assert.equal(c.game.state.phase,'won');c.showResult();
 const before=JSON.stringify([c.game.profile,c.game.state]);c.dismissModal();
 assert.equal(c.modal,'result');assert.equal(JSON.stringify([c.game.profile,c.game.state]),before);
});
