// Simulated week for a casual player: 2 short sessions a day (SESSION_S game-seconds of battle each), using the game's own
// rules (Game.dispatch: daily, weekly, quests, upgrades, summons, evolution). Evolution past the free chapters (age>=2 -> 3 since 1.3)
// is blocked unless PAID=1, matching evolutionNeedsFullJourney in the iPhone app.
// Run: node --experimental-strip-types scripts/qa-gate/week-sim.ts [sessionSeconds=360] [PAID=0]
import { Game } from '../../src/game/simulation.ts';
import { QUESTS, ERAS, dailyReward } from '../../src/game/data.ts';
import { weekId, weeklyStatus } from '../../src/game/weekly.ts';
import { currentSealCount } from '../../src/game/prestige.ts';
import { cardPackCost } from '../../src/game/cards.ts';
import type { UnitKind } from '../../src/game/types.ts';
import { FREE_AGES } from '../../src/ui/app-bridge.ts';

const SESSION_S = Number(process.argv[2] ?? 360), PAID = process.argv[3] === '1', SEED = Number(process.argv[4] ?? 1);
// Seeded so runs are repeatable; the Game's own summon seed is separate.
let seed = SEED >>> 0 || 1;
Math.random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const game = new Game();
const p = game.profile;
// Thursday 2026-11-12 local midnight as day 1 (so the week rolls over on Monday = day 5).
const day0 = Math.floor(Date.UTC(2026, 10, 12) / 86_400_000);
let lossStreak = 0;
const days: Record<number, string[]> = {};
const stats: Record<number, { battles: number; wins: number; losses: number; gameSeconds: number; coins: number; gems: number; seals: number; chapter: number; age: number; cards: number }> = {};

function claimAll(day: number, log: string[]) {
  const d = dailyReward(p, day);
  if (game.dispatch({ type: 'daily', day })) log.push(`daily reward +${d.gems} gems (streak ${d.streak})`);
  const wk = weekId(day);
  game.dispatch({ type: 'weekly-sync', week: wk });
  for (const q of QUESTS) if (game.dispatch({ type: 'claim', id: q.id })) log.push(`milestone "${q.id}" +${q.reward} gems`);
  if (game.dispatch({ type: 'weekly', week: wk })) log.push('weekly record (3 new seals) +60 gems');
}
function spend(log: string[]) {
  for (let i = 0; i < 400; i++) {
    if (game.dispatch({ type: 'unlock', kind: 1 })) { log.push(`unlocked troop 2 (${ERAS[p.age].units[1].name})`); continue; }
    if (game.dispatch({ type: 'unlock', kind: 2 })) { log.push(`unlocked troop 3 (${ERAS[p.age].units[2].name})`); continue; }
    if (p.foodLevel <= p.baseLevel && game.dispatch({ type: 'upgrade', stat: 'food' })) { log.push(`food upgrade -> ${p.foodLevel}`); continue; }
    if (game.dispatch({ type: 'upgrade', stat: 'base' })) { log.push(`gate upgrade -> ${p.baseLevel}`); continue; }
    break;
  }
  if (p.gems >= cardPackCost(1) && game.dispatch({ type: 'summon', count: 1 })) log.push(`card pack opened (gems left ${p.gems})`);
  const gated = p.age + 1 >= FREE_AGES && !PAID;
  if (p.age < 5 && p.age <= p.enemyAge && p.coins >= ERAS[p.age].evolveCost) {
    if (gated) log.push(`evolution to ${ERAS[p.age + 1].name} affordable but needs Full Journey (paywall)`);
    else if (game.dispatch({ type: 'evolve' })) log.push(`EVOLVED to ${ERAS[p.age].name}`);
  }
}
function fight(log: string[]) {
  const before = { chapter: p.enemyAge, seals: currentSealCount(p) };
  if (!game.dispatch({ type: 'start' }) && game.state.phase !== 'running') return 0;
  let t = 0;
  for (; game.state.phase === 'running' && t < 300; t += 0.1) {
    const kinds: UnitKind[] = [0, 1, 2].filter(k => p.unlocked[k]) as UnitKind[];
    const want = kinds[Math.floor(Math.random() * kinds.length)];
    if (!game.dispatch({ type: 'spawn', kind: want })) game.dispatch({ type: 'spawn', kind: 0 });
    if (game.state.food < 3) game.dispatch({ type: 'skill', skill: 'food' });
    if (game.state.units.filter(u => u.side === 'enemy').length >= 4) game.dispatch({ type: 'skill', skill: 'freeze' });
    game.step(0.1); game.drainEvents();
  }
  if (t >= 300 && game.state.phase === 'running') { game.dispatch({ type: 'retreat' }); log.push('battle stalled 5 min -> retreat'); }
  const won = game.state.phase === 'won';
  const seals = currentSealCount(p) - before.seals;
  if (won) {
    if (seals > 0) log.push(`won chapter ${before.chapter + 1} (+${seals} seal${seals > 1 ? 's' : ''})`);
    if (before.chapter === 5) { if (PAID && game.dispatch({ type: 'prestige', expectedTimeline: p.timeline, legacy: 'hearth' })) log.push(`NEW TIMELINE ${p.timeline} (prestige)`); else game.dispatch({ type: 'retry' }); }
    else if (!game.dispatch({ type: 'next' })) game.dispatch({ type: 'retry' });
    if (p.enemyAge > before.chapter) log.push(`NEW CHAPTER ${p.enemyAge + 1} opened`);
  } else {
    game.dispatch({ type: 'retry' }); lossStreak++;
    // The game's regroup offer: after 3 straight defeats a casual player steps back a chapter for coins and gems.
    if (lossStreak >= 3 && p.enemyAge > 0 && game.dispatch({ type: 'select-battle', battle: p.enemyAge - 1 })) { log.push(`3 defeats in a row at chapter ${p.enemyAge + 2} -> stepped back to chapter ${p.enemyAge + 1}`); lossStreak = 0; }
  }
  if (won) lossStreak = 0;
  return { t, won };
}

for (let d = 1; d <= 7; d++) {
  const day = day0 + d - 1; const log: string[] = []; days[d] = log;
  const st = { battles: 0, wins: 0, losses: 0, gameSeconds: 0, coins: 0, gems: 0, seals: 0, chapter: 0, age: 0, cards: 0 };
  for (let s = 0; s < 2; s++) {
    log.push(`-- session ${s + 1}`);
    claimAll(day, log); spend(log);
    let used = 0;
    while (used < SESSION_S) {
      const r = fight(log); if (!r) break;
      used += r.t + 8; st.battles++; r.won ? st.wins++ : st.losses++;
      claimAll(day, log); spend(log);
    }
    st.gameSeconds += used;
  }
  Object.assign(st, { coins: p.coins, gems: p.gems, seals: currentSealCount(p), chapter: p.enemyAge + 1, age: p.age, cards: p.cards.reduce((a, b) => a + b, 0) });
  const w = weeklyStatus(p, weekId(day));
  log.push(`weekly ${w.progress}/${w.target}${w.claimed ? ' claimed' : ''}`);
  stats[d] = st;
}
if (process.env.COMPACT) {
  for (let d = 1; d <= 7; d++) { const st = stats[d]; const L = days[d];
    const has = (re: RegExp) => L.filter(l => re.test(l)).length;
    console.log(JSON.stringify({ seed: SEED, paid: PAID, day: d, battles: st.battles, wins: st.wins, chapter: st.chapter, age: st.age, timeline: p.timeline, newChapters: has(/NEW CHAPTER/), seals: st.seals, evolved: has(/EVOLVED/), troops: has(/unlocked troop/), milestones: has(/milestone/), weekly: has(/weekly record/), packs: has(/card pack/), paywallHits: has(/paywall/), prestige: has(/NEW TIMELINE/), stepBacks: has(/stepped back/), coins: st.coins })); }
  process.exit(0);
}
for (let d = 1; d <= 7; d++) {
  // Collapse repeats so the log reads like a diary.
  const counts = new Map<string, number>();
  for (const l of days[d]) counts.set(l, (counts.get(l) ?? 0) + 1);
  console.log(`\nDAY ${d}`, JSON.stringify(stats[d]));
  for (const [l, n] of counts) console.log(`  ${l}${n > 1 ? `  x${n}` : ''}`);
}
