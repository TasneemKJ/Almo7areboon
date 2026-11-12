import {lang,tr} from './i18n.ts';
/** Optional cinema. No profile, storage, simulation or ownership mutations. */
export const COMPANY_FILMS = Object.freeze({en:'./film/company-en.mp4',ar:'./film/company-ar.mp4'});
/** The film's own chrome and transcript, in one language: the game's at first, then the film's when the player picks one. */
const FILM_COPY={
 en:{title:'Those who walk together',close:'Close',picker:'Film language',video:'Those who walk together — English film',play:'Play film',ready:'Press Play film when you are ready.',transcript:'At dusk, one lamp becomes a promise. No one has to hold the road alone. From quiet doorways, a company gathers. Over the hills, courage travels on foot. When the distant footsteps answer… we stand together.'},
 ar:{title:'الذين يسيرون معًا',close:'إغلاق',picker:'لغة الفيلم',video:'الذين يسيرون معًا — فيلم بالعربية',play:'شاهد الفيلم',ready:'اضغط «شاهد الفيلم» عندما تكون مستعدًا.',transcript:'عند الغروب، يصبح ضوء القنديل وعدًا. لن يحرس أحدٌ الطريق وحده. من عتبات هادئة، تجتمع السريّة. فوق التلال، تمضي الشجاعة على الأقدام. وحين تجيب الخطوات البعيدة، نقف معًا.'},
} as const;
/** "Film EN / AR · Game English": both film languages, and the language the game itself is in. */
const filmNote=(film:'en'|'ar')=>film==='ar'?`الفيلم بالعربية والإنجليزية · اللعبة ${lang()==='ar'?'بالعربية':'بالإنجليزية'}`:`Film EN / AR · Game ${lang()==='ar'?'Arabic':'English'}`;
export function companyFilmHtml():string {
 const film=lang(),copy=FILM_COPY[film];
 return `<div class="company-cinema"><header class="film-header"><h2 id="dialog-title">${copy.title}</h2><button class="film-close" data-command="close">${copy.close}</button><label class="film-language" for="film-language"><span data-film-language-label>${copy.picker}</span><select id="film-language"><option value="en" lang="en" ${film==='en'?'selected':''}>English</option><option value="ar" lang="ar" ${film==='ar'?'selected':''}>العربية</option></select></label><p class="film-note" data-film-description>${filmNote(film)}</p></header><div class="film-picture"><video id="company-film" dir="ltr" controls playsinline preload="none" tabindex="0" poster="./film/poster.jpg" aria-label="${copy.video}" aria-describedby="film-transcript"></video><p id="film-transcript" class="sr-only">${copy.transcript}</p><div class="film-actions"><p id="film-status" class="film-note" role="status">${copy.ready}</p><button class="big-button green" type="button" data-film-play>${copy.play}</button></div><span class="sr-only" tabindex="0" data-film-focus-end aria-label="${tr('Return to film controls','عُد إلى أدوات الفيلم')}"></span></div></div>`;
}
/** Bound to the canonical modal. Replacement (including recovery) immediately releases media/listeners. */
export function mountCompanyFilm(layer:HTMLElement,sound:boolean,volume:number):()=>void {
 const video=layer.querySelector<HTMLVideoElement>('#company-film')!;
 const language=layer.querySelector<HTMLSelectElement>('#film-language')!;
 const status=layer.querySelector<HTMLElement>('#film-status')!;
 const play=layer.querySelector<HTMLButtonElement>('[data-film-play]')!;
 const actions=layer.querySelector<HTMLElement>('.film-actions')!;
 const focusEnd=layer.querySelector<HTMLElement>('[data-film-focus-end]')!;
 const wrapFocus=()=>layer.querySelector<HTMLElement>('[data-command="close"]')?.focus();
 focusEnd.addEventListener('focus',wrapFocus);
 let disposed=false,revision=0;
 const ar=()=>language.value==='ar';
 video.muted=!sound;video.volume=Math.max(0,Math.min(1,volume/100));
 const message=(en:string,arabic:string)=>{status.textContent=ar()?arabic:en;status.lang=ar()?'ar':'en';status.dir=ar()?'rtl':'ltr';};
 function reset(){
  const dialog=layer.querySelector<HTMLElement>('[role="dialog"]')!;dialog.lang=ar()?'ar':'en';dialog.dir=ar()?'rtl':'ltr';
  const copy=FILM_COPY[ar()?'ar':'en'];
  layer.querySelector<HTMLElement>('#dialog-title')!.textContent=copy.title;
  layer.querySelector<HTMLElement>('[data-film-description]')!.textContent=filmNote(ar()?'ar':'en');
  layer.querySelector<HTMLElement>('#film-transcript')!.textContent=copy.transcript;
  layer.querySelector<HTMLElement>('[data-film-language-label]')!.textContent=ar()?'لغة الفيلم':'Film language / لغة الفيلم';
  layer.querySelector<HTMLElement>('[data-command="close"]')!.textContent=copy.close;
  layer.querySelector<HTMLElement>('[data-film-focus-end]')!.setAttribute('aria-label',ar()?'عُد إلى أدوات الفيلم':'Return to film controls');
  revision++;actions.hidden=false;video.pause();video.removeAttribute('src');video.load();play.textContent=copy.play;video.setAttribute('aria-label',copy.video);message(FILM_COPY.en.ready,FILM_COPY.ar.ready);}
 async function start(event:Event){
  event.stopPropagation();event.preventDefault();const token=++revision;
  if(!video.getAttribute('src'))video.src=COMPANY_FILMS[ar()?'ar':'en'];
  if(video.ended)video.currentTime=0;
  message('Loading film…','جارٍ تحميل الفيلم…');
  try {await video.play();if(disposed||token!==revision)return;actions.hidden=true;message('Use the player controls to pause or seek.','استخدم أدوات المشغّل للإيقاف المؤقت أو الانتقال.');play.textContent=ar()?'إعادة التشغيل':'Restart film';}
  catch {if(disposed||token!==revision)return;message('Playback could not start. Press Play film to retry, or Close to return.','تعذّر تشغيل الفيلم. حاول مجددًا أو أغلقه للعودة.');play.textContent=ar()?'حاول مجددًا':'Try again';}
 }
 const playClick=(event:Event)=>{if(video.getAttribute('src')&&!video.error)video.currentTime=0;void start(event);};
 const error=()=>{actions.hidden=false;message('The film could not load. Check your connection and try again, or Close.','تعذّر تحميل الفيلم. تحقّق من الاتصال وحاول مجددًا، أو أغلقه.');play.textContent=ar()?'حاول مجددًا':'Try again';video.removeAttribute('src');};
 const ended=()=>{actions.hidden=false;message('The tale ends here. Your company is waiting.','انتهت الحكاية. سريّتك تنتظرك.');play.textContent=ar()?'شاهد مجددًا':'Watch again';};
 const visibility=()=>{if(document.hidden){video.pause();message('Paused. Press play when you return.','متوقف مؤقتًا. اضغط التشغيل عند العودة.');}};
 play.addEventListener('click',playClick);language.addEventListener('change',reset);video.addEventListener('error',error);video.addEventListener('ended',ended);document.addEventListener('visibilitychange',visibility);
 const observer=new MutationObserver(()=>{if(!video.isConnected)dispose();});observer.observe(layer,{childList:true,subtree:true});
 function dispose(){if(disposed)return;disposed=true;revision++;observer.disconnect();focusEnd.removeEventListener('focus',wrapFocus);document.removeEventListener('visibilitychange',visibility);video.removeEventListener('error',error);video.removeEventListener('ended',ended);play.removeEventListener('click',playClick);language.removeEventListener('change',reset);video.pause();video.removeAttribute('src');video.load();}
 return dispose;
}
