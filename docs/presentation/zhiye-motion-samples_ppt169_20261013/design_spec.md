<!-- ppt-master-schema: design-spec/v1 -->
# 知野比赛路演 - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | 知野比赛路演 |
| Canvas Format | PPT 16:9, 1280 × 720 |
| Page Count | 3 |
| Primary Language | zh-CN |
| Target Audience | 比赛评委 |
| Communication Intent | 5 分钟内突出问题、解决方案和验证结果 |
| Desired Audience Outcome | 理解课堂复盘价值、教师审核机制与当前验收边界 |
| Core Message / Ask / Action | 把课堂记录转为可审核教学材料，再把学习反馈带回下一课 |
| Delivery Context | 现场主讲，5 分钟 |
| Artifact Afterlife | 评委复阅与项目演示 |
| Reading Mode | presentation |
| Content Strategy | 使用项目已有证据，保留已确认的封面、产品与验证三张样稿 |
| Design Style | 知野前端同款山谷欢迎页与浅灰绿工作台 |
| AI Image Acquisition Path | not applicable |
| Generation Mode | continuous |
| Spec Refinement | disabled |
| Speaker Notes | enabled — workflow default |
| Custom Animations | enabled — 用户明确要求产品页与验证页分步动效 |
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
| Cover | 前端书法标题的楷体替代 | Ma Shan Zheng | Arial | Microsoft YaHei |

- **Title stack**: Noto Sans SC, Arial, Microsoft YaHei
- **Body stack**: Noto Sans SC, Arial, Microsoft YaHei
- **Cover stack**: Ma Shan Zheng, Arial, Microsoft YaHei
- **Role rationale**: Cover 使用网页原本的毛笔字体。Display 为验收大数字，Lead 用于重点短句，Footnote 为证据出处和页脚。

### Font Size Hierarchy

| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 28 |
| Caption | 24 |
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

## IX. Content Outline

#### Slide 01 - 知野 · 课堂复盘数字员工

- **Audience move**: 从不了解当前环节到理解：让每一节课成为下一次教学的依据
- **Relationships**: none
- **Composition**: 山谷封面，书法标题与短定位
- **Title**: 知野 · 课堂复盘数字员工
- **Core message**: 让每一节课成为下一次教学的依据
- **Content**: 乡村小学课堂复盘与精准补讲原型
- **Images**: zhiye-kite-valley.png

#### Slide 02 - 录下课堂，生成可用的草稿

- **Audience move**: 从不了解当前环节到理解：录音与补讲目标共同驱动结构化成果
- **Relationships**: 录音和目标作为输入，成果作为输出
- **Composition**: 左侧产品成果定位，右侧关键审核区域放大，左下保留完整界面
- **Title**: 录下课堂，生成可用的草稿
- **Core message**: 录音与补讲目标共同驱动结构化成果
- **Content**: 课堂录音 + 补讲目标；学生复习卡；教师课堂报告；补讲教案与练习
- **Images**: shot-workspace.jpg

#### Slide 03 - 已完成工程验收，真实课堂效果待验证

- **Audience move**: 从不了解当前环节到理解：已有证据支持原型可运行与边界可检查
- **Relationships**: 历史工程验收与真实课堂效果验证是不同层次
- **Composition**: 深墨绿大数字与暖白下一阶段分区，分步呈现验收证据
- **Title**: 已完成工程验收，真实课堂效果待验证
- **Core message**: 已有证据支持原型可运行与边界可检查
- **Content**: 历史验收：前端 181 项测试通过；本地 AI 63 项测试通过；类型检查与生产构建通过；四类失败边界覆盖；尚未形成真实课堂成效数据

## X. Speaker Notes Requirements

- **Generation**: enabled
- **Filename**: match each SVG filename under notes/
- **Content**: 原路演对应页讲稿，演讲者点击控制揭示。
- **Total duration**: 三页样稿，完整路演仍为 5 分钟
- **Notes style**: 正式路演
- **Presentation purpose**: 确认动效与视觉方向
