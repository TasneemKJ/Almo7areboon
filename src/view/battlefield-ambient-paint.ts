import type Phaser from 'phaser';
import type {atmosphereFrame} from './era-atmosphere.ts';

/** Fireflies, starlight, gulls, leaves and embers drifting over the scene, painted as plain strokes and discs. */
export function paintAmbientMarks(g:Phaser.GameObjects.Graphics,marks:ReturnType<typeof atmosphereFrame>):void {
 for(const mark of marks){
    if(mark.kind==='firefly'||mark.kind==='starlight'){
     g.fillStyle(mark.color,mark.alpha*.09);g.fillCircle(mark.x,mark.y,mark.size*4.2);
     g.fillStyle(mark.color,mark.alpha*.24);g.fillCircle(mark.x,mark.y,mark.size*2.1);
     g.fillStyle(mark.color,mark.alpha);g.fillCircle(mark.x,mark.y,mark.size*.72);
     if(mark.kind==='starlight'){g.lineStyle(.8,mark.color,mark.alpha*.72);g.lineBetween(mark.x-mark.size*1.7,mark.y,mark.x+mark.size*1.7,mark.y);g.lineBetween(mark.x,mark.y-mark.size*1.7,mark.x,mark.y+mark.size*1.7);}
    }else if(mark.kind==='gull'){
     const wing=mark.size,tilt=Math.sin(mark.angle);g.lineStyle(1.4,mark.color,mark.alpha);
     g.lineBetween(mark.x-wing,mark.y+tilt*wing,mark.x,mark.y-wing*.28);g.lineBetween(mark.x,mark.y-wing*.28,mark.x+wing,mark.y-tilt*wing);
    }else if(mark.kind==='leaf'){
     const dx=Math.cos(mark.angle)*mark.size*1.7,dy=Math.sin(mark.angle)*mark.size*1.7;
     g.lineStyle(1.1,mark.color,mark.alpha*.7);g.lineBetween(mark.x-dx,mark.y-dy,mark.x+dx,mark.y+dy);
     g.fillStyle(mark.color,mark.alpha*.78);g.fillCircle(mark.x,mark.y,mark.size*.75);
    }else{
     const dx=Math.cos(mark.angle)*mark.size*2,dy=Math.sin(mark.angle)*mark.size*2;
     if(mark.kind==='ember'){g.fillStyle(mark.color,mark.alpha*.14);g.fillCircle(mark.x,mark.y,mark.size*2.4);}
     g.lineStyle(mark.kind==='ember'?1.9:1.15,mark.color,mark.alpha);g.lineBetween(mark.x-dx,mark.y-dy,mark.x+dx,mark.y+dy);
     if(mark.kind==='ember'){g.fillStyle(0xffe6a3,mark.alpha*.82);g.fillCircle(mark.x+dx*.35,mark.y+dy*.35,mark.size*.5);}
    }
 }
}
