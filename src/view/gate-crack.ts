import type {BattleState,Side} from '../game/types.ts';

/** Gate health in thirds: 3 whole, 2 cracked, 1 failing, 0 fallen. */
export function gateBand(hp:number,maxHp:number):number {
 if(!(maxHp>0)||!(hp>0))return 0;
 const ratio=hp/maxHp;
 return ratio>2/3?3:ratio>1/3?2:1;
}
export const GATE_CRACK_WORDS:Record<Side,readonly [string,string]>={enemy:['THEIR GATE CRACKS','THEIR GATE BUCKLES'],player:['OUR GATE SHAKES','HOLD THE GATE!']};

/** Remembers each gate's band and reports a callout the moment a gate drops into a lower third (not when it falls). */
export function createGateCracks(){
 let battle:object|null=null,bands:Record<Side,number>={player:3,enemy:3};
 return (s:Readonly<BattleState>):{side:Side;words:string}[]=>{
  if(battle!==s){battle=s;bands={player:3,enemy:3};}
  const calls:{side:Side;words:string}[]=[];
  for(const side of ['enemy','player'] as const){
   const band=side==='enemy'?gateBand(s.enemyHp,s.enemyMaxHp):gateBand(s.playerHp,s.playerMaxHp);
   if(s.phase==='running'&&band>0&&band<bands[side])calls.push({side,words:GATE_CRACK_WORDS[side][band===2?0:1]});
   bands[side]=Math.min(bands[side],band||bands[side]);
  }
  return calls;
 };
}
