const paintedIcons=new Set(['coin','gem','food','battle','evolution','cards','skills','shield','gear','quest','lock','freeze','meteor','heart','flag','trophy']);
export function icon(name:string, cls=''):string {
  // Keep the SVG box so existing size, accessibility and portrait selectors remain valid.
  if(!paintedIcons.has(name)&&!['arrow','close','sound'].includes(name))name='shield';
  if(paintedIcons.has(name))return `<svg class="icon ${cls}" viewBox="0 0 128 128" aria-hidden="true"><image href="/art/storybook/interface/${name}.webp" width="128" height="128"/></svg>`;
  const paths:Record<string,string> = {
    arrow:'<path d="M5 16h22M18 6l10 10-10 10" fill="none" stroke="currentColor" stroke-width="4"/>',
    close:'<path d="M7 7l18 18M25 7L7 25" fill="none" stroke="currentColor" stroke-width="4"/>',
    sound:'<path d="M3 12h7l8-7v22l-8-7H3z" fill="#f3eac9"/><path d="M23 10q8 6 0 12m3-18q13 12 0 24" fill="none" stroke="#f3eac9"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#293039" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${paths[name]||''}</svg>`;
}
