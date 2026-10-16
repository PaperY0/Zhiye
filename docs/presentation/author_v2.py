from pathlib import Path
from html import escape
import shutil,sys
BASE=Path(__file__).parent;P=BASE/'zhiye-roadshow-v2_ppt169_20261013';S=BASE/'zhiye-motion-samples_ppt169_20261013'
F='Noto Sans SC, Arial, Microsoft YaHei';INK='#172019';GREEN='#526F59';PAPER='#FFFEFA';BG='#F4F7F3';SAGE='#DCE8D5';GOLD='#C9A660';MUTED='#56675C'
def t(x,y,s,size=28,c=INK,w=400,font=F,dy=None):
 a=s.split('\n');z=f'<text x="{x}" y="{y}" font-size="{size}" fill="{c}" font-weight="{w}" font-family="{font}">{escape(a[0])}'
 for q in a[1:]:z+=f'<tspan x="{x}" dy="{dy or size*1.35:g}">{escape(q)}</tspan>'
 return z+'</text>'
def r(x,y,w,h,c,rx=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}"/>'
def l(x,y,xx,yy,c=SAGE):return f'<line x1="{x}" y1="{y}" x2="{xx}" y2="{yy}" stroke="{c}" stroke-width="1"/>'
def g(id,b,s):return f'<g id="{id}" data-pptx-bounds="{b}">{s}</g>'
def img(name,x,y,w,h):return f'<image href="../images/{name}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet"/>'
def start(n,section,dark=False):
 c=PAPER if dark else INK;mut=SAGE if dark else GREEN
 z=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" data-pptx-page-role="content" font-family="{F}">'
 z+=f'<rect id="background" data-pptx-role="background" x="0" y="0" width="1280" height="720" fill="{INK if dark else BG}"/>'
 z+=f'<g id="brand" data-pptx-role="header" data-pptx-bounds="64 30 1152 54">'+t(64,62,'知野',24,c,900)+t(140,59,'Z H I Y E',14,mut)+t(1036,59,section,16,mut)+'</g>'
 z+=f'<g id="footer" data-pptx-role="footer" data-pptx-bounds="64 674 1152 26">'+t(64,694,'课堂复盘数字员工',14,mut)+t(1160,694,f'{n:02d} / 12',14,mut)+'</g>'
 return z
def save(n,s):
 (P/'svg_output'/f'{n:02d}_zhiye.svg').write_text(s+'</svg>',encoding='utf-8');print(f'P{n:02d}')
def sample(n,name):
 txt=(S/'svg_output'/name).read_text(encoding='utf-8');(P/'svg_output'/f'{n:02d}_zhiye.svg').write_text(txt,encoding='utf-8');print(f'P{n:02d} approved sample')
def p1():sample(1,'01_cover.svg')
def p2():
 z=start(2,'01  问题场景')
 z+=g('scenario-title','64 124 696 230',t(64,181,'一节课结束，',52,w=800)+t(64,259,'教学支持还没有结束',52,w=800)+t(64,330,'乡村小学教师的课后工作',24,GREEN))
 z+=g('teacher-load','828 126 388 394',l(828,126,828,520)+t(868,172,'课堂重点',34,w=700)+t(868,217,'从记录中整理',24,MUTED)+t(868,294,'补讲材料',34,w=700)+t(868,339,'把卡点变成教案与练习',24,MUTED)+t(868,416,'学生疑问',34,w=700)+t(868,461,'跟进并安排下一次教学',24,MUTED))
 z+=g('scenario-takeaway','64 405 696 161',t(64,454,'记录已经留下，',34,GREEN,600)+t(64,515,'还需要转化成可用的教学材料',28,GREEN))
 save(2,z)
def p3():
 z=start(3,'01  问题拆解',True)
 z+=g('gap-title','64 120 1152 105',t(64,180,'教学支持，断在三个地方',52,PAPER,700))
 for i,(x,num,who,claim,desc) in enumerate([(64,'01','教师','复盘挤占精力','整理课堂记录\n准备补讲材料'),(464,'02','学生','卡点缺少引导','需要分层提示\n需要表达自己的理解'),(864,'03','下一课','反馈难连续利用','作业与提问分散\n难衔接后续教学')]):
  z+=g(f'gap-{i}','%s 267 352 343'%x,t(x,334,num,72,GOLD if i==1 else SAGE,500)+t(x+118,325,who,28,SAGE)+t(x,420,claim,34,PAPER,600)+t(x,493,desc,24,SAGE,dy=43))
 save(3,z)
def p4():
 z=start(4,'02  解决方案')
 z+=g('loop-title','64 120 1152 147',t(64,179,'把课堂，接到下一课',52,w=800)+t(64,241,'教师审核连接 AI 复盘与学生学习',24,GREEN))
 vals=[('课堂记录','音频与教学目标'),('AI 整理','转写与生成草稿'),('教师审核','核对、修改、发布'),('学生学习','复习、练习、提问'),('反馈回流','支持下一次教学')]
 for i,(title,desc) in enumerate(vals):
  x=64+i*232
  z+=g(f'loop-{i+1}',f'{x} 307 216 230',r(x,307,216,230,'#EEE3C9',20) if i==2 else '')
  # Keep each stage's semantic unit and its preceding relationship together.
  frag=t(x+18,392,f'{i+1:02d}',72,GOLD if i==2 else GREEN,500)+t(x+18,457,title,28,w=700)+t(x+18,505,desc,20,MUTED)
  z=z.replace(f'<g id="loop-{i+1}" data-pptx-bounds="{x} 307 216 230">',f'<g id="loop-{i+1}" data-pptx-bounds="{x} 307 216 230">'+frag)
 z+=g('loop-return','64 580 1152 60',t(64,620,'学习反馈回到教师端，支持下一次补讲与任务安排',28,GREEN,500))
 save(4,z)
def p5():sample(5,'02_product.svg')
def p6():
 z=start(6,'02  课堂依据')
 z+=g('evidence-title','64 120 1152 150',t(64,180,'每条建议，都能回到课堂依据',52,w=800)+t(64,240,'课堂事实与 AI 推断分开呈现',24,GREEN))
 z+=g('lesson-screen','64 292 692 358',img('shot-lesson-detail.jpg',64,292,548,343)+t(636,327,'原始',20,GREEN,600)+t(636,358,'转写',20,GREEN,600))
 z+=g('evidence-facts','812 297 404 112',t(812,335,'01  核对课堂事实',28,w=600)+t(812,387,'保留原始转写与课堂原话',24,MUTED))
 z+=g('evidence-inference','812 431 404 112',t(812,469,'02  判断教学建议',28,w=600)+t(812,521,'核实证据关联，再决定取舍',24,MUTED))
 z+=g('evidence-note','812 568 404 75',t(812,610,'教师保留最终判断',28,GREEN,600))
 save(6,z)
def p7():
 z=start(7,'02  教师审核',True)
 z+=g('approval-title','64 119 572 218',t(64,177,'教师确认，',52,PAPER,700)+t(64,253,'才对学生开放',52,PAPER,700))
 z+=g('approval-actions','64 362 546 155',t(64,398,'AI 初稿可编辑',28,SAGE)+t(64,452,'教师核对、修改、确认发布',28,SAGE)+t(64,505,'课堂转写与教师报告不公开',24,SAGE))
 z+=g('unpublished-evidence','652 139 564 392',img('shot-review.jpg',652,139,564,353)+t(674,523,'未发布时，学生端不可查看',24,SAGE,500))
 z+=g('approval-takeaway','64 571 1152 75',t(64,620,'发布门槛，在教师手里',34,GOLD,600))
 save(7,z)
def p8():
 z=start(8,'02  学习回流')
 z+=g('feedback-title','64 117 1152 127',t(64,178,'学生的学习，回到下一次教学',52,w=800)+t(64,235,'从学习支持到班级聚合信号',24,GREEN))
 z+=g('learning-support','64 297 414 303',t(64,342,'学生学习',34,w=700)+t(64,397,'复习卡与任务',28)+t(64,447,'分层提示、思路复述',24,MUTED)+t(64,489,'变式练习',24,MUTED)+l(64,531,420,531)+t(64,578,'下一课教师草稿',28,GREEN,600)+t(64,626,'草稿不自动推送',20,MUTED))
 z+=g('feedback-screen','510 290 706 346',img('shot-insights.jpg',510,290,542,339)+t(1076,350,'聚合',20,GREEN,600)+t(1076,384,'学习',20,GREEN,600)+t(1076,418,'信号',20,GREEN,600))
 save(8,z)
def p9():
 z=start(9,'03  核心机制')
 z+=g('agent-title','64 116 1152 140',t(64,178,'有状态、有依据的工具编排',52,w=800)+t(64,239,'多步工作流保留证据与人工审核节点',24,GREEN))
 vals=[('本地转写','FunASR 音频转文本'),('提取证据','依据原始课堂文本'),('结构化生成','复习卡与教学草稿'),('教师审核','人工确认后发布')]
 for i,(title,desc) in enumerate(vals):
  x=64+i*296
  z+=g(f'agent-{i+1}',f'{x} 291 264 211',t(x,363,f'{i+1:02d}',72,GOLD if i==3 else GREEN,500)+t(x,432,title,28,w=600)+t(x,480,desc,20,MUTED))
 z+=g('agent-boundary','64 536 1152 112',l(64,540,1216,540)+t(64,584,'各步保留状态与错误原因，失败步骤可重试',28,GREEN,500)+t(64,629,'本地模式：本机处理音频和题图，所需文本用于大模型生成',20,MUTED))
 save(9,z)
def p10():sample(10,'03_validation.svg')
def p11():
 z=start(11,'04  落地验证')
 z+=g('trial-title','64 116 1152 115',t(64,180,'下一步，用真实课堂检验价值',52,w=800))
 z+=g('prototype-boundary','64 284 450 332',t(64,323,'当前原型',34,GREEN,600)+t(64,383,'同一浏览器内四端联动',28)+t(64,432,'教师、学生、家长、管理',24,MUTED)+l(64,468,478,468)+t(64,514,'跨设备共享与正式账号认证',24,MUTED)+t(64,554,'尚未接入',24,MUTED))
 z+=g('audio-trial','602 278 614 132',t(602,317,'01  真实音频验收',28,w=600)+t(602,366,'获准且脱敏的课堂音频，跑通端到端流程',24,MUTED))
 z+=g('teacher-trial','602 428 614 124',t(602,467,'02  小规模教师试用',28,w=600)+t(602,516,'审核对照与持续学习反馈',24,MUTED))
 z+=g('trial-metrics','602 573 614 79',t(602,607,'待测：耗时、可读性、证据一致性、修改量',24,GREEN,500))
 save(11,z)
def p12():
 z=(S/'svg_output/01_cover.svg').read_text(encoding='utf-8').replace('data-pptx-page-role="cover"','data-pptx-page-role="ending"').replace('把课堂记录，变成下一次教学的依据','AI 承担整理，教师保留判断').replace('面向乡村小学的 AI 课堂复盘与精准补讲','知其所学，野望生长').replace('比赛路演  /  5 分钟','谢谢各位评委')
 (P/'svg_output/12_zhiye.svg').write_text(z,encoding='utf-8');print('P12')
funcs=[p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12]
for i in range(int(sys.argv[1])-1,int(sys.argv[2])):funcs[i]()
