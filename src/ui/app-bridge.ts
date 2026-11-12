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
/** Apple's own manage-subscriptions sheet (TasKit 040aa0e). */
export function manageSubscriptions(bridge: TasBridge = almoApp): boolean { return bridge.post('manageSubscriptions'); }

/**
 * Chapters 1 and 2 (ages 0-1) are free. Evolving into chapter 3 or beyond, and so every later chapter and the harder
 * timeline, needs Full Journey. A player who is already past chapter 2 (a save from the web) keeps playing where they
 * are; only the next evolution asks.
 */
export const FREE_AGES = 2;
export function evolutionNeedsFullJourney(currentAge: number, bridge: TasBridge = almoApp): boolean {
  return currentAge + 1 >= FREE_AGES && !ownsFullJourney(bridge);
}

/** What the app runs before copying the save to its vault (TasGameConfig.flushSaveScript). */
export function installSaveFlush(flush: () => void): void {
  (globalThis as unknown as { __almoFlushSave?: () => void }).__almoFlushSave = () => { try { flush(); } catch { /* a failed flush keeps the last good save */ } };
}
