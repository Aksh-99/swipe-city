from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];changes={};before=after=0
for folder in ['billboards','storefronts','reference48','home']:
 for p in (root/'public'/folder).glob('*.png'):
  old=p.stat().st_size;dest=p.with_suffix('.webp');Image.open(p).save(dest,format='WEBP',quality=94,method=6);new=dest.stat().st_size
  if new>=old:dest.unlink();continue
  changes[p.name]=dest.name;before+=old;after+=new;p.unlink()
for folder in ['src','tests']:
 for p in (root/folder).rglob('*'):
  if not p.is_file() or p.suffix not in ['.js','.css','.json','.html']:continue
  s=p.read_text();updated=s
  for old,new in changes.items():updated=updated.replace(old,new)
  if updated!=s:p.write_text(updated)
print('City images',round(before/1e6,1),'MB ->',round(after/1e6,1),'MB; saved',round((before-after)/1e6,1),'MB',flush=True)
