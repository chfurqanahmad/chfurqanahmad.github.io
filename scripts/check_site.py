"""Check generated pages, local navigation, downloads and publication invariants."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, subprocess
from lxml import html, etree
from case_studies import CASES

ROOT=Path(__file__).resolve().parents[1]
errors=[];links=0
pages={p:html.fromstring(p.read_bytes()) for p in ROOT.rglob('*.html')}

def require(ok,message):
    if not ok: errors.append(message)

for path,tree in pages.items():
    name=str(path.relative_to(ROOT))
    redirect=bool(tree.xpath('//meta[translate(@http-equiv,"REFSH","refsh")="refresh"]'))
    ids=tree.xpath('//*[@id]/@id')
    require(len(ids)==len(set(ids)),f'{name}: duplicate IDs')
    require(len(tree.xpath('//h1'))==1 or redirect,f'{name}: expected one H1')
    require(tree.get('lang')=='en',f'{name}: language missing')
    require(bool(tree.xpath('//title/text()')),f'{name}: missing title')
    for image in tree.xpath('//img'):
        require(image.get('alt') is not None,f'{name}: image alt missing')
        require(image.get('width') and image.get('height'),f'{name}: image dimensions missing')
    for field in tree.xpath('//input|//select|//textarea'):
        require(bool(tree.xpath('//label[@for=$id]',id=field.get('id'))),f'{name}: unlabelled form input')
    for script in tree.xpath('//script[@type="application/ld+json"]'):
        json.loads(script.text)
    for el in tree.xpath('//*[@href or @src]'):
        ref=el.get('href') or el.get('src');u=urlsplit(ref)
        if u.scheme not in ('','https','http') or (u.netloc and u.netloc!='furqanahmad.com'):continue
        target=(ROOT/unquote(u.path.lstrip('/'))) if u.path.startswith('/') else (path.parent/unquote(u.path)) if u.path else path
        if target.is_dir():target=target/'index.html'
        target=target.resolve();links+=1
        require(target.exists(),f'{name}: missing {ref}')
        if u.fragment and target in pages:
            require(u.fragment in pages[target].xpath('//*[@id]/@id'),f'{name}: missing anchor {ref}')
    require(not re.search(r'before publishing,|lorem ipsum|working at (?:a |his )?desk',tree.text_content(),re.I),f'{name}: placeholder content')
    for anchor in tree.xpath('//a[@target="_blank"]'):
        require('noopener' in anchor.get('rel',''),f'{name}: unsafe external target')

home=pages[ROOT/'index.html']
require(len(home.xpath('//*[@class="work-card"]'))==4,'Expected four case studies')
require(all('hidden' not in card.attrib for card in home.xpath('//*[@class="work-card"]')),'Case studies must work without JS')
require(bool(home.xpath('//noscript//a[starts-with(@href,"mailto:")]')),'Missing no-JS contact path')
require(not home.xpath('//form[@action]'),'Form must not submit to a server')
require(not home.xpath('//script[starts-with(@src,"http")]'),'Unexpected external script')
for c in CASES:
    pdf=ROOT/'assets/documents'/c['pdf']
    require(pdf.read_bytes().startswith(b'%PDF-'),f'{c["slug"]}: invalid PDF')
    txt=subprocess.check_output(['pdftotext',str(pdf),'-'],text=True)
    require('Sources & scope' in txt,f'{pdf.name}: missing evidence explanation')
    require('before publishing' not in txt.lower(),f'{pdf.name}: publishing instructions')
    if c['category']=='client':
        require(all(v in txt for v in ['923','434','210','314','62','23','not ultimately held']),'AlphaRose PDF evidence missing')
    require('thisisfurqanahmad@gmail.com' in txt,f'{pdf.name}: missing contact')

for path in [ROOT/'sitemap.xml',ROOT/'assets/images/favicon.svg']:
    etree.parse(str(path))
# Public pages must not reveal private source identifiers or investor contacts.
public='\n'.join(p.read_text() for p in pages)
require('docs.google.com/spreadsheets' not in public,'Private CRM link leaked')
require(set(re.findall(r'[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}',public))=={'thisisfurqanahmad@gmail.com'},'Unexpected email address in public pages')
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} HTML pages, {links} internal links/assets/anchors, four PDF reports, metadata and privacy checks.')
