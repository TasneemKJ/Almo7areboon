import type { BattleState, Profile } from '../game/types.ts';
import { campLampIllustration } from '../view/camp-illustrations.ts';
import { battleClock } from './battle-clock.ts';
import { chapterInBothLanguages, chapterLandscape } from './chapter-presentation.ts';

/**
 * A postcard home from the road, sent after a victory through the iPhone share sheet (TasKit `share(dataURL)`). It is
 * the game's own painted plate of the chapter just won, the village's Levantine lantern, and the journey's words:
 * written Arabic first (the game's name, the chapter and its line), English under it. Nothing is invented for it.
 */
export const POSTCARD = { width: 1080, height: 1350 } as const;
const CHAPTERS = 6;
const INK = '#102c29', PAPER = '#f6ead2', GOLD = '#f0ce87', BRASS = '#c7a773', DUSK = '#e9dcc0';
const ARABIC = '"Almo Arabic", "Geeza Pro", sans-serif', SERIF = 'Georgia, serif';

export interface PostcardLines { game: string; titleAr: string; subtitleAr: string; titleEn: string; chapter: string; detail: string;
  /** The Arabic detail line as runs in reading order (right to left), each of one direction, for drawing. */
  runs: string[] }


function warriorsAr(count: number): string[] {
  if (count === 1) return ['محارب واحد'];
  if (count === 2) return ['محاربان'];
  return [String(count), count >= 3 && count <= 10 ? 'محاربين' : 'محارباً'];
}

export function postcardLines(profile: Readonly<Profile>, state: Readonly<BattleState>): PostcardLines {
  const chapter = Math.max(0, Math.min(CHAPTERS - 1, profile.enemyAge)), both = chapterInBothLanguages(chapter);
  const clock = battleClock(state.time), warriors = warriorsAr(Math.max(0, state.stats.deployed | 0)), number = `${chapter + 1} / ${CHAPTERS}`;
  return {
    game: 'المحاربون',
    titleAr: `نصرٌ في ${both.ar.title}`,
    subtitleAr: both.ar.subtitle,
    titleEn: `Victory at ${both.en.title}`,
    chapter: number,
    detail: `${clock} · ${warriors.join(' ')}`,
    runs: ['الفصل', number, '·', clock, '·', ...warriors],
  };
}

/** Paints the card on a 1080x1350 context: plate, dusk wash, brass frame, lantern, then the words (Arabic first). */
export function drawPostcard(ctx: CanvasRenderingContext2D, art: { plate: CanvasImageSource; lamp: CanvasImageSource }, lines: PostcardLines): void {
  const W = POSTCARD.width, H = POSTCARD.height;
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
  const plate = art.plate as { width?: number; height?: number };
  if (plate.width && plate.height) {
    const scale = Math.max(W / plate.width, H / plate.height), sw = W / scale, sh = H / scale;
    ctx.drawImage(art.plate, (plate.width - sw) / 2, (plate.height - sh) / 2, sw, sh, 0, 0, W, H);
  } else ctx.drawImage(art.plate, 0, 0, W, H);
  const wash = ctx.createLinearGradient(0, H * .42, 0, H);
  wash.addColorStop(0, '#102c2900'); wash.addColorStop(.45, '#102c29d0'); wash.addColorStop(1, '#102c29f5');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = BRASS; ctx.lineWidth = 5; ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = '#c7a77366'; ctx.lineWidth = 2; ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.drawImage(art.lamp, W - 250, 46, 168, 210);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.direction = 'rtl';
  const text = (value: string, font: string, color: string, y: number) => { ctx.font = font; ctx.fillStyle = color; ctx.fillText(value, W / 2, y, W - 160); };
  text(lines.game, `700 60px ${ARABIC}`, GOLD, 905);
  text(lines.titleAr, `700 76px ${ARABIC}`, PAPER, 1010);
  text(lines.subtitleAr, `400 42px ${ARABIC}`, DUSK, 1080);
  // Mixed Arabic and numbers: placed run by run from the right, since canvas bidi support varies between WebKits.
  ctx.direction = 'ltr'; ctx.font = `400 34px ${ARABIC}`; ctx.fillStyle = BRASS; ctx.textAlign = 'right';
  const gap = 14, widths = lines.runs.map(run => ctx.measureText(run).width);
  let x = W / 2 + (widths.reduce((a, b) => a + b, 0) + gap * (lines.runs.length - 1)) / 2;
  lines.runs.forEach((run, i) => { ctx.fillText(run, x, 1150); x -= widths[i] + gap; });
  ctx.textAlign = 'center';
  text(lines.titleEn, `italic 400 38px ${SERIF}`, DUSK, 1225);
  text('Almo7areboon', `700 26px ${SERIF}`, BRASS, 1272);
}

export interface PostcardDeps { canvas: () => HTMLCanvasElement; image: (src: string) => Promise<CanvasImageSource>; fonts: () => Promise<unknown> }
const browserDeps: PostcardDeps = {
  canvas: () => document.createElement('canvas'),
  image: src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; }),
  fonts: () => Promise.all([document.fonts.load(`700 76px ${ARABIC}`, 'المحاربون'), document.fonts.load(`400 42px ${ARABIC}`, 'نصر')]),
};

/** Draws and hands the PNG to the share sheet; false (and nothing sent) off the app or if the canvas cannot export. */
export async function sharePostcard(profile: Readonly<Profile>, state: Readonly<BattleState>, bridge: { inApp: boolean; share(dataURL: string): boolean }, deps: PostcardDeps = browserDeps): Promise<boolean> {
  if (!bridge.inApp) return false;
  try {
    const lines = postcardLines(profile, state);
    await deps.fonts().catch(() => {});
    const [plate, lamp] = await Promise.all([deps.image(chapterLandscape(profile.enemyAge)), deps.image(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(campLampIllustration())}`)]);
    const canvas = deps.canvas(); canvas.width = POSTCARD.width; canvas.height = POSTCARD.height;
    const ctx = canvas.getContext('2d'); if (!ctx) return false;
    drawPostcard(ctx, { plate, lamp }, lines);
    return bridge.share(canvas.toDataURL('image/png'));
  } catch { return false; }
}
