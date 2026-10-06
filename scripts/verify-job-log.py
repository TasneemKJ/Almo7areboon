"""Verify a complete raw Actions job log, then extract byte-identical PNG originals. No recompression."""
import base64
import hashlib
import json
from pathlib import Path
import struct
import re
import sys

MAX_JOB_BYTES = 3_932_160
PINS = json.loads((Path(__file__).parent.parent / 'source-pins.json').read_text())
CANDIDATE_SHA = PINS['candidateSha']
CANDIDATE_TREE = PINS['candidateTree']
BASELINE_SHA = PINS['baselineSha']
BASELINE_TREE = PINS['baselineTree']

def verify(raw, candidate=CANDIDATE_SHA, tree=CANDIDATE_TREE, workflow=None, case=None):
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
    if not manifests:
        raise ValueError('No canonical source manifests.')
    cases = {m['reviewCase'] for m in manifests}
    if len(cases) != 1 or next(iter(cases)) not in ('camp-390', 'camp-320-rotate', 'preferences-home-390'):
        raise ValueError('Mixed or invalid job case.')
    actual_case = next(iter(cases))
    expected_revisions = ['baseline', 'candidate'] if actual_case == 'camp-390' else ['candidate']
    if [m['revision'] for m in manifests] != expected_revisions:
        raise ValueError('Missing or duplicate source revision.')
    if case is not None and actual_case != case:
        raise ValueError('Unexpected requested job case.')
    workflows = {m['workflowCommit'] for m in manifests}
    if len(workflows) != 1 or not re.fullmatch('[0-9a-f]{40}', next(iter(workflows))):
        raise ValueError('Mixed or invalid workflow identity.')
    if workflow is not None and workflows != {workflow}:
        raise ValueError('Unexpected requested workflow SHA.')
    if actual_case == 'camp-390' and (len({m.get('fixtureSha256') for m in manifests}) != 1 or not re.fullmatch('[0-9a-f]{64}', manifests[0].get('fixtureSha256', ''))):
        raise ValueError('Mismatched returning-profile fixture.')
    for manifest in manifests:
        if manifest['revision'] not in ('candidate', 'baseline') or manifest['sourceCommit'] != (candidate if manifest['revision'] == 'candidate' else BASELINE_SHA):
            raise ValueError('Unexpected product source in downloaded job log.')
        if manifest['sourceTree'] != (tree if manifest['revision'] == 'candidate' else BASELINE_TREE):
            raise ValueError('Unexpected candidate source tree in downloaded job log.')
    for meta, _ in images:
        if meta['reviewCase'] != actual_case:
            raise ValueError('Image job identity mismatch.')
        allowed = {(320,568),(844,390)} if actual_case == 'camp-320-rotate' else {(390,844)}
        if (meta['width'],meta['height']) not in allowed:
            raise ValueError('Image rotation allowlist mismatch.')
        matches = [m for m in manifests if m['sourceCommit'] == meta['sourceCommit'] and m['sourceTree'] == meta['sourceTree'] and m['revision'] == meta['revision'] and m['workflowCommit'] == meta['workflowCommit']]
        if len(matches) != 1 or not any(row['path'] == meta['path'] and row['sha256'] == meta['sha256'] for row in matches[0]['images']):
            raise ValueError('Image provenance does not match one canonical manifest.')
    return manifests, images, transport

if __name__ == '__main__':
    try:
        raw = Path(sys.argv[1]).read_bytes()
        if len(sys.argv) != 5 or not re.fullmatch('[0-9a-f]{40}', sys.argv[3]):
            raise ValueError('Usage: verify-job-log.py RAW_LOG OUTPUT_DIR EXPECTED_WORKFLOW_SHA REVIEW_CASE')
        manifests, images, transport = verify(raw, workflow=sys.argv[3], case=sys.argv[4])
        output = Path(sys.argv[2]); output.mkdir(parents=True, exist_ok=True)
        for meta, data in images:
            (output / meta['path']).write_bytes(data)
        for manifest in manifests:
            (output / f"{manifest['revision']}-review-manifest.json").write_text(json.dumps(manifest, indent=2))
        print(json.dumps({'rawJobLogBytes':len(raw),'originalsVerified':True,'imageCount':len(images),'images':[m for m,_ in images],
                          'nativeStatus':{m['revision']:m.get('executionStatus','unreported') for m in manifests},'paintedAcceptance':'pending-human-original-pixel-review'},indent=2))
    except (ValueError, KeyError, OSError, json.JSONDecodeError, IndexError) as error:
        raise SystemExit(f'JOB_LOG_REJECTED {error}')
