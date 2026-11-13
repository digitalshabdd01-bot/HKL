#!/usr/bin/env python3
"""Complete nested embeds/form introductions and explicit event landing redirects."""
import argparse, hashlib, importlib, json, urllib.parse
from pathlib import Path


def atomic_text(path, value):
    temporary=path.with_name(path.name+".tmp")
    temporary.write_text(value)
    temporary.replace(path)

parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];cache=Path(args.cache)
module=importlib.import_module('import-hkl-content')
catalog=json.loads((root/'content/hkl-source.json').read_text());changed=0
for i,page in enumerate(catalog['pages']):
    raw=cache/(hashlib.sha256(page['url'].encode()).hexdigest()+'.html')
    meta=raw.with_suffix('.meta.json')
    if not raw.exists() or not meta.exists():continue
    text=raw.read_text();info=json.loads(meta.read_text())
    hostname=urllib.parse.urlsplit(info['finalUrl']).hostname
    own_landing=page.get('externalRedirect') and hostname in ('in.hkl.org','www.hklglobal.org','hklglobal.org')
    if 'srcdoc=' in text or '<form' in text or own_landing:
        # Resolve relative links against the final URL, then restore its sitemap identity.
        parsed=module.extract(info['finalUrl'],text,info)
        parsed['path']=page['path'];parsed['url']=page['url'];parsed['canonicalPath']=page.get('canonicalPath',page['path']);parsed['locale']=page.get('locale','en')
        if own_landing:
            parsed['registrationUrl']=info['finalUrl']
            if not parsed['blocks']:parsed['externalRedirect']=True
        catalog['pages'][i]=parsed;changed+=1
atomic_text(root/'content/hkl-source.json',json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'pages':len(catalog['pages']),'completedEmbedsAndForms':changed}))
