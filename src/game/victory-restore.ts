import { battleStats } from './statistics.ts';
import type { BattleState, Profile } from './types.ts';

/** Re-creates the finished-battle state a saved victory receipt describes. */
export function applyPendingVictory(state: BattleState, victory: NonNullable<Profile['pendingVictory']>): void {
  state.phase = 'won';
  state.stats = battleStats(victory.stats);
  state.enemyHp = Math.min(state.enemyMaxHp,victory.story?.enemyHp??0);
  state.playerHp = Math.min(state.playerMaxHp, victory.playerHp);
  state.earned = victory.earned;
  state.time = victory.seconds;
  state.wave = state.totalWaves;
  if(state.chronicle){
    const c=state.chronicle,story=victory.story;c.settled=true;
    if(story){
      c.cart={x:story.cartX,hp:Math.min(story.cartHp,story.cartMaxHp),maxHp:story.cartMaxHp};
      c.rescued=story.rescued;c.rescueProgress=story.rescueProgress;c.lightSeconds=story.lightSeconds;
      c.boss.spawned=story.bossDefeated;c.boss.interrupts=story.interrupts;
      c.coveredHits=story.coveredHits;c.shatters=story.shatters;
    }
  }
}

/** The Chronicle part of a victory receipt, captured when the battle is won. */
export function victoryStory(state: BattleState, c: NonNullable<BattleState['chronicle']>): NonNullable<NonNullable<Profile['pendingVictory']>['story']> {
  return {
        route:c.route,enemyHp:state.enemyHp,cartX:c.cart.x,cartHp:c.cart.hp,cartMaxHp:c.cart.maxHp,
        rescued:c.rescued,rescueProgress:c.rescueProgress,lightSeconds:c.lightSeconds,
        bossDefeated:c.boss.spawned&&!state.units.some(unit=>unit.id===c.boss.id&&unit.hp>0),
        interrupts:c.boss.interrupts,coveredHits:c.coveredHits,shatters:c.shatters,
      };
}
