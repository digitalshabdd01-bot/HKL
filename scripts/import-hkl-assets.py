#!/usr/bin/env python3
"""Cache the source site's public images locally, keeping their visual content."""
import concurrent.futures, hashlib, io, json, urllib.parse, urllib.request, http.client
from pathlib import Path
from PIL import Image, ImageOps


def atomic_text(path, value):
    temporary=path.with_name(path.name+".tmp")
    temporary.write_text(value)
    temporary.replace(path)

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'content'
TARGET=ROOT/'public/images/hkl'
TARGET.mkdir(parents=True,exist_ok=True)
manifest_path=DATA/'hkl-assets.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
catalog=json.loads((DATA/'hkl-source.json').read_text())
images={}
for page in catalog['pages']:
    for block in page.get('blocks',[]):
        if block['kind']=='image':
            url=block['url']; key=urllib.parse.urlsplit(url)._replace(query='',fragment='').geturl();images.setdefault(key,url)

def transfer(item):
    key,url=item
    if key in manifest and (ROOT/'public'/manifest[key].lstrip('/')).exists():return key,manifest[key],None
    stem=hashlib.sha256(key.encode()).hexdigest()[:20]
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
        response=urllib.request.urlopen(req,timeout=35)
        chunks=[]
        while True:
            try:
                chunk=response.read(65536)
            except http.client.IncompleteRead as incomplete:
                chunks.append(incomplete.partial)
                break
            if not chunk:break
            chunks.append(chunk)
        data=b''.join(chunks)
        if urllib.parse.urlsplit(url).path.lower().endswith('.svg'):
            name=stem+'.svg';(TARGET/name).write_bytes(data)
        else:
            image=ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
            image.thumbnail((1400,1400),Image.Resampling.LANCZOS)
            if image.mode not in ('RGB','RGBA'):image=image.convert('RGBA' if 'transparency' in image.info else 'RGB')
            name=stem+'.webp';image.save(TARGET/name,'WEBP',quality=86,method=5,lossless=max(image.size)<400)
        return key,'/images/hkl/'+name,None
    except Exception as error:return key,None,str(error)

failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for index,(key,local,error) in enumerate(pool.map(transfer,images.items()),1):
        if local:manifest[key]=local
        else:failures.append({'url':key,'error':error})
        if index%30==0:print(f'Images {index}/{len(images)}',flush=True)
atomic_text(manifest_path,json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
atomic_text(DATA/'hkl-asset-audit.json',json.dumps({'sourceImages':len(images),'localImages':len(manifest),'failures':failures},indent=2))
print(json.dumps({'sourceImages':len(images),'localImages':len(manifest),'failures':len(failures),'bytes':sum(p.stat().st_size for p in TARGET.iterdir())}),flush=True)
