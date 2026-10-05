"""Emit a bounded allowlist of untouched PNG bytes from review-manifest.json."""
import base64
import hashlib
import json
import os
from pathlib import Path
import struct
import sys

root = Path(sys.argv[1]).resolve()
manifest_path = root / 'review-manifest.json'
if not manifest_path.is_file():
    raise SystemExit('No canonical screenshot manifest was produced.')
manifest = json.loads(manifest_path.read_text())
if manifest['sourceCommit'] != os.environ['SOURCE_SHA']:
    raise SystemExit('Screenshot source does not match the checked-out source.')
print('SCENE_REVIEW_MANIFEST ' + json.dumps(manifest, separators=(',', ':')), flush=True)
selected = [row for row in manifest['images'] if row.get('transport')]
if not selected or len(selected) > 6:
    raise SystemExit('Expected one to six explicitly selected originals.')
total = 0
for row in selected:
    path = (root / row['path']).resolve()
    if not path.is_relative_to(root) or path.suffix != '.png':
        raise SystemExit('Screenshot path escapes review directory.')
    data = path.read_bytes()
    total += len(data)
    if len(data) > 4 * 1024 * 1024 or total > 20 * 1024 * 1024 or data[:8] != b'\x89PNG\r\n\x1a\n':
        raise SystemExit('Original PNG exceeds the bounded transport budget.')
    width, height = struct.unpack('>II', data[16:24])
    digest = hashlib.sha256(data).hexdigest()
    if digest != row['sha256']:
        raise SystemExit('Original screenshot hash changed after capture.')
    encoded = base64.b64encode(data).decode('ascii')
    meta = {**row, 'sourceCommit': manifest['sourceCommit'], 'sourceTree': manifest['sourceTree'],
            'revision': manifest['revision'], 'workflowCommit': os.environ['GITHUB_SHA'],
            'runId': os.environ.get('GITHUB_RUN_ID'), 'width': width, 'height': height,
            'bytes': len(data), 'purpose': 'canonical-game', 'base64Length': len(encoded)}
    print('SCENE_IMAGE_BEGIN ' + json.dumps(meta, separators=(',', ':')), flush=True)
    for offset in range(0, len(encoded), 12000):
        print('SCENE_IMAGE_DATA ' + encoded[offset:offset + 12000], flush=True)
    print('SCENE_IMAGE_END ' + row['path'], flush=True)
