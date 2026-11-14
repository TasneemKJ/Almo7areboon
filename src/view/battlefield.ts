import {tr} from '../game/locale.ts';
import Phaser from 'phaser';
import {createDensityGovernor} from './render-resolution.ts';
import {battlefieldRendererMode} from './renderer-policy.ts';
import {createBattlefieldScene,type SceneHost} from './battlefield-scene.ts';
import {installReviewHooks} from './battlefield-review.ts';
import type {GameEvent,GamePort} from '../game/types';

/** Mounts the Phaser battlefield into `element`; the scene and its collaborators live in the sibling battlefield-* modules. */
export function mountBattlefield(element:HTMLElement,game:GamePort,onFrame:(force?:boolean)=>void,onEvents:(events:GameEvent[])=>void,options:SceneHost['options']={}):{destroy():void} {
 let disposed=false;
 const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
 const loading=document.createElement('div');loading.className='world-loader';loading.setAttribute('role','status');loading.textContent=tr('Preparing the battlefield…','نهيّئ ساحة المعركة…');element.append(loading);
 let renderer:Phaser.Game;
 const governor=createDensityGovernor(window.devicePixelRatio);let pixelRatio=governor.density;
 try{
  renderer=new Phaser.Game({type:battlefieldRendererMode(navigator.userAgent)==='canvas'?Phaser.CANVAS:Phaser.AUTO,parent:element,width:(element.clientWidth||450)*pixelRatio,height:(element.clientHeight||430)*pixelRatio,transparent:true,antialias:true,render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.NONE,zoom:1/pixelRatio,autoCenter:Phaser.Scale.NO_CENTER},scene:[createBattlefieldScene({element,game,onFrame,onEvents,options,isDisposed:()=>disposed,motionQuery,loading,get pixelRatio(){return pixelRatio;}})],audio:{noAudio:true},fps:{target:60},banner:false});
 }catch(error){loading.textContent=tr('The battlefield could not start. Reload or try another browser.','تعذّر فتح ساحة المعركة. أعد التحميل أو جرّب متصفّحاً آخر.');throw error;}
 if(navigator.webdriver)installReviewHooks(renderer);
 renderer.canvas.setAttribute('role','img');renderer.canvas.setAttribute('aria-label',tr('Illustrated battlefield. Blue warriors attack the red enemy base.','ساحة معركة مرسومة. المحاربون الزُّرق يهاجمون حصن العدوّ الأحمر.'));
 const fit=()=>{if(!disposed&&element.clientWidth>0&&element.clientHeight>0)renderer.scale.resize(Math.round(element.clientWidth*pixelRatio),Math.round(element.clientHeight*pixelRatio));};
 const observer=new ResizeObserver(fit);observer.observe(element);
 // A quiet step-down only past 20 ms frames (render-resolution.ts): the same picture, half a density lighter.
 renderer.events.on('step',(_time:number,delta:number)=>{const next=governor.frame(delta);if(next===null||disposed)return;pixelRatio=next;renderer.scale.setZoom(1/pixelRatio);fit();});
 return {destroy(){if(disposed)return;disposed=true;observer.disconnect();loading.remove();renderer.destroy(true);}};
}
