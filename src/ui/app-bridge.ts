import '../vendor/tas-bridge.js';

/**
 * The page side of the iPhone app (TasKit, see ios/). In the app, StoreKit decides what is owned and the page asks
 * `owns(key)`; on the web (and in node tests) there is no app, nothing is gated and every call is a harmless no-op.
 * Purchases never enter the save. Names match ios/Almo7areboon/Almo7areboonConfig.swift: handler `almo7areboon`,
 * bridge `almoApp`, boot `__almoAppBoot`, catalog key `fullGame`.
 */
export interface TasBridge {
  readonly inApp: boolean;
  readonly platform: 'ios' | 'android' | 'web';
  owned: Record<string, boolean>;
  prices: Record<string, string>;
  price: string;
  /** '' | 'buying' | 'pending' (Ask to Buy) | 'failed' | 'unavailable' | 'nothing' (Restore found nothing). */
  status: string;
  owns(key: string): boolean;
  buy(key?: string): boolean;
  restore(): boolean;
  refresh(): boolean;
  openPage(name: 'terms' | 'privacy' | 'support' | 'subscriptions'): boolean;
  share(dataURL: string): boolean;
  post(type: string, data?: unknown): boolean;
  /** After a won climax only: the app may ask for a rating, at most once per 90 days (TasKit c87e8af). */
  requestReview(): boolean;
  update(u: unknown): void;
}

type CreateTasBridge = (options: { handler: string; boot: string; defaultProduct?: string; window?: unknown; onUpdate?: (b: TasBridge, before: Record<string, boolean>) => void; onStatus?: (b: TasBridge) => void }) => TasBridge;

export const FULL_JOURNEY = 'fullGame';
/** The Lamplighter subscription, two lengths in one group (yearly ranks above monthly). */
export const LAMPLIGHTER_MONTHLY = 'lamplighterMonthly';
export const LAMPLIGHTER_YEARLY = 'lamplighterYearly';
export const LAMPLIGHTER_PLANS = [LAMPLIGHTER_MONTHLY, LAMPLIGHTER_YEARLY] as const;
export type LamplighterPlan = typeof LAMPLIGHTER_PLANS[number];

const listeners = new Set<(bridge: TasBridge, unlockedNow: boolean) => void>();
function notify(bridge: TasBridge, before?: Record<string, boolean>): void {
  const unlockedNow = !!before && before[FULL_JOURNEY] !== true && bridge.owned[FULL_JOURNEY] === true;
  for (const listener of listeners) { try { listener(bridge, unlockedNow); } catch { /* one screen's failure never stops another */ } }
}

/** Builds a bridge on a given window (tests pass a fake one). */
export function createAppBridge(win?: unknown): TasBridge {
  const create = (globalThis as unknown as { createTasBridge: CreateTasBridge }).createTasBridge;
  return create({ handler: 'almo7areboon', boot: '__almoAppBoot', defaultProduct: FULL_JOURNEY, window: win, onUpdate: (b, before) => notify(b, before), onStatus: b => notify(b) });
}

export const almoApp: TasBridge = createAppBridge();
(globalThis as unknown as { almoApp: TasBridge }).almoApp = almoApp;

/** Called when the store answers or a purchase changes state; `unlockedNow` is true once, when Full Journey arrives. */
export function onStoreChange(listener: (bridge: TasBridge, unlockedNow: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Off the app always true. */
export function ownsFullJourney(bridge: TasBridge = almoApp): boolean { return bridge.owns(FULL_JOURNEY); }

/**
 * The Lamplighter walks with the company only while a plan is live in the app. He is presence, never power: on the
 * web (where nothing is sold) he does not appear at all, so the web game looks exactly as it always has.
 */
export function lamplighterWalks(bridge: Pick<TasBridge, 'inApp' | 'owned'> = almoApp): boolean {
  return bridge.inApp && LAMPLIGHTER_PLANS.some(plan => bridge.owned[plan] === true);
}
/** The live plan, if any (the yearly wins if both are reported during an upgrade). */
export function lamplighterPlan(bridge: Pick<TasBridge, 'inApp' | 'owned'> = almoApp): LamplighterPlan | null {
  if (!bridge.inApp) return null;
  return bridge.owned[LAMPLIGHTER_YEARLY] === true ? LAMPLIGHTER_YEARLY : bridge.owned[LAMPLIGHTER_MONTHLY] === true ? LAMPLIGHTER_MONTHLY : null;
}
/**
 * The one place the game asks for a rating: a battle batch that holds a victory (a won chapter battle, or a dusk raid
 * turned back). Never a defeat, never a purchase or a menu; the app itself keeps it rare. Returns whether it asked.
 */
export function askForRatingAfter(batch: readonly { type: string }[], bridge: Pick<TasBridge, 'inApp' | 'requestReview'> = almoApp): boolean {
  return bridge.inApp && batch.some(event => event.type === 'win') && !batch.some(event => event.type === 'lose') && bridge.requestReview() === true;
}
/**
 * A won climax, the only moment the rating ask may follow: a chapter cleared for the first time in this timeline (the
 * victory's first seal is new), or a dusk raid turned back. A chapter won again, a defeat or a purchase is not one.
 */
export function wonClimax(p: { readonly pendingVictory: { readonly settlement: string; readonly newMask?: number } | null }, s: { readonly phase: string; readonly dusk?: unknown }): boolean {
  if (s.phase !== 'won') return false;
  if (s.dusk) return true;
  const v = p.pendingVictory;
  return !!v && v.settlement === 'mastery-v1' && ((v.newMask ?? 0) & 1) === 1;
}
/** Apple's own manage-subscriptions sheet (TasKit 040aa0e). */
export function manageSubscriptions(bridge: TasBridge = almoApp): boolean { return bridge.post('manageSubscriptions'); }

/**
 * Chapters 1 and 2 (ages 0-1) are free. Evolving into chapter 3 or beyond, and so every later chapter and the harder
 * timeline, needs Full Journey. A save that is already past chapter 2 (imported, or from the web) is held: it stays
 * exactly as it is on disk and no battle starts from it until StoreKit says Full Journey is owned (1.1; in 1.0 such a
 * save kept playing, which let an import walk around the purchase).
 */
export const FREE_AGES = 2;
type JourneyProgress = { readonly timeline: number; readonly age: number; readonly enemyAge: number; readonly furthestBattle: number };
/** Past the free arc: a paid chapter is the chosen battle, the army wears a paid chapter, or it is a later timeline. */
export function pastFreeArc(p: Pick<JourneyProgress, 'timeline' | 'age' | 'enemyAge'>): boolean {
  return p.timeline > 1 || p.age >= FREE_AGES || p.enemyAge >= FREE_AGES;
}
/**
 * True while a save past the free arc waits for Full Journey. Asked at the moment of use and only of the bridge
 * (StoreKit): nothing in the save can answer it, and the save is never changed by it, so the answer arriving late
 * (or a Restore) opens the same untouched progress.
 */
export function journeyHeld(p: Pick<JourneyProgress, 'timeline' | 'age' | 'enemyAge'>, bridge: Pick<TasBridge, 'owns'> = almoApp): boolean {
  return pastFreeArc(p) && !bridge.owns(FULL_JOURNEY);
}
/**
 * The free chapter a held save can still play, when only its chosen battle is past the free arc (the furthest battle
 * reached stays on record). Null when its own army or timeline is paid: nothing in that save is free to play.
 */
export function freeChapterFor(p: JourneyProgress): number | null {
  return p.timeline === 1 && p.age < FREE_AGES && p.enemyAge >= FREE_AGES ? Math.min(FREE_AGES - 1, p.furthestBattle) : null;
}
export function evolutionNeedsFullJourney(currentAge: number, bridge: TasBridge = almoApp): boolean {
  return currentAge + 1 >= FREE_AGES && !ownsFullJourney(bridge);
}

/** What the app runs before copying the save to its vault (TasGameConfig.flushSaveScript). */
export function installSaveFlush(flush: () => void): void {
  (globalThis as unknown as { __almoFlushSave?: () => void }).__almoFlushSave = () => { try { flush(); } catch { /* a failed flush keeps the last good save */ } };
}
