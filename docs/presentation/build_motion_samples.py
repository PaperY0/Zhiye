from pathlib import Path
import re,base64,shutil

BASE=Path(__file__).parent
OLD=BASE/'zhiye-roadshow_ppt169_20261013'
NEW=BASE/'zhiye-motion-samples_ppt169_20261013'
selected=[('01_cover','01_cover'),('05_product','02_product'),('10_validation','03_validation')]
for f in ['zhiye-kite-valley.png','shot-workspace.jpg']:
    shutil.copy2(OLD/'images'/f,NEW/'images'/f)
for src,dst in selected:
    shutil.copy2(OLD/'design-samples-v2'/(src+'.svg'),NEW/'svg_output'/(dst+'.svg'))
spec=(OLD/'design_spec.md').read_text(encoding='utf-8')
parts=re.split(r'(?=#### Slide \d+ -)',spec)
header=parts[0]
header=header.replace('| Page Count | 12 |','| Page Count | 3 |').replace('| Custom Animations | disabled — workflow default |','| Custom Animations | enabled — 用户明确要求产品页与验证页分步动效 |')
header=header.replace('KaiTi','Ma Shan Zheng').replace('| Cover | 76 |','| Cover | 108 |').replace('| Display | 80 |','| Display | 144 |').replace('| Title | 42 |','| Title | 52 |')
header=header.replace('Cover 用楷体呼应网页书法','Cover 使用网页原本的毛笔字体')
used=[]
for i,oldnum in enumerate([1,5,10],1):
    block=parts[oldnum].split('## X.')[0]
    block=re.sub(r'#### Slide \d+',f'#### Slide {i:02d}',block)
    if oldnum==5:
        block=block.replace('shot-teacher-classroom.jpg','shot-workspace.jpg').replace('课堂页面大截图，旁列成果清单','左侧产品成果定位，右侧关键审核区域放大，左下保留完整界面')
    if oldnum==10:block=block.replace('两组大数字，失败边界短说明，明确验证范围','深墨绿大数字与暖白下一阶段分区，分步呈现验收证据')
    used.append(block)
header=re.sub(r'\| (shot-teacher-classroom|shot-lesson-detail|shot-review|shot-insights)\.jpg[^\n]*\n','',header)
header=header.replace('按用户确认的 12 页顺序展开','保留已确认的封面、产品与验证三张样稿')
spec=header+''.join(used)+'''## X. Speaker Notes Requirements

- **Generation**: enabled
- **Filename**: match each SVG filename under notes/
- **Content**: 原路演对应页讲稿，演讲者点击控制揭示。
- **Total duration**: 三页样稿，完整路演仍为 5 分钟
- **Notes style**: 正式路演
- **Presentation purpose**: 确认动效与视觉方向
'''
(NEW/'design_spec.md').write_text(spec,encoding='utf-8')
lock=(OLD/'spec_lock.md').read_text(encoding='utf-8').replace('KaiTi','Ma Shan Zheng').replace('- cover: 76','- cover: 108').replace('- display: 80','- display: 144').replace('- title: 42','- title: 52')
lock=re.sub(r'## page_rhythm\n.*?(?=## pptx_structure)', '## page_rhythm\n- P01: anchor\n- P02: dense\n- P03: anchor\n\n',lock,flags=re.S)
lock=re.sub(r'- (shot-teacher-classroom|shot-lesson-detail|shot-review|shot-insights):[^\n]*\n','',lock)
(NEW/'spec_lock.md').write_text(lock,encoding='utf-8')
notes=(OLD/'notes/total.md').read_text(encoding='utf-8').split('\n---\n')
out=[]
for n,idx in enumerate([0,4,9],1):out.append(re.sub(r'^# \d+_',f'# {n:02d}_',notes[idx].strip()))
(NEW/'notes/total.md').write_text('\n\n---\n\n'.join(out),encoding='utf-8')

# The standalone preview keeps UI and animation code outside canonical SVGs.
svgs=[]
for src,dst in selected:
    s=(NEW/'svg_output'/(dst+'.svg')).read_text(encoding='utf-8')
    for f in ['zhiye-kite-valley.png','shot-workspace.jpg']:
        if f in s:
            ext='png' if f.endswith('.png') else 'jpeg'
            s=s.replace('../images/'+f,'data:image/'+ext+';base64,'+base64.b64encode((NEW/'images'/f).read_bytes()).decode())
    svgs.append(s)
font=base64.b64encode((OLD/'fonts/MaShanZheng-Regular.ttf').read_bytes()).decode()
font2=base64.b64encode(Path('C:/Windows/Fonts/NotoSansSC-VF.ttf').read_bytes()).decode()
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>知野 · 动效样稿</title><style>
@font-face{font-family:'Ma Shan Zheng';src:url(data:font/ttf;base64,FONT1)}
@font-face{font-family:'Noto Sans SC';src:url(data:font/ttf;base64,FONT2);font-weight:100 900}
*{box-sizing:border-box}body{margin:0;background:#e8ede7;color:#172019;font-family:'Noto Sans SC',sans-serif}header{max-width:1280px;margin:auto;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}.label{font-size:16px;font-weight:600}nav{display:flex;gap:4px;padding:4px;background:#fffefa;border-radius:999px}button{font:inherit;cursor:pointer;border:0;background:transparent;min-height:44px;padding:8px 18px;border-radius:999px;color:#526f59}button[aria-selected=true],.primary{background:#172019;color:#fffefa}button:focus-visible,input:focus-visible{outline:3px solid #c9a660;outline-offset:4px}main{max-width:1280px;margin:auto}article{display:none;aspect-ratio:16/9;background:#f4f7f3;box-shadow:0 18px 60px #17201918;overflow:hidden}article.active{display:block}svg{display:block;width:100%;height:100%}.controls{max-width:1280px;margin:auto;display:flex;justify-content:center;align-items:center;gap:8px;padding:20px 16px;flex-wrap:wrap}.note{text-align:center;padding:0 16px 20px;font-size:14px;color:#56675c}label{font-size:14px;padding:12px}input{accent-color:#526f59}#status{font-size:14px;color:#56675c;min-width:110px}.motion-unit{transform-box:fill-box;transform-origin:center}@media(max-width:640px){header{flex-direction:column;padding:16px}button{padding:8px 12px}nav{width:100%;justify-content:center}.controls{gap:4px}.note{font-size:12px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style><header><span class="label">知野 · 路演动效样稿</span><nav role="tablist" aria-label="样稿页面"><button role="tab" aria-selected="true" data-page="0">封面</button><button role="tab" aria-selected="false" data-page="1">产品成果</button><button role="tab" aria-selected="false" data-page="2">验证结果</button></nav></header><main>SLIDES</main><div class="controls"><button id="play" class="primary">播放演示</button><button id="next">下一步</button><button id="replay">重播</button><label><input id="reduce" type="checkbox"> 减少动态效果</label><span id="status" role="status" aria-live="polite"></span></div><div class="note">演示按讲解顺序揭示内容。可用空格播放 / 暂停，右方向键逐步揭示。</div><script>
let pageIndex=0,step=0,token=0,playing=false,live=[];
const articles=[...document.querySelectorAll('article')];
const plans=[[],[{id:'product-title',duration:320},{id:'input-output',duration:320},{id:'product-focus',duration:480,travel:12},{id:'full-interface',duration:280}],[{id:'verification-heading',duration:280},{id:'metric-front',duration:380},{id:'metric-ai',duration:380},{id:'engineering-scope',duration:300},{id:'field-validation',duration:440,travel:10}]];
const reduced=document.querySelector('#reduce');reduced.checked=matchMedia('(prefers-reduced-motion:reduce)').matches;
function unit(id){return articles[pageIndex].querySelector('#'+id)}
function status(){document.querySelector('#status').textContent=plans[pageIndex].length?step+' / '+plans[pageIndex].length+' 步':'封面'}
function stop(){token++;playing=false;for(const a of live){a.finish();a.cancel()}live=[];document.querySelector('#play').textContent='播放演示'}
function reset(){stop();step=0;for(const p of plans[pageIndex]){let e=unit(p.id);e.style.opacity=0;e.style.transform='none';e.classList.add('motion-unit')}status()}
async function reveal(){if(step>=plans[pageIndex].length)return;const p=plans[pageIndex][step++],e=unit(p.id);status();if(reduced.checked){e.style.opacity=1;return}const travel=p.travel||0;const a=e.animate([{opacity:0,transform:'translateY('+travel+'px)'},{opacity:1,transform:'translateY(0)'}],{duration:p.duration,easing:'cubic-bezier(.22,.68,0,1)',fill:'forwards'});live.push(a);try{await a.finished}catch{}e.style.opacity=1;e.style.transform='none';a.cancel();live=live.filter(x=>x!==a)}
async function play(){if(playing){stop();return}if(step>=plans[pageIndex].length)reset();playing=true;let mine=++token;document.querySelector('#play').textContent='暂停';while(mine===token&&step<plans[pageIndex].length){await reveal();if(mine!==token)break;await new Promise(r=>setTimeout(r,reduced.checked?0:220))}if(mine===token)stop()}
function select(i){stop();pageIndex=i;articles.forEach((a,k)=>a.classList.toggle('active',k===i));document.querySelectorAll('[data-page]').forEach((b,k)=>b.setAttribute('aria-selected',k===i));reset()}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>select(+b.dataset.page));document.querySelector('#play').onclick=play;document.querySelector('#next').onclick=()=>{stop();reveal()};document.querySelector('#replay').onclick=()=>{reset();play()};reduced.onchange=()=>{stop();for(const p of plans[pageIndex].slice(0,step)){unit(p.id).style.opacity=1;unit(p.id).style.transform='none'}};document.addEventListener('keydown',e=>{if(e.target.matches('button,input'))return;if(e.code==='Space'){e.preventDefault();play()}if(e.code==='ArrowRight'){e.preventDefault();stop();reveal()}});select(1);
</script></html>'''
html=html.replace('FONT1',font).replace('FONT2',font2).replace('SLIDES',''.join(f'<article aria-label="{name}">{s}</article>' for name,s in zip(['封面','产品成果','验证结果'],svgs)))
(NEW/'知野-动效预览.html').write_text(html,encoding='utf-8')
print(NEW)
