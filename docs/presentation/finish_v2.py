from pathlib import Path
import json,re,base64
import xml.etree.ElementTree as E
BASE=Path(__file__).parent;P=BASE/'zhiye-roadshow-v2_ppt169_20261013';S=BASE/'zhiye-motion-samples_ppt169_20261013'
old=json.loads((S/'animations.json').read_text(encoding='utf-8'))
slides={'05_zhiye':old['slides']['02_product'],'10_zhiye':old['slides']['03_validation']}
def row(order,trigger='after-previous',effect='entrance_fade',duration=.3):return dict(effect=effect,order=order,trigger=trigger,duration=duration)
slides.update({
 '02_zhiye':{'groups':{'teacher-load':row(1,'on-click'), 'scenario-takeaway':row(2)}},
 '03_zhiye':{'groups':{f'gap-{i}':row(i+1,'on-click' if i==0 else 'after-previous') for i in range(3)}},
 '04_zhiye':{'groups':{**{f'loop-{i}':row(i,'on-click' if i==1 else 'after-previous',duration=.24) for i in range(1,6)},'loop-return':row(6,'on-click')}},
 '06_zhiye':{'groups':{'lesson-screen':row(1,'on-click','entrance_float',.42),'evidence-facts':row(2),'evidence-inference':row(3),'evidence-note':row(4,'on-click')}},
 '07_zhiye':{'groups':{'approval-actions':row(1,'on-click'),'unpublished-evidence':row(2,'after-previous','entrance_float',.42),'approval-takeaway':row(3,'on-click')}},
 '08_zhiye':{'groups':{'learning-support':row(1,'on-click'),'feedback-screen':row(2,'after-previous','entrance_float',.42)}},
 '09_zhiye':{'groups':{**{f'agent-{i}':row(i,'on-click' if i==1 else 'after-previous',duration=.24) for i in range(1,5)},'agent-boundary':row(5,'on-click')}},
 '11_zhiye':{'groups':{'prototype-boundary':row(1,'on-click'),'audio-trial':row(2),'teacher-trial':row(3),'trial-metrics':row(4,'on-click')}}
})
(P/'animations.json').write_text(json.dumps({'version':1,'slides':slides},ensure_ascii=False,indent=2),encoding='utf-8')
# Ground notes in the final page text and corrected evidence state.
f=P/'notes/total.md';s=f.read_text(encoding='utf-8')
s=s.replace('这条机制','这一机制')
s=s.replace('学生端看到的是已经发布的复习卡，课堂转写和教师报告不会公开。','页面展示的是未发布时的学生端，明确提示复习卡不可查看。只有教师确认发布后，学生才获得复习卡，课堂转写和教师报告不会公开。')
s=s.replace('前端采用 React 和 TypeScript，服务端采用 FastAPI。','')
f.write_text(s,encoding='utf-8')
# Source-aware notes consistency summary for internal verification.
ns={'s':'http://www.w3.org/2000/svg'}
texts=[]
for file in sorted((P/'svg_output').glob('*.svg')):
 root=E.parse(file);texts.append(file.name+'\n'+'\n'.join(''.join(t.itertext()) for t in root.findall('.//s:text',ns)))
(P/'validation/final-page-text.txt').write_text('\n\n'.join(texts),encoding='utf-8')

template=(S/'知野-动效预览.html').read_text(encoding='utf-8')
articles=[];plans=[]
for i,file in enumerate(sorted((P/'svg_output').glob('*.svg'))):
 svg=file.read_text(encoding='utf-8')
 for name in re.findall(r'href="\.\./images/([^"]+)"',svg):
  image=P/'images'/name;kind='png' if image.suffix=='.png' else 'jpeg';uri='data:image/'+kind+';base64,'+base64.b64encode(image.read_bytes()).decode();svg=svg.replace('../images/'+name,uri)
 articles.append(f'<article aria-label="第 {i+1} 页">{svg}</article>')
 groups=slides.get(file.stem,{}).get('groups',{})
 plans.append([{'id':id,'duration':int(v['duration']*1000),**({'travel':12} if v['effect']=='entrance_float' else {})} for id,v in sorted(groups.items(),key=lambda x:x[1]['order'])])
template=re.sub(r'<main>.*?</main>','<main>'+''.join(articles)+'</main>',template,flags=re.S)
template=template.replace('知野 · 动效样稿','知野 · 完整路演').replace('知野 · 路演动效样稿','知野 · 12 页比赛路演')
titles=['封面','问题场景','三个断点','方案闭环','产品成果','课堂依据','教师审核','反馈回流','工具编排','验证结果','落地计划','结尾']
navigation='<nav aria-label="页面选择"><button id="page-prev" aria-label="上一页">上一页</button><select id="page-select" aria-label="选择页面">'+''.join(f'<option value="{i}">{i+1:02d}  {t}</option>' for i,t in enumerate(titles))+'</select><button id="page-next" aria-label="下一页">下一页</button></nav>'
template=re.sub(r'<nav role="tablist".*?</nav>',navigation,template,flags=re.S)
template=re.sub(r'const plans=\[.*?\];\nconst reduced','const plans='+json.dumps(plans,ensure_ascii=False)+';\nconst reduced',template,flags=re.S)
template=template.replace('header{max-width:1280px','select{font:inherit;border:0;background:#fffefa;color:#172019;min-height:44px;padding:8px 12px;border-radius:12px}header{max-width:1280px')
template=template.replace('function select(i){stop();pageIndex=i;','function select(i){stop();pageIndex=i;document.querySelector("#page-select").value=i;')
template=template.replace('select(1);','document.querySelector("#page-select").onchange=e=>select(+e.target.value);document.querySelector("#page-prev").onclick=()=>select(Math.max(0,pageIndex-1));document.querySelector("#page-next").onclick=()=>select(Math.min(11,pageIndex+1));select(0);')
template=template.replace("plans[pageIndex].length?step+' / '+plans[pageIndex].length+' 步':'封面'","plans[pageIndex].length?step+' / '+plans[pageIndex].length+' 步':'完整页面'")
(P/'知野-完整路演预览.html').write_text(template,encoding='utf-8')
# Independent full-slide raster proofs, without motion or UI.
(P/'preview').mkdir(exist_ok=True)
fontstyle=template.split('<style>')[1].split('*{box-sizing')[0]
for i,article in enumerate(articles,1):
 svg=article[article.index('<svg'):article.rindex('</svg>')+6]
 (P/'preview'/f'{i:02d}.html').write_text('<meta charset="utf-8"><style>'+fontstyle+'body{margin:0}svg{display:block;width:1280px;height:720px}</style>'+svg,encoding='utf-8')
print('12-page native animation plan, grounded notes and standalone preview ready')
