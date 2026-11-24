"""App Store screenshots from the real game build in Chromium (no Simulator), both languages.

Brought onto main from ios/taskit-1.3 (6870080, capture-ipad.py) and extended to the iPhone 6.9" size.
Usage (with a preview of dist/ running):  python3 ios/store/capture-web.py <ipad|iphone> <url> [out-dir]
  ipad   -> 1032x1376 @2x = 2064x2752 (iPad 13"), default out ios/store/screenshots-ipad/<lang>/
  iphone -> 440x956  @3x = 1320x2868 (iPhone 6.9"), default out ios/store/screenshots/<lang>/
A fake TasKit message handler makes the page run as the app (the store note on Home is the app's). Gameplay comes
first; Home is one shot. Each scene plays by pressing the game's own controls; nothing is drawn on top.
Headless has no status bar or safe-area insets.
"""
import os, sys
from playwright.sync_api import sync_playwright
DEVICE, URL = sys.argv[1], sys.argv[2]
SIZE = {'ipad': ((1032, 1376), 2, 'ios/store/screenshots-ipad'), 'iphone': ((440, 956), 3, 'ios/store/screenshots')}[DEVICE]
OUT = sys.argv[3] if len(sys.argv) > 3 else SIZE[2]
SEED1 = '{"version":2,"timeline":1,"age":0,"enemyAge":0,"coins":300,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":12,"kills":9,"wins":1,"played":true,"furthestBattle":1}'
SEED2 = '{"version":2,"timeline":1,"age":1,"enemyAge":1,"coins":900,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":60,"kills":48,"wins":4,"played":true,"furthestBattle":1}'
SEED3 = '{"version":2,"timeline":1,"age":2,"enemyAge":2,"coins":1400,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":140,"kills":120,"wins":8,"played":true,"furthestBattle":2}'
def js(scene):
    return """(function(){var S='%s';var tap=function(s){var b=document.querySelector(s);if(b&&!b.disabled&&b.getClientRects().length>0){b.click();return true;}return false;};
var seq=function(steps,then){var i=0,h=setInterval(function(){if(i>=steps.length){clearInterval(h);if(then)then();return;}if(tap(steps[i]))i++;},1800);};
setInterval(function(){var a=document.activeElement;if(a&&a!==document.body&&a.blur)a.blur();},400);
if(S==='title')return;
seq(['#entry-play'],function(){var i=0;setInterval(function(){tap('#unit-cards [data-unit="'+([0,0,1,0,2][i++%%5])+'"]');},1100);});})()""" % scene
PLAN = [('battle', SEED1, [(36, '1-hold-the-gate.png'), (41, '3-at-their-gate.png')]),
        ('battle', SEED2, [(34, '2-olive-terraces.png')]),
        ('title', SEED3, [(6, '4-home.png')])]
with sync_playwright() as p:
    exe = os.environ.get('CHROMIUM_PATH')
    b = p.chromium.launch(**({'executable_path': exe} if exe else {}))
    for L in ('en', 'ar'):
        os.makedirs(f'{OUT}/{L}', exist_ok=True)
        for scene, seed, shots in PLAN:
            ctx = b.new_context(viewport={'width': SIZE[0][0], 'height': SIZE[0][1]}, device_scale_factor=SIZE[1], is_mobile=True, has_touch=True, locale='ar-SA' if L == 'ar' else 'en-US')
            ctx.add_init_script("window.webkit={messageHandlers:{almo7areboon:{postMessage:function(){}}}};if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('almo7areboon.lang.v1','%s');localStorage.setItem('almo7areboon.save.v1','%s');}" % (L, seed))
            pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(URL, wait_until='load'); pg.wait_for_selector('#entry-play:not([disabled])', timeout=60000); pg.wait_for_timeout(800); pg.evaluate(js(scene))
            t = 0
            for sec, name in shots:
                pg.wait_for_timeout((sec - t) * 1000); t = sec; pg.screenshot(path=f'{OUT}/{L}/{name}')
            print(DEVICE, L, scene, errs[:2], flush=True); ctx.close()
    b.close()
