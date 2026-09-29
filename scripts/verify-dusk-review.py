"""Verify exported source compositions without opening a game or browser."""
import io
import json
import sys
from pathlib import Path
import cairosvg
from PIL import Image, ImageChops


def raster(path):
    return Image.open(io.BytesIO(cairosvg.svg2png(url=str(path)))).convert('RGB')


def main(folder):
    errors, scenes = [], []
    for age in range(6):
        before = raster(folder / f'before-{age}.svg')
        peaks = []
        for time in [0, 10, 20]:
            after = raster(folder / f'after-{age}-{time}.svg')
            difference = ImageChops.difference(before, after)
            peak = max(channel[1] for channel in difference.crop((0, 615, 900, 760)).getextrema())
            peaks.append(peak)
            if peak:
                errors.append(f'chapter {age}, time {time}: effect touched the combat road')
            if difference.getbbox() is None:
                errors.append(f'chapter {age}, time {time}: effect absent')
        reduced = raster(folder / f'reduced-{age}.svg')
        initial = raster(folder / f'after-{age}-0.svg')
        if ImageChops.difference(reduced, initial).getbbox() is not None:
            errors.append(f'chapter {age}: reduced composition changed')
        scenes.append({'age': age, 'road_change': max(peaks), 'times': [0, 10, 20]})
    report = {'kind': 'source pixel checks, not game/browser verification', 'compositions': 18,
              'reduced_compositions': 6, 'road_mask': [0, 615, 900, 760], 'scenes': scenes, 'errors': errors}
    (folder / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/verify-dusk-review.py EXPORTED_REVIEW_DIRECTORY')
    raise SystemExit(main(Path(sys.argv[1])))
