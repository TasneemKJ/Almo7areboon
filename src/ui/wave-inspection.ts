import {waveAccessibleLabel} from './battle-hud.ts';
import type {MissionObjective} from '../game/chronicle.ts';
import type { WaveStatus } from '../game/encounters.ts';
import {counted,intentName,secondsLong} from './battle-hud.ts';
import {isArabic,n} from './i18n.ts';

/** A paused snapshot of the authoritative schedule, not another encounter or reward system. */
export function waveInspectionHtml(status: Readonly<WaveStatus>,objective?:MissionObjective): string {
  if (isArabic()) return arabicWaveInspectionHtml(status, objective);
  const wave = status.preview;
  const title = wave ? `Next wave: ${wave.intent[0].toUpperCase()}${wave.intent.slice(1)}` : 'The final watch';
  const current = `${status.enemiesRemaining} living ${status.enemiesRemaining === 1 ? 'enemy' : 'enemies'} on the field.`;
  const counter = wave?.intent === 'volley' ? 'Melee guards take less damage from ranged enemies. Keep your ranged troops behind a front line.'
    : wave?.intent === 'bulwark' ? 'Ranged troops deal extra damage to heavy enemies. Protect them with melee or heavy troops.'
    : 'Send warriors together. Heavy troops can hit a second nearby enemy.';
  const pending = status.pendingEnemies > 0 ? `<p>${status.pendingEnemies} ${status.pendingEnemies === 1 ? 'member is' : 'members are'} still incoming from an earlier wave.</p>` : '';
  const next = wave ? `<p>Wave ${wave.number} of ${wave.total}: ${wave.counts.flatMap((count, kind) => count ? [`${count} ${['melee', 'ranged', 'heavy'][kind]}`] : []).join(', ')}.</p><p>This wave's first arrival is in ${Math.ceil(wave.nextIn)} battle seconds. Members may arrive in a staggered group.</p>${pending}<p>${counter}</p><p>${current}</p>`
    : status.pendingEnemies > 0 ? `<p>${status.pendingEnemies} ${status.pendingEnemies === 1 ? 'enemy still incoming' : 'enemies still incoming'} from the final wave. ${current}</p>`
    : status.enemiesRemaining > 0 ? `<p>All waves have arrived. ${current} Protect your front line until they are defeated.</p>`
    : objective&&objective!=='siege'?`<p>No living enemies remain. ${waveAccessibleLabel(status,objective)}</p>`:'<p>No living enemies remain. Your army can attack the enemy base.</p>';
  return `<span class="eyebrow">FIELD NOTES</span><h2 id="dialog-title">${title}</h2>${next}<p>Viewing these notes pauses battle time. Close to return; any manual pause stays.</p><button class="big-button secondary" data-command="close">RETURN TO BATTLE</button>`;
}

const enemies = (count: number) => counted(count, ['enemy', 'enemies'], ['عدوّ واحد', 'عدوّان', 'أعداء', 'عدوّاً'], n);

/** The same field notes in Arabic, written as Arabic sentences rather than the English word order. */
function arabicWaveInspectionHtml(status: Readonly<WaveStatus>, objective?: MissionObjective): string {
  const wave = status.preview;
  const title = wave ? `الموجة التالية: ${intentName(wave.intent)}` : 'الحراسة الأخيرة';
  const current = status.enemiesRemaining === 0 ? 'لا أعداء أحياء في الميدان.' : `في الميدان ${counted(status.enemiesRemaining, ['enemy', 'enemies'], ['عدوّ واحد حيّ', 'عدوّان حيّان', 'أعداء أحياء', 'عدوّاً حيّاً'], n)}.`;
  const counter = wave?.intent === 'volley' ? 'حرّاس القتال القريب يتلقّون ضرراً أقلّ من رماة العدوّ. أبقِ رماتك خلف خطّ أماميّ.'
    : wave?.intent === 'bulwark' ? 'الرماة يوقعون ضرراً إضافياً بالأعداء الثقال. احمِهم بجند القتال القريب أو الثقال.'
    : 'أرسل محاربيك معاً. الجنديّ الثقيل يصيب عدوّاً ثانياً قريباً.';
  const pending = status.pendingEnemies > 0 ? `<p>ما زال ${enemies(status.pendingEnemies)} من موجة سابقة في الطريق.</p>` : '';
  const roles = ['قتال قريب', 'رماية', 'ثقيل'];
  const next = wave ? `<p>الموجة ${n(wave.number)} من ${n(wave.total)}: ${wave.counts.flatMap((count, kind) => count ? [`${roles[kind]}: ${n(count)}`] : []).join('، ')}.</p><p>يصل أوّل أفراد هذه الموجة بعد ${secondsLong(Math.ceil(wave.nextIn), n)} من وقت المعركة. قد يصل الباقون متتابعين.</p>${pending}<p>${counter}</p><p>${current}</p>`
    : status.pendingEnemies > 0 ? `<p>ما زال ${enemies(status.pendingEnemies)} من الموجة الأخيرة في الطريق. ${current}</p>`
    : status.enemiesRemaining > 0 ? `<p>وصلت الموجات كلّها. ${current} احمِ خطّك الأماميّ حتى تهزمهم.</p>`
    : objective && objective !== 'siege' ? `<p>لم يبقَ أعداء أحياء. ${waveAccessibleLabel(status, objective)}</p>` : '<p>لم يبقَ أعداء أحياء. يستطيع جيشك مهاجمة حصن العدوّ.</p>';
  return `<span class="eyebrow">ملاحظات الميدان</span><h2 id="dialog-title">${title}</h2>${next}<p>قراءة هذه الملاحظات توقف وقت المعركة. أغلقها لتعود، وأيّ إيقاف يدويّ يبقى كما هو.</p><button class="big-button secondary" data-command="close">عُد إلى المعركة</button>`;
}
