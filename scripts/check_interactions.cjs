/* DOM-level behavior checks. These do not replace visual browser testing. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const raw = JSON.parse(execFileSync('python', ['-c', `
import json
from lxml import html
from pathlib import Path
root=html.fromstring(Path('index.html').read_bytes())
def node(e):
 return {'tag':e.tag,'attrs':dict(e.attrib),'text':e.text_content(),'children':[node(c) for c in e if isinstance(c.tag,str)]}
print(json.dumps(node(root)))
`], { cwd: root, encoding: 'utf8' }));
let active;
class Element {
  constructor(raw, parent = null) {
    this.tag = raw.tag; this.attrs = {...raw.attrs}; this.textContent = raw.text;
    this.parent = parent; this.events = {}; this.validityMessage = '';
    this.children = raw.children.map(c => new Element(c, this));
    this.value = this.attrs.value || (this.tag === 'select' ? this.children[0].textContent : '');
    this.classList = {
      contains: c => (this.attrs.class || '').split(' ').includes(c),
      add: c => this.classList.toggle(c, true),
      remove: c => this.classList.toggle(c, false),
      toggle: (c, on) => {
        const set = new Set((this.attrs.class || '').split(' ').filter(Boolean));
        if (on ?? !set.has(c)) set.add(c); else set.delete(c);
        this.attrs.class = [...set].join(' ');
      }
    };
  }
  get dataset() { return Object.fromEntries(Object.entries(this.attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5).replace(/-([a-z])/g,(_,l) => l.toUpperCase()),v])); }
  get hidden() { return 'hidden' in this.attrs; }
  set hidden(v) { if(v)this.attrs.hidden='';else delete this.attrs.hidden; }
  get href() { return this.attrs.href; } set href(v) { this.attrs.href=v; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  setAttribute(k,v) { this.attrs[k]=String(v); }
  matches(s) {
    const attr = s.match(/\[([^\]]+)\]/); if(attr && !(attr[1] in this.attrs))return false;
    s=s.replace(/\[[^\]]+\]/g,'');
    if(s.startsWith('#'))return this.attrs.id===s.slice(1);
    if(s.startsWith('.'))return this.classList.contains(s.slice(1));
    return !s || s===this.tag;
  }
  all() { return this.children.flatMap(c => [c,...c.all()]); }
  querySelectorAll(s) { return this.all().filter(c=>c.matches(s)); }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  closest(s) { return this.matches(s) ? this : this.parent?.closest(s); }
  contains(e) { return e===this || this.all().includes(e); }
  addEventListener(type,fn,options) { (this.events[type] ||= []).push({fn,once:options?.once}); }
  async fire(type,extra={}) {
    const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...extra};
    for(const entry of [...(this.events[type]||[])]) {await entry.fn(event);if(entry.once)this.events[type]=this.events[type].filter(e=>e!==entry);}
    return event;
  }
  focus() { active=this; }
  setCustomValidity(v) { this.validityMessage=v; }
  reportValidity() { return this.tag==='form' ? this.all().every(e=>e.reportValidity()) : !this.validityMessage && (!('required' in this.attrs) || !!this.value); }
}
(async () => {
 const html=new Element(raw);
 const doc=new Element({tag:'document',attrs:{},text:'',children:[]});
 doc.children=[html];doc.documentElement=html;doc.getElementById=id=>doc.querySelector('#'+id);
 const win=new Element({tag:'window',attrs:{},text:'',children:[]});win.innerWidth=375;
 let copied='';const navigator={clipboard:{writeText:async text=>{copied=text}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8'),{document:doc,window:win,navigator,Date,Error,encodeURIComponent});
 const q=s=>doc.querySelector(s), all=s=>doc.querySelectorAll(s);
 assert(all('[data-enhanced]').every(e=>!e.hidden));
 assert(html.classList.contains('nav-ready'));
 const toggle=q('.nav-toggle'),menu=q('#primary-navigation');
 await toggle.fire('click');assert.equal(toggle.getAttribute('aria-expanded'),'true');assert(menu.classList.contains('is-open'));
 await doc.fire('keydown',{key:'Escape'});assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(active,toggle);
 await toggle.fire('click');await menu.fire('click',{target:menu.querySelector('a')});assert.equal(active.attrs.id,'work');assert(!menu.classList.contains('is-open'));
 await toggle.fire('click');await doc.fire('click',{target:q('h1')});assert.equal(toggle.getAttribute('aria-expanded'),'false');
 await toggle.fire('click');win.innerWidth=1200;await win.fire('resize');assert(!menu.classList.contains('is-open'));
 const filters=all('[data-filter]');
 await filters[1].fire('click');assert.equal(all('.work-card').filter(e=>!e.hidden).length,1);assert.equal(q('[data-filter-count]').textContent,'1 case study');
 await filters[2].fire('click');assert.equal(all('.work-card').filter(e=>!e.hidden).length,3);
 await filters[0].fire('click');assert.equal(all('.work-card').filter(e=>!e.hidden).length,4);
 const audiences=all('[data-audience]');await audiences[1].fire('click');assert.equal(q('#audience-detail').querySelector('h4').textContent,'Corporate training providers');
 assert.equal(audiences.filter(e=>e.getAttribute('aria-pressed')==='true').length,1);
 await q('[data-copy-email]').fire('click');assert.equal(copied,'thisisfurqanahmad@gmail.com');assert.equal(q('[data-copy-status]').textContent,'Email address copied.');
 navigator.clipboard=null;await q('[data-copy-email]').fire('click');assert(q('[data-copy-status]').textContent.includes('Select and copy'));
 const form=q('#project-brief'),goal=q('#brief-goal');
 assert((await form.fire('submit')).defaultPrevented);assert(q('#brief-result').hidden);
 goal.value='   ';await form.fire('submit');assert(goal.validityMessage);assert(q('#brief-result').hidden);
 goal.value='Research R&D buyers <script>alert(1)</script> & pricing\nNext line';await goal.fire('input');
 q('#brief-company').value='A&B Research';await form.fire('submit');
 assert(!q('#brief-result').hidden);assert.equal(active,q('.brief-status'));
 const mail=new URL(q('#brief-mail').href),gmail=new URL(q('#brief-gmail').href);
 assert.equal(mail.protocol,'mailto:');assert.equal(gmail.hostname,'mail.google.com');
 assert.equal(mail.searchParams.get('body'),gmail.searchParams.get('body'));
 assert(mail.searchParams.get('body').includes(goal.value));assert(mail.searchParams.get('body').includes('A&B Research'));
 assert(q('#brief-preview').textContent.includes('<script>alert(1)</script>'));
 assert.equal(q('#brief-preview').children.length,0);
 assert.equal(q('[data-current-year]').textContent,new Date().getFullYear());
 console.log('PASS: navigation state/focus, filters, audience switching, clipboard fallback, required fields and safely encoded email drafts.');
})().catch(error=>{console.error(error);process.exit(1)});
