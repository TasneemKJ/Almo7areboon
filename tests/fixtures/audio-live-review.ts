/** Browser-only control surface; no test globals are installed by production. */
import * as audio from '../../src/view/audio.ts';
const fixture={...audio};
Object.assign(window,{audioLiveReview:fixture});
document.querySelector('#unlock')!.addEventListener('click',()=>audio.unlockAudio(true));
document.querySelector('#dispose')!.addEventListener('click',()=>audio.disposeAudio());
document.body.dataset.ready='true';
