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
 a=actors[name][frame%6]
 # Trim transparent padding so the visible sole, rather than the sprite box, meets the ground.
 bounds=a.getchannel('A').getbbox()
 if bounds:a=a.crop(bounds)
 a=a.resize((int(height*a.width/a.height),int(height)),Image.Resampling.BICUBIC)
 if flip:a=a.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 if shadow:
  dark=Image.new('RGBA',a.size,(12,27,35,255));dark.putalpha(a.getchannel('A').point(lambda v:int(v*.8)));a=dark
 # Composite the shadow in RGBA before flattening: no opaque navy ellipse.
 blur=max(2,height*.011);pad=math.ceil(blur*4)
 sw=math.ceil(a.width*.68);sh=math.ceil(height*.033)
 contact=Image.new('RGBA',(sw+2*pad,sh+2*pad));d=ImageDraw.Draw(contact)
 d.ellipse((pad,pad,pad+sw,pad+sh),fill=(25,22,17,85))
 im.alpha_composite(contact.filter(ImageFilter.GaussianBlur(blur)),(int(x-sw/2-pad),int(base-height*.014-pad)))
 im.alpha_composite(a,(int(x-a.width/2),int(base-height)))

def ground_scene(t,width,height):
 """Project scenery and all grounded objects through one source-space camera."""
 shot=min(5,int(t//10));u=t%10/10;e=u*u*(3-2*u)
 plate=plates['olive' if shot in [2,3] else 'village'];portrait=height>width
 if portrait:
  zoom=[1.02,1.28,1.04,1.10,1.48,1.02][shot]+.035*e
  ch=plate.height/zoom;cw=ch*width/height
  cx=plate.width*[.51,.46,.50,.50,.73,.50][shot]+(e-.5)*18
  cy=plate.height*(.42 if shot==4 else .53)
 else:
  zoom=[1.02,1.10,1.02,1.05,1.20,1.02][shot]+.035*e
  cw=plate.width/zoom;ch=cw*height/width
  cx=plate.width*.5+(e-.5)*18;cy=plate.height*(.38 if shot==4 else .61)+(e-.5)*12
 cx=max(cw/2,min(plate.width-cw/2,cx));cy=max(ch/2,min(plate.height-ch/2,cy))
 left,top=cx-cw/2,cy-ch/2;scale=width/cw
 image=plate.crop((left,top,left+cw,top+ch)).resize((width,height),Image.Resampling.BICUBIC).convert('RGBA')
 def project(x,y):return ((x-left)*scale,(y-top)*scale)
 return image,project,scale

def ground_company(im,t,project,scale):
 """Feet stay on the authored open road (source y=850..990), never on roof or sky."""
 shot=min(5,int(t//10));u=t%10/10;portrait=im.height>im.width
 placements=[]
 if shot==1:placements=[('pathkeeper',450,960,330,4)]
 elif shot==2:
  placements=[('rider',350+u*18,880,185,int(t*5)%4),('thrower',570+u*18,910,210,int(t*5+1)%4),('pathkeeper',790+u*18,955,255,int(t*5+2)%4)]
 elif shot==3:
  placements=[('thrower',(395 if portrait else 345)+u*24,945,220,int(t*5)%4),('rider',575+u*24,890,185,int(t*5+1)%4),('pathkeeper',(765 if portrait else 790)+u*24,965,255,int(t*5+2)%4)]
 elif shot==5:
  placements=[('rider',380 if portrait else 280,930,240,0),('thrower',780 if portrait else 850,935,245,0),('pathkeeper',570,980,330,4)]
 for name,x,y,h,frame in sorted(placements,key=lambda a:a[2]):
  sx,sy=project(x,y);actor(im,name,sx,sy,h*scale,frame)
 # One planted standard in the dedicated raising scene; its base shares the courtyard projection.
 if shot==1:
  x,base=project(680,960);_,top=project(680,550);d=ImageDraw.Draw(im)
  d.line((x,top-12*scale,x,base),fill='#483b2b',width=max(4,int(7*scale)))
  d.line((x-scale,top-12*scale,x-scale,base),fill='#b69155',width=max(2,int(3*scale)))
  # A woven, folded standard uses the same warm/cool pigments as the painted company.
  def wave(q):return 6*scale*math.sin(t*1.5+q/45)
  for q in range(131):
   light=math.sin(q/14+t*.9)*7+math.sin(q*.83)*2
   color=(int(36+light),int(73+light),int(79+light))
   d.line((x+q*scale,top+wave(q),x+q*scale,top+100*scale+wave(q)),fill=color,width=max(1,math.ceil(scale)))
  edge=[(x+q*scale,top+wave(q)) for q in range(131)]
  lower=[(x+q*scale,top+100*scale+wave(q)) for q in range(131)]
  d.line(edge,fill='#b09a66',width=max(1,int(scale)))
  d.line(lower,fill='#172f34',width=max(2,int(2*scale)))
  d.line((x+130*scale,top+wave(130),x+130*scale,top+100*scale+wave(130)),fill='#172f34',width=max(2,int(2*scale)))
  for row in range(7,99,7):
   d.line([(x+q*scale,top+row*scale+wave(q)) for q in range(4,129)],fill='#2b5055',width=1)
  d.ellipse((x+53*scale,top+32*scale,x+75*scale,top+68*scale),fill='#c1a264',outline='#e0c080',width=max(1,int(scale)))
  contact=Image.new('RGBA',im.size);cd=ImageDraw.Draw(contact)
  cd.ellipse((x-16*scale,base-3*scale,x+24*scale,base+4*scale),fill=(25,22,17,125))
  im.alpha_composite(contact.filter(ImageFilter.GaussianBlur(2*scale)))

def scene(t,lang):
 shot=min(5,int(t//10));u=(t%10)/10; ease=u*u*(3-2*u)
 im,project,scale=ground_scene(t,W,H)
 ground_company(im,t,project,scale)
 d=ImageDraw.Draw(im,'RGBA')
 for i in range(24):
  x=(i*173+t*(5+i%4))%W;y=360+(i*197-t*(7+i%3))%950;r=2+i%3
  d.ellipse((x-r,y-r,x+r,y+r),fill=(255,199,112,45+i%4*18))
 # The authored foreground already supplies textured leaves and depth.
 im.alpha_composite(grade)
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
  sheet=Image.new('RGB',(1296,784),'#071922')
  for i,t in enumerate([3,15,25,35,45,57]):sheet.paste(scene(t,'en').resize((216,384)),(i*216,0));sheet.paste(scene(t,'ar').resize((216,384)),(i*216,400))
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
