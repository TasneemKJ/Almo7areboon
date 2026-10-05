"""Offline transport unit fixtures only. No generated pixels are game evidence."""
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
import zlib

EMITTER=Path(__file__).with_name('emit-originals.py')
SHA='c7d0fa22dd5abaf3b237ccd0ce558aa33daeba9c'
def png(noisy=False,width=390,height=844):
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data))
    raw=b''.join(b'\x00'+(os.urandom(width*4) if noisy else bytes(width*4)) for _ in range(height))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')

class TransportTests(unittest.TestCase):
    def run_case(self,modify=lambda root,m:None,count=1,noisy=False):
        with tempfile.TemporaryDirectory(prefix='almo-emitter-unit-') as directory:
            root=Path(directory);rows=[]
            for index in range(count):
                data=png(noisy);name=f'unit-fixture-{index}.png';(root/name).write_bytes(data)
                rows.append(dict(path=name,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),screenshotScale='css',viewport=dict(width=390,height=844),purpose='unit-fixture-only',transport=True))
            manifest=dict(sourceCommit=SHA,sourceTree='a'*40,viewportName='390x844',revision='candidate',images=rows)
            modify(root,manifest);(root/'review-manifest.json').write_text(json.dumps(manifest))
            return subprocess.run(['python3',str(EMITTER),str(root)],env={**os.environ,'SOURCE_SHA':SHA,'GITHUB_SHA':'b'*40,'GITHUB_RUN_ID':'unit-test','REVIEW_VIEWPORT':'390x844','REVIEW_REVISION':'candidate'},capture_output=True,text=True)
    def test_preserves_purpose_and_original_bytes(self):
        result=self.run_case();self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('"purpose":"unit-fixture-only"',result.stdout);self.assertIn('SCENE_IMAGE_END unit-fixture-0.png',result.stdout)
    def test_source_mismatch(self):
        result=self.run_case(lambda root,m:m.update(sourceCommit='f'*40));self.assertNotEqual(result.returncode,0);self.assertNotIn('SCENE_IMAGE_DATA',result.stdout)
    def test_hash_tampering(self):
        result=self.run_case(lambda root,m:m['images'][0].update(sha256='f'*64));self.assertNotEqual(result.returncode,0);self.assertNotIn('SCENE_IMAGE_DATA',result.stdout)
    def test_path_escape(self):
        result=self.run_case(lambda root,m:m['images'][0].update(path='../escaped.png'));self.assertNotEqual(result.returncode,0);self.assertNotIn('SCENE_IMAGE_DATA',result.stdout)
    def test_entire_budget_preflight_prevents_partial_payload(self):
        result=self.run_case(count=3,noisy=True);self.assertNotEqual(result.returncode,0);self.assertIn('refuse above',result.stderr);self.assertNotIn('SCENE_IMAGE_DATA',result.stdout)
    def test_four_images_refused(self):
        result=self.run_case(count=4);self.assertNotEqual(result.returncode,0);self.assertNotIn('SCENE_IMAGE_DATA',result.stdout)
    def test_orientation_failure_keeps_actual_rotated_original(self):
        def rotate(root,m):
            data=png(width=844,height=390);row=m['images'][0];(root/row['path']).write_bytes(data)
            row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),viewport=dict(width=844,height=390),purpose='native-failure')
            m['reviewCase']='orientation-background'
        result=self.run_case(rotate);self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('"width":844,"height":390',result.stdout)
    def test_ordinary_capture_cannot_silently_change_viewport(self):
        def rotate(root,m):
            data=png(width=844,height=390);row=m['images'][0];(root/row['path']).write_bytes(data)
            row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),viewport=dict(width=844,height=390))
        result=self.run_case(rotate);self.assertNotEqual(result.returncode,0);self.assertNotIn('SCENE_IMAGE_DATA',result.stdout)
if __name__=='__main__':
    unittest.main()
