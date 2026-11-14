import type { TasBridge } from './app-bridge.ts';
import { FULL_JOURNEY } from './app-bridge.ts';
import { n, tr } from './i18n.ts';

/** The one line under the buttons for the store's state. */
export function fullJourneyStatus(bridge: Pick<TasBridge, 'status' | 'owns'>): string {
  if (bridge.owns(FULL_JOURNEY)) return tr('Full Journey is yours. Every chapter is open.', 'الرحلة كاملة لك. كلّ الفصول مفتوحة.');
  switch (bridge.status) {
    case 'buying': return tr('Opening the App Store…', 'جارٍ فتح متجر التطبيقات…');
    case 'pending': return tr('Waiting for approval. The chapters open as soon as it is approved.', 'بانتظار الموافقة. تُفتح الفصول حالما تتمّ الموافقة.');
    case 'failed': return tr('The purchase did not go through. Nothing was charged; try again.', 'لم تكتمل عملية الشراء ولم يُخصم شيء. حاول مرّة أخرى.');
    case 'unavailable': return tr('The App Store cannot be reached right now. Try again later.', 'تعذّر الوصول إلى متجر التطبيقات الآن. حاول لاحقاً.');
    case 'nothing': return tr('No earlier purchase was found for this Apple Account.', 'لم نجد شراءً سابقاً لهذا الحساب.');
    default: return '';
  }
}

/**
 * Full Journey: chapters 4 to 6 and the harder timeline after them, bought once (1.3: chapters 1 to 3 are free). Shown
 * when a player who does not own it goes on past chapter 3 or moves camp into chapter 4, and from Settings. Restore, Terms and Privacy sit on the same card (App Review).
 */
/** The App Store's own price text for Full Journey ('' until the store has answered). */
export function fullJourneyPrice(bridge: Pick<TasBridge, 'prices' | 'price'>): string { return bridge.prices[FULL_JOURNEY] || bridge.price || ''; }

/**
 * `chapterName` is the first paid chapter (chapter 4), so the list's count stays true whoever opens the card.
 * `held` is set when the card was opened by a save that is past the free chapters (an import): it says the save is
 * kept as it is, and `held.freeChapter` adds the way back to a free chapter so declining never leaves a dead end.
 */
export function fullJourneyHtml(bridge: Pick<TasBridge, 'status' | 'owns' | 'prices' | 'price'>, chapterName: string, heldFree = true, held: { freeChapter: boolean } | null = null): string {
  const owned = bridge.owns(FULL_JOURNEY);
  const price = fullJourneyPrice(bridge);
  const busy = bridge.status === 'buying';
  const buyLabel = price ? tr(`Continue the journey · ${n(price)}`, `تابع الرحلة · ${n(price)}`) : tr('Continue the journey', 'تابع الرحلة');
  const buyAria = price ? tr(`Buy Full Journey for ${price}`, `اشترِ الرحلة كاملة بسعر ${price}`) : tr('Buy Full Journey', 'اشترِ الرحلة كاملة');
  const items = [
    tr(`${chapterName} and the two chapters after it`, `${chapterName} والفصلان اللذان يليانه`),
    tr('Nine new troops in new wardrobes', 'تسعة جنود جدد بأزياء جديدة'),
    tr('The harder timeline after the last chapter', 'الخطّ الزمني الأصعب بعد الفصل الأخير'),
    tr('Bought once and yours to keep. No ads, no timers.', 'تشتريها مرّة واحدة وتبقى لك. بلا إعلانات ولا انتظار.'),
  ];
  return `<span class="eyebrow">${tr('FULL JOURNEY', 'الرحلة كاملة')}</span><h2 id="dialog-title">${owned ? tr('The road is open', 'الطريق مفتوح') : tr('The road goes on', 'الطريق يمتدّ')}</h2>
 <p>${held && !owned ? tr('This save is past the free chapters. It is kept exactly as it is, and Full Journey opens it.', 'هذا الحفظ تجاوز الفصول المجّانية. يبقى محفوظاً كما هو، و«الرحلة كاملة» تفتحه.') : heldFree ? tr('Your company has held the three free chapters. Full Journey opens the rest of the tale.', 'صمدت سريّتك في الفصول الثلاثة المجّانية. الرحلة كاملة تفتح بقيّة الحكاية.') : tr('The first three chapters are free. Full Journey opens the rest of the tale.', 'الفصول الثلاثة الأولى مجّانية. الرحلة كاملة تفتح بقيّة الحكاية.')}</p>
 <ul class="full-journey-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>
 <p id="full-journey-status" class="save-note" role="status">${fullJourneyStatus(bridge)}</p>
 <div class="full-journey-actions">${owned
    ? `<button class="big-button green" data-command="close">${tr('Onward', 'إلى الأمام')}</button>`
    : `<button class="big-button green" data-command="buy-full-journey" aria-label="${buyAria}" ${busy ? 'disabled' : ''}>${buyLabel}</button>
 <button class="big-button secondary" data-command="restore-purchases" ${busy ? 'disabled' : ''}>${tr('Restore purchases', 'استعادة المشتريات')}</button>
 ${held?.freeChapter ? `<button class="big-button secondary" data-command="free-chapters">${tr('Play the free chapters', 'العب الفصول المجّانية')}</button>` : ''}
 <button class="big-button secondary" data-command="close">${tr('Not now', 'ليس الآن')}</button>`}</div>
 <p class="full-journey-legal"><button class="link-button" data-command="open-terms">${tr('Terms of Use', 'شروط الاستخدام')}</button> · <button class="link-button" data-command="open-privacy">${tr('Privacy', 'الخصوصية')}</button></p>`;
}
