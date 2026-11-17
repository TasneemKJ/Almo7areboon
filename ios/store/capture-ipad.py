import sys,subprocess,time
from playwright.sync_api import sync_playwright
OUT=sys.argv[1]; PORT=8821
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'-d',sys.argv[2]],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SEED1='{"version":2,"timeline":1,"age":0,"enemyAge":0,"coins":300,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":12,"kills":9,"wins":1,"played":true,"furthestBattle":1}'
SEED2='{"version":2,"timeline":1,"age":1,"enemyAge":1,"coins":900,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":60,"kills":48,"wins":4,"played":true,"furthestBattle":1}'
def js(S):
  return """(function(){var S='%s';var tap=function(s){var b=document.querySelector(s);if(b&&!b.disabled&&b.getClientRects().length>0){b.click();return true;}return false;};
var seq=function(steps,then){var i=0,h=setInterval(function(){if(i>=steps.length){clearInterval(h);if(then)then();return;}if(tap(steps[i]))i++;},1800);};
if(S==='title')return;if(S==='camp'){seq(['#entry-secondary']);return;}
seq(['#entry-play'],function(){var i=0,started=false;setInterval(function(){if(!started&&tap('#ready [data-command="start"]'))started=true;tap('#unit-cards .unit-card[data-unit="'+([0,0,1,0,2][i++%%5])+'"]');},1100);});})()"""%S
plan=[('title',SEED1,[(16,'1-dusk-village.png')]),('battle',SEED1,[(36,'2-hold-the-gate.png'),(40,'3-victory.png')]),('camp',SEED1,[(18,'4-camp.png')]),('battle',SEED2,[(34,'5-olive-terraces.png')])]
import os
with sync_playwright() as p:
  b=p.chromium.launch()
  for L in ('en','ar'):
    os.makedirs(f'{OUT}/{L}',exist_ok=True)
    for scene,seed,shots in plan:
      ctx=b.new_context(viewport={'width':1032,'height':1376},device_scale_factor=2,is_mobile=True,has_touch=True,locale='ar-SA' if L=='ar' else 'en-US')
      ctx.add_init_script("if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('almo7areboon.lang.v1','%s');localStorage.setItem('almo7areboon.save.v1','%s');}"%(L,seed))
      pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
      pg.goto(f'http://127.0.0.1:{PORT}/',wait_until='load'); pg.wait_for_timeout(1500); pg.evaluate(js(scene))
      t=0
      for sec,name in shots:
        pg.wait_for_timeout((sec-t)*1000); t=sec; pg.screenshot(path=f'{OUT}/{L}/{name}')
      print(L,scene,errs[:2],flush=True); ctx.close()
  b.close()
srv.terminate()
