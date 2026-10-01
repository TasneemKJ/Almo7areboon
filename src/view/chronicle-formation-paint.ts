import {chronicleThreadStyle,type ChronicleFormationFrame} from './chronicle-formation.ts';

export interface FormationPainter {
 lineStyle(width:number,colour:number,alpha?:number):unknown;
 lineBetween(x1:number,y1:number,x2:number,y2:number):unknown;
 beginPath():unknown;moveTo(x:number,y:number):unknown;lineTo(x:number,y:number):unknown;strokePath():unknown;
 fillStyle(colour:number,alpha?:number):unknown;fillEllipse(x:number,y:number,width:number,height:number):unknown;
 fillTriangle(x1:number,y1:number,x2:number,y2:number,x3:number,y3:number):unknown;
 strokeEllipse(x:number,y:number,width:number,height:number):unknown;fillCircle(x:number,y:number,radius:number):unknown;
}

/** Executes the actual bounded Phaser drawing grammar through an inspectable painter boundary. */
export function paintChronicleFormation(layers:readonly FormationPainter[],frame:ChronicleFormationFrame,groundY:number,laneGap:number):void {
 for(const link of frame.links){
  const layer=layers[Math.min(link.targetLane,link.protectorLane)];if(!layer)continue;
  const style=chronicleThreadStyle(link.side,link.status),x1=link.targetX*.45,y1=groundY+link.targetLane*laneGap+3,x2=link.protectorX*.45,y2=groundY+link.protectorLane*laneGap+3;
  if(link.status==='breached'){
   layer.lineStyle(1.35,style.colour,.78);for(const [a,b] of [[0,.21],[.39,.59],[.78,1]])layer.lineBetween(x1+(x2-x1)*a,y1+(y2-y1)*a,x1+(x2-x1)*b,y1+(y2-y1)*b);
   if(style.glyph==='split'){layer.lineBetween(x1-4,y1-3,x1,y1+1);layer.lineBetween(x1,y1+1,x1+4,y1-3);}else{layer.lineBetween(x1-3,y1-3,x1+3,y1+2);layer.lineBetween(x1+3,y1-3,x1-3,y1+2);}
  }else{
   layer.lineStyle(1.15,style.colour,.58);layer.beginPath();layer.moveTo(x1,y1);layer.lineTo((x1+x2)/2,(y1+y2)/2+4);layer.lineTo(x2,y2);layer.strokePath();
   const mx=(x1+x2)/2,my=(y1+y2)/2+2;layer.fillStyle(style.colour,.72);
   if(style.glyph==='leaves'){layer.fillEllipse(mx-2,my,4,2);layer.fillEllipse(mx+2,my-2,4,2);}else layer.fillTriangle(mx,my-3,mx+3,my+1,mx-3,my+1);
   layer.lineStyle(1.1,style.colour,.82);layer.strokeEllipse(x1,y1,10,5);
  }
 }
 for(const rally of frame.rally){
  const layer=layers[rally.holdLane];if(!layer)continue;const x1=rally.unitX*.45,y=groundY+rally.holdLane*laneGap+4,x2=rally.holdX*.45;
  layer.lineStyle(.9,0xd8bc7d,.44);if(Math.abs(x2-x1)>4)for(let i=0;i<3;i++){const a=i/3+.05,b=Math.min(1,a+.14);layer.lineBetween(x1+(x2-x1)*a,y,x1+(x2-x1)*b,y);}
  layer.lineStyle(1.1,0xe4c894,.78);layer.strokeEllipse(x2,y,9,5);layer.fillStyle(0xd8bc7d,.72);layer.fillCircle(x1,y,1.8);
 }
}
