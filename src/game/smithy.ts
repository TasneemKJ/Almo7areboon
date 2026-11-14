import { ERAS, eraEconomyScale } from './data.ts';
import { litCounsel } from './counsel.ts';
import type { BattleState, Profile, Unit, UnitDef, UnitKind } from './types.ts';

/**
 * «سيوف المعركة المكسورة», the smith (DESIGN.md #60). After a battle, won or lost, one or two broken blades lie on the
 * field where the company's troops fell (two after a defeat: a loss leaves something to carry). A tap carries one home;
 * a blade left on the field is gone when the next battle starts. At the village smith, coins reforge a blade into a
 * weapon named for the battle it came from, for the kind of troop who carried it. A forged weapon is a sidegrade, never
 * a straight upgrade: each temper makes one number better and another worse. One hook per troop kind, so at most three
 * hang at once; the rest go on the smithy wall, the keepsake collection. Blades come only from battles, never from a
 * shop, and nothing here is sold for money.
 *
 * Saved as `profile.smithy` (optional, normalized in save.ts). It survives Move camp and a new timeline (it is the
 * company's memory, not its camp); Start over begins without it. A dusk raid drops nothing.
 */
export interface Blade {
  readonly id: number;
  /** The battle (chapter index, 0-5) the blade came from: its name. */
  readonly chapter: number;
  /** The troop kind who carried it, and so the kind it is reforged for. */
  readonly kind: UnitKind;
  /** It came from a defeat (the patient temper). */
  readonly lost?: true;
  forged?: true;
  hung?: true;
}
/** A blade still lying on the field: where it fell, in simulation coordinates. */
export interface FieldBlade extends Blade { readonly x: number; readonly lane: number }
export interface Smithy { next: number; blades: Blade[]; field?: FieldBlade[] }
/** Where the company's troops fell in this battle (transient, newest last), and whether its blades were dropped. */
export interface SmithBattle { falls: { x: number; lane: number; kind: UnitKind }[]; dropped?: true }

export const SMITHY_CAP = 60;
/** How long the result waits while blades lie on the field after a battle; it comes sooner once they are carried. */
export const BLADE_HOLD_MS = 3500, BLADE_LAST_MS = 450;
const FALLS_KEPT = 40;
/** The reforging price before the camp's own scale (eraEconomyScale): 400 coins in the first camp. */
export const REFORGE_BASE = 400;

/** Each troop kind's two tempers: a blade won in victory keeps its edge (a), one carried from a defeat learned patience (b). */
export type TemperKey = 'heavy-edge' | 'light-edge' | 'long-reach' | 'quick-hand' | 'first-charge' | 'steady';
export interface Temper { readonly key: TemperKey; readonly kind: UnitKind; readonly mul: Readonly<Partial<Record<'hp' | 'damage' | 'speed' | 'range' | 'interval', number>>> }
export const TEMPERS: Readonly<Record<TemperKey, Temper>> = Object.freeze({
  // Swords: hits harder but swings slower, or swings quicker but lighter.
  'heavy-edge': { key: 'heavy-edge', kind: 0, mul: { damage: 1.15, interval: 1.12 } },
  'light-edge': { key: 'light-edge', kind: 0, mul: { interval: 0.88, damage: 0.88 } },
  // Javelins: reach further but throw slower, or throw quicker from closer in.
  'long-reach': { key: 'long-reach', kind: 1, mul: { range: 1.2, interval: 1.15 } },
  'quick-hand': { key: 'quick-hand', kind: 1, mul: { interval: 0.87, range: 0.8 } },
  // Lances: the charge arrives first but turns back sooner, or holds longer and arrives later.
  'first-charge': { key: 'first-charge', kind: 2, mul: { speed: 1.18, hp: 0.88 } },
  'steady': { key: 'steady', kind: 2, mul: { hp: 1.12, speed: 0.85 } },
});
const BY_KIND: readonly [[TemperKey, TemperKey], [TemperKey, TemperKey], [TemperKey, TemperKey]] = [['heavy-edge', 'light-edge'], ['long-reach', 'quick-hand'], ['first-charge', 'steady']];
export function temperOf(blade: Pick<Blade, 'kind' | 'lost'>): Temper { return TEMPERS[BY_KIND[blade.kind][blade.lost ? 1 : 0]]; }

export function reforgeCost(p: Pick<Profile, 'age'>): number { return REFORGE_BASE * eraEconomyScale(p.age); }
/**
 * The forge stays cold while the village lamp is lit over another place (counsel.ts): bread and the gate come first, so
 * the smith never takes the coins the road needs (free-path-sim.ts: reforging before bread cost a free player a try in
 * chapters 2 and 4). It warms again once the lamp goes out.
 */
export function forgeWaits(p: Readonly<Profile>): boolean { return litCounsel(p) !== null; }
export const blades = (p: Readonly<Pick<Profile, 'smithy'>>): readonly Blade[] => p.smithy?.blades ?? [];
export const fieldBlades = (p: Readonly<Pick<Profile, 'smithy'>>): readonly FieldBlade[] => p.smithy?.field ?? [];
/** The broken blades waiting by the anvil, oldest first. */
export const brokenBlades = (p: Readonly<Pick<Profile, 'smithy'>>): readonly Blade[] => blades(p).filter(b => !b.forged);
export const hungBlades = (p: Readonly<Pick<Profile, 'smithy'>>): readonly Blade[] => blades(p).filter(b => b.hung);
/** The keepsake wall: forged weapons not on a hook, newest first. */
export const wallBlades = (p: Readonly<Pick<Profile, 'smithy'>>): readonly Blade[] => blades(p).filter(b => b.forged && !b.hung).reverse();
export const hungFor = (p: Readonly<Pick<Profile, 'smithy'>>, kind: UnitKind): Blade | undefined => blades(p).find(b => b.hung && b.kind === kind);

/** Remembers where one of the company's troops fell (the death of a player unit; enemies are ignored). */
export function noteFall(s: BattleState, unit: Pick<Unit, 'side' | 'x' | 'lane' | 'kind'>): void {
  if (unit.side !== 'player' || s.dusk) return;
  const smith = s.smith ??= { falls: [] };
  smith.falls.push({ x: Math.round(unit.x), lane: unit.lane, kind: unit.kind });
  if (smith.falls.length > FALLS_KEPT) smith.falls.shift();
}

/**
 * Once the battle is over, its blades lie on the field: the fall furthest forward, and after a defeat also the latest
 * fall of another kind (or else the latest one). A battle nobody fell in leaves none. Replaces any blades still lying
 * from an earlier battle. Idempotent; a dusk raid drops nothing.
 */
export function dropBlades(p: Profile, s: BattleState): void {
  if ((s.phase !== 'won' && s.phase !== 'lost') || s.dusk || s.smith?.dropped) return;
  const falls = s.smith?.falls ?? [];
  if (!s.smith || !falls.length) return; // nobody fell: nothing to drop, and the state stays as it was
  s.smith.dropped = true;
  const lost = s.phase === 'lost', chosen = [falls.reduce((a, b) => b.x > a.x ? b : a)];
  if (lost && falls.length > 1) {
    const latest = [...falls].reverse(), other = latest.find(f => f !== chosen[0] && f.kind !== chosen[0].kind) ?? latest.find(f => f !== chosen[0]);
    if (other) chosen.push(other);
  }
  const smithy = p.smithy ??= { next: 1, blades: [] };
  smithy.field = chosen.map(f => ({ id: smithy.next++, chapter: p.enemyAge, kind: f.kind, x: f.x, lane: f.lane, ...(lost ? { lost: true as const } : {}) }));
}

/** The next battle starts: blades nobody carried stay where they lie, and the field forgets them. */
export function leaveField(p: Profile): void { if (p.smithy?.field) delete p.smithy.field; }

export type SmithAction = { type: 'blade-carry' | 'reforge' | 'hang'; id: number };
export interface SmithPort { readonly profile: Profile; readonly phase: BattleState['phase']; canPrepare(): boolean; spend(cost: number): boolean; }

/** Carry a blade home, reforge one, or change what hangs on its kind's hook. Never while a battle is being fought. */
export function smithAction(game: SmithPort, action: SmithAction): boolean {
  const p = game.profile, smithy = p.smithy;
  if (!smithy || !Number.isInteger(action.id) || game.phase === 'running') return false;
  if (action.type === 'blade-carry') {
    const index = smithy.field?.findIndex(b => b.id === action.id) ?? -1;
    if (index < 0 || smithy.blades.length >= SMITHY_CAP) return false;
    const [{ x: _x, lane: _lane, ...blade }] = smithy.field!.splice(index, 1);
    if (!smithy.field!.length) delete smithy.field;
    smithy.blades.push(blade);
    return true;
  }
  const blade = smithy.blades.find(b => b.id === action.id);
  if (!blade || !game.canPrepare()) return false;
  if (action.type === 'reforge') {
    if (blade.forged || forgeWaits(p) || !game.spend(reforgeCost(p))) return false;
    blade.forged = true;
    if (!hungFor(p, blade.kind)) blade.hung = true; // an empty hook takes it; otherwise it goes on the wall
    return true;
  }
  if (action.type === 'hang') {
    if (!blade.forged) return false;
    if (blade.hung) { delete blade.hung; return true; } // taken down to the wall
    const current = hungFor(p, blade.kind);
    if (current) delete current.hung;
    blade.hung = true;
    return true;
  }
  return false;
}

const tempered = new Map<string, UnitDef>();
/** The troop's numbers in battle: a player troop whose kind has a weapon on its hook carries that temper. */
export function troopDef(p: Readonly<Pick<Profile, 'smithy'>>, unit: Pick<Unit, 'side' | 'age' | 'kind'>): UnitDef {
  const def = ERAS[unit.age].units[unit.kind];
  const blade = unit.side === 'player' ? hungFor(p, unit.kind) : undefined;
  if (!blade) return def;
  const temper = temperOf(blade), key = `${unit.age}:${temper.key}`;
  let result = tempered.get(key);
  if (!result) {
    result = Object.create(def) as UnitDef; // the role stays a getter, so it still speaks the current language
    for (const [stat, mul] of Object.entries(temper.mul) as [keyof typeof temper.mul, number][]) result[stat] = def[stat] * mul;
    tempered.set(key, result);
  }
  return result;
}

/** Load-time normalization: unknown shapes are dropped, ids stay unique, one hung weapon per kind, caps hold. */
export function normalizeSmithy(raw: unknown): Smithy | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const source = raw as { next?: unknown; blades?: unknown; field?: unknown };
  const seen = new Set<number>(), hung = new Set<number>();
  const read = (value: unknown, onField: boolean): FieldBlade | Blade | null => {
    const b = value as Record<string, unknown> | null;
    if (!b || typeof b !== 'object' || !Number.isInteger(b.id) || (b.id as number) < 1 || seen.has(b.id as number)) return null;
    if (!Number.isInteger(b.chapter) || (b.chapter as number) < 0 || (b.chapter as number) > 5 || ![0, 1, 2].includes(b.kind as number)) return null;
    seen.add(b.id as number);
    const blade: Blade = { id: b.id as number, chapter: b.chapter as number, kind: b.kind as UnitKind, ...(b.lost === true ? { lost: true as const } : {}) };
    if (onField) {
      if (!Number.isFinite(b.x) || ![0, 1, 2].includes(b.lane as number)) return null;
      return { ...blade, x: Math.max(90, Math.min(910, Math.round(b.x as number))), lane: b.lane as number };
    }
    if (b.forged === true) blade.forged = true;
    if (blade.forged && b.hung === true && !hung.has(blade.kind)) { hung.add(blade.kind); blade.hung = true; }
    return blade;
  };
  const list = (value: unknown, onField: boolean, cap: number) => (Array.isArray(value) ? value : []).slice(0, cap).map(v => read(v, onField)).filter(Boolean);
  const kept = list(source.blades, false, SMITHY_CAP) as Blade[], field = list(source.field, true, 2) as FieldBlade[];
  if (!kept.length && !field.length) return undefined;
  const top = Math.max(0, ...seen);
  const next = Number.isInteger(source.next) && (source.next as number) > top ? Math.min(1e9, source.next as number) : top + 1;
  return { next, blades: kept, ...(field.length ? { field } : {}) };
}
