from pathlib import Path
from html import escape
import sys

P=Path(__file__).parent/'zhiye-roadshow_ppt169_20261013'
C={'bg':'#F4F7F3','paper':'#FFFEFA','ink':'#172019','green':'#526F59','gold':'#C9A660','body':'#294B30','muted':'#56675C','line':'#DCE8D5'}
F='Noto Sans SC, Arial, Microsoft YaHei'

def text(x,y,lines,size=28,fill=None,bold=False,family=F,anchor=None,leading=None):
    lines=lines.split('\n') if isinstance(lines,str) else lines
    attrs=f'x="{x}" y="{y}" font-family="{family}" font-size="{size}" fill="{fill or C["body"]}"'
    if bold:attrs+=' font-weight="700"'
    if anchor:attrs+=f' text-anchor="{anchor}"'
    s=f'<text {attrs}>{escape(lines[0])}'
    for line in lines[1:]:s+=f'<tspan x="{x}" dy="{leading or round(size*1.55)}">{escape(line)}</tspan>'
    return s+'</text>'

def rect(x,y,w,h,fill,rx=0,stroke=None):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="1"' if stroke else '')+'/>'
def line(x1,y1,x2,y2,color=None,width=2):return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color or C["line"]}" stroke-width="{width}"/>'
def group(id,bounds,contents):return f'<g id="{id}" data-pptx-bounds="{bounds}">{contents}</g>'
def image(name,x,y,w,h,mode='meet'):return f'<image href="../images/{name}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid {mode}"/>'
def base(n,title,section):
    s='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1280 720" data-pptx-page-role="content">'
    s+=f'<rect id="page-bg" data-pptx-role="background" x="0" y="0" width="1280" height="720" fill="{C["bg"]}"/>'
    s+=group('page-title','56 42 1168 113',text(56,63,section,16,C['green'],True)+text(56,125,title,42,C['ink'],True))
    s+=f'<g id="footer" data-pptx-role="footer" data-pptx-bounds="56 674 1168 28">'+text(56,694,'知野  ZHIYE',16,C['muted'])+text(1224,694,f'{n:02d} / 12',16,C['muted'],anchor='end')+'</g>'
    return s
def save(n,s):
    (P/'svg_output'/f'{n:02d}_zhiye.svg').write_text(s+'</svg>',encoding='utf-8')
    print(f'P{n:02d} authored')

def p1():
    s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" data-pptx-page-role="cover">'
    s+=f'<image id="valley" data-pptx-role="background" href="../images/zhiye-kite-valley.png" x="0" y="0" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/>'
    s+=group('cover-title','80 38 1120 295',text(80,65,'知野  ZHIYE',20,C['ink'],True)+text(640,170,'知野',76,C['ink'],True,'KaiTi, Arial, Microsoft YaHei','middle')+text(640,236,'课堂复盘数字员工',42,C['ink'],True,anchor='middle')+text(640,300,'让每一节课成为下一次教学的依据',28,C['body'],anchor='middle'))
    s+=group('cover-context','380 344 520 98',rect(380,344,520,98,C['paper'],20)+text(640,382,'乡村小学课堂复盘与精准补讲原型',20,C['body'],anchor='middle')+text(640,418,'比赛路演  ·  5 分钟',20,C['muted'],anchor='middle'))
    save(1,s)
def p2():
    s=base(2,'一节课结束，教学支持还没有结束','01  问题场景')
    s+=group('teacher-after-class','56 184 338 445',text(56,232,'课后还有一轮\n整理与跟进',34,C['ink'],True)+line(56,320,352,320)+text(56,376,'整理课堂重点\n准备补讲材料\n跟进学生疑问',28,leading=64)+text(56,608,'场景：乡村小学教师',20,C['muted']))
    s+=group('workspace-evidence','418 176 806 466',rect(418,176,806,466,C['paper'],20)+image('shot-workspace.jpg',434,190,774,425)+text(450,634,'知野教师工作台：把课后整理变成待审核成果',20,C['muted']))
    save(2,s)
def p3():
    s=base(3,'教学支持的三个断点','01  问题拆解')
    cols=[(56,'教师','复盘挤占精力',['课堂记录需要整理','补讲材料需要准备']),(456,'学生','卡点缺少引导',['不会的步骤需要提示','练习后需要表达理解']),(856,'教学','反馈难连续利用',['作业与提问分散','难衔接下一次教学'])]
    for i,(x,who,title,body) in enumerate(cols):
        s+=group(f'gap-{i}','%s 200 368 325'%x,text(x,231,who,20,C['green'],True)+text(x,310,title,34,C['ink'],True)+line(x,346,x+326,346)+text(x,408,body,28,leading=52))
    s+=group('gap-takeaway','56 556 1168 85',rect(56,556,1168,85,C['paper'],20)+text(90,610,'课堂记录，需要成为持续学习支持的依据',34,C['ink'],True))
    save(3,s)
def p4():
    s=base(4,'课堂到下一课的完整闭环','02  解决方案')
    s+=group('workflow','56 204 1168 285',line(112,286,1168,286,C['green'],3)+''.join(rect(x,245,190,82,C['paper'] if i!=2 else '#EEE3C9',20)+text(x+95,298,t,28,C['ink'],True,anchor='middle')+text(x+95,387,d,20,C['muted'],anchor='middle') for i,(x,t,d) in enumerate([(56,'课堂记录','音频与教学目标'),(300,'AI 整理','转写与生成草稿'),(544,'教师审核','核对、修改、发布'),(788,'学生学习','复习、练习、提问'),(1032,'反馈回流','下一课教学依据')])) )
    s+=group('workflow-return','56 500 1168 139',rect(56,500,1168,139,C['paper'],20)+text(88,549,'AI 承担整理，教师保留判断',34,C['ink'],True)+text(88,605,'学习反馈回到教师端，支持下一次补讲与任务安排',28))
    save(4,s)
def p5():
    s=base(5,'录下课堂，生成可用的草稿','02  产品成果')
    s+=group('recording-evidence','56 178 794 467',rect(56,178,794,467,C['paper'],20)+image('shot-teacher-classroom.jpg',70,188,766,426)+text(86,635,'输入：课堂录音 + 补讲目标',20,C['green'],True))
    s+=group('draft-results','880 188 344 460',text(880,230,'成果进入教学流程',28,C['ink'],True)+line(880,268,1210,268)+text(880,323,'学生复习卡',28,C['ink'],True)+text(880,366,'课堂重点与自检问题',20,C['muted'])+text(880,425,'教师课堂报告',28,C['ink'],True)+text(880,468,'课堂依据与教学建议',20,C['muted'])+text(880,527,'补讲教案与练习',28,C['ink'],True)+text(880,570,'支持下一次教学安排',20,C['muted']))
    save(5,s)
def p6():
    s=base(6,'每条建议，都有课堂依据','02  可追溯的复盘')
    s+=group('evidence-mechanism','56 184 382 446',text(56,232,'先核对课堂事实\n再判断教学建议',34,C['ink'],True)+line(56,333,400,333)+text(56,388,'原始转写可核对\n建议关联课堂证据\n教师核实后取舍',28,leading=58)+text(56,610,'课堂事实与 AI 推断分开呈现',20,C['green'],True))
    s+=group('lesson-evidence','458 176 766 464',rect(458,176,766,464,C['paper'],20)+image('shot-lesson-detail.jpg',472,190,738,414)+text(486,626,'课堂详情：转写、复习卡、报告与进度',20,C['muted']))
    save(6,s)
def p7():
    s=base(7,'教师审核，才抵达学生','02  人工确认')
    s+=group('publication-gate','56 184 438 454',text(56,234,'AI 初稿',34,C['muted'],True)+text(56,308,'教师编辑与确认',34,C['ink'],True)+text(56,382,'发布给学生',34,C['green'],True)+line(56,426,466,426)+text(56,483,'教师可核对、修改和取舍\n学生看到已发布复习卡',28,leading=52)+text(56,610,'课堂转写与教师报告不公开',20,C['muted']))
    s+=group('student-published-view','520 178 704 462',rect(520,178,704,462,C['paper'],20)+image('shot-review.jpg',534,190,676,413)+text(548,626,'学生端课堂复习页',20,C['muted']))
    save(7,s)
def p8():
    s=base(8,'学生学习，再回到下一课','02  反馈闭环')
    s+=group('insights-evidence','56 178 794 467',rect(56,178,794,467,C['paper'],20)+image('shot-insights.jpg',70,188,766,426)+text(86,635,'教师端班级洞察：汇总学习信号',20,C['muted']))
    s+=group('feedback-meaning','880 182 344 466',text(880,228,'学生学习',28,C['ink'],True)+text(880,276,'复习卡与任务\n分层提示、思路复述\n变式练习',20,C['muted'],leading=34)+line(880,380,1210,380)+text(880,435,'反馈回到教师',28,C['ink'],True)+text(880,483,'显示班级聚合信号\n形成下一课教师草稿',20,C['muted'],leading=36)+text(880,605,'草稿不自动推送',28,C['green'],True))
    save(8,s)
def p9():
    s=base(9,'有状态、有依据的工具编排','03  核心机制')
    s+=group('agent-chain','56 190 1168 250',line(113,273,1169,273,C['green'],3)+''.join(rect(x,223,260,103,C['paper'] if i<3 else '#EEE3C9',20)+text(x+130,283,label,28,C['ink'],True,anchor='middle')+text(x+130,385,desc,20,C['muted'],anchor='middle') for i,(x,label,desc) in enumerate([(56,'本地转写','FunASR 音频转文本'),(356,'提取课堂证据','依据原始课堂文本'),(656,'结构化生成','复习卡与教学草稿'),(956,'等待教师审核','人工确认后发布')])) )
    s+=group('runtime-boundary','56 475 1168 176',rect(56,475,1168,176,C['paper'],20)+text(88,521,'各步保留状态与错误原因，失败步骤可重试',28,C['ink'],True)+text(88,572,'本地模式：音频与题图由本机处理，所需文本用于大模型生成',20,C['muted'])+text(88,615,'当前原型：React / TypeScript + FastAPI',20,C['muted']))
    save(9,s)
def p10():
    s=base(10,'已完成工程验收，真实课堂效果待验证','03  验证结果')
    s+=group('engineering-results','56 187 1168 267',rect(56,187,1168,267,C['paper'],20)+text(88,232,'项目历史验收记录',20,C['green'],True)+text(88,339,'181',80,C['ink'],True)+text(88,408,'前端测试通过',28)+text(516,339,'63',80,C['ink'],True)+text(516,408,'本地 AI 测试通过',28)+text(906,295,'类型检查通过\n生产构建通过',28,C['body'],leading=58))
    s+=group('failure-boundaries','56 484 1168 92',text(56,521,'已覆盖四类失败边界',28,C['ink'],True)+text(56,562,'无麦克风 / 空录音、缺少密钥、空转写、模型网络断开',20,C['muted']))
    s+=group('verification-scope','56 597 1168 60',text(56,625,'尚未形成真实课堂的耗时、教师减负或学习提升数据',20,C['muted'])+text(56,650,'来源：项目 Day 08 验收记录；测试通过数量为当时记录',16,C['muted']))
    save(10,s)
def p11():
    s=base(11,'下一步：小规模教师试用','04  落地验证')
    s+=group('trial-path','56 185 1168 472',line(82,218,82,590,C['line'],3)+text(124,235,'当前原型',28,C['green'],True)+text(124,283,'同一浏览器内，教师、学生、家长、管理四端联动',28)+text(124,366,'计划试用',28,C['ink'],True)+text(124,414,'授权脱敏音频试跑，再开展教师审核对照与持续反馈',28)+rect(112,462,1112,175,C['paper'],20)+text(140,507,'待测指标',28,C['ink'],True)+text(140,555,'端到端耗时、转写可读性、证据一致性、教师修改量',28)+text(140,610,'跨设备共享与正式账号认证尚未接入',20,C['muted']))
    save(11,s)
def p12():
    s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" data-pptx-page-role="ending">'
    s+=f'<image id="valley" data-pptx-role="background" href="../images/zhiye-kite-valley.png" x="0" y="0" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/>'
    s+=group('closing-title','80 48 1120 290',text(80,77,'知野  ZHIYE',20,C['ink'],True)+text(640,175,'让每一间课堂',76,C['ink'],True,'KaiTi, Arial, Microsoft YaHei','middle')+text(640,270,'长出自己的回响',76,C['green'],True,'KaiTi, Arial, Microsoft YaHei','middle'))
    s+=group('closing-message','332 358 616 110',rect(332,358,616,110,C['paper'],20)+text(640,402,'AI 承担整理，教师保留判断',28,C['ink'],True,anchor='middle')+text(640,441,'知其所学，野望生长',20,C['muted'],anchor='middle'))
    save(12,s)

funcs=[p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12]
a=int(sys.argv[1]);b=int(sys.argv[2])
for i in range(a-1,b):funcs[i]()
