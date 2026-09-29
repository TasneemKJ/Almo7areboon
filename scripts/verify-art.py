"""Standalone SVG raster QA. Requires Pillow and CairoSVG; never opens a browser.
Run export-art-review.mjs first, then: python scripts/verify-art.py OUTPUT_DIRECTORY
"""
import io
import json
import sys
from pathlib import Path

try:
    import cairosvg
    from PIL import Image, ImageChops
except ImportError as error:
    raise SystemExit('Asset QA needs Pillow and CairoSVG in the local Python environment.') from error


def raster(svg: str) -> Image.Image:
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode('utf-8')))).convert('RGBA')


def bounds(image: Image.Image):
    return image.getchannel('A').point(lambda value: 255 if value > 20 else 0).getbbox()


def main(directory: Path) -> int:
    manifest = json.loads((directory / 'review.json').read_text())
    errors = []
    sheets = {}
    frame_count = 0
    for frame in manifest['frames']:
        key = (frame['age'], frame['kind'], frame['side'])
        if key not in sheets:
            filename = f'sheet-{key[0]}-{key[1]}-{key[2]}.svg'
            sheets[key] = raster((directory / filename).read_text())
        image = raster(frame['svg'])
        box = bounds(image)
        if not box or box[0] < 2 or box[1] < 2 or box[2] > 126 or box[3] > 142:
            errors.append({'frame': [*key, frame['frame']], 'problem': 'sampling margin', 'bounds': box})
        x = frame['frame'] * 128
        cell = sheets[key].crop((x, 0, x + 128, 144))
        difference = ImageChops.difference(cell.getchannel('A'), image.getchannel('A')).getextrema()[1]
        if difference > 3:
            errors.append({'frame': [*key, frame['frame']], 'problem': 'atlas alpha mismatch', 'difference': difference})
        frame_count += 1
    for base in manifest['bases']:
        box = bounds(raster(base['svg']))
        if not box or box[0] < 2 or box[1] < 2 or box[2] > 158 or box[3] > 158:
            errors.append({'base': [base['age'], base['side']], 'problem': 'sampling margin', 'bounds': box})
        if 'opacity=".25"' not in base['svg']:
            errors.append({'base': [base['age'], base['side']], 'problem': 'missing contact shadow'})
    for card in manifest['cards']:
        if not bounds(raster(card['svg'])):
            errors.append({'card': card['name'], 'problem': 'empty image'})
    result = {'kind': 'standalone asset QA, not browser verification', 'frames': frame_count,
              'sheets': len(sheets), 'bases': len(manifest['bases']), 'cards': len(manifest['cards']),
              'errors': errors}
    (directory / 'asset-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/verify-art.py OUTPUT_DIRECTORY')
    raise SystemExit(main(Path(sys.argv[1])))
