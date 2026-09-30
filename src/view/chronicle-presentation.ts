export const chroniclePaintPalette=Object.freeze({ink:'#28383c',stone:'#d6b78c',linen:'#ead7ae',teal:'#4e7c79',wood:'#846446',light:'#edba61'});
export const chronicleActorDepth=(footY:number,tie=0)=>footY+tie*.1;
export function bellMotion(time:number,warning:boolean,reduced:boolean):number{return warning&&!reduced&&Number.isFinite(time)?Math.sin(time*5)*9:0;}
