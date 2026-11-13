#!/usr/bin/env python3
"""Derive small navigation/library records from the complete server-side catalog."""
import datetime, json, re, urllib.parse
from pathlib import Path


def atomic_text(path, value):
    temporary=path.with_name(path.name+".tmp")
    temporary.write_text(value)
    temporary.replace(path)

ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'content'
catalog=json.loads((DATA/'hkl-source.json').read_text())
assets=json.loads((DATA/'hkl-assets.json').read_text()) if (DATA/'hkl-assets.json').exists() else {}
PREFIXES={'es':'es-BO','de':'de-DE','it':'it-IT','pa':'pa-Guru-IN','ru':'ru-RU','ukra':'uk-UA'}
TITLES={'/':'The HKL Global Movement','/home-2':'The HKL Journey','/abeautifulgarden':'A Beautiful Garden','/stories':'The Story of Our Lives','/join':'Weekly Practices','/donate':'Donate to the HKL Movement','/media':'HKL Event Media Policy','/channel':'HKL WhatsApp Channels','/practice-app':'Install the HKL Practice App','/todayspractice':'Today’s Practice','/punjab-india-2026':'8th International HKL Conference · Punjab 2026','/malaysia-conference-2027':'9th International HKL Conference · Malaysia 2027','/abbotsford-canada-2025':'3rd HKL Global Conference · Abbotsford, Canada 2025','/punjab-india-2024':'The Launch of HKL · Punjab, India 2024','/parma-italy-2025':'2nd HKL Global Conference · Parma, Italy 2025','/jalandhar-india-2025':'4th HKL Global Conference · Jalandhar, India 2025','/sydney-australia-2026':'5th HKL Global Conference · Sydney, Australia 2026','/telford-uk-2026':'6th HKL Global Conference · Telford, UK 2026','/toronto':'7th HKL Global Conference · Toronto, Canada 2026','/ca':'Toronto Conference Registration','/contact-us':'Contact HKL','/community':'Join the HKL Community','/walks':'HKL Walks'}
for page in catalog['pages']:
    prefix=page['path'].split('/')[1] if page['path']!='/' else ''
    page['locale']=PREFIXES.get(prefix,'en')
    page['canonicalPath']=(page['path'][len(prefix)+1:] or '/') if prefix in PREFIXES else page['path']
    if page['locale']=='en' and page['canonicalPath'] in TITLES:page['displayTitle']=TITLES[page['canonicalPath']]
    else:page['displayTitle']=page.get('heading') or page.get('title') or TITLES.get(page['canonicalPath'],'HKL')
    page['displayTitle']=page['displayTitle'].replace(' | HKL','')
    if not page.get('heading'):page['heading']=page['displayTitle']
    page.setdefault('blocks',[]);page.setdefault('links',[])

english=[p for p in catalog['pages'] if p['locale']=='en']
by_path={p['path']:p for p in english}
join_order={}
for link in by_path['/join']['links']:
    path=urllib.parse.unquote(urllib.parse.urlsplit(link['url']).path)
    if path.startswith('/weekly-practice/') and path not in join_order:join_order[path]=len(join_order)

def image_url(url):return assets.get(urllib.parse.urlsplit(url)._replace(query='',fragment='').geturl(),url)
def date_iso(text):
    text=text.replace('Sept ', 'Sep ')
    for fmt in ['%B %d, %Y','%b %d, %Y','%B %d %Y','%b %d %Y']:
        try:return datetime.datetime.strptime(text,fmt).date().isoformat()
        except ValueError:pass
    return ''
def short_text(text,limit=190):return text if len(text)<=limit else text[:limit].rsplit(' ',1)[0]+'…'
def category(path):
    if path.startswith('/stories'):return 'Stories & talks'
    if path.startswith('/weekly-practice') or path in ['/join','/todayspractice','/practice-app']:return 'Weekly practices'
    if path.startswith(('/board-of-directors','/canada-speakers')) or path=='/italy2025speakers':return 'Board & speakers'
    if any(word in path for word in ['punjab','jalandhar','parma','abbotsford','sydney','telford','toronto','malaysia']) or path=='/ca':return 'Conferences'
    if path in ['/privacy-policy','/media','/donate','/support-us','/contact-us']:return 'Policies & support'
    if path in ['/','/home-2','/abeautifulgarden']:return 'The movement'
    return 'Community & publications'
talks=[];practices=[];resources=[];profiles=[];conferences=[]
for page in english:
    path=page['path'];blocks=page['blocks'];texts=[b.get('text','') for b in blocks if b['kind'] in ('p','h1','h2','h3')]
    first_image=next((b['url'] for b in blocks if b['kind']=='image'),'')
    videos=[b['url'] for b in blocks if b['kind']=='embed' and 'youtube' in b['url']]
    video=re.search(r'/embed/([^?&/]+)',videos[0]).group(1) if videos else ''
    if path.startswith('/stories/') or path.startswith('/weekly-practice/'):
        heading=next((b['text'] for b in blocks if b['kind']=='h1'),page['displayTitle'])
        first_heading=next((i for i,b in enumerate(blocks) if b['kind']=='h1'),0)
        dates=[b['text'] for b in blocks[:first_heading] if b['kind']=='p' and re.search(r'\d{4}',b.get('text',''))]
        date=dates[0] if dates else ''
        body=[b['text'] for b in blocks[first_heading+1:] if b['kind']=='p' and len(b.get('text',''))>50]
        summary=short_text(body[0] if body else page.get('description',''))
        slug=path.rsplit('/',1)[-1]
        item={'slug':slug.removesuffix('-of-our-lives'),'originalSlug':slug,'sourcePath':path,'title':heading,'date':date,'isoDate':date_iso(date),'image':image_url(first_image) or '/images/love.webp','video':video,'summary':summary,'source':page['url']}
        if path.startswith('/stories/'):
            episode=next((int(re.sub(r'\D','',b['text'])) for b in blocks[:first_heading] if b['kind']=='p' and re.fullmatch(r'(Episode\s*)?\d+',b.get('text',''))),0)
            item.update({'episode':episode,'paragraphs':body,'question':''});talks.append(item)
        else:
            item.update({'order':join_order.get(path,99),'body':body[0] if body else '', 'invitation':''});practices.append(item)
    resource={'path':path,'title':page['displayTitle'],'description':short_text(next((t for t in texts if len(t)>65 and t!=page['heading']),page.get('description','')),155),'category':category(path),'image':image_url(first_image)}
    resources.append(resource)
    if path.startswith(('/board-of-directors/','/canada-speakers/')):profiles.append(resource)
    if category(path)=='Conferences' and path!='/ca':conferences.append(resource)

talks.sort(key=lambda x:x['episode'],reverse=True);practices.sort(key=lambda x:x['order'])
home=by_path['/']['blocks'];original_values={}
for name in ['Humility','Kindness','Love']:
    index=next((i for i,b in enumerate(home) if b.get('text')==name),-1)
    original_values[name]=next((b['text'] for b in home[index+1:index+4] if b['kind']=='p' and len(b.get('text',''))>70),'')
mission_index=next((i for i,b in enumerate(home) if b.get('text','').startswith('The HKL Global Movement is dedicated')), -1)
original_mission=[b['text'] for b in home[mission_index:mission_index+3] if b['kind']=='p']
result={'talks':talks,'practices':practices,'resources':resources,'profiles':profiles,'conferences':conferences,'originalValues':original_values,'originalMission':original_mission}
atomic_text(DATA/'hkl-libraries.json',json.dumps(result,ensure_ascii=False,separators=(',',':')))
atomic_text(DATA/'hkl-source.json',json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
for locale in ['en','es-BO','de-DE','it-IT','pa-Guru-IN','ru-RU','uk-UA']:
    atomic_text(DATA/f'hkl-source-{locale}.json',json.dumps({'checkedAt':catalog['checkedAt'],'pages':[p for p in catalog['pages'] if p['locale']==locale]},ensure_ascii=False,separators=(',',':')))
if not (DATA/'hkl-assets.json').exists():(DATA/'hkl-assets.json').write_text('{}')
print(json.dumps({'talks':len(talks),'practices':len(practices),'resources':len(resources),'profiles':len(profiles),'conferences':len(conferences),'catalogPages':len(catalog['pages'])}))
