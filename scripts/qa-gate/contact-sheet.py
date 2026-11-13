# Side-by-side review sheets: en and ar of the same screen next to each other, 3 screens per sheet (6 tiles).
# python3 scripts/qa-gate/contact-sheet.py <OUT>
import sys, os, glob
from PIL import Image
out = sys.argv[1]
names = sorted({f[3:] for f in os.listdir(out) if f[:3] in ('en-', 'ar-') and f[3:5].isdigit()})
names.sort(key=lambda n: int(n.split('-')[0]))
W, H = 585, 1266
for i in range(0, len(names), 3):
    group = names[i:i + 3]
    sheet = Image.new('RGB', (W * 2 * len(group) + 10 * (2 * len(group) - 1), H), 'white')
    x = 0
    for n in group:
        for lang in ('en', 'ar'):
            p = os.path.join(out, f'{lang}-{n}')
            if os.path.exists(p):
                sheet.paste(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS), (x, 0))
            x += W + 10
    sheet.save(os.path.join(out, 'sheets', f'sheet-{i // 3:02d}.png'))
    print(f'sheet-{i // 3:02d}', group)
