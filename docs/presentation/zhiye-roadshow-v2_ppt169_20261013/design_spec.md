<!-- ppt-master-schema: design-spec/v1 -->
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
| Design Style | 已确认新版：山谷书法封面、大字留白、放大产品证据、深浅分区验证 |
| AI Image Acquisition Path | not applicable |
| Generation Mode | continuous |
| Spec Refinement | disabled |
| Speaker Notes | enabled — workflow default |
| Custom Animations | enabled — 用户确认整套使用分步揭示动效 |
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
- **Visual Style Behavior**: 来自知野前端本身。山谷插画承担封面和结尾，正文用浅灰绿背景、暖白与深墨绿页面交替，减少容器、深墨绿粗标题、鼠尾草绿状态、麦穗金强调；关键界面可放大，完整图同时保留，配原生可编辑说明。交替采用主截图、连续流程、短句大留白和验收大数字。
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
| Cover | 前端书法标题的楷体替代 | Ma Shan Zheng | Arial | Microsoft YaHei |

- **Title stack**: Noto Sans SC, Arial, Microsoft YaHei
- **Body stack**: Noto Sans SC, Arial, Microsoft YaHei
- **Cover stack**: Ma Shan Zheng, Arial, Microsoft YaHei
- **Role rationale**: Cover 使用网页原本的毛笔字体，Caption 为说明文字，Index 为流程阶段编号。Display 为验收大数字，Lead 用于重点短句，Footnote 为证据出处和页脚。

### Font Size Hierarchy

| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 28 |
| Caption | 24 |
| Index | 72 |
| Title | 52 |
| Lead | 34 |
| Annotation | 20 |
| Footnote | 16 |
| Cover | 108 |
| Display | 144 |

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
| zhiye-kite-valley.png | 1672 × 941 | 1.7768 | 封面与结尾的知野山谷 | Background | 全幅山谷，天空区域承接标题 | adaptive | user | Existing | 项目现有素材，保持原图身份 | none | local |
| shot-workspace.jpg | 1180 × 738 | 1.5989 | 完整产品界面证据 | Screenshot | 完整截图作为主证据，旁列可编辑说明 | no-crop | user | Existing | 项目现有素材，保持原图身份 | none | local |
| shot-lesson-detail.jpg | 1180 × 738 | 1.5989 | 完整产品界面证据 | Screenshot | 完整截图作为主证据，旁列可编辑说明 | no-crop | user | Existing | 项目现有素材，保持原图身份 | none | local |
| shot-review.jpg | 1180 × 738 | 1.5989 | 完整产品界面证据 | Screenshot | 完整截图作为主证据，旁列可编辑说明 | no-crop | user | Existing | 项目现有素材，保持原图身份 | none | local |
| shot-insights.jpg | 1180 × 738 | 1.5989 | 完整产品界面证据 | Screenshot | 完整截图作为主证据，旁列可编辑说明 | no-crop | user | Existing | 项目现有素材，保持原图身份 | none | local |

## IX. Content Outline

#### Slide 01 - 知野 · 课堂复盘数字员工

- **Audience move**: 从不了解当前环节到理解：让每一节课成为下一次教学的依据
- **Relationships**: none
- **Composition**: 山谷封面，书法标题与短定位
- **Title**: 知野 · 课堂复盘数字员工
- **Core message**: 让每一节课成为下一次教学的依据
- **Content**: 乡村小学课堂复盘与精准补讲原型
- **Images**: zhiye-kite-valley.png

#### Slide 02 - 一节课结束，教学支持还没有结束

- **Audience move**: 从不了解当前环节到理解：课堂内容需要继续成为复习与补讲的依据
- **Relationships**: 课堂记录与课后整理、补讲、跟进之间存在先后关系
- **Composition**: 大字课后场景，侧列整理、补讲和跟进任务
- **Title**: 一节课结束，教学支持还没有结束
- **Core message**: 课堂内容需要继续成为复习与补讲的依据
- **Content**: 课后整理重点；准备补讲材料；跟进学生疑问
- **Images**: shot-workspace.jpg

#### Slide 03 - 教学支持的三个断点

- **Audience move**: 从不了解当前环节到理解：记录、学习支持与反馈之间缺少连续利用
- **Relationships**: 三个断点分别对应教师、学生、后续教学
- **Composition**: 三列短句，大留白，底部归纳
- **Title**: 教学支持的三个断点
- **Core message**: 记录、学习支持与反馈之间缺少连续利用
- **Content**: 教师：复盘与整理挤占精力；学生：卡点需要适当引导；教学：作业和提问反馈分散

#### Slide 04 - 课堂到下一课的完整闭环

- **Audience move**: 从不了解当前环节到理解：教师审核连接 AI 复盘与学生学习
- **Relationships**: 课堂记录、AI 整理、教师审核、学生学习、反馈回流依次相连，反馈回流连接下一次教学
- **Composition**: 五步横向顺序，阶段编号与文字依次揭示，审核用麦穗金突出
- **Title**: 课堂到下一课的完整闭环
- **Core message**: 教师审核连接 AI 复盘与学生学习
- **Content**: 课堂记录；AI 整理；教师审核；学生学习；反馈回流

#### Slide 05 - 录下课堂，生成可用的草稿

- **Audience move**: 从不了解当前环节到理解：录音与补讲目标共同驱动结构化成果
- **Relationships**: 录音和目标作为输入，成果作为输出
- **Composition**: 采用已确认产品样稿：左侧输入输出，右侧关键审核区域放大，左下完整界面
- **Title**: 录下课堂，生成可用的草稿
- **Core message**: 录音与补讲目标共同驱动结构化成果
- **Content**: 课堂录音 + 补讲目标；学生复习卡；教师课堂报告；补讲教案与练习
- **Images**: shot-workspace.jpg

#### Slide 06 - 每条建议，都有课堂依据

- **Audience move**: 从不了解当前环节到理解：课堂事实与 AI 推断分开呈现
- **Relationships**: 课堂证据支持 AI 建议，教师核实二者关联
- **Composition**: 完整课堂详情截图，侧边解释证据机制
- **Title**: 每条建议，都有课堂依据
- **Core message**: 课堂事实与 AI 推断分开呈现
- **Content**: 原始转写可核对；建议关联课堂证据；教师核实后取舍
- **Images**: shot-lesson-detail.jpg

#### Slide 07 - 教师审核，才抵达学生

- **Audience move**: 从不了解当前环节到理解：教师保留编辑、确认与发布决定
- **Relationships**: AI 初稿、教师编辑、确认发布、学生可见依次相连
- **Composition**: 审核动作大字，学生复习页作为发布结果
- **Title**: 教师审核，才抵达学生
- **Core message**: 教师保留编辑、确认与发布决定
- **Content**: AI 初稿可编辑；发布前确认；学生看到已发布复习卡；转写与报告不公开
- **Images**: shot-review.jpg

#### Slide 08 - 学生学习，再回到下一课

- **Audience move**: 从不了解当前环节到理解：学生完成情况转为下一课教师草稿
- **Relationships**: 学生学习与完成情况连接班级聚合反馈，反馈连接下一课草稿
- **Composition**: 教师洞察大截图，学生学习到回流的简短说明
- **Title**: 学生学习，再回到下一课
- **Core message**: 学生完成情况转为下一课教师草稿
- **Content**: 复习卡与任务；分层提示、思路复述、变式练习；聚合反馈；下一课草稿不自动推送
- **Images**: shot-insights.jpg

#### Slide 09 - 有状态、有依据的工具编排

- **Audience move**: 从不了解当前环节到理解：多步工作流保留证据与人工审核节点
- **Relationships**: 本地转写提供文本，文本支持证据提取和生成，生成后等待教师审核
- **Composition**: 分层技术链，底部本地处理与云端文本生成边界
- **Title**: 有状态、有依据的工具编排
- **Core message**: 多步工作流保留证据与人工审核节点
- **Content**: 本地 FunASR 转写；提取证据与结构化生成；各步状态和错误原因；失败步骤可重试；教师审核节点

#### Slide 10 - 已完成工程验收，真实课堂效果待验证

- **Audience move**: 从不了解当前环节到理解：已有证据支持原型可运行与边界可检查
- **Relationships**: 历史工程验收与真实课堂效果验证是不同层次
- **Composition**: 采用已确认验证样稿：深墨绿大数字与暖白下一阶段分区
- **Title**: 已完成工程验收，真实课堂效果待验证
- **Core message**: 已有证据支持原型可运行与边界可检查
- **Content**: 历史验收：前端 181 项测试通过；本地 AI 63 项测试通过；类型检查与生产构建通过；四类失败边界覆盖；尚未形成真实课堂成效数据

#### Slide 11 - 下一步：小规模教师试用

- **Audience move**: 从不了解当前环节到理解：用真实课堂检验耗时、质量与连续反馈
- **Relationships**: 当前原型先进入真实音频验收，再进入教师试用与效果评估
- **Composition**: 左侧当前边界，右侧两阶段试用计划与待测指标
- **Title**: 下一步：小规模教师试用
- **Core message**: 用真实课堂检验耗时、质量与连续反馈
- **Content**: 当前：同一浏览器的四端联动原型；计划：授权脱敏课堂音频试跑、教师审核对照、持续学习反馈；待测：端到端耗时、转写可读性、证据一致性、教师修改量

#### Slide 12 - 让每一间课堂，长出自己的回响

- **Audience move**: 从不了解当前环节到理解：AI 承担整理，教师保留判断
- **Relationships**: none
- **Composition**: 山谷结尾与封面呼应
- **Title**: 让每一间课堂，长出自己的回响
- **Core message**: AI 承担整理，教师保留判断
- **Content**: 知野 · 课堂复盘数字员工；知其所学，野望生长
- **Images**: zhiye-kite-valley.png

## X. Speaker Notes Requirements

- **Generation**: enabled
- **Filename**: match each SVG filename under notes/
- **Content**: 逐页自然口语讲稿。覆盖最终页面信息，历史测试数字注明为项目记录，真实效果与规划保持区分。
- **Total duration**: 5 分钟
- **Notes style**: 正式路演，简明口语
- **Presentation purpose**: 面向评委突出问题、解决方案和验证结果
