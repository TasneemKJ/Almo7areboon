export function icon(name:string, cls=''):string {
  const paths:Record<string,string> = {
    coin:'<circle cx="16" cy="16" r="12" fill="#ffd24c"/><circle cx="16" cy="16" r="8" fill="none" stroke="#cb9130"/><path d="M12 20V12l4 3 4-3v8z" fill="#d49829" stroke="none"/>',
    gem:'<path d="M7 5h18l5 9-14 16L2 14z" fill="#69dfb4"/><path d="M2 14h28M7 5l5 9 4 16 4-16 5-9M12 14l4-9 4 9" fill="none" stroke="#238e79"/>',
    food:'<path d="M14 20l-7 7c-5 1-7-3-4-6l5-5" fill="#f5e1b8"/><path d="M9 8c4-7 14-7 19-1 7 9-1 19-9 18-5 0-6-5-9-7S6 12 9 8z" fill="#f07772"/><ellipse cx="21" cy="10" rx="3" ry="4" fill="#ffb398" stroke="none"/>',
    battle:'<path d="M5 3l4 1 19 21-3 3L5 8zM27 3l-4 1L4 25l3 3L27 8z" fill="#dce8ed"/><path d="M3 20l9 9m17-9-9 9" stroke="#d4a058" stroke-width="4"/>',
    evolution:'<path d="M5 24l8-8 6 4 8-12" fill="none" stroke="#91d977" stroke-width="5"/><path d="M18 7h11v11" fill="none" stroke="#91d977" stroke-width="5"/>',
    cards:'<rect x="4" y="5" width="19" height="25" rx="3" fill="#b5a5eb" transform="rotate(-12 12 16)"/><rect x="10" y="3" width="19" height="25" rx="3" fill="#eece79"/><path d="M20 9l2 4 4 1-3 3 1 5-4-2-4 2 1-5-3-3 4-1z" fill="#f19d4e"/>',
    skills:'<path d="M17 2L5 18h10l-1 13L29 12H18l4-10z" fill="#f6d657"/>',
    shield:'<path d="M16 2l12 5v12c0 5-7 10-12 12C11 29 4 24 4 19V7z" fill="#729fe0"/><path d="M16 7v18M9 12h14" stroke="#beddf5" stroke-width="3"/>',
    gear:'<path d="M12 3h8l1 5 5 1 3 7-4 3 1 5-7 5-4-3-5 1-6-6 2-5-2-4 5-6z" fill="#d6e0dc"/><circle cx="16" cy="16" r="5" fill="#627681"/>',
    quest:'<path d="M8 4h17v26H5V8z" fill="#f3db97"/><path d="M12 3h9v5h-9z" fill="#b87f4d"/><path d="M10 13l2 2 4-4m-6 10 2 2 4-4M19 14h3m-3 8h3" fill="none"/>',
    lock:'<rect x="7" y="14" width="20" height="16" rx="3" fill="#c6cacf"/><path d="M11 14V8a6 6 0 0112 0v6" fill="none" stroke-width="4"/><path d="M17 20v4"/>',
    freeze:'<path d="M16 2v28M4 9l24 14M4 23L28 9M11 5l5 4 5-4M11 27l5-4 5 4M3 15l6-3-1-6M24 26l-1-6 6-3M3 17l6 3-1 6M24 6l-1 6 6 3" fill="none" stroke="#a4ebff" stroke-width="3"/>',
    meteor:'<path d="M8 24L28 3l-2 14-8 11z" fill="#ffd95a"/><circle cx="11" cy="22" r="8" fill="#ed7652"/><path d="M7 21l4-3 4 6" fill="none" stroke="#ffbd64" stroke-width="3"/>',
    heart:'<path d="M16 28S0 19 2 10c2-9 12-8 14-2 2-6 12-7 14 2 2 9-14 18-14 18z" fill="#ed776e"/>',
    arrow:'<path d="M5 16h22M18 6l10 10-10 10" fill="none" stroke="currentColor" stroke-width="4"/>',
    close:'<path d="M7 7l18 18M25 7L7 25" fill="none" stroke="currentColor" stroke-width="4"/>',
    sound:'<path d="M3 12h7l8-7v22l-8-7H3z" fill="#f3eac9"/><path d="M23 10q8 6 0 12m3-18q13 12 0 24" fill="none" stroke="#f3eac9"/>',
    flag:'<path d="M8 30V3h18l-4 7 4 7H8" fill="#75b8f2"/><path d="M4 30h10"/>',
    trophy:'<path d="M9 3h14v12c0 6-14 6-14 0zM9 6H3v5c0 5 6 6 6 6m14-11h6v5c0 5-6 6-6 6" fill="#fbd25a"/><path d="M16 20v7M9 29h14" stroke="#dfaa42" stroke-width="5"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#293039" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${paths[name]||paths.shield}</svg>`;
}
