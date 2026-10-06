"""Atomic job-wide transport: <=3 untouched CSS-pixel PNGs; all manifests preflighted before emission."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import sys

MAX_JOB_BYTES = 3_932_160  # Strictly below 3.75 MiB including timestamp estimates and reserved workflow output.
RESERVED_OTHER_LOG_BYTES = 524_288
MAX_TRANSPORT_BYTES = MAX_JOB_BYTES - RESERVED_OTHER_LOG_BYTES
CASE_VIEWPORT = {'camp-390': '390x844', 'camp-320-rotate': '320x568', 'preferences-home-390': '390x844'}
DIMENSIONS = {'390x844': {(390, 844)}, '320x568': {(320, 568), (844, 390)}}
BASELINE_TREE = '49bb9cf35feda86a15797573d1e2df4b756065dd'
BASELINE_SHA = '53f7bf91db2589e5590c890636c51e5f972b0269'

def require(condition, message):
    if not condition:
        raise ValueError(message)

def encode_batch(roots, env):
    candidate = env['SOURCE_SHA']
    candidate_tree = env['SOURCE_TREE']
    case = env['REVIEW_CASE']
    workflow = env['GITHUB_SHA']
    require(re.fullmatch('[0-9a-f]{40}', candidate), 'Missing exact candidate source commit.')
    require(re.fullmatch('[0-9a-f]{40}', candidate_tree), 'Missing exact candidate source tree.')
    require(re.fullmatch('[0-9a-f]{40}', workflow), 'Missing exact workflow commit.')
    require(case in CASE_VIEWPORT, 'Unexpected review case.')
    manifests, selected, revisions = [], [], []
    for root in roots:
        root = Path(root).resolve()
        manifest = json.loads((root / 'review-manifest.json').read_text())
        revision = manifest['revision']
        require(revision in ('baseline', 'candidate'), 'Unknown source revision.')
        revisions.append(revision)
        require(manifest['sourceCommit'] == (BASELINE_SHA if revision == 'baseline' else candidate), 'Screenshot source mismatch.')
        require(manifest['sourceTree'] == (BASELINE_TREE if revision == 'baseline' else candidate_tree), 'Exact source tree mismatch.')
        require(manifest['workflowCommit'] == workflow, 'Workflow source mismatch.')
        require(manifest['reviewCase'] == case and manifest['viewportName'] == CASE_VIEWPORT[case], 'Job identity mismatch.')
        require(re.fullmatch('[0-9a-f]{64}', manifest['buildTreeSha256']), 'Missing build identity.')
        require(manifest['harnessFilesSha256'] and all(re.fullmatch('[0-9a-f]{64}', h) for h in manifest['harnessFilesSha256'].values()), 'Missing harness file hashes.')
        manifests.append(manifest)
        for row in manifest['images']:
            if row.get('transport'):
                selected.append((root, manifest, row))
    expected_revisions = ['baseline', 'candidate'] if case == 'camp-390' else ['candidate']
    require(revisions == expected_revisions, 'Expected one exact batch of job manifests in baseline/candidate order.')
    if case == 'camp-390':
        require(len({m.get('fixtureSha256') for m in manifests}) == 1 and re.fullmatch('[0-9a-f]{64}', manifests[0].get('fixtureSha256', '')), 'Comparison requires identical returning-profile fixture bytes.')
    require(1 <= len(selected) <= 3, 'Expected one to three selected originals across the whole job.')
    require(len({row['path'] for _, _, row in selected}) == len(selected), 'Duplicate image name across the job.')
    # Full native metadata is emitted; neither manifests nor image data are silently truncated.
    lines = ['SCENE_REVIEW_MANIFEST ' + json.dumps(manifest, separators=(',', ':')) for manifest in manifests]
    for root, manifest, row in selected:
        path = (root / row['path']).resolve()
        require(path.parent == root and path.suffix == '.png' and Path(row['path']).name == row['path'], 'Image path escapes flat review directory.')
        data = path.read_bytes()
        require(24 <= len(data) <= 3 * 1024 * 1024 and data[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid or oversized PNG.')
        width, height = struct.unpack('>II', data[16:24])
        allowed = DIMENSIONS[manifest['viewportName']]
        require((width, height) in allowed, 'Image dimensions are not on the explicit job rotation allowlist.')
        require(case == 'camp-320-rotate' or (width, height) == (390, 844), 'Unexpected rotation.')
        require(row['viewport'] == {'width': width, 'height': height} and row['screenshotScale'] == 'css', 'CSS-pixel dimension mismatch.')
        require(hashlib.sha256(data).hexdigest() == row['sha256'] and len(data) == row['bytes'], 'Original bytes changed after capture.')
        encoded = base64.b64encode(data).decode('ascii')
        metadata = {**row, 'sourceCommit': manifest['sourceCommit'], 'sourceTree': manifest['sourceTree'],
                    'revision': manifest['revision'], 'workflowCommit': workflow, 'runId': env.get('GITHUB_RUN_ID'),
                    'reviewCase': case, 'width': width, 'height': height, 'base64Length': len(encoded)}
        lines.append('SCENE_IMAGE_BEGIN ' + json.dumps(metadata, separators=(',', ':')))
        lines.extend('SCENE_IMAGE_DATA ' + encoded[i:i+12000] for i in range(0, len(encoded), 12000))
        lines.append('SCENE_IMAGE_END ' + row['path'])
    summary = {'images': len(selected), 'manifests': len(manifests), 'maxJobBytesExclusive': MAX_JOB_BYTES,
               'reservedOtherJobLogBytes': RESERVED_OTHER_LOG_BYTES, 'transportBudget': MAX_TRANSPORT_BYTES,
               'originalBytesVerified': True, 'truncationAccepted': False, 'screenshotsAltered': False}
    lines.append('SCENE_TRANSPORT_VERIFIED ' + json.dumps(summary, separators=(',', ':')))
    output = '\n'.join(lines) + '\n'
    bounded = len(output.encode('utf-8')) + 40 * len(lines)
    require(bounded < MAX_TRANSPORT_BYTES, f'Originals and metadata need {bounded} log bytes; refuse above {MAX_TRANSPORT_BYTES} without alteration or truncation.')
    return output

if __name__ == '__main__':
    try:
        output = encode_batch(sys.argv[1:], os.environ)
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as error:
        raise SystemExit(f'SCENE_TRANSPORT_REJECTED {error}')
    sys.stdout.write(output)
    sys.stdout.flush()
