# Those who walk together

Original one-minute Almo7areboon company tale, in English and Arabic. The authored settlement, olive terraces and character sheets remain the source of truth. Six scenes: a lit doorway; a planted standard unfurling; gathering; walking the terrace road; distant footsteps; standing together. Captions are original. No real politics, gore, stock music, narration, remote resources or credentials.

## Reproduce

From the repository root, run `python film/produce.py --preview`, then `python film/produce.py`. Requirements: Python 3, Pillow with RAQM and NumPy (`python -m pip install -r film/requirements.txt`), ffmpeg/libx264, DejaVu Serif and Noto Naskh Arabic system fonts. The script draws at native 1080×1920, 24 fps, emits H.264/yuv420p plus AAC stereo, and normalizes its original procedural score to -16 LUFS / -1.5 dBTP. Two encoding threads limit shared-machine contention. `--lang en` / `--lang ar` regenerate one version. Outputs are `public/film/company-en.mp4`, `company-ar.mp4` and `poster.jpg`; preview is `/tmp/mohareboon-contact.jpg`. The temporary generated WAV is removed after success.

The game build does not require Python or rerender the movies. `npm ci --cache /workspace/.onboarding/npm-cache`, `npm test`, `npm run build` use the committed lockfile. The optional movies are requested only after Play film, excluded from service-worker caching; they do not inflate the JavaScript budget or app boot. Offline gameplay stays available; optional unrequested films need a connection.

Open Settings → Watch film · EN / العربية. Language applies to this film, not game localization. Controls support play/pause, seeking, restart and Close. Escape returns to Preferences, restoring the Watch film focus; Preferences preserves its Home/field-pause origin. Hidden tabs pause and require a deliberate resume. Sound uses the game's master switch and atmosphere volume; native media controls can be adjusted deliberately. Opening replay stays under Watch intro, with the existing once-only save preference and reduced-motion still mode.

## Verification

See `docs/audits/2026-10-12-company-cinema.md` for the design review. Verification on 2026-10-12: all 1,452 repository tests passed, followed by 24 focused introduction/film/architecture checks after the final accessibility adjustment. Production build passed its 500 KiB JavaScript budget (486.2 KiB gzip). `git diff --check` passed.

Run the acceptance script against `npm run preview -- --port 4215 --strictPort` using `flock /tmp/browser.lock /workspace/.onboarding/venvs/Al-bayyara/bin/python scripts/verify-company-cinema.py` (or any Python environment with Playwright and Chromium). The script checks both actual movie languages at 320×568, 360×640, 390×844, 412×915, 844×390 and 1280×800, including 4× CPU throttling at 390px. Checks cover lazy requests, no movie in service-worker caches, playback, seeking, native Space/arrows/Tab controls, ended/restart, Escape/Close, focus restoration, target sizes, overflow and unchanged saved progress. Lifecycle checks cover reduced motion, Arabic opening/skip, session language replay, field-pause restoration, network failure/retry, background pause, rotation, once-only reload and cross-tab session-conflict media disposal. The existing periodic `lastSeen` timestamp is excluded from the saved-progress comparison.

Evidence is written to `/tmp/mohareboon-cinema/results.json` and twelve viewport/language PNGs; these temporary machine-local files are not required by the game. Final frames were visually reviewed for authored-art fidelity and Arabic glyph shaping. Physical-device and Safari validation are separate from Chromium automation.

The shipped encodes are inventoried with SHA-256 and ffprobe metadata in `manifest.json`. Both are exactly 60.000 seconds, 1080×1920 H.264 with 48 kHz stereo AAC: English 14,765,689 bytes, Arabic 14,614,324 bytes. Final encoded score measured -15.53 LUFS integrated and -5.40 dBTP. The final ten seconds carry the game name in the selected language above the story title; `produce.py` includes that composition natively. The player uses a full-viewport variant of the existing modal, preserves native media Tab traversal with a boundary focus sentinel, and provides a localized screen-reader transcript.

## Widescreen publication package

`python film/youtube.py --preview` prepares a six-scene bilingual contact sheet and separately composed 1280×720 thumbnails. `python film/youtube.py` renders the native 1920×1080 English/Arabic films into `film/youtube/`. This version rearranges scenery, company planes, foreground and titles for widescreen, retaining the original score. Upload copy and credits are in `film/youtube/UPLOAD.md`. No upload or publication is performed.

Final widescreen exports: English 18,191,814 bytes and Arabic 17,989,079 bytes. Both are exactly 60 seconds, 1920×1080, 24fps H.264/AAC stereo, and decoded cleanly through 1,440 frames. Both score tracks measure −15.52 LUFS / −5.36 dBTP. `film/youtube/manifest.json` records verified SHA-256 values and ffprobe metadata.
