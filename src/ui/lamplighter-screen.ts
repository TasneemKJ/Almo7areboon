import type { TasBridge } from './app-bridge.ts';
import { LAMPLIGHTER_MONTHLY, LAMPLIGHTER_YEARLY, lamplighterPlan } from './app-bridge.ts';
import { n, tr } from './i18n.ts';

type Store = Pick<TasBridge, 'inApp' | 'owned' | 'status' | 'prices'>;

/** The one line under the buttons for the store's state. */
export function lamplighterStatus(bridge: Store): string {
  if (lamplighterPlan(bridge)) return tr('The Lamplighter lights the wall lamps each dusk and keeps the lanterns lit at your gate.', 'يُشعل مُشعِل القناديل قناديل السور كلّ غروب، ويُبقي القناديل مضاءة عند بوّابتك.');
  switch (bridge.status) {
    case 'buying': return tr('Opening the App Store…', 'جارٍ فتح متجر التطبيقات…');
    case 'pending': return tr('Waiting for approval. He joins you as soon as it is approved.', 'بانتظار الموافقة. ينضمّ إليك حالما تتمّ الموافقة.');
    case 'failed': return tr('The subscription did not go through. Nothing was charged; try again.', 'لم يكتمل الاشتراك ولم يُخصم شيء. حاول مرّة أخرى.');
    case 'unavailable': return tr('The App Store cannot be reached right now. Try again later.', 'تعذّر الوصول إلى متجر التطبيقات الآن. حاول لاحقاً.');
    case 'nothing': return tr('No earlier purchase was found for this Apple Account.', 'لم نجد شراءً سابقاً لهذا الحساب.');
    default: return '';
  }
}

/**
 * The Lamplighter (مُشعِل القناديل): an auto-renewing subscription, monthly or yearly. Each dusk he lights the village
 * wall's lamps, which opens one extra battle that day, the dusk raid (game/dusk-raid.ts, DESIGN.md #51): the player hangs
 * three lamps and raiders show only in their light. It is a different fight, never a stronger army, and it pays nothing.
 * He also keeps lanterns lit at the gate in every battle. Without him a player gets one raid as a sample. Opened from
 * Settings, or from the unlit wall lamps in Camp, in the app only.
 * The card says what he does, both lengths and prices, and how renewal and cancelling work before anything is paid
 * (App Review 3.1.2), with Restore, Manage subscription, Terms and Privacy on the same card.
 */
export function lamplighterHtml(bridge: Store): string {
  const live = lamplighterPlan(bridge) !== null;
  const busy = bridge.status === 'buying';
  const monthly = bridge.prices[LAMPLIGHTER_MONTHLY] || '';
  const yearly = bridge.prices[LAMPLIGHTER_YEARLY] || '';
  const plan = (command: string, label: string, price: string, per: string, aria: string, cls: string) =>
    `<button class="big-button ${cls}" data-command="${command}" aria-label="${aria}" ${busy ? 'disabled' : ''}>${label}${price ? ` · ${n(price)} ${per}` : ''}</button>`;
  const items = [
    tr('Each dusk he lights the lamps on the village wall, and one more battle comes out of the dark: the dusk raid, once a day', 'كلّ غروب يُشعل قناديل سور القرية، فتخرج من الظلام معركةٌ أخرى: غارة الغسق، مرّةً كلّ يوم'),
    tr('You hang three lamps on the field, and the raiders show only in their light. A different fight, not a stronger army', 'تعلّق ثلاثة قناديل في الساحة، فلا يظهر المغيرون إلا في نورها. قتالٌ آخر، لا جيشٌ أقوى'),
    tr('He also keeps the lanterns lit at your gate in every battle', 'ويُبقي القناديل مضاءة عند بوّابتك في كلّ معركة'),
    tr('He does not fight, and gives no food, coins or strength; the raid earns none either. Without him, the wall lamps are lit once, as a sample.', 'لا يقاتل، ولا يعطي مؤونةً ولا نقوداً ولا قوّة، ولا تكسب الغارة شيئاً منها. ومن دونه تُشعَل قناديل السور مرّةً واحدة للتجربة.'),
  ];
  const actions = live
    ? `<button class="big-button green" data-command="close">${tr('Onward', 'إلى الأمام')}</button>
 <button class="big-button secondary" data-command="manage-subscriptions">${tr('Manage subscription', 'إدارة الاشتراك')}</button>`
    : `${plan('buy-lamplighter-yearly', tr('Yearly', 'سنوياً'), yearly, tr('a year', 'في السنة'),
        yearly ? tr(`Subscribe yearly to the Lamplighter for ${yearly} a year`, `اشترك سنوياً بمُشعِل القناديل بسعر ${yearly} في السنة`) : tr('Subscribe yearly to the Lamplighter', 'اشترك سنوياً بمُشعِل القناديل'), 'green')}
 ${plan('buy-lamplighter-monthly', tr('Monthly', 'شهرياً'), monthly, tr('a month', 'في الشهر'),
        monthly ? tr(`Subscribe monthly to the Lamplighter for ${monthly} a month`, `اشترك شهرياً بمُشعِل القناديل بسعر ${monthly} في الشهر`) : tr('Subscribe monthly to the Lamplighter', 'اشترك شهرياً بمُشعِل القناديل'), 'blue')}
 <button class="big-button secondary" data-command="restore-purchases" ${busy ? 'disabled' : ''}>${tr('Restore purchases', 'استعادة المشتريات')}</button>
 <button class="big-button secondary" data-command="close">${tr('Not now', 'ليس الآن')}</button>`;
  return `<span class="eyebrow">${tr('THE LAMPLIGHTER', 'مُشعِل القناديل')}</span><h2 id="dialog-title">${tr('A lamp for the road', 'قنديلٌ للطريق')}</h2>
 <p>${tr('At dusk an old lamplighter walks the valley. Subscribe, and he lights the wall lamps for a raid each evening.', 'عند الغروب يمشي مُشعِل قناديل عجوز في الوادي. اشترك، فيُشعل قناديل السور لغارةٍ كلّ مساء.')}</p>
 <ul class="full-journey-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>
 <p id="lamplighter-status" class="save-note" role="status">${lamplighterStatus(bridge)}</p>
 <div class="full-journey-actions">${actions}</div>
 <p class="full-journey-renewal">${tr('Payment is charged to your Apple Account. The subscription renews automatically unless you cancel it at least 24 hours before the end of the period. Manage or cancel it any time in your Apple Account settings.', 'يُخصم المبلغ من حساب Apple الخاص بك. يتجدّد الاشتراك تلقائياً ما لم تلغه قبل نهاية المدّة بأربع وعشرين ساعة على الأقل. تستطيع إدارته أو إلغاءه متى شئت من إعدادات حساب Apple.')}</p>
 <p class="full-journey-legal"><button class="link-button" data-command="open-terms">${tr('Terms of Use', 'شروط الاستخدام')}</button> · <button class="link-button" data-command="open-privacy">${tr('Privacy', 'الخصوصية')}</button></p>`;
}
