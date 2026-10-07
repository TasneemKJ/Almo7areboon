import {createFieldController} from '../ui/field-controller.ts';
import { appShellHtml } from '../ui/app-shell.ts';
import { unitPortrait } from '../view/unit-illustrations.ts';
import { icon } from '../view/icons.ts';
import { createArmyUpdater } from '../ui/army-screen.ts';
import { compactNumber } from '../ui/battle-hud.ts';
import { createModalIsolation } from '../ui/accessibility.ts';
import { createLifetime } from '../ui/lifetime.ts';
import { createModalTapGuard } from '../ui/modal-tap-guard.ts';
import type { Profile } from '../game/types.ts';

/** Builds the shell DOM and the handles every module shares (mount, lifetime, lookup, formatting, controllers). */
export function createRuntime(profile: Profile) {
  const mount=document.querySelector<HTMLDivElement>('#app');
  if(!mount)throw new Error('The game mount element is missing.');
  const root:HTMLDivElement=mount;
  root.dataset.fieldMode='field';
  const lifetime=createLifetime();
  const blockModalTap=createModalTapGuard();
  const money=(value:number)=>value>=10000?compactNumber(value):Math.floor(value).toLocaleString('en-US');
  const coin=(value:number)=>`${icon('coin')}<span>${money(value)}</span>`;
  root.innerHTML = appShellHtml(profile);
  const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  const updateArmy=createArmyUpdater({units:$('unit-cards'),skills:$('battle-skills'),stages:$('stage-progress')},unitPortrait,money);
  const isolateModal=createModalIsolation($('modal-layer'));
  const fieldControls=createFieldController(root);
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  return { root, lifetime, blockModalTap, money, coin, $, updateArmy, isolateModal, fieldControls, motionQuery };
}

export type Runtime = ReturnType<typeof createRuntime>;
