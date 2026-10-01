import {waveAccessibleLabel} from './battle-hud.ts';
import type {MissionObjective} from '../game/chronicle.ts';
import type { WaveStatus } from '../game/encounters.ts';

/** A paused snapshot of the authoritative schedule, not another encounter or reward system. */
export function waveInspectionHtml(status: Readonly<WaveStatus>,objective?:MissionObjective): string {
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
