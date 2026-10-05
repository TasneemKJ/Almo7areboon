"""Offline transport fixtures only. Generated pixels are never represented as game evidence."""
import base64
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import struct
import tempfile
import unittest
import zlib

spec = importlib.util.spec_from_file_location('emitter', Path(__file__).with_name('emit-originals.py'))
emitter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(emitter)
verify_spec = importlib.util.spec_from_file_location('verify_log', Path(__file__).with_name('verify-job-log.py'))
verifier = importlib.util.module_from_spec(verify_spec)
verify_spec.loader.exec_module(verifier)
CANDIDATE = 'b29d6199708135f30128abc8b4eb537ea5620bf6'
WORKFLOW = 'b' * 40
ENV = {'SOURCE_SHA': CANDIDATE, 'REVIEW_CASE': 'field-390', 'GITHUB_SHA': WORKFLOW, 'GITHUB_RUN_ID': 'unit-only'}

def png(width=390, height=844, noisy=False):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    raw = b''.join(b'\x00' + (os.urandom(width * 4) if noisy else bytes(width * 4)) for _ in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')

def prepare(root, revision, count, case='field-390', dimensions=None, noisy=False):
    root.mkdir()
    dimensions = dimensions or ([(390, 844)] * count if case == 'field-390' else [(320, 568)] * count)
    rows = []
    for index, (width, height) in enumerate(dimensions):
        data = png(width, height, noisy)
        name = f'{revision}-{index}.png'
        (root / name).write_bytes(data)
        rows.append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'screenshotScale': 'css',
                     'viewport': {'width': width, 'height': height}, 'purpose': 'unit-fixture-not-game-evidence', 'transport': True})
    manifest = {'sourceCommit': emitter.BASELINE_SHA if revision == 'baseline' else CANDIDATE, 'sourceTree': verifier.CANDIDATE_TREE if revision == 'candidate' else 'a' * 40,
                'revision': revision, 'reviewCase': case, 'viewportName': emitter.CASE_VIEWPORT[case], 'workflowCommit': WORKFLOW,
                'buildTreeSha256': 'c' * 64, 'harnessFilesSha256': {'capture-entry.mjs': 'd' * 64}, 'images': rows}
    (root / 'review-manifest.json').write_text(json.dumps(manifest))
    return manifest

def save(root, manifest):
    (root / 'review-manifest.json').write_text(json.dumps(manifest))

class TransportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='almo-entry-transport-only-')
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)
    def comparison(self, noisy=False, candidate_count=2):
        baseline = self.root / 'baseline'; candidate = self.root / 'candidate'
        return [baseline, candidate], [prepare(baseline, 'baseline', 1, noisy=noisy), prepare(candidate, 'candidate', candidate_count, noisy=noisy)]
    def test_jobwide_three_originals_roundtrip_sha_and_dimensions(self):
        roots, manifests = self.comparison()
        output = emitter.encode_batch(roots, ENV)
        originals, encoded, meta = {}, [], None
        for line in output.splitlines():
            if line.startswith('SCENE_IMAGE_BEGIN '):
                meta = json.loads(line.split(' ', 1)[1]); encoded = []
            elif line.startswith('SCENE_IMAGE_DATA '):
                encoded.append(line.split(' ', 1)[1])
            elif line.startswith('SCENE_IMAGE_END '):
                data = base64.b64decode(''.join(encoded), validate=True)
                self.assertEqual(hashlib.sha256(data).hexdigest(), meta['sha256'])
                self.assertEqual(struct.unpack('>II', data[16:24]), (meta['width'], meta['height']))
                originals[meta['path']] = data
        self.assertEqual(len(originals), 3)
        for root, manifest in zip(roots, manifests):
            for row in manifest['images']:
                self.assertEqual(originals[row['path']], (root / row['path']).read_bytes())
        self.assertLess(len(output.encode()) + 40 * len(output.splitlines()) + emitter.RESERVED_OTHER_LOG_BYTES, emitter.MAX_JOB_BYTES)
    def test_four_images_across_two_manifests_rejected(self):
        roots, _ = self.comparison(candidate_count=3)
        with self.assertRaisesRegex(ValueError, 'one to three'):
            emitter.encode_batch(roots, ENV)
    def test_aggregate_budget_rejects_before_any_partial_batch(self):
        roots, _ = self.comparison(noisy=True)
        with self.assertRaisesRegex(ValueError, 'without alteration or truncation'):
            emitter.encode_batch(roots, ENV)
    def test_one_explicit_320_to_844_rotation_is_preserved(self):
        root = self.root / 'candidate'
        prepare(root, 'candidate', 3, case='field-320-rotate', dimensions=[(320,568),(320,568),(844,390)])
        output = emitter.encode_batch([root], {**ENV, 'REVIEW_CASE': 'field-320-rotate'})
        self.assertIn('"width":844,"height":390', output)
        self.assertEqual(output.count('SCENE_IMAGE_BEGIN '), 3)
    def test_comparison_rotation_is_rejected(self):
        roots, manifests = self.comparison(); row = manifests[1]['images'][0]
        data = png(844,390); (roots[1] / row['path']).write_bytes(data)
        row.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), viewport={'width':844,'height':390}); save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'rotation allowlist'):
            emitter.encode_batch(roots, ENV)
    def test_exact_candidate_pin_is_enforced(self):
        roots, manifests = self.comparison(); manifests[1]['sourceCommit'] = 'f' * 40; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'source mismatch'):
            emitter.encode_batch(roots, ENV)
    def test_workflow_identity_is_enforced(self):
        roots, manifests = self.comparison(); manifests[1]['workflowCommit'] = 'f' * 40; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'Workflow source mismatch'):
            emitter.encode_batch(roots, ENV)
    def test_original_hash_tampering_is_rejected(self):
        roots, manifests = self.comparison(); manifests[1]['images'][0]['sha256'] = 'f' * 64; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'bytes changed'):
            emitter.encode_batch(roots, ENV)
    def test_path_escape_is_rejected(self):
        roots, manifests = self.comparison(); manifests[1]['images'][0]['path'] = '../escape.png'; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'path escapes'):
            emitter.encode_batch(roots, ENV)
    def test_missing_harness_hash_is_rejected(self):
        roots, manifests = self.comparison(); manifests[1]['harnessFilesSha256'] = {}; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'harness file hashes'):
            emitter.encode_batch(roots, ENV)
    def test_missing_baseline_is_not_silently_accepted(self):
        root = self.root / 'candidate'; prepare(root, 'candidate', 2)
        with self.assertRaisesRegex(ValueError, 'exact batch'):
            emitter.encode_batch([root], ENV)
    def test_duplicate_paths_between_revisions_are_rejected(self):
        roots, manifests = self.comparison(); manifests[1]['images'][0]['path'] = manifests[0]['images'][0]['path']; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'Duplicate image'):
            emitter.encode_batch(roots, ENV)
    def test_raw_job_log_preserves_images_and_requires_complete_end(self):
        roots, _ = self.comparison(); output = emitter.encode_batch(roots, ENV)
        raw = ('setup log\n' + '\n'.join('2026-10-05T22:00:00Z ' + line for line in output.splitlines()) + '\ncleanup log\n').encode()
        manifests, images, transport = verifier.verify(raw)
        self.assertEqual(len(images), 3)
        self.assertEqual(len(manifests), 2)
        with self.assertRaisesRegex(ValueError, 'terminator is missing'):
            verifier.verify(raw.split(b'SCENE_TRANSPORT_VERIFIED ')[0])
    def test_raw_job_log_over_budget_is_not_accepted(self):
        with self.assertRaisesRegex(ValueError, '3.75 MiB'):
            verifier.verify(b'x' * emitter.MAX_JOB_BYTES)
    def test_dpr_screenshot_is_rejected(self):
        roots, manifests = self.comparison(); manifests[1]['images'][0]['screenshotScale'] = 'device'; save(roots[1], manifests[1])
        with self.assertRaisesRegex(ValueError, 'CSS-pixel'):
            emitter.encode_batch(roots, ENV)

if __name__ == '__main__':
    unittest.main(verbosity=2)
