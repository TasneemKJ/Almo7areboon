"""Source-art composition checks only. Not browser, accessibility or device acceptance."""
import io
import json
import sys
from pathlib import Path
import cairosvg
from PIL import Image, ImageStat


def raster(path):
    return Image.open(io.BytesIO(cairosvg.svg2png(url=str(path)))).convert('RGBA')


def luminance(image):
    channels = ImageStat.Stat(image.convert('RGB')).mean
    linear = [v / 255 / 12.92 if v / 255 <= .04045 else ((v / 255 + .055) / 1.055) ** 2.4 for v in channels]
    return sum(v * weight for v, weight in zip(linear, [.2126, .7152, .0722]))


def main(folder):
    results, errors = [], []
    for age in range(6):
        world = raster(folder / f'world-{age}.svg')
        overlay = raster(folder / f'foreground-{age}.svg')
        # Foreground is half-size, with its source-space top at y=560.
        road_alpha = overlay.getchannel('A').crop((72, 25, 378, 95)).getextrema()[1]
        road = luminance(world.crop((200, 650, 700, 725)))
        near_ground = luminance(world.crop((200, 770, 700, 815)))
        contrast = (road + .05) / (near_ground + .05)
        item = {'age': age, 'world_size': list(world.size), 'road_overlay_alpha': road_alpha,
                'road_luminance': round(road, 4), 'road_vs_near_ground': round(contrast, 3)}
        results.append(item)
        if world.size != (900, 1000) or world.getchannel('A').getextrema()[0] != 255:
            errors.append(f'chapter {age}: uncovered source canvas')
        if road_alpha != 0:
            errors.append(f'chapter {age}: foreground covers central combat corridor')
        if road < .16 or contrast < 1.3:
            errors.append(f'chapter {age}: dusk road lost its source-art contrast budget')
    report = {'kind': 'source-art heuristics, not browser or WCAG verification', 'scenes': results, 'errors': errors}
    (folder / 'scene-verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/verify-levantine-scenes.py EXPORTED_ASSET_DIRECTORY')
    raise SystemExit(main(Path(sys.argv[1])))
