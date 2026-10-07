import type Phaser from 'phaser';
import type {atmosphereFrame} from './era-atmosphere.ts';

/** Fireflies, starlight, gulls, leaves and embers drifting over the scene, painted as plain strokes and discs. */
export function paintAmbientMarks(g:Phaser.GameObjects.Graphics,marks:ReturnType<typeof atmosphereFrame>):void {
 for(const mark of marks){
    if(mark.kind==='firefly'||mark.kind==='starlight'){
     g.fillStyle(mark.color,mark.alpha*.16);g.fillCircle(mark.x,mark.y,mark.size*2.5);
     g.fillStyle(mark.color,mark.alpha);g.fillCircle(mark.x,mark.y,mark.size*.65);
     if(mark.kind==='starlight'){g.lineStyle(.8,mark.color,mark.alpha*.65);g.lineBetween(mark.x-mark.size*1.5,mark.y,mark.x+mark.size*1.5,mark.y);g.lineBetween(mark.x,mark.y-mark.size*1.5,mark.x,mark.y+mark.size*1.5);}
    }else if(mark.kind==='gull'){
     const wing=mark.size,tilt=Math.sin(mark.angle);g.lineStyle(1.35,mark.color,mark.alpha);
     g.lineBetween(mark.x-wing,mark.y+tilt*wing,mark.x,mark.y-wing*.28);g.lineBetween(mark.x,mark.y-wing*.28,mark.x+wing,mark.y-tilt*wing);
    }else if(mark.kind==='leaf'){
     const dx=Math.cos(mark.angle)*mark.size*1.7,dy=Math.sin(mark.angle)*mark.size*1.7;
     g.lineStyle(1,mark.color,mark.alpha*.65);g.lineBetween(mark.x-dx,mark.y-dy,mark.x+dx,mark.y+dy);
     g.fillStyle(mark.color,mark.alpha*.72);g.fillCircle(mark.x,mark.y,mark.size*.7);
    }else{
     const dx=Math.cos(mark.angle)*mark.size*2,dy=Math.sin(mark.angle)*mark.size*2;
     g.lineStyle(mark.kind==='ember'?1.8:1.1,mark.color,mark.alpha);g.lineBetween(mark.x-dx,mark.y-dy,mark.x+dx,mark.y+dy);
     if(mark.kind==='ember'){g.fillStyle(0xffe6a3,mark.alpha*.75);g.fillCircle(mark.x+dx*.35,mark.y+dy*.35,mark.size*.45);}
    }
 }
}
