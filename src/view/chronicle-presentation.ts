export const chroniclePaintPalette=Object.freeze({ink:'#28383c',stone:'#d6b78c',linen:'#ead7ae',teal:'#4e7c79',wood:'#846446',light:'#edba61'});
export const chronicleActorDepth=(footY:number,tie=0)=>footY+tie*.1;
export function bellMotion(time:number,warning:boolean,reduced:boolean):number{return warning&&!reduced&&Number.isFinite(time)?Math.sin(time*5)*9:0;}

/** Three pigment swatches; only baked props use these, never live full-screen grading. */
export function chronicleMaterial(colour:string):readonly [string,string,string]{
  const colours:Record<string,readonly [string,string,string]>={
    '#ead7ae':['#ecdab4','#ead7ae','#9b845b'],
    '#846446':['#b18b58','#846446','#4f3f30'],
    '#edba61':['#edcf87','#edba61','#967044'],
    '#4e7c79':['#7c937d','#4e7c79','#344b46'],
    '#d6b78c':['#dfc598','#d6b78c','#8e7759'],
    '#28383c':['#45504a','#28383c','#232b29'],
  };return colours[colour]??[colour,colour,colour];
}
