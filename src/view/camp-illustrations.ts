import {storybookArt} from './storybook-art.ts';
import {baseSvg} from './world-illustrations.ts';
import {dataSvg} from './illustration-kit.ts';
/** Painted local work props share the existing stone, cloth, ink and brass palette.
 * They depict their function at scene scale; they are not navigation glyphs. */
export function storehouseIllustration(level:number):string {
 const worked=Number.isFinite(level)&&level>0;
 return `<span class="camp-storehouse" data-work-level="${Math.max(0,Math.floor(Number.isFinite(level)?level:0))}"><img class="camp-storehouse-image" src="/art/storybook/camp/storehouse.webp" alt="" width="640" height="427"/>${worked?'<img class="camp-stock-food" src="/art/storybook/interface/food.webp" alt=""/>':''}</span>`;
}
export function journalIllustration():string {
 return '<img src="/art/storybook/camp/journal.webp" alt="" width="512" height="468"/>';
}
export function campGateImage(age:number):string {
 const art=storybookArt(age);return art?`${art.folder}/shelter-hd.webp`:dataSvg(baseSvg(age,'player'));
}

/**
 * The village lantern from the Levantine scenery (levantine-scenery.ts `lantern`: ink hanger, brass body #c7a773, warm
 * glass #ffdc92, soft lamp halo), hung over the one Camp place worth a visit. The village's own lamp, not the
 * Lamplighter's: it appears for every player and never depends on a purchase.
 */
export function campLampIllustration(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="camp-lamp" viewBox="-32 -40 64 80" aria-hidden="true" focusable="false"><defs><radialGradient id="camp-lamp-glow"><stop stop-color="#ffd18a" stop-opacity=".9"/><stop offset="1" stop-color="#ffc58a" stop-opacity="0"/></radialGradient></defs><ellipse cx="0" cy="0" rx="30" ry="37" fill="url(#camp-lamp-glow)"/><path d="M0-40V-13" stroke="#243e4a" stroke-width="2" fill="none"/><path d="M-6-9L0-15 6-9 5 9-5 9Z" fill="#c7a773" stroke="#243e4a" stroke-width="1.5"/><rect x="-3" y="-7" width="6" height="13" rx="1" fill="#ffdc92"/><path d="M-6-8H6M-5 8H5" stroke="#243e4a" stroke-width="1.4"/></svg>`;
}
