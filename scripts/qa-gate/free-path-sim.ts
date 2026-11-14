// The free path (DESIGN.md #60, STUDIO-BAR "pay-to-progress"): a player who never buys anything plays the game's own rules
// (the web build, where nothing is sold) from a fresh save until the chapter 6 battle is won, or BATTLES run out.
// The player taps the first affordable troop like the audit bot (streak-sim.ts; TAP=mix sends its troops in turn) and
// uses no skills. Between battles:
//   CAMP=0        presses Retry after a defeat and Continue after a win, never opens Camp;
//   CAMP=counsel  follows the Regroup primary: the lit Camp place's act until the lamp goes out, and Move camp when the
//                 coins can do it (the defeat card's primary then), as streak-sim.ts does;
//   CAMP=spend    spends like a player who wanders Camp after every battle: Move camp when affordable, else the counsel
//                 order with no lamp scope (campCounsel), so coins never sit idle.
// SMITH=keep|none|all|hang3 (the smith, #60): keep = carry blades home and do nothing else; none = leave them; all =
// reforge every blade that can be paid for, hang the newest; hang3 = reforge and keep three hung, one per troop kind.
// Per chapter it reports battles, losses, the longest run of defeats, wins that needed the pacing director's rally,
// coins earned in battle, spent in Camp, wiped by Move camp and still idle when the chapter was won, and what Move
// camp asked. A wall is a chapter with a run of more than 3 defeats, or one whose next step needed coins the player
// had not earned there. `appGate` is the battle where the iPhone app's Full Journey card would first stop this player
// (src/ui/app-bridge.ts pastFreeArc), printed for reference only: the sim plays the rules, not the store.
// Run: node --experimental-strip-types scripts/qa-gate/free-path-sim.ts [seeds=12] [CAMP=counsel] [battles=150] [SMITH=keep] [TAP=first|mix]
import { Game } from '../../src/game/simulation.ts';
import { campCounsel, counselAction, litCounsel } from '../../src/game/counsel.ts';
import { ERAS } from '../../src/game/data.ts';
import { rallyLevel } from '../../src/game/encounters.ts';
import type { UnitKind } from '../../src/game/types.ts';

const SEEDS = Number(process.argv[2] ?? 12), CAMP = process.argv[3] ?? 'counsel', BATTLES = Number(process.argv[4] ?? 150), SMITH = process.argv[5] ?? 'keep', TAP = process.argv[6] ?? 'first';
function seeded(s: number) { let seed = s >>> 0 || 1; return () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
type Row = { battles: number; losses: number; streak: number; rallyWins: number; earned: number; spent: number; wiped: number; idle: number; moveCost: number; reforged: number; won: boolean; firstTry: boolean };
const blank = (): Row => ({ battles: 0, losses: 0, streak: 0, rallyWins: 0, earned: 0, spent: 0, wiped: 0, idle: 0, moveCost: 0, reforged: 0, won: false, firstTry: false });

function fight(game: Game, rnd: () => number): boolean {
  if (!game.dispatch({ type: 'start' }) && game.state.phase !== 'running') return false;
  let next = 1, n = 0;
  for (let t = 0; game.state.phase === 'running' && t < 200; t += 0.1) {
    if (t >= next) {
      // first: the first affordable troop (the audit bot); mix: the owned troops in turn, a tap waiting for food when the
      // next one is not affordable yet (chapter2-sim.ts).
      if (TAP === 'mix') { const kinds = ([0, 1, 2] as UnitKind[]).filter(k => game.profile.unlocked[k]); if (game.dispatch({ type: 'spawn', kind: kinds[n % kinds.length] })) n++; }
      else for (const kind of [0, 1, 2] as UnitKind[]) if (game.profile.unlocked[kind] && game.dispatch({ type: 'spawn', kind })) break;
      next += 1.15 * (0.95 + rnd() * 0.8);
    }
    game.step(0.1); game.drainEvents();
  }
  if (game.state.phase === 'running') game.dispatch({ type: 'retreat' });
  return game.state.phase === 'won';
}
const canMove = (game: Game) => { const p = game.profile; return p.age < ERAS.length - 1 && p.age <= p.enemyAge && p.coins >= ERAS[p.age].evolveCost; };
function camp(game: Game, row: Row) {
  const before = game.profile.coins;
  if (CAMP === 'counsel') for (let lit = litCounsel(game.profile), n = 0; lit && n < 60 && game.dispatch(counselAction(lit)); lit = litCounsel(game.profile), n++);
  if (CAMP === 'spend') for (let c = campCounsel(game.profile), n = 0; c && n < 200 && game.dispatch(counselAction(c)); c = campCounsel(game.profile), n++);
  row.spent += before - game.profile.coins;
}
function move(game: Game, row: Row): boolean {
  if (CAMP === '0' || !canMove(game)) return false;
  const cost = ERAS[game.profile.age].evolveCost, coins = game.profile.coins;
  if (!game.dispatch({ type: 'evolve' })) return false;
  row.spent += cost; row.wiped += coins - cost; return true;
}
function smithy(game: Game, row: Row) {
  if (SMITH === 'none') return;
  for (const blade of (game.state as { fallen?: { id: number }[] }).fallen ?? []) game.dispatch({ type: 'blade-carry', id: blade.id } as never);
  if (SMITH === 'keep') return;
  type Blade = { id: number; kind: number; forged?: true; hung?: true };
  const blades = (): Blade[] => (game.profile as { smithy?: { blades: Blade[] } }).smithy?.blades ?? [];
  for (const blade of [...blades()]) {
    if (blade.forged) continue;
    const coins = game.profile.coins;
    if (game.dispatch({ type: 'reforge', id: blade.id } as never)) { row.spent += coins - game.profile.coins; row.reforged++; }
  }
  const forged = blades().filter(b => b.forged);
  if (SMITH === 'all') { const last = forged.at(-1); if (last && !last.hung) game.dispatch({ type: 'hang', id: last.id } as never); }
  if (SMITH === 'hang3') for (const kind of [0, 1, 2]) { const b = forged.filter(x => x.kind === kind).at(-1); if (b && !b.hung) game.dispatch({ type: 'hang', id: b.id } as never); }
}

const players: { chapters: Row[]; battles: number; done: boolean; appGate: number | null; walls: string[] }[] = [];
for (let s = 1; s <= SEEDS; s++) {
  const rnd = seeded(s); Math.random = seeded(1000 + s);
  const game = new Game(); const chapters = Array.from({ length: 6 }, blank); let streak = 0, appGate: number | null = null, b = 0, done = false;
  for (; b < BATTLES && !done; b++) {
    const ch = game.profile.enemyAge, row = chapters[ch];
    if (appGate === null && (ch >= 2 || game.profile.age >= 2)) appGate = b + 1;
    const rally = rallyLevel(game.profile) > 0, coins = game.profile.coins;
    const won = fight(game, rnd);
    row.battles++; row.earned += game.profile.coins - coins;
    smithy(game, row);
    if (won) {
      streak = 0; if (rally) row.rallyWins++; if (row.battles === 1) row.firstTry = true;
      if (ch === 5) { row.won = true; row.idle = game.profile.coins; done = true; break; }
      row.won = true; row.idle = game.profile.coins;
      if (!game.dispatch({ type: 'next' })) game.dispatch({ type: 'retry' });
    } else {
      streak++; row.losses++; row.streak = Math.max(row.streak, streak);
      if (!move(game, row)) game.dispatch({ type: 'retry' });
    }
    // Move camp is the army's own road: a player keeps up with the rival when the coins allow (counsel and spend).
    if (game.profile.age < game.profile.enemyAge) { chapters[game.profile.enemyAge].moveCost = ERAS[game.profile.age].evolveCost; move(game, chapters[game.profile.enemyAge]); }
    camp(game, chapters[game.profile.enemyAge]);
  }
  const walls = chapters.flatMap((r, i) => r.battles && (r.streak > 3 || (!r.won && r.moveCost > r.earned)) ? [`ch${i + 1}${r.streak > 3 ? ` streak ${r.streak}` : ''}${!r.won && r.moveCost > r.earned ? ` needs ${r.moveCost}` : ''}`] : []);
  players.push({ chapters, battles: b + (done ? 1 : 0), done, appGate, walls });
}
const avg = (f: (r: Row) => number, i: number) => +(players.reduce((a, p) => a + f(p.chapters[i]), 0) / players.length).toFixed(1);
const table = Array.from({ length: 6 }, (_, i) => ({ chapter: i + 1, reached: players.filter(p => p.chapters[i].battles).length, won: players.filter(p => p.chapters[i].won).length, firstTry: players.filter(p => p.chapters[i].firstTry).length, battles: avg(r => r.battles, i), losses: avg(r => r.losses, i), maxStreak: Math.max(...players.map(p => p.chapters[i].streak)), rallyWins: avg(r => r.rallyWins, i), earned: avg(r => r.earned, i), spent: avg(r => r.spent, i), wiped: avg(r => r.wiped, i), idle: avg(r => r.idle, i), reforged: avg(r => r.reforged, i) }));
console.log(JSON.stringify({ camp: CAMP, smith: SMITH, tap: TAP, seeds: SEEDS, battleCap: BATTLES, finished: players.filter(p => p.done).length, battlesToFinish: players.map(p => p.done ? p.battles : `${p.battles}+`).join(','), worstStreak: Math.max(...players.flatMap(p => p.chapters.map(r => r.streak))), appGateAtBattle: players.map(p => p.appGate ?? '-').join(','), walls: [...new Set(players.flatMap(p => p.walls))] }));
for (const row of table) console.log(JSON.stringify(row));
