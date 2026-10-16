from pathlib import Path
import shutil,re
BASE=Path(__file__).parent
OLD=BASE/'zhiye-roadshow_ppt169_20261013'
SAMPLE=BASE/'zhiye-motion-samples_ppt169_20261013'
P=BASE/'zhiye-roadshow-v2_ppt169_20261013'
for folder in ['images','sources','fonts']:
    if (OLD/folder).exists():shutil.copytree(OLD/folder,P/folder,dirs_exist_ok=True)
spec=(OLD/'design_spec.md').read_text(encoding='utf-8')
spec=spec.replace('| Custom Animations | disabled — workflow default |','| Custom Animations | enabled — 用户确认整套使用分步揭示动效 |').replace('KaiTi','Ma Shan Zheng').replace('| Title | 42 |','| Title | 52 |').replace('| Cover | 76 |','| Cover | 108 |').replace('| Display | 80 |','| Display | 144 |').replace('| Body | 28 |','| Body | 28 |\n| Caption | 24 |\n| Index | 72 |')
spec=spec.replace('Cover 用楷体呼应网页书法','Cover 使用网页原本的毛笔字体，Caption 为说明文字，Index 为流程阶段编号')
spec=spec.replace('暖白单一主面板','暖白与深墨绿页面交替，减少容器').replace('截图完整显示，配原生可编辑说明','关键界面可放大，完整图同时保留，配原生可编辑说明')
spec=spec.replace('课堂页面大截图，旁列成果清单','采用已确认产品样稿：左侧输入输出，右侧关键审核区域放大，左下完整界面').replace('两组大数字，失败边界短说明，明确验证范围','采用已确认验证样稿：深墨绿大数字与暖白下一阶段分区')
spec=spec.replace('左侧课后场景叙述，右侧真实工作台','大字课后场景，侧列整理、补讲和跟进任务').replace('- **Images**: shot-teacher-classroom.jpg','- **Images**: shot-workspace.jpg')
spec=spec.replace('| Design Style | 知野前端同款山谷欢迎页与浅灰绿工作台 |','| Design Style | 已确认新版：山谷书法封面、大字留白、放大产品证据、深浅分区验证 |')
spec=spec.replace('横向五步连续路径，教师审核重点突出','五步横向顺序，阶段编号与文字依次揭示，审核用麦穗金突出').replace('纵向阶段路径，当前与计划明确标注','左侧当前边界，右侧两阶段试用计划与待测指标')
(P/'design_spec.md').write_text(spec,encoding='utf-8')
lock=(OLD/'spec_lock.md').read_text(encoding='utf-8').replace('KaiTi','Ma Shan Zheng').replace('- title: 42','- title: 52').replace('- cover: 76','- cover: 108').replace('- display: 80','- display: 144').replace('- body: 28','- body: 28\n- caption: 24\n- index: 72')
lock=lock.replace('暖白圆角主面板','暖白与深墨绿交替页面、少量圆角焦点面板').replace('保持大留白，产品截图与原生说明并置','采用已确认样稿的大字留白、关键产品区域放大、深浅验证分区与按讲解顺序揭示')
(P/'spec_lock.md').write_text(lock,encoding='utf-8')
shutil.copy2(OLD/'notes/total.md',P/'notes/total.md')
print('V2 planning ready; exact 12-page roster retained')
