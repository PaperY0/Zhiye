# 知野课堂复盘数字员工实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 在 2026-09-19 前，交付一个可复现、可演示、可验收的“课堂复盘数字员工”，并完成初赛提交材料。

**架构：** 保留现有 React 前端、FastAPI 本地 AI 服务、FunASR、PaddleOCR 与 DeepSeek。新增一个明确的 `RecapJob` 编排层：前端创建任务、后端按固定安全步骤运行工具并返回可追踪事件，教师在界面审核四项成果并下载补讲包。现有学生端只用于呈现已审核的复习卡和练习结果，不再扩展新功能。

**技术栈：** React + TypeScript、Vitest、FastAPI + Pydantic + pytest、FunASR、PaddleOCR、DeepSeek API、本地浏览器存储。

## 全局约束

- 只做“课堂复盘数字员工”一条主线；拒绝新增家长端、后台或第二智能体。
- 所有课堂事实必须可回溯到转写片段；AI 推断与课堂事实分区展示。
- 教师确认是唯一对学生发布、下载含学生信息成果、发送家长摘要的门槛。
- 演示数据只用获准、脱敏的录音与姓名；密钥只置于本机环境变量，不进 Git、不入录像。
- 每完成一个任务，先跑该任务测试，再跑全量测试，再做一次浏览器手工验收；没有证据不能标完成。
- 当前根目录缺少应用 `package.json` 与锁文件；在 Day 1 恢复前，不得宣称项目可复现运行。

---

## 每日总览与人工验收

| 日期 | 当日唯一成果 | AI 负责 | 你负责验收 |
|---|---|---|---|
| 9/8 | 可安装、可启动、可测试的基线 | 找回/重建工程清单，记录环境与失败原因 | 在新终端按 README 成功启动一次 |
| 9/9 | 智能体任务与证据数据契约 | 定义 schema、样例和单元测试 | 阅读一份样例，确认没有“模型编造”为事实 |
| 9/10 | 可追踪的后端工具链 | 将转写、证据、归因、生成拆为工具 | 用固定转写文本得到四项结构化产物 |
| 9/11 | 可失败、可重试的编排任务 | 实现 `RecapJob`、步骤状态、保留成功步骤 | 故意使生成失败，只重试失败步骤 |
| 9/12 | 任务执行页 | 显示目标、计划、工具、耗时、证据 | 1440×900 下首次看清整条流程 |
| 9/13 | 教师审核与补讲包下载 | 编辑、确认发布、导出 | 下载并打开补讲包，内容与页面一致 |
| 9/14 | 学生结果回流的最小闭环 | 将练习完成情况汇总为下一课建议 | 发布后在教师端看到真实回流提示 |
| 9/15 | 真实音频端到端与异常演示 | 修复失败、补齐回归测试 | 真实 1–2 分钟录音成功；失败演示也清楚 |
| 9/16 | 路演级界面与录屏 | 清理噪音、制作演示数据重置 | 录完 5 分钟无卡顿演示视频 |
| 9/17 | 初赛材料初稿 | 生成架构图、技术说明、市场与安全文案 | 用评分表逐项打分、删掉空泛表述 |
| 9/18 | 提交前彩排包 | 打包源码、README、视频、PPT、演示脚本 | 完整彩排一次并由你计时 |
| 9/19 | 线上提交留证 | 核验文件、链接和提交字段 | 亲自点提交，保存回执截图 |

---

## Task 1（9/8）：恢复可复现基线

**文件：**
- 创建：`package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`.env.example`、`README.md`
- 核对：`src/main.tsx`、`src/App.tsx`、`services/local-ai/requirements.txt`、`scripts/start-local-ai.ps1`
- 记录：`docs/evidence/day-01-baseline.md`

**AI 执行：**

- [ ] 只读盘点根目录、`node_modules/.pnpm`、现有源代码导入和测试命令痕迹；优先从恢复来源找回原清单，不能仅按 `node_modules` 猜依赖版本。
- [ ] 若找不到原清单，创建最小 workspace 清单，明确记录每个依赖来自哪个 import；生成锁文件。
- [ ] 补 `.env.example`，仅含 `DEEPSEEK_API_KEY=`、`DEEPSEEK_MODEL=`、`VITE_LOCAL_AI_BASE_URL=`，不写真实值。
- [ ] 写 README：安装、前端启动、本地 AI 启动、测试、真实演示前置条件、失败排查。
- [ ] 将 `pnpm install --frozen-lockfile`、前端测试、生产构建和 `python -m pytest` 的真实输出写入证据文件。

**你实际验收：**

- [ ] 新开 PowerShell，按 README 从第一条命令开始执行；不允许依赖已经存在的 `node_modules`。
- [ ] 将前端打开到 `#/teacher/classroom`，确认课堂页面出现。
- [ ] 不提供 Key 时确认页面显示“本地 AI 服务未启动/未设置 Key”等真实错误，不可伪装为成功。

**通过条件：** `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build` 与 `python -m pytest services/local-ai` 都有可保存的成功输出，或未通过原因被写入证据且当天修复。

## Task 2（9/9）：锁定智能体数据契约

**文件：**
- 创建：`services/local-ai/recap_job.py`、`services/local-ai/test_recap_job.py`
- 修改：`services/local-ai/schemas.py`、`src/app/prototype/types.ts`
- 创建：`docs/evidence/recap-job-example.json`

**接口：**

```python
class RecapStep(BaseModel):
    key: Literal['transcribe', 'extract-evidence', 'identify-gaps', 'generate-deliverables', 'teacher-review']
    status: Literal['pending', 'running', 'succeeded', 'failed', 'skipped']
    summary: str
    evidence_ids: list[str] = []
    error: str | None = None

class RecapJob(BaseModel):
    id: str
    goal: str
    status: Literal['queued', 'running', 'needs-review', 'failed']
    steps: list[RecapStep]
    deliverables: RecapDeliverables | None = None
```

**AI 执行：**

- [ ] 写失败测试：非法状态、没有证据的建议、无课堂事实的发布内容都必须被 schema 拒绝。
- [ ] 实现最小 schema 和一个固定样例；`RecapDeliverables` 固定有 `student_recap`、`teacher_report`、`remedial_plan`、`practice_questions` 四项。
- [ ] 课堂证据使用不可变 `EvidenceItem(id, quote, start_seconds, source)`，AI 推断使用单独 `InferenceItem`。
- [ ] 添加测试，断言任何 `InferenceItem` 不得出现在 `EvidenceItem.quote` 中。

**你实际验收：**

- [ ] 打开 `recap-job-example.json`，随机选两条建议；你能在 30 秒内找到对应原话。
- [ ] 把一条没有出处的建议故意填入样例，测试必须失败；不能靠界面文字约束。

**通过条件：** `python -m pytest services/local-ai/test_recap_job.py -v` 通过，且样例明确区分“课堂证据”和“AI 推断”。

## Task 3（9/10）：把 AI 调用改造成工具链

**文件：**
- 修改：`services/local-ai/server.py`、`services/local-ai/generation.py`、`services/local-ai/schemas.py`
- 创建：`services/local-ai/recap_tools.py`、`services/local-ai/test_recap_tools.py`
- 修改：`src/services/lessonAnalysis.ts`

**接口：**

```python
def transcribe_audio(path: str) -> list[EvidenceItem]: ...
def extract_evidence(transcript: list[EvidenceItem]) -> list[EvidenceItem]: ...
def identify_learning_gaps(goal: str, evidence: list[EvidenceItem]) -> list[InferenceItem]: ...
def generate_deliverables(goal: str, evidence: list[EvidenceItem], gaps: list[InferenceItem]) -> RecapDeliverables: ...
```

**AI 执行：**

- [ ] 先让上述四个工具的 fake 输入测试失败；所有工具均返回 schema，而不是自由文本。
- [ ] 将现有 `transcribe` 移入 `transcribe_audio`；保留 FunASR 模型惰性加载。
- [ ] 将 DeepSeek prompt 改为一次只生成一个结构化职责，要求交付物引用 `evidence_ids`；响应无引用则返回可读错误。
- [ ] 新增 `POST /recap-jobs`，接受音频与目标，返回第一个 `RecapJob` 快照；开发阶段允许同步运行，但每步都必须更新状态与摘要。
- [ ] `GET /health` 继续返回 ASR 与 DeepSeek 可用性，不能暴露 Key。

**你实际验收：**

- [ ] 先用固定转写文本运行，不花 API 费用；确认四项成果都生成。
- [ ] 再用真实 Key 做一次；确认“单位换算需补讲”能显示两段来自转写的依据。
- [ ] 断网后调用，确认显示具体工具失败，而不是笼统“AI 出错”。

**通过条件：** 工具单测与 `/health`、成功 `/recap-jobs`、断网失败三种证据齐全。

## Task 4（9/11）：编排、重试与状态保留

**文件：**
- 修改：`services/local-ai/recap_job.py`、`services/local-ai/server.py`
- 创建：`services/local-ai/test_recap_orchestrator.py`
- 修改：`src/services/localAi.ts`、`src/app/prototype/PrototypeContext.tsx`

**AI 执行：**

- [ ] 实现 `run_recap_job(job)`：严格按五个固定步骤运行；成功步骤不可被后续失败覆盖。
- [ ] 实现 `retry_recap_step(job_id, step_key)`：只允许重试 `failed` 步；上游成功结果作为输入复用。
- [ ] 前端将任务状态持久化到已有 prototype 存储，刷新后仍可看到最后一次状态。
- [ ] 写测试：让 `generate_deliverables` 首次抛错，断言前 3 步仍为 `succeeded`；重试后仅第 4 步重新运行。

**你实际验收：**

- [ ] 关闭 DeepSeek Key 触发生成失败，截图保存失败步骤与已保留证据。
- [ ] 恢复 Key，点击“仅重试生成补讲包”；确认转写步骤没有再次执行。
- [ ] 刷新页面，确认任务记录仍在。

**通过条件：** 失败、单步重试、刷新恢复各有录屏或截图；测试证明没有全流程重复执行。

## Task 5（9/12）：任务执行页

**文件：**
- 创建：`src/features/teacher/recap-agent/RecapAgentPage.tsx`、`src/features/teacher/recap-agent/RecapPlanTimeline.tsx`、`src/features/teacher/recap-agent/RecapEvidenceDrawer.tsx`
- 创建：对应 `*.test.tsx`
- 修改：`src/app/routes.ts`、`src/features/teacher/TeacherRoutes.tsx`、`src/components/workspace/WorkspaceSidebar.tsx`

**AI 执行：**

- [ ] 为路由新增教师页 `recap-agent`，入口文案为“课堂复盘数字员工”。
- [ ] 页面首屏固定显示：教师目标、5 步计划、每步工具名/状态/耗时/摘要、失败重试按钮。
- [ ] 展开证据抽屉时，显示转写原文、时间、被哪一项建议使用；推断使用单独黄色标签，不能伪装为事实。
- [ ] 完成时显示四项可验收产物；未完成时显示下一步与阻塞原因。
- [ ] 用现有 Tailwind/玻璃表面组件，不新建第二套设计语言；在 1440×900 下主计划与成果区域同屏可见。

**你实际验收：**

- [ ] 用无旁白屏幕录制 30 秒：陌生人能看懂输入、计划、工具调用和结果吗？看不懂就删信息，不加功能。
- [ ] 截图 1440×900，检查没有横向滚动、文字截断或靠颜色表达状态。

**通过条件：** 组件测试覆盖成功/运行中/失败/重试四种状态；你能在 30 秒内讲清智能体做了什么。

## Task 6（9/13）：教师审核、发布与补讲包

**文件：**
- 创建：`src/features/teacher/recap-agent/RecapDeliverablesReview.tsx`、`src/features/teacher/recap-agent/exportRecapPackage.ts`
- 创建：对应测试
- 修改：`src/features/teacher/classroom/LessonDetailPage.tsx`、`src/app/prototype/PrototypeContext.tsx`

**AI 执行：**

- [ ] 审核界面让教师逐项编辑四个产物，默认标记“AI 草稿”。
- [ ] 发布按钮先打开确认对话框，明确“学生将看见复习卡与练习”；确认后才调用已有 `publishLesson`。
- [ ] 导出先实现 UTF-8 HTML 单文件补讲包（浏览器可直接打开和打印为 PDF），文件名含课程与日期；包内包含四项成果、证据引用、教师确认时间。
- [ ] 写测试：未确认不可导出学生可见包；导出内容包含目标、四项成果和至少一条证据。

**你实际验收：**

- [ ] 编辑一处复习卡，再发布；切到学生端确认文字已变化。
- [ ] 下载 HTML，在无网络环境双击打开；确认中文、标题、三题练习和证据都在。
- [ ] 检查导出文件没有 API Key、真实学生姓名或原始音频。

**通过条件：** “编辑 → 确认 → 学生可见 → 下载并打开”全过程成功且可录屏。

## Task 7（9/14）：最小学生回流闭环

**文件：**
- 修改：`src/features/student/review/StudentReviewPage.tsx`、`src/features/teacher/insights/InsightsPage.tsx`
- 修改：`src/app/prototype/types.ts`、`src/app/prototype/PrototypeContext.tsx`
- 创建/修改：对应测试

**AI 执行：**

- [ ] 复用已有练习与完成状态，聚合匿名完成率/卡点标签；不创建新的学生画像系统。
- [ ] 教师任务页只展示聚合信号，例如“单位换算：18/32 需再练”，并给出关联的原课堂证据。
- [ ] 生成的下一课建议必须是教师草稿，不能自动推送。

**你实际验收：**

- [ ] 用演示账号提交三份不同结果，回到教师端看到数字变化。
- [ ] 确认教师端不展示其他学生的个人答案或姓名。

**通过条件：** 演示闭环从“课堂”到“学生完成”再到“下一课建议”可在一次录屏完成。

## Task 8（9/15）：真实运行、故障韧性与回归

**文件：**
- 创建：`docs/evidence/day-08-real-run.md`、`docs/evidence/demo-reset.md`
- 修改：必要的失败文案与测试文件，不进行无关视觉重构。

**AI 执行：**

- [ ] 以获准的 1–2 分钟脱敏数学录音完成真实运行；记录耗时、转写质量、各工具输出与改动。
- [ ] 执行四项故障测试：无麦克风权限、无 DeepSeek Key、空转写、网络断开。
- [ ] 对每项故障保留已成功步骤、给出中文原因和单步重试；补齐回归测试。
- [ ] 重新跑前端全测、后端全测、生产构建。

**你实际验收：**

- [ ] 听一遍转写，手工标出至少两处正确依据和一处模型不应编造的信息。
- [ ] 亲自点击每一种重试，不允许“刷新页面后假装恢复”。

**通过条件：** 一次真实成功运行 + 四种故障的截图/短视频 + 全量测试结果。

## Task 9（9/16）：演示数据与 5 分钟路演录屏

**文件：**
- 创建：`docs/demo/5-minute-script.md`、`docs/demo/demo-checklist.md`
- 创建：`docs/evidence/recording-notes.md`

**AI 执行：**

- [ ] 写 5 分钟脚本：30 秒痛点，30 秒输入，2 分钟智能体执行，1 分钟教师审核和下载，45 秒学生回流，15 秒技术/安全总结。
- [ ] 实现“重置演示”只恢复脱敏 fixture，不清除真实用户数据；每次彩排从同一状态开始。
- [ ] 在 1440×900 渲染并逐页检查；删掉不会在脚本中出现的干扰入口。

**你实际验收：**

- [ ] 自己连续演示三次；每次不超过 5 分钟，所有点击都有确定结果。
- [ ] 录制一条从头到尾无剪辑视频；观看时关闭声音，仍能理解状态和产物。

**通过条件：** 一条完整录屏、一个演示重置说明、三次计时记录。

## Task 10（9/17）：初赛提交材料

**文件：**
- 创建：`submission/项目简介.md`、`submission/技术方案.md`、`submission/市场与落地.md`、`submission/数据安全说明.md`、`submission/评分映射.md`
- 创建：`submission/assets/`（只放脱敏截图、架构图、视频封面）

**AI 执行：**

- [ ] 用赛题五个 20 分维度分别写证据：技术可行性、市场可行性、综合创新性、AI 大模型结合、赛道专业维度。
- [ ] 技术方案必须写清 `RecapJob` 规划、工具、证据、重试、教师确认和最终交付；不夸大未实现的数据库、多智能体或真实学校部署。
- [ ] 商业叙事聚焦乡村小学 4–6 年级数学，说明教师节省的复盘时间、试点方式和收费假设；所有未验证数字标成“待验证假设”。
- [ ] 数据安全说明写录音授权、脱敏、最小化留存、教师审核、密钥管理。

**你实际验收：**

- [ ] 按评分映射逐行问：“这一分的证据在哪里？”没有截图、测试、录屏或文件就删掉该主张。
- [ ] 请一名不了解项目的人只看材料后复述“它替教师做了什么”；不能复述则重写首段。

**通过条件：** 五个评分项均有证据链接，所有宣传性数字都有来源或被标注为假设。

## Task 11（9/18–9/19）：打包、彩排与提交

**文件：**
- 创建：`submission/README-评委快速运行.md`、`submission/checksums.txt`
- 生成：`submission/知野-课堂复盘数字员工-提交包.zip`
- 保存：`docs/evidence/submission-receipt.md`

**AI 执行：**

- [ ] 打包前扫描密钥、`.env`、`node_modules`、缓存、录音原文件和真实学生身份信息；全部排除。
- [ ] 在空临时目录解压，按评委 README 重跑安装、测试与演示准备。
- [ ] 生成文件校验清单，最终检查报名页面要求的字段、视频链接、团队信息和组别。
- [ ] 彩排问答：为什么是智能体而非聊天机器人、为什么教师仍需确认、失败如何恢复、证据如何避免幻觉、如何扩展到学校。

**你实际验收：**

- [ ] 你亲自在报名网站填写和提交；AI 不替你提交涉及身份、团队信息或赛制承诺的字段。
- [ ] 下载/截图提交回执，核对上传文件名、视频播放和项目简介。

**通过条件：** 提交包可在空目录复现；报名回执、上传文件校验和最后彩排录像均已保存。

## 固定每日收尾模板

每天结束由 AI 更新 `docs/evidence/day-NN.md`，只写四项：

```markdown
## 已完成
- [命令或界面证据]

## 未通过/风险
- [具体报错、复现条件、影响]

## 明天唯一目标
- [只写上表下一行的成果]

## 需要你决定
- [仅列无法由 AI 安全代替的账号、录音授权、报名或价值取舍]
```

禁止把“页面已经写了”“看起来没问题”“未验证的后续工作”当作完成证据。
