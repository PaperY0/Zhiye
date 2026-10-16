from pathlib import Path
from html import escape
import base64

P=Path(__file__).parent/'zhiye-roadshow_ppt169_20261013'
S=P/'design-samples-v2'
S.mkdir(exist_ok=True)
F='Noto Sans SC, Microsoft YaHei, Arial'
def t(x,y,s,size=28,color='#172019',weight=400,font=F):
    a=s.split('\n'); z=f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(a[0])}'
    for l in a[1:]:z+=f'<tspan x="{x}" dy="{size*1.27:g}">{escape(l)}</tspan>'
    return z+'</text>'
def r(x,y,w,h,fill,rx=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>'
def l(x1,y1,x2,y2,color='#DCE8D5'):return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1"/>'
def g(i,b,s):return f'<g id="{i}" data-pptx-bounds="{b}">{s}</g>'
def img(name,x,y,w,h,mode='meet'):return f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="../images/{name}" preserveAspectRatio="xMidYMid {mode}"/>'
def root(role):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" data-pptx-page-role="{role}" font-family="{F}">'
def write(name,s):
    s+='</svg>';(S/(name+'.svg')).write_text(s,encoding='utf-8')
    # Preview carries font loading outside the canonical SVG.
    font='data:font/ttf;base64,'+base64.b64encode((P/'fonts/MaShanZheng-Regular.ttf').read_bytes()).decode()
    font2='data:font/ttf;base64,'+base64.b64encode(Path('C:/Windows/Fonts/NotoSansSC-VF.ttf').read_bytes()).decode()
    for f in ['zhiye-kite-valley.png','shot-workspace.jpg']:
        if f in s:
            uri='data:image/'+('png' if f.endswith('png') else 'jpeg')+';base64,'+base64.b64encode((P/'images'/f).read_bytes()).decode()
            s=s.replace('../images/'+f,uri)
    (S/(name+'.html')).write_text(f'<html><head><meta charset="utf-8"><style>@font-face{{font-family:"Ma Shan Zheng";src:url("{font}")}} @font-face{{font-family:"Noto Sans SC";src:url("{font2}");font-weight:100 900}}body{{margin:0;background:#F4F7F3}} svg{{display:block;width:1280px;height:720px}}</style></head><body>{s}</body></html>',encoding='utf-8')

# Cover: left aligned brush title over the original landscape, no UI card.
s=root('cover')
s+='<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F7F3" stop-opacity="0.74"/><stop offset="0.68" stop-color="#F4F7F3" stop-opacity="0.58"/><stop offset="1" stop-color="#F4F7F3" stop-opacity="0"/></linearGradient></defs>'
s+='<image id="landscape" data-pptx-role="background" x="0" y="0" width="1280" height="720" href="../images/zhiye-kite-valley.png" preserveAspectRatio="xMidYMid slice"/>'
s+='<rect id="sky-wash" data-pptx-role="decoration" x="0" y="0" width="1280" height="720" fill="url(#sky)"/>'
s+=g('brand','68 36 1144 58',t(68,69,'知野',32,weight=900)+t(150,66,'Z H I Y E',14,'#526F59',600)+t(977,66,'课堂复盘数字员工',20,'#294B30'))
s+=g('cover-title','68 130 1100 256',t(68,226,'让每一间课堂',108,font='Ma Shan Zheng, KaiTi')+t(68,352,'长出自己的回响',108,'#3F6B45',font='Ma Shan Zheng, KaiTi'))
s+=g('cover-description','76 412 680 114',t(76,430,'把课堂记录，变成下一次教学的依据',30,'#172019',500)+t(76,476,'面向乡村小学的 AI 课堂复盘与精准补讲',20,'#294B30'))
s+=g('cover-foot','76 657 650 30',t(76,681,'比赛路演  /  5 分钟',16,'#FFFFFF',600))
write('01_cover',s)

# Product: main approval module enlarged with complete-screen reference.
s=root('content')+r(0,0,1280,720,'#F4F7F3')
s+=g('brand','64 32 1152 45',t(64,60,'知野',24,weight=900)+t(139,58,'Z H I Y E',12,'#526F59')+t(1053,58,'02   产品成果',16,'#526F59',500))
s+=g('product-title','64 112 410 184',t(64,170,'把一节课，',56,weight=800)+t(64,243,'整理成教学材料',48,weight=800))
s+=g('input-output','64 323 406 166',t(64,352,'INPUT',14,'#526F59',600)+t(64,387,'课堂录音 + 补讲目标',26,weight=500)+l(64,409,430,409)+t(64,444,'OUTPUT',14,'#526F59',600)+t(64,478,'复习卡、报告、补讲与练习',24,weight=500))
s+=g('full-interface','64 521 398 165',img('shot-workspace.jpg',64,521,226,142)+t(312,553,'教师工作台',18,'#526F59',600)+t(312,584,'产品界面示例',16,'#56675C')+t(312,616,'可审核的复盘',16,'#56675C'))
s+=g('product-focus','505 112 719 563',r(505,112,719,563,'#DCE8D5',24)+t(541,153,'AI 初稿可编辑，教师确认后发布',20,'#294B30',600)+'<svg x="525" y="177" width="679" height="438" viewBox="214 98 643 415" preserveAspectRatio="xMidYMid meet">'+img('shot-workspace.jpg',0,0,1180,738)+'</svg>'+t(541,654,'核对依据  /  修改草稿  /  确认发布',20,'#294B30',500))
write('05_product',s)

# Verification: editorial split, oversized figures, explicit evidence scope.
s=root('content')+r(0,0,1280,720,'#172019')+r(878,0,402,720,'#FFFEFA')
s+=g('verification-brand','64 32 748 51',t(64,63,'知野',24,'#FFFEFA',900)+t(139,60,'Z H I Y E',12,'#DCE8D5')+t(671,61,'03   验证结果',16,'#DCE8D5',500))
s+=g('verification-heading','64 112 748 151',t(64,161,'验证，以证据为准',52,'#FFFEFA',700)+t(64,218,'已完成原型工程验收',26,'#DCE8D5',400))
s+=g('metric-front','64 279 358 191',t(64,412,'181',144,'#FFFEFA',500)+t(72,462,'项前端测试通过',26,'#DCE8D5'))
s+=g('metric-ai','466 279 350 191',t(466,412,'63',144,'#C9A660',500)+t(474,462,'项本地 AI 测试通过',26,'#DCE8D5'))
s+=g('engineering-scope','64 508 748 151',l(64,510,812,510,'#526F59')+t(64,553,'类型检查与生产构建通过',24,'#FFFEFA',500)+t(64,598,'四类失败边界：空录音、缺密钥、空转写、网络断开',20,'#DCE8D5')+t(64,648,'项目 Day 08 历史验收记录，数字为当时测试结果',16,'#DCE8D5'))
s+=g('field-validation','918 86 322 548',t(918,115,'下一阶段',16,'#526F59',600)+t(918,208,'真实课堂\n效果验证',42,'#172019',700)+l(918,299,1216,299)+t(918,351,'端到端耗时',28,'#294B30',500)+t(918,416,'教师审核与修改量',24,'#294B30',500)+t(918,481,'持续学习反馈',28,'#294B30',500)+t(918,579,'目前尚无课堂成效数据',20,'#56675C')+t(918,619,'计划通过教师试用检验',20,'#56675C'))
write('10_validation',s)
print(S)

