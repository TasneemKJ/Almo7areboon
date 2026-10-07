import Phaser from 'phaser';
import {battleResolution} from './render-resolution.ts';
import {battlefieldRendererMode} from './renderer-policy.ts';
import {createBattlefieldScene,type SceneHost} from './battlefield-scene.ts';
import {installReviewHooks} from './battlefield-review.ts';
import type {GameEvent,GamePort} from '../game/types';

/** Mounts the Phaser battlefield into `element`; the scene and its collaborators live in the sibling battlefield-* modules. */
export function mountBattlefield(element:HTMLElement,game:GamePort,onFrame:(force?:boolean)=>void,onEvents:(events:GameEvent[])=>void,options:SceneHost['options']={}):{destroy():void} {
 let disposed=false;
 const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
 const loading=document.createElement('div');loading.className='world-loader';loading.setAttribute('role','status');loading.textContent='Preparing the battlefield…';element.append(loading);
 let renderer:Phaser.Game;
 const pixelRatio=battleResolution(window.devicePixelRatio);
 try{
  renderer=new Phaser.Game({type:battlefieldRendererMode(navigator.userAgent)==='canvas'?Phaser.CANVAS:Phaser.AUTO,parent:element,width:(element.clientWidth||450)*pixelRatio,height:(element.clientHeight||430)*pixelRatio,transparent:true,antialias:true,render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.NONE,zoom:1/pixelRatio,autoCenter:Phaser.Scale.NO_CENTER},scene:[createBattlefieldScene({element,game,onFrame,onEvents,options,isDisposed:()=>disposed,motionQuery,loading,pixelRatio})],audio:{noAudio:true},fps:{target:60},banner:false});
 }catch(error){loading.textContent='The battlefield could not start. Reload or try another browser.';throw error;}
 if(navigator.webdriver)installReviewHooks(renderer);
 renderer.canvas.setAttribute('role','img');renderer.canvas.setAttribute('aria-label','Illustrated battlefield. Blue warriors attack the red enemy base.');
 const observer=new ResizeObserver(()=>{if(!disposed&&element.clientWidth>0&&element.clientHeight>0)renderer.scale.resize(Math.round(element.clientWidth*pixelRatio),Math.round(element.clientHeight*pixelRatio));});observer.observe(element);
 return {destroy(){if(disposed)return;disposed=true;observer.disconnect();loading.remove();renderer.destroy(true);}};
}
