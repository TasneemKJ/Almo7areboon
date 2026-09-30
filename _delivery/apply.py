from pathlib import Path
import hashlib,json,lzma
root=Path.cwd().resolve()
parts=sorted(Path('_delivery').glob('chronicle-*.xzpart'))
bundle=b''.join(p.read_bytes() for p in parts)
assert hashlib.sha256(bundle).hexdigest()=='1a8aaf18029995d53d250092d65d4ef4daf482b2af24eb2cc5afd59cd848a2fc','Transport digest mismatch'
changes=json.loads(lzma.decompress(bundle)); staged=[]
for change in changes:
    path=Path(change['path'])
    assert path.parts[0] in ('src','tests','scripts') or str(path)=='.github/workflows/chronicle-review.yml',path
    assert not path.is_absolute() and '..' not in path.parts,path
    assert (root/path).resolve().is_relative_to(root),path
    if change['old'] is None:
        new=change['content']
        assert not path.exists() or path.read_text()==new, f'Unexpected existing file: {path}'
    else:
        old=path.read_text()
        assert hashlib.sha256(old.encode()).hexdigest()==change['old'], f'Base changed: {path}'
        new=old
        for start,end,text in reversed(change['edits']):
            assert 0<=start<=end<=len(old)
            new=new[:start]+text+new[end:]
    staged.append((path,new))
for path,new in staged:
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(new)
print(f'Applied {len(staged)} validated source files; no shared branch was modified.')
