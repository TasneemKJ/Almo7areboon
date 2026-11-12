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
 * Full Journey: chapters 3 to 6 and the harder timeline after them, bought once. Shown when a player who does not own
 * it chooses to evolve past chapter 2, and from Settings. Restore, Terms and Privacy sit on the same card (App Review).
 */
export function fullJourneyHtml(bridge: Pick<TasBridge, 'status' | 'owns' | 'prices' | 'price'>, chapterName: string): string {
  const owned = bridge.owns(FULL_JOURNEY);
  const price = bridge.prices[FULL_JOURNEY] || bridge.price || '';
  const busy = bridge.status === 'buying';
  const buyLabel = price ? tr(`Continue the journey · ${n(price)}`, `تابع الرحلة · ${n(price)}`) : tr('Continue the journey', 'تابع الرحلة');
  const buyAria = price ? tr(`Buy Full Journey for ${price}`, `اشترِ الرحلة كاملة بسعر ${price}`) : tr('Buy Full Journey', 'اشترِ الرحلة كاملة');
  const items = [
    tr(`${chapterName} and the three chapters after it`, `${chapterName} والفصول الثلاثة التي تليه`),
    tr('Twelve new troops in new wardrobes', 'اثنا عشر جندياً جديداً بأزياء جديدة'),
    tr('The harder timeline after the last chapter', 'الخطّ الزمني الأصعب بعد الفصل الأخير'),
    tr('Bought once. No ads, no timers, nothing else to buy.', 'تشتريها مرّة واحدة. بلا إعلانات ولا انتظار، ولا شيء آخر للشراء.'),
  ];
  return `<span class="eyebrow">${tr('FULL JOURNEY', 'الرحلة كاملة')}</span><h2 id="dialog-title">${owned ? tr('The road is open', 'الطريق مفتوح') : tr('The road goes on', 'الطريق يمتدّ')}</h2>
 <p>${tr('Your company has held the first two chapters. Full Journey opens the rest of the tale.', 'صمدت سريّتك في الفصلين الأوّلين. الرحلة كاملة تفتح بقيّة الحكاية.')}</p>
 <ul class="full-journey-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>
 <p id="full-journey-status" class="save-note" role="status">${fullJourneyStatus(bridge)}</p>
 <div class="full-journey-actions">${owned
    ? `<button class="big-button green" data-command="close">${tr('Onward', 'إلى الأمام')}</button>`
    : `<button class="big-button green" data-command="buy-full-journey" aria-label="${buyAria}" ${busy ? 'disabled' : ''}>${buyLabel}</button>
 <button class="big-button secondary" data-command="restore-purchases" ${busy ? 'disabled' : ''}>${tr('Restore purchases', 'استعادة المشتريات')}</button>
 <button class="big-button secondary" data-command="close">${tr('Not now', 'ليس الآن')}</button>`}</div>
 <p class="full-journey-legal"><button class="link-button" data-command="open-terms">${tr('Terms of Use', 'شروط الاستخدام')}</button> · <button class="link-button" data-command="open-privacy">${tr('Privacy', 'الخصوصية')}</button></p>`;
}
