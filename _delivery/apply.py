from pathlib import Path
import hashlib,json
root=Path.cwd().resolve()
changes=[json.loads(line) for line in Path('_delivery/followup.jsonl').read_text().splitlines() if line.strip()];staged=[]
for change in changes:
    path=Path(change['path'])
    assert path.parts[0] in ('src','tests','scripts'),path
    assert not path.is_absolute() and '..' not in path.parts,path
    assert (root/path).resolve().is_relative_to(root),path
    if change['old'] is None:
        new=change['content'];assert not path.exists() or path.read_text()==new,path
    else:
        old=path.read_text();assert hashlib.sha256(old.encode()).hexdigest()==change['old'],f'Base changed: {path}'
        new=old
        for start,end,text in reversed(change['edits']):
            assert 0<=start<=end<=len(old)
            new=new[:start]+text+new[end:]
    staged.append((path,new))
for path,new in staged:
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(new)
print(f'Applied {len(staged)} tested review fixes on this branch.')
