

import {createFieldController} from '../ui/field-controller.ts';
import { appShellHtml } from '../ui/app-shell.ts';
import { unitPortrait } from '../view/unit-illustrations.ts';
import { icon } from '../view/icons.ts';
import { createArmyUpdater } from '../ui/army-screen.ts';
import { compactNumber } from '../ui/battle-hud.ts';
import { createModalIsolation } from '../ui/accessibility.ts';
import { createLifetime } from '../ui/lifetime.ts';
import { createModalTapGuard } from '../ui/modal-tap-guard.ts';
import { app } from './state.ts';

const mount=document.querySelector<HTMLDivElement>('#app');
if(!mount)throw new Error('The game mount element is missing.');
export const root:HTMLDivElement=mount;
root.dataset.fieldMode='field';
export const lifetime=createLifetime();
export const blockModalTap=createModalTapGuard();
export const money=(value:number)=>value>=10000?compactNumber(value):Math.floor(value).toLocaleString('en-US');
export const coin=(value:number)=>`${icon('coin')}<span>${money(value)}</span>`;
root.innerHTML = appShellHtml(app.game.profile);
export const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export const updateArmy=createArmyUpdater({units:$('unit-cards'),skills:$('battle-skills'),stages:$('stage-progress')},unitPortrait,money);
export const isolateModal=createModalIsolation($('modal-layer'));
export const fieldControls=createFieldController(root);
export const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
