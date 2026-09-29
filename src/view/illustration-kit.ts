/** Small SVG primitives shared by original, self-contained artwork. */
export const INK='#273c43';
export const path=(d:string,fill:string,stroke=INK,width=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
export const ellipse=(x:number,y:number,rx:number,ry:number,fill:string,stroke='none',width=0)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
export const rect=(x:number,y:number,w:number,h:number,r:number,fill:string,stroke=INK,width=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
export const line=(d:string,color=INK,width=2)=>path(d,'none',color,width);
export const gradient=(id:string,top:string,bottom:string)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
export const documentSvg=(w:number,h:number,body:string,defs='')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
export const dataSvg=(svg:string)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
