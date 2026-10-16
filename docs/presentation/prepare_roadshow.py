from pathlib import Path

P = Path(__file__).parent / 'zhiye-roadshow_ppt169_20261013'
pages = [
('知野 · 课堂复盘数字员工','让每一节课成为下一次教学的依据','乡村小学课堂复盘与精准补讲原型','none','山谷封面，书法标题与短定位','zhiye-kite-valley.png'),
('一节课结束，教学支持还没有结束','课堂内容需要继续成为复习与补讲的依据','课后整理重点；准备补讲材料；跟进学生疑问','课堂记录与课后整理、补讲、跟进之间存在先后关系','左侧课后场景叙述，右侧真实工作台','shot-workspace.jpg'),
('教学支持的三个断点','记录、学习支持与反馈之间缺少连续利用','教师：复盘与整理挤占精力；学生：卡点需要适当引导；教学：作业和提问反馈分散','三个断点分别对应教师、学生、后续教学','三列短句，大留白，底部归纳',''),
('课堂到下一课的完整闭环','教师审核连接 AI 复盘与学生学习','课堂记录；AI 整理；教师审核；学生学习；反馈回流','课堂记录、AI 整理、教师审核、学生学习、反馈回流依次相连，反馈回流连接下一次教学','横向五步连续路径，教师审核重点突出',''),
('录下课堂，生成可用的草稿','录音与补讲目标共同驱动结构化成果','课堂录音 + 补讲目标；学生复习卡；教师课堂报告；补讲教案与练习','录音和目标作为输入，成果作为输出','课堂页面大截图，旁列成果清单','shot-teacher-classroom.jpg'),
('每条建议，都有课堂依据','课堂事实与 AI 推断分开呈现','原始转写可核对；建议关联课堂证据；教师核实后取舍','课堂证据支持 AI 建议，教师核实二者关联','完整课堂详情截图，侧边解释证据机制','shot-lesson-detail.jpg'),
('教师审核，才抵达学生','教师保留编辑、确认与发布决定','AI 初稿可编辑；发布前确认；学生看到已发布复习卡；转写与报告不公开','AI 初稿、教师编辑、确认发布、学生可见依次相连','审核动作大字，学生复习页作为发布结果','shot-review.jpg'),
('学生学习，再回到下一课','学生完成情况转为下一课教师草稿','复习卡与任务；分层提示、思路复述、变式练习；聚合反馈；下一课草稿不自动推送','学生学习与完成情况连接班级聚合反馈，反馈连接下一课草稿','教师洞察大截图，学生学习到回流的简短说明','shot-insights.jpg'),
('有状态、有依据的工具编排','多步工作流保留证据与人工审核节点','本地 FunASR 转写；提取证据与结构化生成；各步状态和错误原因；失败步骤可重试；教师审核节点','本地转写提供文本，文本支持证据提取和生成，生成后等待教师审核','分层技术链，底部本地处理与云端文本生成边界',''),
('已完成工程验收，真实课堂效果待验证','已有证据支持原型可运行与边界可检查','历史验收：前端 181 项测试通过；本地 AI 63 项测试通过；类型检查与生产构建通过；四类失败边界覆盖；尚未形成真实课堂成效数据','历史工程验收与真实课堂效果验证是不同层次','两组大数字，失败边界短说明，明确验证范围',''),
('下一步：小规模教师试用','用真实课堂检验耗时、质量与连续反馈','当前：同一浏览器的四端联动原型；计划：授权脱敏课堂音频试跑、教师审核对照、持续学习反馈；待测：端到端耗时、转写可读性、证据一致性、教师修改量','当前原型先进入真实音频验收，再进入教师试用与效果评估','纵向阶段路径，当前与计划明确标注',''),
('让每一间课堂，长出自己的回响','AI 承担整理，教师保留判断','知野 · 课堂复盘数字员工；知其所学，野望生长','none','山谷结尾与封面呼应','zhiye-kite-valley.png'),
]
intro = '''<!-- ppt-master-schema: design-spec/v1 -->
# 知野比赛路演 - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | 知野比赛路演 |
| Canvas Format | PPT 16:9, 1280 × 720 |
| Page Count | 12 |
| Primary Language | zh-CN |
| Target Audience | 比赛评委 |
| Communication Intent | 5 分钟内突出问题、解决方案和验证结果 |
| Desired Audience Outcome | 理解课堂复盘价值、教师审核机制与当前验收边界 |
| Core Message / Ask / Action | 把课堂记录转为可审核教学材料，再把学习反馈带回下一课 |
| Delivery Context | 现场主讲，5 分钟 |
| Artifact Afterlife | 评委复阅与项目演示 |
| Reading Mode | presentation |
| Content Strategy | 使用项目已有证据，按用户确认的 12 页顺序展开 |
| Design Style | 知野前端同款山谷欢迎页与浅灰绿工作台 |
| AI Image Acquisition Path | not applicable |
| Generation Mode | continuous |
| Spec Refinement | disabled |
| Speaker Notes | enabled — workflow default |
| Custom Animations | disabled — workflow default |
| Narration Audio | disabled — workflow default |
| Created Date | 2026-10-13 |

## II. Canvas Specification

| Property | Value |
| --- | --- |
| Format | PPT 16:9 |
| Dimensions | 1280 × 720 |
| viewBox | `0 0 1280 720` |
| Margins | 56 px |
| Content Area | 1168 × 608 |

## III. Visual Theme

### Theme Style

- **Mode**: custom
- **Mode Behavior**: 保持已确认的 12 页顺序，先问题，再闭环与具体产品成果，随后技术机制和验收，最后落地计划与价值收束。
- **Visual style**: custom
- **Visual Style Behavior**: 来自知野前端本身。山谷插画承担封面和结尾，正文用浅灰绿背景、暖白单一主面板、深墨绿粗标题、鼠尾草绿状态、麦穗金强调；截图完整显示，配原生可编辑说明。交替采用主截图、连续流程、短句大留白和验收大数字。
- **Theme**: 知野前端同款
- **Tone**: 清晰、温暖、可信

### Color Scheme

| Role | HEX | Purpose |
| --- | --- | --- |
| Background | #F4F7F3 | 正文页面底色 |
| Secondary background | #FFFEFA | 主内容面板 |
| Primary | #172019 | 标题和重点 |
| Accent | #526F59 | 强调与流程 |
| Secondary accent | #C9A660 | 审核节点与待验证 |
| Body text | #294B30 | 正文 |
| Secondary text | #56675C | 注释 |
| Divider | #DCE8D5 | 分隔 |

## IV. Typography System

### Font Plan

| Role | Character (Reference) | Primary | English if non-English | Fallback tail |
| --- | --- | --- | --- | --- |
| Title | 前端同款中文无衬线粗体 | Noto Sans SC | Arial | Microsoft YaHei |
| Body | 前端同款中文无衬线 | Noto Sans SC | Arial | Microsoft YaHei |
| Cover | 前端书法标题的楷体替代 | KaiTi | Arial | Microsoft YaHei |

- **Title stack**: Noto Sans SC, Arial, Microsoft YaHei
- **Body stack**: Noto Sans SC, Arial, Microsoft YaHei
- **Cover stack**: KaiTi, Arial, Microsoft YaHei
- **Role rationale**: Cover 用楷体呼应网页书法。Display 为验收大数字，Lead 用于重点短句，Footnote 为证据出处和页脚。

### Font Size Hierarchy

| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 28 |
| Title | 42 |
| Lead | 34 |
| Annotation | 20 |
| Footnote | 16 |
| Cover | 76 |
| Display | 80 |

## V. Layout Principles

### Deck-wide Direction

- **Hierarchy direction**: 每页一个主结论，证据或机制作为主体，短说明作为支撑
- **Composition tendency**: 产品页大截图，流程页连续路径，问题页短句并列，验证页大数字
- **Cross-page continuity**: 标题、色系和页码固定，审核节点用麦穗金，封面与结尾山谷相呼应
- **Spacing posture**: 开阔留白，截图页略密
- **Spacing anchors**: page margin 56 px, block gap 28 px, column gutter 32 px, corner radius 20 px, body leading 44 px

## VI. Icon Usage Specification

- **Primary bundled library**: none

| Icon Path | Suitable Scenarios |
| --- | --- |

## VIII. Image Resource List

| Filename | Dimensions | Ratio | Purpose | Type | Image pattern | Crop Policy | Acquire Via | Status | Reference | text_policy | page_role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
'''
imgs = [('zhiye-kite-valley.png',1672,941,'封面与结尾的知野山谷','adaptive')]+[(p,1180,738,'完整产品界面证据','no-crop') for p in ['shot-workspace.jpg','shot-teacher-classroom.jpg','shot-lesson-detail.jpg','shot-review.jpg','shot-insights.jpg']]
for name,w,h,job,crop in imgs:
    intro += f'| {name} | {w} × {h} | {w/h:.4f} | {job} | '+('Background' if crop=='adaptive' else 'Screenshot')+f' | '+('全幅山谷，天空区域承接标题' if crop=='adaptive' else '完整截图作为主证据，旁列可编辑说明')+f' | {crop} | user | Existing | 项目现有素材，保持原图身份 | none | local |\n'
intro += '\n## IX. Content Outline\n'
for i,(title,msg,content,rel,comp,img) in enumerate(pages,1):
    intro += f'\n#### Slide {i:02d} - {title}\n\n- **Audience move**: 从不了解当前环节到理解：{msg}\n- **Relationships**: {rel}\n- **Composition**: {comp}\n- **Title**: {title}\n- **Core message**: {msg}\n- **Content**: {content}\n'
    if img: intro += f'- **Images**: {img}\n'
intro += '''
## X. Speaker Notes Requirements

- **Generation**: enabled
- **Filename**: match each SVG filename under notes/
- **Content**: 逐页自然口语讲稿。覆盖最终页面信息，历史测试数字注明为项目记录，真实效果与规划保持区分。
- **Total duration**: 5 分钟
- **Notes style**: 正式路演，简明口语
- **Presentation purpose**: 面向评委突出问题、解决方案和验证结果
'''
(P/'design_spec.md').write_text(intro,encoding='utf-8')
lock='''<!-- ppt-master-schema: spec-lock/v1 -->
# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## communication
- primary_language: zh-CN
- audience: 比赛评委
- objective: 5 分钟内让评委理解问题、解决方案与验证结果
- core_message: 课堂记录转为可审核教学材料，学习反馈带回下一课
- consumption_mode: presentation

## mode
- mode: custom
- mode_behavior: 按已确认的 12 页顺序，问题、闭环、产品、机制、验收、试用计划、收束。

## visual_style
- visual_style: custom
- visual_style_behavior: 复用知野网页的山谷插画、浅灰绿底、暖白圆角主面板、深墨绿标题、鼠尾草绿状态与麦穗金强调。保持大留白，产品截图与原生说明并置。

## colors
- background: #F4F7F3
- secondary_bg: #FFFEFA
- primary: #172019
- accent: #526F59
- secondary_accent: #C9A660
- body_text: #294B30
- secondary_text: #56675C
- divider: #DCE8D5

## typography
- font_family: Noto Sans SC, Arial, Microsoft YaHei
- title_family: Noto Sans SC, Arial, Microsoft YaHei
- body_family: Noto Sans SC, Arial, Microsoft YaHei
- cover_family: KaiTi, Arial, Microsoft YaHei
- body: 28
- title: 42
- lead: 34
- annotation: 20
- footnote: 16
- cover: 76
- display: 80

## icons
- library: none
- inventory: none

## page_rhythm
'''
for i in range(1,13):lock+=f'- P{i:02d}: '+('anchor' if i in (1,4,10,12) else 'dense' if i in (5,6,7,8,9) else 'breathing')+'\n'
lock+='\n## pptx_structure\n- mode: flat\n\n## images\n'
for name,w,h,job,crop in imgs:lock+=f'- {name.rsplit(".",1)[0]}: images/{name} | source=user | crop={crop}\n'
lock+='''
## forbidden
- `mask`, `<style>`, `class`, external CSS, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<set>`, `<script>` / event attributes, `<iframe>`
- HTML named entities in text; write typography as raw Unicode and escape XML reserved characters
'''
(P/'spec_lock.md').write_text(lock,encoding='utf-8')
(P/'planning-decisions.md').write_text('''# 确认记录

用户已在聊天确认：12 页、5 分钟、评委受众，重点问题、解决方案与验证结果，前端同款视觉。自由设计，素材限项目已有图片。讲稿默认开启，配音和自定义动画默认关闭，持续制作。

## 设计推演

方案一：欢迎页山谷封面与结尾，工作台式内容页，产品界面作证据主体。采用此方案，因为用户明确要求与前端匹配，且已确认这一方向。

方案二：同款颜色与字体，全程以课堂详情界面为固定场景，按信息层依次展开。保留在设计推演中，未采用，因为问题页和验收页需要独立的表达空间。

方案三：同款颜色与字体，以山谷长幅背景贯穿，前景原生文字与少量截图呈现。保留在设计推演中，未采用，因为主体截图需要更高可读性。

所有候选均为 custom，不引用其他目录基底。图片不生成、不联网搜索，保持现有素材。
''',encoding='utf-8')
print('Design spec and lock written')
