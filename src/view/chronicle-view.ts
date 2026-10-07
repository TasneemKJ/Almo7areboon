import Phaser from 'phaser';
import type {Profile,BattleState} from '../game/types.ts';
import {chronicleActorDepth,chroniclePaintPalette as P,bellMotion,chronicleMaterial,chronicleAttachmentDepth} from './chronicle-presentation.ts';
import {chronicleFormationFrame,chronicleThreadDepth} from './chronicle-formation.ts';
import {paintChronicleFormation} from './chronicle-formation-paint.ts';
import {chronicleRescueFrame,chronicleRescueRenderPlan} from './chronicle-rescue.ts';
import {chronicleCatFrame,chronicleCatRenderPlan} from './chronicle-cat.ts';
import {chronicleLandmarkStatus} from '../game/chronicle-combat.ts';
import {chronicleLandmarkFrame,chronicleLandmarkRenderPlan} from './chronicle-landmark.ts';
import {troopScale} from './lane-perspective.ts';
import {TROOP_FRAME} from './unit-illustrations.ts';
import {drawTroop} from './art.ts';
type Prop='cart'|'lantern'|'cage'|'cage-open'|'bell'|'supply';
/** Small prepainted props reuse the storybook material grammar; they never own combat. */
function paintedProp(scene:Phaser.Scene,kind:Prop):string {
  const key=`chronicle-${kind}-ink-v1`;if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,240,192);if(!texture)return '__WHITE';
  const c=texture.getContext();c.lineCap='round';c.lineJoin='round';
  function pigment(fill:string,x:number,y:number,w:number,h:number){const [light,mid,shadow]=chronicleMaterial(fill),wash=c.createLinearGradient(x,y,x+w*.72,y+h);wash.addColorStop(0,light);wash.addColorStop(.38,mid);wash.addColorStop(1,shadow);return wash;}
  function path(points:number[][],fill:string,close=true,width=4){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);c.fillStyle=pigment(fill,Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));if(close)c.fill();c.strokeStyle='#37372e';c.lineWidth=width;c.stroke();}
  function oval(x:number,y:number,rx:number,ry:number,fill:string,stroke=true){c.beginPath();c.ellipse(x,y,rx,ry,-.08,0,Math.PI*2);c.fillStyle=pigment(fill,x-rx,y-ry,rx*2,ry*2);c.fill();if(stroke){c.strokeStyle='#37372e';c.lineWidth=3;c.stroke();}}
  if(kind==='cart'||kind==='supply'){
    path([[27,111],[196,115],[185,147],[40,143]],P.wood);
    path([[36,115],[27,99],[53,99],[58,144]],P.wood);
    path([[180,117],[195,105],[219,108]],P.wood,false);
    oval(63,150,18,20,P.ink);oval(164,154,19,21,P.ink);oval(63,150,13,15,P.wood);oval(164,154,14,16,P.wood);
    for(let i=0;i<4;i++)path([[42,118+i*6],[183,121+i*6]],'#523e2c',false,1);
    for(const x of [63,164]){path([[x-12,150],[x+12,151]],P.ink,false,2);path([[x,138],[x,163]],P.ink,false,2);oval(x,151,3,3,P.ink,false);}
    for(const [x,y,rx,ry] of [[81,83,32,37],[131,87,29,32],[161,99,22,20]]){
      oval(x,y,rx,ry,P.linen);path([[x-13,y-27],[x-4,y-33],[x+10,y-29],[x+16,y-34]],P.teal);path([[x-17,y-15],[x-20,y+8],[x-13,y+22]],P.wood,false,2);
      c.strokeStyle='#a28b60';c.lineWidth=.8;for(let j=0;j<6;j++){c.beginPath();c.moveTo(x-22+j*6,y-12);c.quadraticCurveTo(x-20+j*6,y+4,x-18+j*6,y+17);c.stroke();}
      c.strokeStyle='#6b7452';c.lineWidth=1.5;c.beginPath();c.moveTo(x+3,y+16);c.quadraticCurveTo(x-7,y,x+4,y-12);c.stroke();
      for(let j=0;j<4;j++){oval(x+(j%2?7:-1),y-9+j*5,4,1.7,'#8d8957',false);}
    }
    path([[38,113],[187,118],[183,130],[41,128]],P.wood);
    path([[84,108],[83,134]],P.teal,false,6);
    if(kind==='supply'){path([[174,70],[174,20]],P.wood,false,6);path([[176,20],[213,25],[207,45],[177,40]],P.teal);}
  }else if(kind==='lantern'){
    path([[98,166],[106,93],[112,60],[106,22],[122,20],[133,95],[143,165]],P.stone);
    path([[111,26],[159,28],[165,42]],P.wood,false,8);
    const glow=c.createRadialGradient(166,81,4,166,81,61);glow.addColorStop(0,'rgba(237,186,97,.65)');glow.addColorStop(1,'rgba(237,186,97,0)');c.fillStyle=glow;c.fillRect(99,25,135,121);
    path([[153,51],[178,53],[185,95],[150,94]],P.light);
    path([[150,49],[154,41],[175,43],[181,54]],P.teal);path([[150,96],[184,96],[177,103],[156,102]],P.wood);
    path([[165,55],[166,90]],P.wood,false,2);oval(166,82,4,9,P.linen,false);
    path([[89,168],[103,154],[141,156],[154,171]],P.stone);
  }else if(kind==='cage'||kind==='cage-open'){
    const open=kind==='cage-open';
    path([[53,153],[59,66],[111,42],[170,69],[180,154]],P.wood);
    path([[60,67],[109,48],[169,72],[172,146],[60,148]],P.teal);
    if(!open){oval(114,105,24,29,P.linen);oval(106,98,2,3,P.ink,false);oval(124,96,2,3,P.ink,false);path([[101,123],[115,129],[126,121]],P.wood,false,2);}
    for(const x of open?[72,95,137]:[72,95,137,160])path([[x,72],[x+2,148]],P.wood,false,6);
    if(open){path([[161,72],[211,91],[207,158],[177,148]],P.wood,false,7);path([[178,80],[178,148]],P.wood,false,5);path([[194,86],[192,153]],P.wood,false,5);}
    path([[48,152],[185,154]],P.wood,false,8);
  }else{
    path([[81,144],[94,125],[101,81],[126,61],[146,72],[154,119],[174,144]],P.light);
    oval(128,146,49,10,P.wood);oval(129,153,9,13,P.light);
    path([[105,86],[109,116]],P.linen,false,5);path([[126,61],[125,45],[140,40]],P.wood,false,6);
    path([[119,87],[130,96],[124,108],[137,119]],P.wood,false,2);
  }
  // Fixed paper flecks clipped to paint: deterministic, one-time texture work.
  c.globalCompositeOperation='source-atop';
  let seed=739;for(let i=0;i<5100;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%240;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%192;c.fillStyle=i%3?'rgba(249,218,169,.13)':'rgba(44,37,24,.14)';c.fillRect(x,y,1+i%3,.7+i%2);}
  c.globalCompositeOperation='source-over';texture.refresh();return key;
}
export class ChronicleView {
  private landmark:Phaser.GameObjects.Image;
  private traveller:Phaser.GameObjects.Image;
  private cage:Phaser.GameObjects.Image;
  private scout:Phaser.GameObjects.Image;
  private scoutFallback:Phaser.GameObjects.Graphics;
  private scoutX=620*.45;
  private bell:Phaser.GameObjects.Image;
  private formation:Phaser.GameObjects.Graphics[]=[];
  private landmarkGround:Phaser.GameObjects.Graphics;
  private rescueGround:Phaser.GameObjects.Graphics;
  private catGround:Phaser.GameObjects.Graphics;
  private cat:Phaser.GameObjects.Graphics;
  private marks:Phaser.GameObjects.Graphics;
  private label:Phaser.GameObjects.Text;
  constructor(private scene:Phaser.Scene,layer:Phaser.GameObjects.Container){
    for(const kind of ['cart','lantern','cage','cage-open','bell','supply'] as const)paintedProp(scene,kind);
    this.landmark=scene.add.image(0,0,'chronicle-supply-ink-v1').setOrigin(.5,.91);
    this.traveller=scene.add.image(0,0,'chronicle-cart-ink-v1').setOrigin(.5,.91);
    this.cage=scene.add.image(0,0,'chronicle-cage-ink-v1').setOrigin(.5,.91);
    this.scout=scene.add.image(0,0,'__WHITE').setOrigin(.5,136/144);
    this.scoutFallback=scene.add.graphics();
    this.bell=scene.add.image(0,0,'chronicle-bell-ink-v1').setOrigin(.5,.83);
    for(let lane=0;lane<3;lane++)this.formation.push(scene.add.graphics());
    this.landmarkGround=scene.add.graphics();
    this.rescueGround=scene.add.graphics();
    this.catGround=scene.add.graphics();
    this.cat=scene.add.graphics();
    this.marks=scene.add.graphics();
    this.label=scene.add.text(0,0,'',{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:'10px',color:P.linen,stroke:P.ink,strokeThickness:3}).setOrigin(.5);
    layer.add([...this.formation,this.landmarkGround,this.rescueGround,this.catGround,this.landmark,this.traveller,this.cat,this.cage,this.scout,this.scoutFallback,this.bell,this.marks,this.label]);
  }
  update(p:Profile,s:BattleState,groundY:number,laneGap:number,reduced:boolean):void {
    const c=s.chronicle;this.marks.clear();this.landmarkGround.clear();this.rescueGround.clear();this.catGround.clear();this.cat.clear().setVisible(false);this.scoutFallback.clear().setVisible(false);for(let lane=0;lane<3;lane++)this.formation[lane].clear().setDepth(chronicleThreadDepth(groundY,lane,lane,laneGap));for(const image of [this.landmark,this.traveller,this.cage,this.scout,this.bell])image.setVisible(false);this.label.setVisible(false);delete this.scene.game.canvas.dataset.chronicleRescue;delete this.scene.game.canvas.dataset.chronicleLandmark;delete this.scene.game.canvas.dataset.chronicleCat;
    if(!c?.enabled)return;
    const g=this.marks;g.setDepth(groundY+laneGap*2+3);
    paintChronicleFormation(this.formation,chronicleFormationFrame(s),groundY,laneGap);
    this.updateLandmark(p,s,c,groundY,laneGap,reduced,g);
    this.updateEscort(p,s,c,groundY,laneGap,reduced,g);
    this.updateRescue(p,s,c,groundY,laneGap,reduced,g);
    this.updateCat(p,s,c,groundY,laneGap,reduced,g);
    this.updateBellAndMarks(p,s,c,groundY,laneGap,reduced,g);
  }
  private updateLandmark(p:Profile,s:BattleState,c:NonNullable<BattleState['chronicle']>,groundY:number,laneGap:number,reduced:boolean,g:Phaser.GameObjects.Graphics):void {
    if(c.landmark.kind!=='none'){
      const status=chronicleLandmarkStatus(p,s)!;
      const frame=chronicleLandmarkFrame(status),plan=chronicleLandmarkRenderPlan(groundY,frame,status.x),key=status.kind==='lantern'?'lantern':'supply';
      this.landmarkGround.setDepth(plan.groundDepth);
      if(frame.ownerShape==='ring'){this.landmarkGround.lineStyle(1.2,0x7c937d,.8);this.landmarkGround.strokeEllipse(plan.x,plan.y,30,6);}
      else if(frame.ownerShape==='corners'){this.landmarkGround.lineStyle(1.2,0xd3916d,.8);for(const sx of [-1,1])for(const sy of [-1,1]){this.landmarkGround.lineBetween(plan.x+sx*8,plan.y+sy*3,plan.x+sx*13,plan.y+sy*3);this.landmarkGround.lineBetween(plan.x+sx*13,plan.y,plan.x+sx*13,plan.y+sy*3);}}
      for(const mark of frame.marks){
        const x=plan.x+mark.x,y=plan.y+mark.y,colour=mark.active?(mark.side==='player'?0x7c937d:0xd3916d):0xd6b78c,alpha=mark.active?.95:.58;
        this.landmarkGround.lineStyle(mark.active?1.8:1.15,colour,alpha);
        if(mark.shape==='knot'){
          this.landmarkGround.strokeCircle(x,y,mark.active?3:2.2);
          if(mark.active){this.landmarkGround.fillStyle(colour,.72);this.landmarkGround.fillCircle(x,y,1.3);}
        }else if(mark.shape==='stitch'){
          const dx=Math.cos(mark.angle+Math.PI/2)*3,dy=Math.sin(mark.angle+Math.PI/2)*2;
          this.landmarkGround.lineBetween(x-dx,y-dy,x+dx,y+dy);
          if(mark.active)this.landmarkGround.lineBetween(x-dx*.55,y-dy*.55,x+dx*.55,y+dy*.55);
        }else if(mark.shape==='cross'){
          this.landmarkGround.lineBetween(x-2.5,y-2,x+2.5,y+2);this.landmarkGround.lineBetween(x-2.5,y+2,x+2.5,y-2);
        }else if(mark.shape==='dash'){
          const dx=Math.cos(mark.angle+Math.PI/2)*3.2,dy=Math.sin(mark.angle+Math.PI/2)*1.8;
          this.landmarkGround.lineBetween(x-dx,y-dy,x+dx,y+dy);
        }else{
          const dx=Math.cos(mark.angle+Math.PI/2)*3.2,dy=Math.sin(mark.angle+Math.PI/2)*1.8;
          this.landmarkGround.lineBetween(x-dx,y-dy,x-dx*.35,y-dy*.35);this.landmarkGround.lineBetween(x+dx*.35,y+dy*.35,x+dx,y+dy);
        }
      }
      this.landmark.setTexture(`chronicle-${key}-ink-v1`).setVisible(true).setPosition(plan.x,groundY-8).setDisplaySize(key==='lantern'?58:61,key==='lantern'?65:49).setDepth(plan.propDepth).setAlpha(status.phase==='broken'?.35:1);
      this.scene.game.canvas.dataset.chronicleLandmark=JSON.stringify({kind:status.kind,phase:status.phase,owner:status.owner,ownerShape:frame.ownerShape,capture:status.capture,threshold:status.threshold,progress:frame.progress,playerCount:status.playerCount,enemyCount:status.enemyCount,activeMarks:frame.marks.filter(mark=>mark.active).length,shapes:[...new Set(frame.marks.map(mark=>mark.shape))],x:plan.x,y:plan.y,groundDepth:plan.groundDepth,propDepth:plan.propDepth,actorFrontDepth:plan.actorFrontDepth});
    }
  }
  private updateEscort(p:Profile,s:BattleState,c:NonNullable<BattleState['chronicle']>,groundY:number,laneGap:number,reduced:boolean,g:Phaser.GameObjects.Graphics):void {
    if(c.objective==='escort'){
      this.traveller.setTexture('chronicle-cart-ink-v1').setVisible(true).setPosition(c.cart.x*.45,groundY+8).setDisplaySize(67,53).setDepth(chronicleActorDepth(groundY+8)).clearTint();
      g.fillStyle(0x28383c,.9);g.fillRoundedRect(c.cart.x*.45-22,groundY-43,44,4,2);g.fillStyle(0xd6bd83,1);g.fillRoundedRect(c.cart.x*.45-21,groundY-42,42*c.cart.hp/c.cart.maxHp,2,1);
    }
  }
  private updateRescue(p:Profile,s:BattleState,c:NonNullable<BattleState['chronicle']>,groundY:number,laneGap:number,reduced:boolean,g:Phaser.GameObjects.Graphics):void {
    if(c.objective==='rescue'){
      const frame=chronicleRescueFrame({rescued:c.rescued,rescueProgress:c.rescueProgress,travellerX:c.cart.x,previousScoutX:this.scoutX,time:s.time,paused:s.paused,reduced}),plan=chronicleRescueRenderPlan(p.age,groundY,frame,key=>this.scene.textures.exists(key)),floor=groundY+8;
      this.rescueGround.setDepth(plan.groundDepth);
      for(const knot of frame.knots){this.rescueGround.lineStyle(1.2,0xead7ae,.9);this.rescueGround.strokeCircle(knot.x,floor+5,4);if(knot.fill>0){this.rescueGround.fillStyle(0xedba61,.9);this.rescueGround.fillCircle(knot.x,floor+5,2.8*Math.sqrt(knot.fill));}}
      for(const footprint of frame.footprints){const y=floor+footprint.y;this.rescueGround.lineStyle(1.4,0x846446,footprint.alpha);this.rescueGround.lineBetween(footprint.x-2,y+1,footprint.x+1,y-2);this.rescueGround.fillStyle(0x28383c,footprint.alpha*.8);this.rescueGround.fillCircle(footprint.x+2,y-3,1);}
      this.cage.setTexture(plan.cageTexture).setVisible(true).setPosition(frame.cage.x,floor).setDisplaySize(frame.cage.open?54:48,47).setDepth(plan.cageDepth).setAlpha(frame.cage.alpha);
      if(frame.scout){
        this.scoutX=frame.scout.x;
        if(plan.scoutMode==='painted')this.scout.setTexture(plan.scoutTexture,String(frame.scout.frame)).setVisible(true).setPosition(frame.scout.x,floor).setDepth(plan.scoutDepth).setScale(troopScale(1,1)*TROOP_FRAME.height/this.scout.height).setFlipX(true).clearTint();
        else{drawTroop(this.scoutFallback,p.age,1,'player',0,false);this.scoutFallback.setVisible(true).setPosition(frame.scout.x,floor).setDepth(plan.scoutDepth).setScale(-1,1);}
      }else this.scoutX=frame.cage.x;
      this.scene.game.canvas.dataset.chronicleRescue=JSON.stringify({cage:{visible:this.cage.visible,x:this.cage.x,texture:this.cage.texture.key},scout:{visible:this.scout.visible||this.scoutFallback.visible,x:frame.scout?.x??null,frame:frame.scout?.frame??null,mode:plan.scoutMode,texture:this.scout.visible?this.scout.texture.key:null},groundDepth:this.rescueGround.depth,cageDepth:this.cage.depth,scoutDepth:frame.scout?(this.scout.visible?this.scout.depth:this.scoutFallback.depth):null});
    }
  }
  private updateCat(p:Profile,s:BattleState,c:NonNullable<BattleState['chronicle']>,groundY:number,laneGap:number,reduced:boolean,g:Phaser.GameObjects.Graphics):void {
    const frame=chronicleCatFrame({discoveries:p.chronicle?.discoveries??0,route:p.chronicle?.route??'road',phase:s.phase,rescued:c.rescued,travellerX:c.cart.x,time:s.time,paused:s.paused,reduced});
    if(frame){
      const plan=chronicleCatRenderPlan(groundY,frame),x=frame.x,y=plan.footY,face=frame.facing,cat=this.cat.setVisible(true).setDepth(plan.catDepth),ground=this.catGround.setDepth(plan.groundDepth);
      for(const paw of frame.paws){ground.fillStyle(0x846446,paw.alpha);ground.fillEllipse(paw.x,paw.y+y,3.4,1.8);ground.fillCircle(paw.x+face*2,paw.y+y-1.4,1.1);}
      ground.fillStyle(0x28383c,.2);ground.fillEllipse(x,y+1,25,5);
      const lift=frame.gait?1.2:0,bodyY=y-8-lift,headX=x+face*9;
      cat.fillStyle(0x3a3730,.98);cat.fillEllipse(x,bodyY,20,10);cat.fillCircle(headX,bodyY-4,5.4);
      cat.fillTriangle(headX-face*4,bodyY-7,headX-face*2,bodyY-13,headX,bodyY-8);cat.fillTriangle(headX+face,bodyY-8,headX+face*3,bodyY-13,headX+face*5,bodyY-7);
      cat.fillStyle(0xc7985c,.9);cat.fillTriangle(headX-face*2.9,bodyY-8,headX-face*2,bodyY-11.1,headX-face*.8,bodyY-8.2);cat.fillCircle(headX+face*2,bodyY-4.4,1.1);
      cat.lineStyle(2.2,0x3a3730,.98);cat.lineBetween(x-face*8,bodyY-1,x-face*11,y);cat.lineBetween(x-face*1,bodyY-1,x+face*2,y);
      const tailX=x-face*10,tailY=bodyY-2,tailReach=face*-(10+Math.cos(frame.tailAngle)*3);cat.lineStyle(2.4,0x3a3730,.98);cat.beginPath();cat.moveTo(tailX,tailY);cat.lineTo(tailX+tailReach*.62,tailY-5-Math.sin(frame.tailAngle)*4);cat.lineTo(tailX+tailReach,tailY-10+Math.sin(frame.tailAngle)*5);cat.strokePath();
      if(navigator.webdriver)this.scene.game.canvas.dataset.chronicleCat=JSON.stringify({mode:frame.mode,x:frame.x,facing:frame.facing,gait:frame.gait,tailAngle:frame.tailAngle,paws:frame.paws.length,groundDepth:plan.groundDepth,catDepth:plan.catDepth,endpointDepth:plan.endpointDepth,reduced,paused:s.paused});
    }
  }
  private updateBellAndMarks(p:Profile,s:BattleState,c:NonNullable<BattleState['chronicle']>,groundY:number,laneGap:number,reduced:boolean,g:Phaser.GameObjects.Graphics):void {
    if(c.rally){g.lineStyle(1.2,0xe4c894,.7);g.strokeEllipse(104,groundY+8,31,13);g.lineBetween(115,groundY+6,115,groundY-22);g.fillStyle(0xd3b880,.9);g.fillTriangle(115,groundY-22,130,groundY-18,115,groundY-12);}
    const keeper=s.units.find(u=>u.storyBoss&&u.hp>0);
    if(keeper){const y=groundY+keeper.lane*laneGap;this.bell.setVisible(true).setPosition(keeper.x*.45+34,y-4).setDisplaySize(64,57).setDepth(chronicleAttachmentDepth(y)).setAngle(bellMotion(s.time,c.boss.windupUntil>s.time,reduced||s.paused));
      if(c.boss.windupUntil>s.time){this.label.setVisible(true).setText(`BELL · ${Math.ceil(c.boss.windupUntil-s.time)}s`).setPosition(keeper.x*.45,y-103).setDepth(groundY+laneGap*2+15);}
    }
    for(const u of s.units){const x=u.x*.45,y=groundY+u.lane*laneGap;
      if(u.storyVeteran!==undefined&&(p.chronicle?.veterans[u.storyVeteran]??0)>=3){g.fillStyle(0xe4c58e,.95);g.fillTriangle(x-4,y-17,x+4,y-17,x,y-11);}
      if((u.brittleUntil??0)>s.time){g.lineStyle(1,0xb5d5d1,.9);g.strokeTriangle(x-7,y-9,x,y-18,x+7,y-9);}
      if(u.side==='player'&&c.shieldUntil>s.time){g.lineStyle(1.3,0xb6d4bd,.9);g.strokeEllipse(x,y-14,28,32);}
      if((u.breachedUntil??0)>s.time){g.lineStyle(1.4,0xd39a78,.9);g.lineBetween(x-5,y-17,x,y-11);g.lineBetween(x,y-11,x+5,y-18);}
    }
  }
  destroy():void{delete this.scene.game.canvas.dataset.chronicleRescue;delete this.scene.game.canvas.dataset.chronicleLandmark;delete this.scene.game.canvas.dataset.chronicleCat;for(const object of [...this.formation,this.landmarkGround,this.rescueGround,this.catGround,this.landmark,this.traveller,this.cat,this.cage,this.scout,this.scoutFallback,this.bell,this.marks,this.label])object.destroy();}
}
