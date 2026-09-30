import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {createChronicle,ROUTES,type RouteId} from '../src/game/chronicle.ts';
import type {Profile,UnitKind} from '../src/game/types.ts';
export function preparedChronicleProfile():Profile {
 const p=defaultProfile();Object.assign(p,{foodLevel:12,baseLevel:8,unlocked:[true,true,true],coins:10000,speed:2,sound:false});
 p.chronicle=createChronicle();p.chronicle.clears[0]=1;p.chronicle.restoration=7;p.chronicle.discoveries=7;
 return p;
}
/** Deterministic fixture review, not evidence of organic campaign unlock pacing. */
export function simulateChronicle(route:RouteId,profile=preparedChronicleProfile()):Game {
 const game=new Game(profile);if(!profile.chronicle?.expedition&&!game.dispatch({type:'chronicle-route',route,battle:profile.enemyAge}))throw Error(`Cannot select ${route}`);
 game.dispatch({type:'start'});let order=0;
 const composition:UnitKind[]=[0,1,0,2,1,2];
 for(let tick=0;tick<180*60&&game.state.phase==='running';tick++){
  const kind=composition[order%composition.length];if(game.dispatch({type:'spawn',kind}))order++;
  if(game.state.time>18&&!game.state.skillsUsed.includes('food'))game.dispatch({type:'skill',skill:'food'});
  if(game.state.units.filter(u=>u.side==='enemy').length>=4&&!game.state.skillsUsed.includes('freeze'))game.dispatch({type:'skill',skill:'freeze'});
  if(game.state.time>44&&game.state.units.filter(u=>u.side==='enemy').length>=3&&!game.state.skillsUsed.includes('meteor'))game.dispatch({type:'skill',skill:'meteor'});
  game.step(1/60);
 }
 return game;
}
if(process.argv[1]?.endsWith('simulate-chronicle.ts')){
 const results=ROUTES.map(route=>{const game=simulateChronicle(route.id);return {route:route.id,phase:game.state.phase,seconds:Number(game.state.time.toFixed(1)),gate:Math.ceil(game.state.playerHp),deployed:game.state.stats.deployed,story:game.state.chronicle};});
 console.log(JSON.stringify(results,null,2));if(results.some(result=>result.phase==='running'))process.exitCode=1;
}
