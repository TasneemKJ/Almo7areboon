"""Native widescreen recomposition of the company tale; no portrait-frame reuse."""
import argparse,hashlib,json,math,pathlib,subprocess
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import produce as p
W,H=1920,1080;OUT=p.ROOT/'film/youtube';OUT.mkdir(exist_ok=True)

def textlayer(text,lang,size,y,color='#fff0d2'):
 im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im);f=ImageFont.truetype(p.fontar if lang=='ar' else p.fonten,size)
 d.text((W/2,y),text,font=f,fill=color,anchor='mm',direction='rtl' if lang=='ar' else 'ltr',stroke_width=1,stroke_fill=color)
 return im
caps={lang:[textlayer(s,lang,59 if lang=='ar' else 48,936) for s in lines] for lang,lines in [('en',p.EN),('ar',p.AR)]}
grade=Image.new('RGBA',(W,H));d=ImageDraw.Draw(grade)
for y in range(H):
 a=int(220*max(0,(y-710)/370)**.7) if y>710 else int(90*max(0,1-y/330))
 d.line((0,y,W,y),fill=(5,21,31,a))

def scene(t,lang):
 shot=min(5,int(t//10));u=t%10/10;e=u*u*(3-2*u)
 plate=p.plates['olive' if shot in [2,3] else 'village'];zoom=[1.02,1.25,1.05,1.12,1.27,1.02][shot]+.055*e
 cw=plate.width/zoom;ch=cw*H/W;cx=plate.width*.5+(e-.5)*plate.width*(1-1/zoom)*.8
 cy=plate.height*[.40,.59,.53,.54,.38,.43][shot]+(e-.5)*32
 cy=max(ch/2,min(plate.height-ch/2,cy))
 im=plate.crop((cx-cw/2,cy-ch/2,cx+cw/2,cy+ch/2)).resize((W,H),Image.Resampling.BICUBIC).convert('RGBA')
 # Warm moving light across the illustrated village, independent of the camera.
 light=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(light)
 for k in range(5):
  x=170+k*345+e*18;y=380+(k%2)*100;r=48+5*math.sin(t*.7+k)
  ld.ellipse((x-r,y-r,x+r,y+r),fill=(255,172,64,22))
 im.alpha_composite(light.filter(ImageFilter.GaussianBlur(35)))
 if shot==0:
  p.actor(im,'pathkeeper',1430-e*140,870,360,int(t*5)%4)
  p.actor(im,'thrower',1690-e*60,890,280,0)
 elif shot==1:
  p.actor(im,'pathkeeper',630+e*35,930,850,4)
  p.actor(im,'thrower',1380-e*40,835,330,0)
 elif shot==2:
  for i,n in enumerate(['rider','thrower','pathkeeper']):p.actor(im,n,420+i*500+e*80,840+i*30,410+i*65,int(t*5+i)%4)
 elif shot==3:
  for i,n in enumerate(['thrower','rider','pathkeeper']):p.actor(im,n,350+i*550+e*65,880-i*40,540-i*55,int(t*5+i)%4)
 elif shot==4:
  p.actor(im,'pathkeeper',435+e*20,950,700,4)
 else:
  p.actor(im,'rider',390-e*15,900,510,0);p.actor(im,'thrower',1310+e*15,900,560,0);p.actor(im,'pathkeeper',960,950,690,4)
 if shot in [1,3,5]:
  x=[0,1040,0,1590,0,1570][shot];y=190 if shot==1 else 290;dd=ImageDraw.Draw(im)
  dd.line((x,y-35,x,900),fill='#b69155',width=12)
  points=[(x,y)]+[(x+q,y+14*math.sin(t*1.5+q/95)) for q in range(0,330,15)]+[(x+q,y+230+14*math.sin(t*1.5+q/95)) for q in range(315,-1,-15)]
  dd.polygon(points,fill='#24505c');dd.line(points[1:23],fill='#d7b368',width=5);dd.ellipse((x+135,y+75,x+183,y+150),fill='#edcb7b')
 d=ImageDraw.Draw(im)
 for i in range(34):
  x=(i*173+t*(5+i%4))%W;y=100+(i*197-t*(7+i%3))%780;r=2+i%3
  d.ellipse((x-r,y-r,x+r,y+r),fill=(255,199,112,65))
 fg=Image.new('RGBA',(W,H));fd=ImageDraw.Draw(fg)
 for side in [0,1]:
  for i in range(5):
   x=(i*30-60+math.sin(t*.22)*10) if side==0 else W-(i*30-60+math.sin(t*.22)*10)
   fd.ellipse((x-60,660+i*70,x+80,1000+i*70),fill=(8,24,30,210))
 im.alpha_composite(fg);im.alpha_composite(grade)
 if shot==5:
  im.alpha_composite(textlayer('المحاربون' if lang=='ar' else 'ALMO7AREBOON',lang,108 if lang=='ar' else 84,112,'#f0ce87'))
  im.alpha_composite(textlayer('الذين يسيرون معًا' if lang=='ar' else 'Those who walk together',lang,67 if lang=='ar' else 53,218))
 op=min(1,max(0,(t%10-.45)/.7),max(0,(9.7-t%10)/.6));cap=caps[lang][shot].copy();cap.putalpha(cap.getchannel('A').point(lambda a:int(a*op)));im.alpha_composite(cap)
 fade=min(1,t%10/.5,(10-t%10)/.45,t/.7,(60-t)/1.3)
 if fade<1:im=Image.blend(Image.new('RGBA',(W,H),'#071922'),im,max(0,fade))
 return im.convert('RGB')

def thumbnail(lang):
 plate=p.plates['village'];im=plate.crop((0,120,plate.width,120+plate.width*9/16)).resize((W,H)).convert('RGBA')
 shade=Image.new('RGBA',(W,H));d=ImageDraw.Draw(shade)
 for x in range(W):d.line((x,0,x,H),fill=(5,21,31,int(230*max(0,1-x/1500))))
 im.alpha_composite(shade);p.actor(im,'rider',1680,1100,590,0);p.actor(im,'pathkeeper',1390,1120,1050,4)
 d=ImageDraw.Draw(im)
 lines=['المحاربون','نسير معًا'] if lang=='ar' else ['ALMO7AREBOON','WALK TOGETHER']
 for y,txt,size,color in [(330,lines[0],100 if lang=='ar' else 81,'#f0ce87'),(505,lines[1],113 if lang=='ar' else 83,'#fff0d2')]:
  f=ImageFont.truetype(p.fontar if lang=='ar' else p.fonten,size);d.text((560,y),txt,font=f,fill=color,anchor='mm',direction='rtl' if lang=='ar' else 'ltr')
 return im.convert('RGB').resize((1280,720),Image.Resampling.LANCZOS)

def preview():
 for lang,lines in [('en',p.EN),('ar',p.AR)]:
  cues=[]
  for i,line in enumerate(lines):
   start=i*10;end=start+9
   cues.append(f'{i+1}\n00:00:{start:02d},450 --> 00:00:{end:02d},700\n{line}\n')
  (OUT/f'captions-{lang}.srt').write_text('\n'.join(cues),encoding='utf-8')
 sheet=Image.new('RGB',(960,1350),'#071922')
 for i,t in enumerate([3,15,30.9,45,57]):
  for j,lang in enumerate(['en','ar']):sheet.paste(scene(t,lang).resize((480,270)),(j*480,i*270))
 sheet.save(OUT/'contact-sheet.jpg',quality=90)
 for lang in ['en','ar']:
  scene(57,lang).save(OUT/f'preview-{lang}.jpg',quality=94)
  thumbnail(lang).save(OUT/f'thumbnail-{lang}.jpg',quality=95)

def render(lang):
 score=p.audio();target=OUT/f'company-wide-{lang}.mp4';temp=OUT/f'{lang}.render.mp4'
 cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','24','-i','pipe:0','-i',str(score),'-c:v','libx264','-threads','2','-preset','fast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','192k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-t','60','-movflags','+faststart',str(temp)]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for frame in range(1440):
  proc.stdin.write(scene(frame/24,lang).tobytes())
  if frame%240==0:print(lang,frame/24,flush=True)
 proc.stdin.close()
 if proc.wait():raise RuntimeError('encode failed')
 temp.replace(target);score.unlink()
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--preview',action='store_true');a.add_argument('--lang',choices=['en','ar','both'],default='both');args=a.parse_args();preview()
 if not args.preview:
  for lang in (['en','ar'] if args.lang=='both' else [args.lang]):render(lang)
  meta={}
  for file in OUT.glob('*.mp4'):
   meta[file.name]={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),**json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels','-of','json',str(file)]))}
  (OUT/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
