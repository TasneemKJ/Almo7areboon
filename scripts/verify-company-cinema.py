"""Chromium cinema acceptance. Run under flock /tmp/browser.lock. Does not render films."""
import json,pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path('/tmp/mohareboon-cinema');OUT.mkdir(exist_ok=True)
URL='http://127.0.0.1:4215';KEY='almo7areboon.save.v1';results=[]
def save(page):
 return page.evaluate('''key=>{const p=JSON.parse(localStorage.getItem(key));if(p)delete p.lastSeen;return p}''',KEY)
def openfilm(page):
 page.locator('[data-command="watch-film"]').click();page.wait_for_selector('#company-film');page.wait_for_timeout(300)
def assertlayout(page):
 layout=page.evaluate('''()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,narrow:document.querySelector('.film-dialog').getBoundingClientRect().width<innerWidth-1,small:[...document.querySelectorAll('.company-cinema button,.company-cinema select')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<44).length})''');assert not layout['overflow'] and not layout['narrow'] and not layout['small'],layout
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);
 for w,h in [(320,568),(360,640),(390,844),(412,915),(844,390),(1280,800)]:
  c=b.new_context(viewport={'width':w,'height':h},has_touch=w<1000,is_mobile=w<1000,device_scale_factor=2);page=c.new_page();errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
  if w==390:c.new_cdp_session(page).send('Emulation.setCPUThrottlingRate',{'rate':4})
  page.goto(URL);page.wait_for_selector('#entry-settings:not([disabled])');page.locator('#entry-settings').click();page.wait_for_timeout(200)
  assert not any('.mp4' in u for u in requests),'movie requested on boot'
  # Exact fresh normalized progress snapshot; periodic lastSeen minute stamp is excluded.
  page.wait_for_timeout(5200);before=save(page);openfilm(page);page.wait_for_timeout(150);assert not any('.mp4' in u for u in requests),'movie requested before Play'
  for lang in ['en','ar']:
   page.locator('#film-language').select_option(lang);assertlayout(page);page.locator('[data-film-play]').click();page.wait_for_function('document.querySelector("video").currentTime>.15',timeout=30000)
   assert page.locator('video').evaluate('(v)=>v.videoWidth')==1080
   page.locator('video').evaluate('(v)=>{v.currentTime=15;v.pause()}');page.wait_for_function('Math.abs(document.querySelector("video").currentTime-15)<.3');page.wait_for_timeout(200)
   page.locator('video').focus();page.keyboard.press('Space');page.wait_for_function('!document.querySelector("video").paused');page.keyboard.press('Space');page.wait_for_function('document.querySelector("video").paused')
   for _ in range(16):
    page.keyboard.press('Tab');assert page.evaluate('document.querySelector(".film-dialog").contains(document.activeElement)'), 'focus escaped film'
   page.locator('video').focus();at=page.locator('video').evaluate('(v)=>v.currentTime');page.keyboard.press('ArrowRight');page.wait_for_timeout(150);assert page.locator('video').evaluate('(v)=>v.currentTime')>=at
   page.locator('video').evaluate('''v=>new Promise(resolve=>{v.addEventListener('seeked',()=>resolve(),{once:true});v.currentTime=16})''');page.wait_for_timeout(250);page.locator('.film-header h2').click();page.screenshot(path=str(OUT/f'{w}x{h}-{lang}.png'))
   page.locator('video').evaluate('(v)=>{v.currentTime=59.75;v.play()}');page.wait_for_function('document.querySelector("video").ended',timeout=15000);assert ('Watch again' if lang=='en' else 'شاهد مجددًا') in page.locator('[data-film-play]').inner_text()
   assert save(page)==before,'film changed progress'
  page.keyboard.press('Escape');page.wait_for_selector('[data-command="watch-film"]');page.wait_for_timeout(100);assert page.locator('[data-command="watch-film"]').evaluate('(e)=>e===document.activeElement')
  openfilm(page);page.locator('.company-cinema [data-command="close"]').click();page.wait_for_selector('[data-command="watch-film"]');assert save(page)==before
  assert not page.evaluate('''async()=>{const names=await caches.keys();for(const name of names){const cache=await caches.open(name);if((await cache.keys()).some(r=>r.url.endsWith('.mp4')))return true}return false}'''),'optional movie entered SW cache'
  assert not errors,errors;results.append({'viewport':f'{w}x{h}','languages':['en','ar'],'cpu':4 if w==390 else 1,'checks':['lazy','play','seek','keyboard','ended','escape','close','focus','save','layout']});(OUT/'partial-results.json').write_text(json.dumps(results,indent=2));c.close()
 # Fresh opening: skip isolation, once-only, live Arabic, replay, pause restoration and reduced motion.
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');page=c.new_page();page.goto(URL);page.wait_for_selector('#entry-play:not([disabled])');page.locator('#entry-play').click();page.wait_for_selector('#intro-layer');page.locator('.intro-language select').select_option('ar');assert page.locator('.intro-line').first.get_attribute('dir')=='rtl';assert page.locator('.game-shell').evaluate('(e)=>e.inert');page.screenshot(path=str(OUT/'intro-ar-reduced.png'));page.locator('.intro-skip').click();page.wait_for_timeout(400);assert page.locator('#intro-layer').count()==0
 assert page.locator('#world').get_attribute('data-phase')=='running';assert not (save(page) or {}).get('introPending');page.locator('[data-command="field-pause"]').click();page.locator('#modal-layer [data-command="settings"]').click();page.locator('[data-command="watch-intro"]').click();page.wait_for_selector('#intro-layer');assert page.locator('.intro-language select').input_value()=='ar';page.keyboard.press('Escape');page.wait_for_timeout(400);assert page.locator('#dialog-title').inner_text()=='A moment by the fire'
 page.locator('#modal-layer [data-command="settings"]').click();openfilm(page);before=save(page);page.route('**/film/company-en.mp4',lambda r:r.abort());page.locator('[data-film-play]').click();page.wait_for_function('document.querySelector("#film-status").textContent.includes("could not")');page.unroute('**/film/company-en.mp4');page.locator('[data-film-play]').click();page.wait_for_function('document.querySelector("video").currentTime>.1')
 # Exercise visibility event through the actual page listener; no auto-resume on return.
 page.evaluate('''()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))}''');assert page.locator('video').evaluate('(v)=>v.paused');page.evaluate('''()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))}''');assert page.locator('video').evaluate('(v)=>v.paused')
 page.set_viewport_size({'width':844,'height':390});assertlayout(page);page.locator('.company-cinema [data-command="close"]').click();page.locator('[data-command="close"]').click();assert page.locator('#dialog-title').inner_text()=='A moment by the fire';assert save(page)==before
 page.reload();page.wait_for_selector('#entry-play:not([disabled])');page.locator('#entry-play').click();page.wait_for_timeout(700);assert page.locator('#intro-layer').count()==0
 page.locator('[data-command="field-pause"]').click();page.locator('#modal-layer [data-command="settings"]').click();openfilm(page);page.locator('[data-film-play]').click();page.wait_for_function('document.querySelector("video").currentTime>.1');page.evaluate('''key=>{window.detachedMovie=document.querySelector('video');localStorage.setItem(key,localStorage.getItem(key)+' ');window.dispatchEvent(new StorageEvent('storage',{key}))}''',KEY);page.wait_for_selector('.session-dialog');page.wait_for_function('window.detachedMovie.paused&&!window.detachedMovie.getAttribute("src")')
 results.append({'lifecycle':['reduced motion','AR intro','skip','replay language','pause restoration','failure retry','visibility pause','rotation','once-only reload','session conflict unload']});c.close();b.close()
(OUT/'results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
