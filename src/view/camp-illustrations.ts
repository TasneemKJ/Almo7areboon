import {storybookArt} from './storybook-art.ts';
import {baseSvg} from './world-illustrations.ts';
import {dataSvg} from './illustration-kit.ts';
/** Original local work props share the existing stone, cloth, ink and brass palette.
 * They depict their function at scene scale; they are not navigation glyphs. */
export function storehouseIllustration(level:number):string {
 const sacks=Math.min(4,1+Math.floor(Math.max(0,level)));
 return `<svg viewBox="0 0 180 160" aria-hidden="true" focusable="false"><ellipse cx="91" cy="148" rx="82" ry="9" fill="#102a29" opacity=".5"/><path d="M24 139V53L82 22l64 32v85Z" fill="#b6a47e" stroke="#344e4d" stroke-width="4"/><path d="M16 57 82 17l73 39-10 11-64-29-57 31Z" fill="#728477" stroke="#344e4d" stroke-width="4"/><path d="M39 133V81q23-22 45 0v52" fill="#29433f" stroke="#d8c394" stroke-width="5"/><path d="M14 79h145l-10 22-26-5-23 7-23-7-26 7-31-5Z" fill="#768e83" stroke="#344e4d" stroke-width="3"/><path d="M24 97v47m121-47v47" stroke="#765d42" stroke-width="5"/><path d="M99 70h28v17H99Z" fill="#efd098" stroke="#6e6048" stroke-width="3"/><path d="M34 63h26m54-15h15m-20 68h24" stroke="#817f67" stroke-width="2"/>${Array.from({length:sacks},(_,i)=>`<g transform="translate(${27+i*27},${i%2?105:112})"><path d="M4 7 9 0h15l5 7q13 25-1 32H6Q-8 29 4 7Z" fill="${i%2?'#baa078':'#d8bf8c'}" stroke="#4c574c" stroke-width="3"/><path d="M7 8h20M12 17l-3 12" fill="none" stroke="#927651" stroke-width="2"/></g>`).join('')}<path d="M119 118q12-16 22 0l-3 24h-17Z" fill="#bd8059" stroke="#405450" stroke-width="3"/><ellipse cx="130" cy="116" rx="10" ry="4" fill="#35453e"/></svg>`;
}
export function journalIllustration():string {
 return '<svg viewBox="0 0 150 140" aria-hidden="true" focusable="false"><ellipse cx="75" cy="128" rx="67" ry="8" fill="#102a29" opacity=".5"/><path d="M29 86 22 128m94-42 11 42" stroke="#61503b" stroke-width="9"/><path d="M14 68 126 58l14 32-119 12Z" fill="#9d7a4f" stroke="#3f4c40" stroke-width="4"/><path d="m30 58 48-11 46 9-4 30-43-4-43 10Z" fill="#65513a" stroke="#2c4644" stroke-width="4"/><path d="m30 50 45-8 46 7-3 29-42-4-42 9Z" fill="#ead8ac" stroke="#9c825b" stroke-width="2"/><path d="m75 43 1 31m-34-16 23-4m-21 12 21-4m22-7 23 2m-23 6 21 2" stroke="#8a7755" stroke-width="2"/><path d="m97 43 19-27-6 24-13 14Z" fill="#c3d0b9" stroke="#455b4e" stroke-width="2"/><path d="m92 62 22-39" stroke="#55644e" stroke-width="2"/><path d="M16 59V43l11-8 11 8v16Z" fill="#eed18c" stroke="#4b6253" stroke-width="3"/><path d="M12 42h31M17 33h20" stroke="#475b4e" stroke-width="3"/></svg>';
}
export function campGateImage(age:number):string {
 const art=storybookArt(age);return art?`${art.folder}/shelter.webp`:dataSvg(baseSvg(age,'player'));
}
