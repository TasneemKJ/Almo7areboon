import { sharePostcard } from '../ui/victory-postcard.ts';
import { almoApp, evolutionNeedsFullJourney, FREE_AGES, FULL_JOURNEY, ownsFullJourney, installSaveFlush, LAMPLIGHTER_MONTHLY, LAMPLIGHTER_YEARLY, manageSubscriptions, onStoreChange, type TasBridge } from '../ui/app-bridge.ts';
import { fullJourneyHtml } from '../ui/full-journey-screen.ts';
import { lamplighterHtml } from '../ui/lamplighter-screen.ts';
import { chapterPresentation } from '../ui/chapter-presentation.ts';
import { tr } from '../ui/i18n.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** Where a store card was opened from, so closing it goes back there. */
export type StoreOrigin = 'settings' | 'evolve' | 'evolve-result' | 'other';
export const STORE_MODALS = ['full-journey', 'lamplighter'] as const;
/** The buttons whose commands the store flow handles (listeners.ts routes them here). */
export const STORE_COMMANDS = ['full-journey', 'lamplighter', 'buy-full-journey', 'buy-lamplighter-monthly', 'buy-lamplighter-yearly', 'restore-purchases', 'manage-subscriptions', 'open-terms', 'open-privacy', 'open-support', 'share-postcard'] as const;

export interface StoreFlowDeps {
  dom: Pick<Runtime, 'lifetime'>;
  ports: Pick<ShellApi, 'closeModal' | 'navState' | 'persist' | 'playable' | 'sessionState' | 'showModal' | 'showResult' | 'showSettings' | 'toast'>;
}

/**
 * The app's two store cards (Full Journey, the Lamplighter) and the one gate: evolving past chapter 2 in the app
 * without Full Journey opens its card instead. Off the app the bridge owns everything, so nothing here ever shows.
 * Ownership is asked of the bridge at the moment of use and never written to the save.
 */
export function createStoreFlow(deps: StoreFlowDeps, bridge: TasBridge = almoApp) {
  const { ports } = deps;
  let origin: StoreOrigin = 'other';
  const open = () => STORE_MODALS.includes(ports.navState.modal as typeof STORE_MODALS[number]);

  function render(): void {
    if (ports.navState.modal === 'full-journey') ports.showModal('full-journey', fullJourneyHtml(bridge, chapterPresentation(Math.min(5, Math.max(2, ports.sessionState.game.profile.age + 1))).title, ports.sessionState.game.profile.furthestBattle >= 1 && ports.sessionState.game.profile.wins > 0));
    else if (ports.navState.modal === 'lamplighter') ports.showModal('lamplighter', lamplighterHtml(bridge));
  }
  function showFullJourney(from: StoreOrigin = 'other'): void {
    if (!ports.playable()) return;
    origin = from;
    bridge.refresh(); // fresh prices and ownership whenever a card opens
    ports.showModal('full-journey', fullJourneyHtml(bridge, chapterPresentation(Math.min(5, Math.max(2, ports.sessionState.game.profile.age + 1))).title, ports.sessionState.game.profile.furthestBattle >= 1 && ports.sessionState.game.profile.wins > 0));
  }
  function showLamplighter(from: StoreOrigin = 'other'): void {
    if (!ports.playable()) return;
    origin = from;
    bridge.refresh();
    ports.showModal('lamplighter', lamplighterHtml(bridge));
  }
  /** True when the evolution was stopped here and the Full Journey card shown instead. */
  function gateEvolution(): boolean {
    if (!evolutionNeedsFullJourney(ports.sessionState.game.profile.age, bridge)) return false;
    showFullJourney(ports.navState.modal === 'result' || ports.navState.evolutionFromResult ? 'evolve-result' : 'evolve');
    return true;
  }
  /** True when the battle against chapter `battle` (0-based) was stopped and the Full Journey card shown instead. */
  function gateBattle(battle: number): boolean {
    if (!bridge.inApp || battle < FREE_AGES || ownsFullJourney(bridge)) return false;
    showFullJourney(ports.navState.modal === 'result' ? 'evolve-result' : 'other');
    return true;
  }
  function leave(): void {
    const from = origin; origin = 'other';
    if (from === 'settings') { ports.showSettings(); return; }
    if (from === 'evolve-result') { ports.navState.evolutionFromResult = false; ports.showResult(); return; }
    ports.closeModal();
  }
  /** Handles a store command; false when the command is not the store's. */
  function handleStoreCommand(command: string | undefined): boolean {
    switch (command) {
      case 'full-journey': showFullJourney(ports.navState.modal === 'settings' ? 'settings' : ports.navState.modal === 'result' ? 'evolve-result' : 'other'); return true;
      case 'lamplighter': showLamplighter(ports.navState.modal === 'settings' ? 'settings' : 'other'); return true;
      case 'buy-full-journey': ports.persist(); bridge.buy(FULL_JOURNEY); return true;
      case 'buy-lamplighter-monthly': ports.persist(); bridge.buy(LAMPLIGHTER_MONTHLY); return true;
      case 'buy-lamplighter-yearly': ports.persist(); bridge.buy(LAMPLIGHTER_YEARLY); return true;
      case 'restore-purchases': bridge.restore(); return true;
      case 'manage-subscriptions': manageSubscriptions(bridge); return true;
      case 'open-terms': bridge.openPage('terms'); return true;
      case 'open-privacy': bridge.openPage('privacy'); return true;
      case 'open-support': bridge.openPage('support'); return true;
      case 'close': if (!open()) return false; leave(); return true;
      // A postcard home after a victory: the iPhone share sheet takes it; nothing is saved or spent.
      case 'share-postcard': {
        const { profile, state } = ports.sessionState.game;
        if (ports.navState.modal !== 'result' || state.phase !== 'won') return true;
        void sharePostcard(profile, state, bridge).then(sent => { if (!sent && bridge.inApp) ports.toast(tr('The postcard could not be made this time.', 'تعذّر صنع البطاقة هذه المرّة.')); });
        return true;
      }
      default: return false;
    }
  }
  const stop = onStoreChange((_, unlockedNow) => {
    if (open() && ports.playable()) render();
    if (unlockedNow && ports.playable()) ports.toast(tr('Full Journey is yours. Every chapter is open.', 'الرحلة كاملة لك. كلّ الفصول مفتوحة.'), 6000);
  });
  deps.dom.lifetime.add(stop);
  installSaveFlush(() => ports.persist());
  // Test and screenshot hooks for the app's integration tests (ios/Almo7areboonTests).
  Object.assign(globalThis, { __almoShowFullJourney: () => showFullJourney(), __almoShowLamplighter: () => showLamplighter() });
  bridge.refresh(); // prices sent before the page loaded are lost: ask again now that the bridge exists
  return { showFullJourney, showLamplighter, gateEvolution, gateBattle, handleStoreCommand };
}
