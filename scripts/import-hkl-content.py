#!/usr/bin/env python3
"""Import the public HKL sitemap and readable content; never submit any forms.

Requires beautifulsoup4 and Pillow. Raw responses stay in the supplied cache.
The generated content catalog and audit are committed with the Site source.
"""
from __future__ import annotations
import argparse, concurrent.futures, hashlib, html, json, re, time
import urllib.error, urllib.parse, urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup, NavigableString, Tag


def atomic_text(path, value):
    temporary=path.with_name(path.name+".tmp")
    temporary.write_text(value)
    temporary.replace(path)

BASE = 'https://hkl.org'
LOCALES = {'en':'', 'es-BO':'es', 'de-DE':'de', 'it-IT':'it', 'pa-Guru-IN':'pa', 'ru-RU':'ru', 'uk-UA':'ukra'}
TEXT_TAGS = {'h1','h2','h3','h4','h5','h6','p','li','blockquote'}
INLINE = {'a','strong','b','em','i','br','u','sup','sub'}
SKIP_HOSTS = {'www.googletagmanager.com','googletagmanager.com','www.google-analytics.com','www.facebook.com'}

def clean(text): return re.sub(r'\s+', ' ', text or '').strip()

def fetch(url, cache):
    target = cache / (hashlib.sha256(url.encode()).hexdigest() + '.html')
    meta = target.with_suffix('.meta.json')
    if target.exists() and meta.exists():
        return target.read_text(), json.loads(meta.read_text())
    for attempt in range(2):
        try:
            req = urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; HKL content migration)'})
            with urllib.request.urlopen(req,timeout=40) as response:
                chunks=[]
                while True:
                    chunk=response.read(65536)
                    if not chunk:break
                    chunks.append(chunk)
                data=b''.join(chunks).decode('utf-8',errors='replace')
                info={'url':url,'finalUrl':response.url,'status':response.status}
            target.write_text(data); meta.write_text(json.dumps(info)); return data, info
        except Exception as error:
            if attempt == 1: return '', {'url':url,'status':getattr(error,'code',0),'error':str(error)}
    raise RuntimeError('unreachable')

def safe_url(value, page):
    if not value: return ''
    url=urllib.parse.urljoin(page,value)
    parts=urllib.parse.urlsplit(url)
    if parts.scheme not in ('http','https','mailto','tel','wa'): return ''
    if parts.hostname in SKIP_HOSTS: return ''
    if parts.hostname=='community.hkl.org': return 'https://community.hkl.org/'
    return url

def inline_html(node, page):
    result=[]
    for child in node.children:
        if isinstance(child,NavigableString): result.append(html.escape(str(child)))
        elif isinstance(child,Tag):
            inside=inline_html(child,page)
            if child.name=='a':
                url=safe_url(child.get('href'),page)
                result.append(f'<a href="{html.escape(url,quote=True)}">{inside}</a>' if url else inside)
            elif child.name=='br': result.append('<br/>')
            elif child.name in INLINE: result.append(f'<{child.name}>{inside}</{child.name}>')
            else: result.append(inside)
    return ''.join(result).strip()

def extract(url, data, info, nested=False):
    soup=BeautifulSoup(data,'html.parser')
    title=clean(soup.title.get_text()) if soup.title else urllib.parse.urlsplit(url).path
    description=soup.find('meta',attrs={'name':'description'})
    description=description.get('content','') if description else ''
    root=soup.select_one('#main') or soup.body or soup
    for item in root.select('nav,footer,script,style,noscript,template,[aria-hidden="true"]'):
        item.decompose()
    blocks=[]; seen=set(); all_links=[]
    def add(block,identity=None):
        key=identity or block['kind']+':'+clean(block.get('text') or block.get('url') or block.get('alt') or json.dumps(block,ensure_ascii=False))
        if key not in seen:
            seen.add(key);blocks.append(block)
    for node in root.descendants:
        if not isinstance(node,Tag):continue
        if node.name in TEXT_TAGS:
            if any(parent.name in TEXT_TAGS or parent.name=='form' for parent in node.parents if parent!=root): continue
            text=clean(node.get_text(' ',strip=True))
            if not text or text in ('HKL','English','Select Language','Load More','Loading globe data…'):continue
            add({'kind':node.name if node.name in {'h1','h2','h3','h4','li','blockquote'} else 'p','text':text,'html':inline_html(node,url)},'text:'+text)
        elif node.name=='img':
            image=safe_url(node.get('src'),url)
            if not image or image.startswith('data:'):continue
            if any(parent.name in ('nav','footer','form') for parent in node.parents):continue
            alt=clean(node.get('alt',''))
            if 'flagcdn.com' in image: add({'kind':'country','text':alt.replace(' flag',''),'url':image},'country:'+alt);continue
            add({'kind':'image','url':image,'alt':alt},'image:'+urllib.parse.urlsplit(image)._replace(query='',fragment='').geturl())
        elif node.name in ('iframe','video'):
            source=node.get('src') or (node.find('source').get('src') if node.find('source') else '')
            source=safe_url(source,url)
            if source:add({'kind':'video' if node.name=='video' else 'embed','url':source,'text':clean(node.get('title',''))},'embed:'+source)
            if node.name=='iframe' and node.get('srcdoc'):
                embedded=BeautifulSoup(node['srcdoc'],'html.parser')
                for frame in embedded.find_all('iframe',src=True):
                    nested_source=safe_url(frame['src'],url)
                    if nested_source:add({'kind':'embed','url':nested_source,'text':clean(frame.get('title',''))},'embed:'+nested_source)
                for link in embedded.find_all('a',href=True):
                    nested_link=safe_url(link['href'],url)
                    if nested_link:add({'kind':'link','url':nested_link,'text':clean(link.get_text(' ',strip=True)) or 'Open this HKL resource'},'link:'+nested_link)
        elif node.name=='a':
            href=safe_url(node.get('href'),url)
            text=clean(node.get_text(' ',strip=True))
            if href:
                all_links.append({'url':href,'text':text[:500]})
                if node.find_parent(['p','li','h1','h2','h3','h4','blockquote','form']):continue
                if text and len(text)<180:add({'kind':'link','text':text,'url':href},'link:'+href+':'+text)
                elif not text and node.find('img'):add({'kind':'link','text':clean(node.find('img').get('alt','')) or 'View image','url':href},'link:'+href)
        elif node.name=='form':
            fields=[]
            for field in node.select('input,textarea,select'):
                if field.get('type') in ('hidden','submit','button') or field.get('aria-hidden')=='true':continue
                label=field.get('aria-label') or field.get('placeholder') or field.get('name') or field.get('type') or 'Your response'
                field_id=field.get('id')
                if field_id:
                    explicit=node.find('label',attrs={'for':field_id})
                    if explicit:label=clean(explicit.get_text(' ',strip=True))
                parent_label=field.find_parent('label')
                if parent_label and clean(parent_label.get_text(' ',strip=True)):label=clean(parent_label.get_text(' ',strip=True))
                fields.append({'name':field.get('name',''),'label':label,'type':field.get('type',field.name),'value':field.get('value',''),'required':field.has_attr('required'),'options':[clean(o.get_text()) for o in field.find_all('option')]})
            intro=[];intro_seen=set()
            field_labels={clean(f['name']) for f in fields}|{clean(f['label']) for f in fields}|{'Submit','Select…'}
            for item in node.find_all(['h1','h2','h3','p']):
                text=clean(item.get_text(' ',strip=True))
                if text and text not in field_labels and text not in intro_seen and not item.find_parent(['label','select']):
                    intro_seen.add(text);intro.append({'kind':item.name,'text':text,'html':inline_html(item,url)})
            if fields:add({'kind':'form','text':clean(node.get_text(' ',strip=True))[:1800],'intro':intro,'fields':fields,'url':url},'form:'+json.dumps(fields,ensure_ascii=False))
    heads=[b['text'] for b in blocks if b['kind']=='h1']
    path=urllib.parse.unquote(urllib.parse.urlsplit(url).path).rstrip('/') or '/'
    prefix=path.split('/')[1] if path!='/' else ''
    locale=next((k for k,v in LOCALES.items() if v and v==prefix),'en')
    canonical=path[len(prefix)+1:] if locale!='en' else path
    if not canonical:canonical='/'
    result = {**info,'path':path,'canonicalPath':canonical,'locale':locale,'title':title,'heading':heads[0] if heads else title.split(' | ')[0], 'description':description,'blocks':blocks,'links':list({(x['url'],x['text']):x for x in all_links}.values())}
    if canonical=='/' and not nested:
        hero=root.find(attrs={'data-framer-name':'Forest hero'})
        if hero and hero.parent:
            result['sections']=[]
            for index,section in enumerate(hero.parent.find_all(recursive=False)):
                segment=extract(url,str(section),info,nested=True)
                if segment['blocks']:
                    result['sections'].append({'id':f'section-{index}','name':section.get('data-framer-name') or segment['heading'],'blocks':segment['blocks']})
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True);parser.add_argument('--locales',default='en');parser.add_argument('--workers',type=int,default=4)
    args=parser.parse_args();cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    repo=Path(__file__).resolve().parents[1];out=repo/'content';out.mkdir(exist_ok=True)
    existing={}
    catalog=out/'hkl-source.json'
    if catalog.exists():existing={p['path']:p for p in json.loads(catalog.read_text())['pages']}
    urls=[]
    for locale in args.locales.split(','):
        sitemap=urllib.request.urlopen(f'{BASE}/sitemap_{locale}.xml',timeout=40).read()
        urls.extend(e.text for e in ET.fromstring(sitemap).iter() if e.tag.endswith('loc'))
    def process(url):
        data,info=fetch(url,cache)
        if not data:return info
        if urllib.parse.urlsplit(info['finalUrl']).hostname not in ('hkl.org','www.hkl.org'):return {**info,'externalRedirect':True,'path':urllib.parse.unquote(urllib.parse.urlsplit(url).path).rstrip('/') or '/','canonicalPath':urllib.parse.unquote(urllib.parse.urlsplit(url).path).rstrip('/') or '/','locale':'en','title':'HKL event registration','heading':'HKL event registration','blocks':[],'links':[]}
        return extract(url,data,info)
    failures=[];count=0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for page in pool.map(process,urls):
            count+=1
            if page.get('path'):existing[page['path']]=page
            else:failures.append(page)
            if count%10==0:print(f'Imported {count}/{len(urls)} pages',flush=True)
    pages=sorted(existing.values(),key=lambda p:(p.get('locale','en'),p['path']))
    result={'source':BASE,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'pages':pages,'failures':failures}
    atomic_text(catalog,json.dumps(result,ensure_ascii=False,separators=(',',':')))
    english=[p for p in pages if p.get('locale')=='en']
    audit={'source':BASE,'checkedAt':result['checkedAt'],'sitemapCount':len(urls),'importedPages':len(pages),'englishPages':len(english),'stories':sum(p['canonicalPath'].startswith('/stories/') for p in english),'weeklyPractices':sum(p['canonicalPath'].startswith('/weekly-practice/') for p in english),'boardProfiles':sum(p['canonicalPath'].startswith('/board-of-directors/') for p in english),'speakerProfiles':sum(p['canonicalPath'].startswith('/canada-speakers/') for p in english),'failures':failures,'pages':[{'path':p['path'],'blocks':len(p.get('blocks',[])),'status':p.get('status')} for p in pages]}
    atomic_text(out/'hkl-audit.json',json.dumps(audit,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in audit.items() if k!='pages'},ensure_ascii=False),flush=True)

if __name__=='__main__':main()
