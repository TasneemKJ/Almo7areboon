"""Verify a complete raw Actions job log, then extract byte-identical PNG originals. No recompression."""
import base64
import hashlib
import json
from pathlib import Path
import struct
import sys

MAX_JOB_BYTES = 3_932_160
CANDIDATE_SHA = '7c5554e827c98107da1aaf0bb8d7f0f3bd74c9c1'
CANDIDATE_TREE = 'e12c7d4e13378e5c41d7f1b23ff5f75b682680ef'
BASELINE_SHA = 'd9dd1dcd1c5c4a4bb6cdd44641e73f8dd07f4003'

def verify(raw):
    if len(raw) >= MAX_JOB_BYTES:
        raise ValueError('Raw job text reaches/exceeds 3.75 MiB; truncation or budget failure cannot be accepted.')
    manifests, images, transport, pending, chunks = [], [], None, None, []
    for line in raw.decode('utf-8', errors='strict').splitlines():
        if 'SCENE_REVIEW_MANIFEST ' in line:
            manifests.append(json.loads(line.split('SCENE_REVIEW_MANIFEST ', 1)[1]))
        elif 'SCENE_IMAGE_BEGIN ' in line:
            if pending is not None:
                raise ValueError('Nested image header or missing image footer.')
            pending = json.loads(line.split('SCENE_IMAGE_BEGIN ', 1)[1]); chunks = []
        elif 'SCENE_IMAGE_DATA ' in line:
            if pending is None:
                raise ValueError('Image data outside a complete image.')
            chunks.append(line.split('SCENE_IMAGE_DATA ', 1)[1])
        elif 'SCENE_IMAGE_END ' in line:
            if pending is None or line.split('SCENE_IMAGE_END ', 1)[1] != pending['path']:
                raise ValueError('Image footer mismatch.')
            encoded = ''.join(chunks)
            if len(encoded) != pending['base64Length']:
                raise ValueError('Base64 payload incomplete.')
            data = base64.b64decode(encoded, validate=True)
            if len(data) != pending['bytes'] or hashlib.sha256(data).hexdigest() != pending['sha256']:
                raise ValueError('PNG original hash/length mismatch.')
            if len(data) < 24 or data[:8] != b'\x89PNG\r\n\x1a\n':
                raise ValueError('Invalid PNG signature.')
            dimensions = struct.unpack('>II', data[16:24])
            if dimensions != (pending['width'], pending['height']) or pending['viewport'] != dict(zip(('width','height'), dimensions)) or pending['screenshotScale'] != 'css':
                raise ValueError('PNG CSS-pixel dimensions mismatch.')
            if Path(pending['path']).name != pending['path'] or not pending['path'].endswith('.png'):
                raise ValueError('Unsafe image path.')
            images.append((pending, data)); pending = None
        elif 'SCENE_TRANSPORT_VERIFIED ' in line:
            if transport is not None:
                raise ValueError('More than one transport batch in job.')
            transport = json.loads(line.split('SCENE_TRANSPORT_VERIFIED ', 1)[1])
    if pending is not None or transport is None:
        raise ValueError('Complete transport terminator is missing; truncated evidence rejected.')
    if not 1 <= len(images) <= 3 or transport['images'] != len(images) or transport['manifests'] != len(manifests):
        raise ValueError('Transport count mismatch.')
    if len({meta['path'] for meta, _ in images}) != len(images):
        raise ValueError('Duplicate image output path.')
    for manifest in manifests:
        if manifest['revision'] not in ('candidate', 'baseline') or manifest['sourceCommit'] != (CANDIDATE_SHA if manifest['revision'] == 'candidate' else BASELINE_SHA):
            raise ValueError('Unexpected product source in downloaded job log.')
        if manifest['revision'] == 'candidate' and manifest['sourceTree'] != CANDIDATE_TREE:
            raise ValueError('Unexpected candidate source tree in downloaded job log.')
    for meta, _ in images:
        matches = [m for m in manifests if m['sourceCommit'] == meta['sourceCommit'] and m['sourceTree'] == meta['sourceTree'] and m['revision'] == meta['revision'] and m['workflowCommit'] == meta['workflowCommit']]
        if len(matches) != 1 or not any(row['path'] == meta['path'] and row['sha256'] == meta['sha256'] for row in matches[0]['images']):
            raise ValueError('Image provenance does not match one canonical manifest.')
    return manifests, images, transport

if __name__ == '__main__':
    try:
        raw = Path(sys.argv[1]).read_bytes()
        manifests, images, transport = verify(raw)
        output = Path(sys.argv[2]); output.mkdir(parents=True, exist_ok=True)
        for meta, data in images:
            (output / meta['path']).write_bytes(data)
        for manifest in manifests:
            (output / f"{manifest['revision']}-review-manifest.json").write_text(json.dumps(manifest, indent=2))
        print(json.dumps({'rawJobLogBytes':len(raw),'originalsVerified':True,'imageCount':len(images),'images':[m for m,_ in images],
                          'nativeStatus':{m['revision']:m.get('executionStatus','unreported') for m in manifests},'paintedAcceptance':'pending-human-original-pixel-review'},indent=2))
    except (ValueError, KeyError, OSError, json.JSONDecodeError, IndexError) as error:
        raise SystemExit(f'JOB_LOG_REJECTED {error}')
