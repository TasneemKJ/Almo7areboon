"""Preflight and emit <=3 untouched CSS-pixel PNGs in <3.75 MiB text per job."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import sys

EXPECTED_SOURCE = '3436810726aae06b728160b8f8c797fdb2fbae15'
VIEWPORTS = {'390x844': (390, 844), '844x390': (844, 390), '1280x800': (1280, 800)}
MAX_TEXT_BYTES = 3_932_160  # 3.75 MiB; leave headroom below the connector's 4 MiB job-log cap.
root = Path(sys.argv[1]).resolve()
manifest_path = root / 'review-manifest.json'
if not manifest_path.is_file():
    raise SystemExit('No canonical screenshot manifest was produced.')
manifest = json.loads(manifest_path.read_text())
if manifest['sourceCommit'] != EXPECTED_SOURCE or os.environ['SOURCE_SHA'] != EXPECTED_SOURCE:
    raise SystemExit('Screenshot source is not the requested immutable baseline.')
if not re.fullmatch('[0-9a-f]{40}', manifest['sourceTree']):
    raise SystemExit('Missing exact source tree identity.')
viewport = os.environ['REVIEW_VIEWPORT']
if viewport not in VIEWPORTS or manifest['viewportName'] != viewport or manifest['revision'] != 'baseline':
    raise SystemExit('Screenshot job identity is inconsistent.')
selected = [row for row in manifest['images'] if row.get('transport')]
if not selected or len(selected) > 3 or len({row['path'] for row in selected}) != len(selected):
    raise SystemExit('Expected one to three unique explicitly selected originals.')

# Validate the whole batch before emitting any PNG payload: never truncate, resize or recompress.
lines = ['SCENE_REVIEW_MANIFEST ' + json.dumps(manifest, separators=(',', ':'))]
for row in selected:
    path = (root / row['path']).resolve()
    if path.parent != root or path.suffix != '.png' or Path(row['path']).name != row['path']:
        raise SystemExit('Screenshot path escapes the flat review directory.')
    data = path.read_bytes()
    if len(data) < 24 or len(data) > 3 * 1024 * 1024 or data[:8] != b'\x89PNG\r\n\x1a\n':
        raise SystemExit('Original PNG is invalid or exceeds the bounded transport budget.')
    width, height = struct.unpack('>II', data[16:24])
    if (width, height) != VIEWPORTS[viewport] or row.get('screenshotScale') != 'css':
        raise SystemExit('Original PNG must match the exact CSS-pixel viewport.')
    if row['viewport'] != {'width': width, 'height': height}:
        raise SystemExit('Original PNG viewport metadata does not match its dimensions.')
    if hashlib.sha256(data).hexdigest() != row['sha256'] or len(data) != row['bytes']:
        raise SystemExit('Original screenshot bytes changed after capture.')
    encoded = base64.b64encode(data).decode('ascii')
    meta = {**row, 'sourceCommit': manifest['sourceCommit'], 'sourceTree': manifest['sourceTree'],
            'revision': manifest['revision'], 'workflowCommit': os.environ['GITHUB_SHA'],
            'runId': os.environ.get('GITHUB_RUN_ID'), 'width': width, 'height': height,
            'bytes': len(data), 'purpose': 'canonical-game', 'base64Length': len(encoded)}
    lines.append('SCENE_IMAGE_BEGIN ' + json.dumps(meta, separators=(',', ':')))
    lines.extend('SCENE_IMAGE_DATA ' + encoded[offset:offset + 12000]
                 for offset in range(0, len(encoded), 12000))
    lines.append('SCENE_IMAGE_END ' + row['path'])
text = '\n'.join(lines) + '\n'
# Reserve 40 bytes per line for the timestamp Actions prefixes to log lines.
bounded_log_bytes = len(text.encode('utf-8')) + 40 * len(lines)
if bounded_log_bytes > MAX_TEXT_BYTES:
    print('SCENE_REVIEW_MANIFEST ' + json.dumps(manifest, separators=(',', ':')), flush=True)
    raise SystemExit(f'Originals need {bounded_log_bytes} log bytes; refuse above {MAX_TEXT_BYTES} without altering them.')
sys.stdout.write(text)
sys.stdout.flush()
