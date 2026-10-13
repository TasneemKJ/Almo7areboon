# YouTube package — Almo7areboon

Prepared files only; nothing has been uploaded or published.

## English

Title: Almo7areboon — Those Who Walk Together | Cinematic Short

Description:
At dusk, a lamp becomes a promise. From quiet doorways, a small company gathers and takes the road together.

An original one-minute illustrated tale from Almo7areboon: a fictional Levantine storybook world of olive terraces, village lights and quiet courage.

English captions · Original instrumental score · No narration
The game itself is currently in English. An Arabic-captioned version of this film is also available in the prepared package.

Visual source: Almo7areboon's original AI-assisted storybook settlement, olive landscape and character sheets. Cinematic staging, animated standard, camera, light, captions and original procedural score were created for this film. See the repository CREDITS.md for the underlying game asset credits.

#Almo7areboon #IndieGame #CinematicShort

Movie: company-wide-en.mp4
Thumbnail: thumbnail-en.jpg
Optional caption upload: captions-en.srt

## العربية

العنوان: المحاربون — الذين يسيرون معًا | حكاية سينمائية قصيرة

الوصف:
عند الغروب، يصبح ضوء القنديل وعدًا. من عتبات هادئة، تجتمع سريّة صغيرة وتمضي على الطريق معًا.

حكاية مصوّرة أصلية من عالم «المحاربون»، في دقيقة واحدة: قرية خيالية بطابع مشرقي، وتلال الزيتون، وقناديل مضيئة، وشجاعة هادئة.

نص عربي على الشاشة · موسيقى أصلية · من دون تعليق صوتي
اللعبة نفسها متاحة حاليًا باللغة الإنجليزية. تتضمن الحزمة نسخة أخرى من الفيلم بنص إنجليزي.

المصادر البصرية: رسومات القرية والزيتون والشخصيات الأصلية، المُعدّة بمساعدة الذكاء الاصطناعي، في مشروع «المحاربون». أُعدّ التكوين السينمائي وحركة الراية والكاميرا والضوء والنص والموسيقى لهذا الفيلم. ترد تفاصيل أصول اللعبة في ملف CREDITS.md.

#المحاربون #لعبة_مستقلة #حكاية_قصيرة

الفيلم: company-wide-ar.mp4
الصورة المصغرة: thumbnail-ar.jpg
ملف الترجمة الاختياري: captions-ar.srt

## Export and production notes

Both films: 60 seconds, 1920×1080, 24 fps, H.264/yuv420p, AAC stereo 48 kHz, fast-start MP4. This is a native widescreen recomposition from authored scenery and transparent actors; it does not pad or enlarge the portrait movie. The thumbnails are separately staged at 1280×720, with a closer hero and larger title. Original portraits remain in public/film for the game player and portrait sharing.

Reproduce from the repository root with `python film/youtube.py --preview`, then `python film/youtube.py`. Use the same local dependencies/fonts as film/produce.py. `--lang en` or `--lang ar` exports one language. The script uses two ffmpeg threads. All deliverables stay outside public/ and the application's offline cache. Manifest hashes and metadata are recorded after successful encoding.

The film depicts fictional illustrated combatants without gore. No stock music, voice service, API credentials or remote render resources are used.

UTF-8 SRT files reproduce the six authored caption cues (each begins 0.45 seconds into its ten-second scene and ends at 9.7 seconds). The movie already includes readable captions; uploading the optional SRT gives viewers a selectable accessibility track. No speech is represented.

Verification: ffprobe confirmed both encodes at exactly 60.000 seconds, 1920×1080, 24fps, H.264 and 48kHz stereo AAC. The encoded score in both languages measured −15.52 LUFS integrated and −5.36 dBTP. Both movies receive SHA-256/ffprobe entries in `manifest.json`; inspect with `ffprobe -v error -show_format -show_streams company-wide-en.mp4` and `sha256sum company-wide-*.mp4` from this folder.

Final file sizes: English 18,191,814 bytes; Arabic 17,989,079 bytes. Both decoded cleanly through all 1,440 frames. Final English and Arabic closing frames were inspected for title placement, caption margins and glyph shaping.
