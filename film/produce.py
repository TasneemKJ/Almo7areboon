"""Local deterministic film renderer. Pillow (RAQM), NumPy and ffmpeg; no network."""
import argparse, hashlib, json, math, pathlib, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT=pathlib.Path(__file__).resolve().parents[1]; OUT=ROOT/'public/film'; W,H=1080,1920; FPS=24
EN=['At dusk, one lamp becomes a promise.','No one has to hold the road alone.','From quiet doorways, a company gathers.','Over the hills, courage travels on foot.','When the distant footsteps answer…','…we stand together.']
AR=['عند الغروب، يصبح ضوء القنديل وعدًا.','لن يحرس أحدٌ الطريق وحده.','من عتبات هادئة، تجتمع السريّة.','فوق التلال، تمضي الشجاعة على الأقدام.','وحين تجيب الخطوات البعيدة،','نقف معًا.']
fonten='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'; fontar='/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf'
plates={n:Image.open(ROOT/'art-source/storybook'/p).convert('RGB') for n,p in [('village','village.webp'),('olive','olive/village.webp')]}
packing=json.loads((ROOT/'art-source/storybook/packing.json').read_text()); actors={}
for name in ['pathkeeper','thrower','rider']:
 src=Image.open(ROOT/f'art-source/storybook/{name}.webp').convert('RGBA'); data=next(x for x in packing if x['name']==name)
 actors[name]=[src.crop((b['left'],b['top'],b['right']+1,b['bottom']+1)) for b in data['sourceBounds']]

def caption(text,lang):
 im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im); f=ImageFont.truetype(fontar if lang=='ar' else fonten,64 if lang=='ar' else 58)
 words=text.split(); lines=[]; line=''
 for word in words:
  trial=(line+' '+word).strip()
  if d.textlength(trial,font=f)>900:lines.append(line);line=word
  else:line=trial
 lines.append(line)
 for j,line in enumerate(lines):d.text((W/2,1500+j*88),line,font=f,fill='#fff0d2',anchor='mm',direction='rtl' if lang=='ar' else 'ltr',stroke_width=1,stroke_fill='#fff0d2')
 return im
caps={lang:[caption(s,lang) for s in lines] for lang,lines in [('en',EN),('ar',AR)]}
# One stable grade and readable lower third; no per-frame noise or flashes.
grade=Image.new('RGBA',(W,H));gd=ImageDraw.Draw(grade)
for y in range(H):
 a=int(220*max(0,(y-1230)/690)**.6) if y>1230 else int(60*max(0,1-y/500))
 gd.line((0,y,W,y),fill=(5,21,31,a))

def actor(im,name,x,base,height,frame=0,flip=False,shadow=False):
 a=actors[name][frame%6];a=a.resize((int(height*a.width/a.height),int(height)),Image.Resampling.BICUBIC)
 if flip:a=a.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 if shadow:
  dark=Image.new('RGBA',a.size,(12,27,35,255));dark.putalpha(a.getchannel('A').point(lambda v:int(v*.8)));a=dark
 d=ImageDraw.Draw(im);d.ellipse((x-a.width*.34,base-16,x+a.width*.34,base+22),fill=(5,16,25,95))
 im.alpha_composite(a,(int(x-a.width/2),int(base-height)))

def scene(t,lang):
 shot=min(5,int(t//10));u=(t%10)/10; ease=u*u*(3-2*u)
 p=plates['olive' if shot in [2,3] else 'village']; zoom=[1.06,1.50,1.20,1.32,1.48,1.12][shot]+.08*ease
 cropH=p.height/zoom;cropW=cropH*W/H;cx=p.width*[.51,.30,.62,.54,.73,.52][shot]+(ease-.5)*80;cy=p.height*[.50,.52,.50,.50,.42,.50][shot]
 cx=max(cropW/2,min(p.width-cropW/2,cx));cy=max(cropH/2,min(p.height-cropH/2,cy))
 im=p.crop((cx-cropW/2,cy-cropH/2,cx+cropW/2,cy+cropH/2)).resize((W,H),Image.Resampling.BICUBIC).convert('RGBA')
 d=ImageDraw.Draw(im,'RGBA')
 # Separate foreground, company planes, moving light and suspended dust.
 for i in range(24):
  x=(i*173+t*(5+i%4))%W;y=360+(i*197-t*(7+i%3))%950;r=2+i%3
  d.ellipse((x-r,y-r,x+r,y+r),fill=(255,199,112,45+i%4*18))
 if shot==0:
  actor(im,'pathkeeper',860-100*ease,1330,300,int(t*5)%4)
 elif shot==1:
  actor(im,'pathkeeper',400+25*ease,1400,710,4)
 elif shot==2:
  for i,n in enumerate(['rider','thrower','pathkeeper']):actor(im,n,160+i*330+u*70,1320-i*25,430+i*40,int(t*5+i)%4)
 elif shot==3:
  for i,n in enumerate(['thrower','rider','pathkeeper']):actor(im,n,180+i*340,1370-i*45,520+i*45,0)
 elif shot==4:
  for i in range(3):actor(im,'pathkeeper',640+i*130-u*90,875+i*15,190-i*20,int(t*4+i)%4,True,True)
  actor(im,'pathkeeper',220,1470,680,4)
 else:
  actor(im,'thrower',790,1360,450,0);actor(im,'rider',180,1370,430,0);actor(im,'pathkeeper',500,1410,560,4)
 if shot in [1,3,5]:
  # Company standard: an original indigo cloth with a simple golden seed emblem.
  pole=740 if shot==1 else 610; top=465 if shot==1 else 665
  d=ImageDraw.Draw(im,'RGBA');d.line((pole,top-40,pole,1370),fill='#b69155',width=13)
  points=[(pole,top)]+[(pole+q,top+12*math.sin(t*1.7+q/80)) for q in range(0,250,20)]+[(pole+q,top+190+12*math.sin(t*1.7+q/80)) for q in range(240,-1,-20)]
  d.polygon(points,fill='#24505c');d.line(points[1:14],fill='#d7b368',width=5);d.ellipse((pole+95,top+62,pole+133,top+128),fill='#edcb7b')
 # Close foreground leaf silhouettes give a stronger depth baseline than a flat zoom.
 fg=Image.new('RGBA',(W,H));fd=ImageDraw.Draw(fg)
 for side in [0,1]:
  for i in range(5):
   x=(i*33-70+math.sin(t*.22)*9) if side==0 else W-(i*33-70+math.sin(t*.22)*9)
   fd.ellipse((x-50,1160+i*93,x+60,1480+i*82),fill=(8,24,30,180))
 im.alpha_composite(fg);im.alpha_composite(grade)
 # Captions dissolve gently at each actual editorial cut, otherwise hold readable.
 op=min(1,max(0,(t%10-.45)/.7),max(0,(9.7-t%10)/.6));cap=caps[lang][shot].copy();cap.putalpha(cap.getchannel('A').point(lambda v:int(v*op)));im.alpha_composite(cap)
 d=ImageDraw.Draw(im);small=ImageFont.truetype(fonten,27)
 # Identity is reserved for the closing title, leaving the picture unmarked.
 if shot==5:
  brand=ImageFont.truetype(fontar if lang=='ar' else fonten,110 if lang=='ar' else 75)
  d.text((540,210),'المحاربون' if lang=='ar' else 'ALMO7AREBOON',font=brand,fill='#f0ce87',anchor='mm',direction='rtl' if lang=='ar' else 'ltr')
  title='Those who walk\ntogether' if lang=='en' else 'الذين يسيرون معًا'
  f=ImageFont.truetype(fontar if lang=='ar' else fonten,86 if lang=='ar' else 78)
  for j,line in enumerate(title.split('\n')):d.text((540,355+j*100),line,font=f,fill='#ffedc8',anchor='mm',direction='rtl' if lang=='ar' else 'ltr')
 # Dark cinematic dissolves between shots instead of discontinuous spatial jumps.
 fade=min(1,(t%10)/.5,(10-t%10)/.45,t/.7,(60-t)/1.3)
 if fade<1:im=Image.blend(Image.new('RGBA',(W,H),'#071922'),im,max(0,fade))
 return im.convert('RGB')

def audio():
 sr=48000;n=sr*60;t=np.arange(n)/sr;y=np.zeros(n,dtype=np.float64)
 # Original modal phrase, warm open fifths, restrained felt/plucked attack.
 for start,midi,dur,level in [(s, m, 3.6,.12) for s,m in zip(np.arange(1,58,1.6),[50,57,60,62,57,53,50,57,62,65,64,60,57,53,50,53,57,60,62,57,53,50,57,60,65,62,60,57,53,50,57,60,62,65,62,57])]:
  a=int(start*sr);k=min(int(dur*sr),n-a);q=np.arange(k)/sr;f=440*2**((midi-69)/12)
  env=(1-np.exp(-q*38))*np.exp(-q*1.25)
  y[a:a+k]+=level*env*(np.sin(2*np.pi*f*q)+.22*np.sin(2*np.pi*f*2*q)+.09*np.sin(2*np.pi*f*3*q))
 for f in [146.83,220,293.66]:y+=.028*np.sin(2*np.pi*f*t+.025*np.sin(t*.4))*np.sin(np.pi*np.clip(t/60,0,1))**2
 y*=np.minimum(1,t/2)*np.minimum(1,(60-t)/3)
 stereo=np.stack([y,np.roll(y,510)*.92],axis=1);pcm=(np.clip(stereo,-.95,.95)*32767).astype('<i2')
 path=ROOT/'film/score.wav'
 with wave.open(str(path),'wb') as wav:wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(sr);wav.writeframes(pcm.tobytes())
 return path

def render(lang,score):
 target=ROOT/'film'/f'company-{lang}.render.mp4'
 cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(score),'-c:v','libx264','-threads','2','-preset','fast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-t','60','-movflags','+faststart',str(target)]
 p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for frame in range(FPS*60):
  p.stdin.write(scene(frame/FPS,lang).tobytes())
  if frame%(FPS*10)==0:print(lang,frame/FPS,flush=True)
 p.stdin.close()
 if p.wait():raise RuntimeError('ffmpeg failed; previous published encode retained')
 target.replace(OUT/f'company-{lang}.mp4')

if __name__=='__main__':
 args=argparse.ArgumentParser();args.add_argument('--preview',action='store_true');args.add_argument('--lang',choices=['en','ar','both'],default='both');a=args.parse_args();OUT.mkdir(exist_ok=True)
 scene(3,'en').save(OUT/'poster.jpg',quality=90)
 if a.preview:
  sheet=Image.new('RGB',(1080,640),'#071922')
  for i,t in enumerate([3,15,30.9,45,57]):sheet.paste(scene(t,'en').resize((216,384)),(i*216,0));sheet.paste(scene(t,'ar').resize((216,384)).crop((0,192,216,384)),(i*216,400))
  sheet.save('/tmp/mohareboon-contact.jpg');scene(3,'en').save(OUT/'poster.jpg',quality=90)
 else:
  score=audio()
  for lang in (['en','ar'] if a.lang=='both' else [a.lang]):render(lang,score)
  score.unlink()
  manifest={}
  for lang in ['en','ar']:
   path=OUT/f'company-{lang}.mp4'
   if path.exists():
    meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels','-of','json',str(path)]))
    manifest[lang]={'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),**meta}
  (ROOT/'film/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
