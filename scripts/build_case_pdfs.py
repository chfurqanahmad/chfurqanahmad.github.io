"""Build public case-study PDFs from the same reviewed content as the site."""
from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("Portfolio", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Portfolio-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from case_studies import CASES

pdfmetrics.registerFontFamily("Portfolio", normal="Portfolio", bold="Portfolio-Bold", italic="Portfolio", boldItalic="Portfolio-Bold")

ROOT=Path(__file__).resolve().parents[1]
INK=colors.HexColor('#142b35')
MUTED=colors.HexColor('#50656d')
TEAL=colors.HexColor('#136b63')
LINE=colors.HexColor('#d6ded9')
SOFT=colors.HexColor('#edf2ec')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='CaseTitle',fontName='Portfolio-Bold',fontSize=25,leading=29,textColor=INK,spaceAfter=15))
styles.add(ParagraphStyle(name='Kicker',fontName='Portfolio-Bold',fontSize=8,leading=12,textColor=TEAL,spaceAfter=12))
styles.add(ParagraphStyle(name='LeadText',fontName='Portfolio',fontSize=12,leading=17,textColor=MUTED,spaceAfter=17))
styles.add(ParagraphStyle(name='CaseBody',fontName='Portfolio',fontSize=9.8,leading=14,textColor=MUTED,spaceAfter=8))
styles.add(ParagraphStyle(name='CaseHeading',fontName='Portfolio-Bold',fontSize=14.5,leading=19,textColor=INK,spaceBefore=12,spaceAfter=7,keepWithNext=True))
styles.add(ParagraphStyle(name='SmallText',fontName='Portfolio',fontSize=8.3,leading=12,textColor=MUTED,spaceAfter=8))
styles.add(ParagraphStyle(name='MetricValue',fontName='Portfolio-Bold',fontSize=25,leading=30,textColor=TEAL))
styles.add(ParagraphStyle(name='Cell',fontName='Portfolio',fontSize=8.4,leading=12,textColor=INK))
styles.add(ParagraphStyle(name='CellHead',fontName='Portfolio-Bold',fontSize=8.4,leading=12,textColor=INK))

def clean(text):
    return text.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"').replace('–','-').replace('—','-').replace('→','to').replace('↗','').replace('↓','')

def p(text,style='CaseBody'):
    return Paragraph(escape(clean(text)),styles[style])

def page(canvas,doc):
    canvas.saveState()
    width,height=A4
    canvas.setStrokeColor(LINE);canvas.line(48,height-37,width-48,height-37)
    canvas.setFillColor(INK);canvas.setFont('Portfolio-Bold',8)
    canvas.drawString(48,height-26,'FURQAN AHMAD')
    canvas.setFillColor(MUTED);canvas.setFont('Portfolio',8)
    canvas.drawRightString(width-48,height-26,'RESEARCH / QUALITY / PARTNERSHIPS')
    canvas.line(48,41,width-48,41)
    canvas.drawString(48,27,'furqanahmad.com')
    canvas.linkURL('https://furqanahmad.com/',(48,24,140,36),relative=0)
    canvas.drawRightString(width-48,27,f'{doc.page}')
    canvas.restoreState()

def build(c):
    styles['CaseBody'].fontSize = 9.2 if c['category']=='client' else 9.8
    styles['CaseBody'].leading = 12 if c['category']=='client' else 14
    styles['CaseBody'].spaceAfter = 4 if c['category']=='client' else 8
    path=ROOT/'assets/documents'/c['pdf']
    doc=SimpleDocTemplate(str(path),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=53,bottomMargin=50,title=c['short'],author='Furqan Ahmad',subject=c['description'])
    width=A4[0]-84
    story=[p(c['kind'].upper()+' / '+c['date'],'Kicker'),p(c['title'],'CaseTitle'),p(c['description'],'LeadText')]
    cells=[[p(v,'MetricValue'),p(label,'SmallText')] for v,label in c['metrics']]
    metric=Table([cells[i:i+3] for i in range(0,len(cells),3)],colWidths=[width/3]*3)
    metric.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,-1),SOFT),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story += [metric,Spacer(1,10),p('The short version','CaseHeading'),p(c['summary'])]
    for i,(title,paras) in enumerate(c['sections']):
        if c['category']=='client' and i==2: story.append(PageBreak())
        story.append(p(title,'CaseHeading'))
        story += [p(text) for text in paras]
        if i==2 and c.get('table'):
            t=c['table'];n=len(t['headers'])
            widths=[width*.40]+[width*.60/(n-1)]*(n-1) if n>3 else [width*.6,width*.2,width*.2]
            rows=[[p(x,'CellHead') for x in t['headers']]]+[[p(x,'Cell') for x in row] for row in t['rows']]
            grid=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
            grid.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),SOFT),('LINEBELOW',(0,0),(-1,-1),.5,LINE),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
            story += [p(t['title'],'CaseHeading'),grid,Spacer(1,10)]
    story += [p('Sources & scope','CaseHeading'),p(c['source_note'],'SmallText')]
    for label,url in c['sources']:
        story.append(Paragraph(f'<link href="{escape(url,quote=True)}" color="#136b63">{escape(clean(label))}</link>',styles['SmallText']))
    page_url='https://furqanahmad.com/projects/'+c['slug']+'.html'
    contact = '<b>Discuss a research or outreach project</b><br/><link href="mailto:thisisfurqanahmad@gmail.com" color="#136b63">thisisfurqanahmad@gmail.com</link> | <link href="'+page_url+'" color="#136b63">Read this case study online</link>'
    if c.get('dataset'):
        contact += '<br/><link href="https://furqanahmad.com/assets/documents/'+c['dataset']+'" color="#136b63">Download the source workbook</link>'
    story.append(KeepTogether([Spacer(1,10),Paragraph(contact,styles['SmallText'])]))
    doc.build(story,onFirstPage=page,onLaterPages=page)
    print(path.name)

if __name__=='__main__':
    for case in CASES:build(case)
