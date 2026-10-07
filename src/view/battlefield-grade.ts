import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {foregroundPlacement,landscapePlacement} from './visual-theme.ts';
import {baseTexture,foregroundTexture,landscapeTexture,unitTexture} from './visual-assets.ts';
import {VIGNETTE_RADIUS,eraGrade,gradeMatrix,gradePixels,keyLightRays,vignetteStops} from './cinematic-grade.ts';
import type {Layout} from './battlefield-types.ts';

/**
 * Static key-light rays and the stage vignette, painted into the art in its own source space
 * (map: world to source). Baked because full-screen blended layers cost ~5 fps each on fill-limited GPUs.
 */
function finishStage(ctx:CanvasRenderingContext2D,age:number,map:{x:number;y:number;kx:number;ky:number},layout:Layout):void {
   const sx=(x:number)=>(x-map.x)*map.kx,sy=(y:number)=>(y-map.y)*map.ky,h=layout.height,{groundY}=layout;
   const rgba=(color:number,alpha:number)=>`rgba(${color>>16&255},${color>>8&255},${color&255},${alpha})`;
   ctx.save();ctx.globalCompositeOperation='lighter';
   for(const ray of keyLightRays(age,groundY,0,true)){ctx.fillStyle=rgba(ray.color,ray.alpha);ctx.beginPath();ctx.moveTo(sx(ray.x1),sy(ray.y1));ctx.lineTo(sx(ray.x2),sy(ray.y2));ctx.lineTo(sx(ray.x3),sy(ray.y3));ctx.closePath();ctx.fill();}
   ctx.restore();ctx.save();ctx.globalCompositeOperation='source-atop';
   const {center,stops,floor,color}=vignetteStops(age),rx=VIGNETTE_RADIUS/256*450*map.kx,ry=VIGNETTE_RADIUS/256*h*map.ky;
   ctx.translate(sx(center.x*450),sy(center.y*h));ctx.scale(1,ry/rx);
   const radial=ctx.createRadialGradient(0,0,0,0,0,rx);for(const [at,alpha]of stops)radial.addColorStop(at,rgba(color,alpha));
   ctx.fillStyle=radial;ctx.fillRect(-4*rx,-4*rx,8*rx,8*rx);
   ctx.setTransform(1,0,0,1,0,0);
   const base=ctx.createLinearGradient(0,sy((center.y+40/256)*h),0,sy(h));base.addColorStop(0,rgba(color,0));base.addColorStop(1,rgba(color,floor));
   ctx.fillStyle=base;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
   ctx.restore();
}
/**
 * Bakes the chapter grade into its static art once: no per-frame post pass, and Canvas and WebGL match.
 * Frames are sub-rectangles of the same source, so sprite sheets keep their cells. A tainted or
 * unavailable canvas leaves the art ungraded rather than failing.
 */
export function bakeGrade(scene:Phaser.Scene,graded:Set<string>,layout:Layout,age:number):void {
   // The storybook paintings already contain their authored lighting and paper texture.
   if(storybookArt(age))return;
   const matrix=gradeMatrix(eraGrade(age));
   const keys=[landscapeTexture(age),foregroundTexture(age)];
   for(const side of ['player','enemy'] as const){keys.push(baseTexture(age,side));for(const kind of [0,1,2] as const)keys.push(unitTexture(age,kind,side));}
   for(const key of keys){
    if(graded.has(key)||!scene.textures.exists(key))continue;
    graded.add(key);
    const source=scene.textures.get(key).source[0],image=source?.image as CanvasImageSource|undefined;
    if(!source||!image||!source.width||!source.height)continue;
    try{
     const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)continue;
     ctx.drawImage(image,0,0);
     const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);gradePixels(pixels.data,matrix);ctx.putImageData(pixels,0,0);
     if(key===landscapeTexture(age)){const w=landscapePlacement(450,layout.height,layout.groundY);finishStage(ctx,age,{x:w.x,y:w.y,kx:1/w.scale,ky:1/w.scale},layout);}
     if(key===foregroundTexture(age)){const f=foregroundPlacement(450,layout.height,layout.groundY);finishStage(ctx,age,{x:f.x,y:f.y,kx:canvas.width/f.width,ky:canvas.height/f.height},layout);}
     source.image=canvas;source.source=canvas;source.isCanvas=true;
     const renderer=scene.renderer;
     if(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer&&source.glTexture)renderer.updateCanvasTexture(canvas,source.glTexture,source.flipY);
    }catch{/* keep the ungraded, still-lit art */}
   }
}
