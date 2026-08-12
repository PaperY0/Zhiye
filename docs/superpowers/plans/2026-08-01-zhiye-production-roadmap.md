# 知野从交互原型到试点产品实施路线图

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**目标：** 将当前可交互的多角色本地原型，逐步落地为可在 1 所乡村小学、3 个班、约 100 名学生、6 位教师中运行 4 周的知野试点产品。

**架构：** 当前 Vite + React 原型继续作为视觉和交互验收基线；生产版本按已批准 SPEC 演进为 Next.js Web、Route Handlers/Server Actions、PostgreSQL/Prisma、Redis/BullMQ、S3 兼容对象存储和独立 AI Worker。先用确定性的假 AI Worker 验证任务状态与权限，再接入真实模型，避免把模型不稳定性直接暴露给产品主流程。

**技术栈：** TypeScript、React、Tailwind CSS、Next.js App Router、PostgreSQL、Prisma、SQLite 本地开发、Redis、BullMQ、S3、SSE、Auth.js、Zod、Vitest、Testing Library、Playwright、Docker Compose。

## 当前基线与边界（2026-08-02 更新）

- 当前已完成：沉浸式知野欢迎页、教师/学生/家长/管理角色路由、统一角色壳层、本地 fixture、跨页面原型状态、课堂复盘/备课/任务/答疑/错题/家长摘要/保护性反馈/审计页面、最小验收数据链、统一历史记录中心。
- 当前性质：高保真本地交互原型；页面中的消息、音频、题图、AI 结果和设置均不会连接真实学校系统。
- 当前验证状态：`npm.cmd run test -- --run` 为 34 个测试文件、130 个测试通过；`npm.cmd run build` 成功。当前预览数据已重置为 1 条最小验收数据链。
- 当前已知问题：未知 hash 的页面内容会安全回到欢迎页，但地址栏不会自动规范化为 `#/welcome`；生产能力仍未实现。
- 当前生产差距：无真实认证、组织权限、数据库、对象存储、异步队列、AI Gateway、SSE、离线加密同步、真实审计和部署环境。
- 产品取舍：比赛演示与真实试点必须分开验收。演示可以使用确定性 fixture；试点必须使用真实状态、真实权限和可追溯任务。

## 第一阶段：收口当前原型（1–2 天）

### 任务 0.1：修复架构迁移后的测试契约

**文件：**
- 修改：`src/features/teacher/workspace/TeacherWorkspacePage.test.tsx`
- 检查：`src/app/AppRouter.test.tsx`、`src/components/shell/RoleShell.test.tsx`

- [x] 将旧的 `教师功能导航` 断言改为 `教师端主导航`。
- [x] 保留“确认并发布”和工作台行动卡跳转断言。
- [x] 执行 `npm.cmd run test -- --run`，结果为 34 个测试文件、130 个测试通过。

### 任务 0.2：完成原型验收矩阵

**文件：**
- 新建：`docs/qa/zhiye-prototype-acceptance.md`
- 检查：`src/app/routes.ts`、全部 `src/features/**/` 页面

- [ ] 逐条验收当前 27 个角色 hash 路由、刷新、前进/后退、角色切换。
- [x] 验收教师主线：工作台 → 课堂详情 → 复习卡发布 → 学生复习卡可见。2026-08-02 已完成最小数据链验收。
- [ ] 验收学生主线：拍题 → 卡点选择 → 分层提示 → 复述 → 保存错题。
- [ ] 验收保护主线：想说一说 → 普通反馈/保护性反馈分流 → 人工处理 → 审计事件。
- [ ] 验收桌面、平板、手机三种宽度；记录 overflow、键盘焦点、减少动效和减少透明度问题。

**阶段出口：** 本地原型全绿，演示脚本可以从欢迎页连续走完教师、学生、家长和保护流程。

## 第二阶段：冻结试点产品契约（2–3 天）

### 任务 1.1：冻结首发范围（已完成）

**提交文档：** `docs/product/zhiye-pilot-scope.md`

- [x] 首发只承诺数学、五年级、教师课堂复盘、学生单题答疑、班级困惑回流、家长陪伴摘要和保护性反馈。
- [x] 语文、英语保留数据结构和导航入口，但不作为首轮质量指标。
- [x] 不把“实时课堂录音分析”“方言高准确率”“自动诊断”放入首轮承诺。

### 任务 1.2：建立指标与事件字典

**当前状态：** 已建立草案，进入产品/工程/隐私评审。

**提交文档：** `docs/product/zhiye-pilot-metrics.md`、`docs/product/zhiye-event-dictionary.md`

**文件：**
- 新建：`docs/product/zhiye-pilot-metrics.md`
- 新建：`docs/product/zhiye-event-dictionary.md`

- [ ] 固化 PRD 的 4 周指标：教师采用 ≥70%、学生学习闭环 ≥60%、教师查看热力图 ≥60%、家长摘要阅读率 ≥50%。
- [ ] 为每个指标定义事件、主体、时间窗口、去重键和失败状态。
- [ ] 明确事件只记录必要元数据，不记录题图、课堂原文或保护性反馈正文。

**阶段出口：** 产品、设计、工程和评审使用同一份 MVP 合同，不再以“页面完成”代替“闭环完成”。

## 第三阶段：生产基础设施（1 周）

### 任务 2.1：建立生产应用边界

**生产边界契约：** `docs/product/zhiye-production-boundary.md`

当前状态：边界与迁移顺序已提交；Prisma schema、Prisma 7 配置、首个 `0001_init` 结构迁移和可执行脱敏 seed 已落地；PostgreSQL、Redis、MinIO 已通过本地 Compose 启动，唯一验收数据已写入数据库；独立 `apps/web` Next.js 生产入口骨架已建立。

当前纵向切片：`packages/domain` 已建立课堂发布状态机、事件 schema 和基础权限拒绝规则；尚未接入 Web、数据库或真实身份。

**文件：**
- 新建：`apps/web/`（Next.js App Router）
- 新建：`apps/worker/`（BullMQ Worker）
- 新建：`packages/domain/`（领域类型、Zod schema、权限规则）
- 修改：根目录 `package.json`、`docker-compose.yml`

- [x] 保留现有 Vite 原型可运行，并建立独立 `apps/web` 生产入口，不与生产路由混用。
- [ ] 为 web、worker、domain 建立 TypeScript project references 和共享 lint/test 命令。
- [x] Docker Compose 启动 PostgreSQL、Redis、MinIO（S3 兼容）基础依赖，并完成运行态验收。
- [ ] 所有环境变量通过 `.env.example` 声明，模型密钥和数据库密钥不进入仓库。

### 任务 2.2：身份、组织与权限

**权限契约草案：** `docs/product/zhiye-permission-matrix.md`

当前状态：领域层已实现会话角色、班级归属、监护绑定和保护案件的拒绝规则，并补齐了 HttpOnly Cookie policy 与 `getSessionUser` 会话解析契约；Auth.js、真实登录页、服务端 API 查询前置校验尚未接入。

**接口：**
- `getSessionUser(): Promise<SessionUser | null>`
- `requireRole(role: Role): Promise<SessionUser>`
- `canAccessClassroom(userId: string, classroomId: string): Promise<boolean>`
- `canReadStudent(userId: string, studentId: string): Promise<boolean>`

**数据：** `User`、`School`、`Classroom`、`Enrollment`、`GuardianLink`、`Invite`、`SafeguardingRouting`。

- [x] 建立 Auth.js route handler、登录页、退出按钮和本地 Credentials Provider 边界；演示邮箱已查询 PostgreSQL 脱敏种子用户，演示凭据在生产环境明确拒绝，真实学校账号 Provider/Adapter 仍待接入。
- [ ] 邀请码/绑定码只保存哈希，设置过期、使用次数和撤销状态。
- [ ] 每个 API 在查询前做组织、班级、监护关系校验；Prisma 不替代权限判断。
- [x] 为教师、学生、家长、管理员、保护负责人建立首轮领域权限矩阵和拒绝测试；API/Auth.js 接入留到下一切片。

## 第四阶段：教师第一闭环（1.5 周）

### 任务 3.1：课堂与录音会话

**数据：** `Course`、`Lesson`、`LessonRecording`、`AIJob`。

**接口：**
- `POST /api/lessons`
- `POST /api/lessons/:id/recordings/upload-url`
- `POST /api/lessons/:id/recordings/complete`
- `POST /api/lessons/:id/finish-recording`
- `GET /api/lessons/:id/status`

- [ ] 支持开始、暂停、结束；结束前二次确认。
- [ ] 文件通过预签名 URL 直传 S3，不经 web 服务器中转。
- [ ] 记录 `local/syncing/synced` 和 `queued/running/succeeded/failed/needs_review`，前端显示真实状态。
- [ ] 录音失败时提供重试、补传、本地草稿入口；不显示虚假百分比。

### 任务 3.2：确定性课堂分析 Worker

**接口：**
- `enqueueLessonAnalysis(input: LessonAnalysisInput): Promise<AIJob>`
- `runLessonAnalysis(jobId: string): Promise<LessonAnalysisOutput>`
- `LessonAnalysisOutput` 必须通过 Zod 校验，包含 `transcript`、`studentRecap`、`teacherReport`、`progressSuggestion`、`confidence`、`evidence`。

- [ ] 先用 fixture/规则 Worker 验证队列、重试、幂等和状态机。
- [ ] 再接 AI Gateway；浏览器不持有模型密钥。
- [ ] 低置信度输出统一进入 `NEEDS_REVIEW`，不得自动发布。
- [ ] 原音频在教师确认后计算 `deleteAfterAt`，默认 7 天删除并记录删除结果。

### 任务 3.3：复盘编辑与教师确认发布

**接口：**
- `GET /api/lessons/:id/artifacts`
- `PATCH /api/lesson-artifacts/:id`
- `POST /api/lesson-artifacts/:id/confirm`
- `POST /api/lesson-artifacts/:id/publish`

- [ ] 学生复习卡与教师私有报告使用 6:4 双栏，权限和视觉边界清晰。
- [ ] 每个 AI 建议展示依据、置信度、编辑、采纳和忽略。
- [ ] 发布事务同时写 `confirmedBy`、`publishedAt` 和审计事件；只有 `PUBLISHED` 对学生可读。
- [ ] 发布后停留在当前页，提供学生视图和班级困惑入口。

**阶段出口：** 教师能在普通教学电脑上完成“结束课堂 → 处理状态 → 编辑复习卡 → 确认发布”，失败可恢复。

## 第五阶段：学生学习闭环（1.5 周）

### 任务 4.1：学生复习与学习事实

**数据：** `LearningEvent`、`PracticeSet`、`PracticeSubmission`。

- [ ] 只能读取当前学生所属班级已发布内容。
- [ ] 记录查看复习卡、完成自检、提交练习等不可变事实。
- [ ] 断网时把可重放请求写入加密 IndexedDB，使用 `idempotencyKey` 防重复提交。

### 任务 4.2：分层拍照答疑

**接口：**
- `POST /api/question-attempts/upload-url`
- `POST /api/question-attempts`
- `GET /api/question-attempts/:id/events`
- `POST /api/question-attempts/:id/respond`
- `POST /api/question-attempts/:id/complete`

- [ ] 题图清晰度不足、缺题干或模型低置信度时先要求补充，不编造答案。
- [ ] 强制选择卡点类型，再按理解题意 → 提示 → 关键步骤 → 讲解 → 复述 → 迁移题推进。
- [ ] 连续直接求答案时改为温和思考引导，不惩罚性封禁。
- [ ] 完成后生成 `MistakeBookEntry` 和学习事实；允许学生修改知识点、错因和掌握状态。

**阶段出口：** 学生完成一次可验证的“先想再答疑”闭环，教师端能看到聚合后的事实，不看到不必要的私密内容。

## 第六阶段：教学回流、任务与家长（1 周）

### 任务 5.1：班级困惑聚合

**数据：** `ClassInsight`。

- [ ] 仅按班级、知识点、解题步骤、时间段聚合，禁止生成默认排名字段。
- [ ] 每个信号包含受影响人数、趋势、证据和置信度。
- [ ] 教师可一键把信号转为补讲草稿或针对性练习。

### 任务 5.2：备课、测验与任务

**接口：**
- `POST /api/plans/generate`
- `POST /api/quizzes/generate`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/status`
- `GET /api/tasks/:id/completions`

- [ ] 生成内容始终是可编辑草稿，教师确认后才能发布。
- [ ] 题目、任务和补讲内容记录来源证据与适用范围。
- [ ] 学生端完成状态回流教师端，家长只看审核后的摘要。

### 任务 5.3：陪伴摘要与家校沟通

**数据：** `ParentSummary`、`Conversation`、`Message`、`Notification`。

- [ ] 仅绑定监护人可读 `PUBLISHED` 摘要。
- [ ] 摘要只包含主题、学习事实、鼓励建议和教师留言；不含排名、完整对话、题图和敏感反馈。
- [ ] 消息支持教师—学生、教师—绑定家长、本班群；禁止学生与陌生人私信。
- [ ] 用 SSE 推送新消息和摘要可用状态；断线后通过游标补拉。

## 第七阶段：保护性反馈与可信 AI（4–5 天）

### 任务 6.1：反馈分流

**数据：** `FeedbackCase`、`FeedbackAction`、`SafeguardingRouting`、`AuditLog`。

- [ ] 儿童可理解的入口分为学习/课堂/校园建议与“我有点害怕，需要帮助”。
- [ ] 高风险内容不写入普通 `Message`；只进入加密反馈表和预设负责人队列。
- [ ] 不承诺绝对保密、不诊断、不自动报警；显示可信成人与紧急服务提示。
- [ ] 分配、查看、转交、跟进、关闭都写审计事件；日志不写正文、题图或课堂原文。

### 任务 6.2：AI 可靠性边界

- [ ] 所有模型输出通过 Zod schema、内容安全检查、置信度阈值和人工确认。
- [ ] 统一错误码：`LOW_CONFIDENCE`、`MISSING_INPUT`、`MODEL_TIMEOUT`、`CONTENT_BLOCKED`、`NEEDS_HUMAN_REVIEW`。
- [ ] 前端显示真实状态和恢复动作；不把失败伪装为成功。

## 第八阶段：弱网、隐私与运维（1 周）

- [ ] IndexedDB 加密保存待上传音频、题图和可重放请求；联网后按顺序同步。
- [ ] 所有写接口支持幂等键；重复请求只产生一次业务结果。
- [ ] 对象存储使用短期预签名 URL、服务端加密和生命周期删除。
- [ ] 个人数据导出、删除、绑定解除、录音删除、权限变更均写审计。
- [ ] 增加 Sentry/结构化日志/队列失败告警/数据库备份和恢复演练。
- [ ] 建立数据留存表：原始音频 7 天、AI 草稿按策略、结构化学习事实按试点协议保留。

## 第九阶段：质量与试点上线（1 周）

### 自动化验收

- [ ] 单元测试：路由、权限、状态机、schema、幂等、聚合、留存计算。
- [ ] 集成测试：数据库事务、队列重试、对象存储上传、SSE 重连、绑定关系。
- [ ] E2E：教师课堂复盘发布、学生分层答疑、班级回流、家长摘要、保护反馈。
- [ ] 安全测试：跨班访问、未绑定家长、越权学生档案、敏感内容日志泄露、重复提交。
- [ ] 性能测试：课堂分析 3 分钟内出初稿，答疑 30 秒内开始反馈，消息 1 分钟内同步。

### 试点上线清单

- [ ] Docker Compose 一键启动开发环境；生产环境使用托管 PostgreSQL/Redis/S3。
- [ ] 建立 1 所学校、3 个班、6 位教师、约 100 名学生的脱敏种子数据和账号回收流程。
- [ ] 培训教师：录音、确认发布、查看热力图、生成补讲、处理普通反馈。
- [ ] 培训保护负责人：高风险反馈接收、人工核实、转交、关闭和审计。
- [ ] 每周复盘 PRD 指标与失败事件，先修复安全/数据正确性，再修复视觉细节。

## 里程碑与停止条件

| 里程碑 | 预计周期 | 必须交付 | 未满足时停止扩展 |
| --- | ---: | --- | --- |
| M0 原型收口 | 1–2 天 | 全绿测试、演示脚本、响应式验收 | 不再增加新页面 |
| M1 契约冻结 | 2–3 天 | MVP 范围、事件字典、权限矩阵 | 不接真实 AI |
| M2 生产基础 | 1 周 | web/worker、数据库、认证、RBAC | 不接真实学校账号 |
| M3 教师闭环 | 1.5 周 | 录音→分析→确认→发布 | 不做多学科扩展 |
| M4 学生闭环 | 1.5 周 | 分层答疑→复述→错题 | 不做开放式聊天 |
| M5 教学回流 | 1 周 | 困惑聚合→补讲/任务→家长摘要 | 不做大屏数据产品 |
| M6 保护与上线 | 1.5 周 | 保护反馈、审计、弱网、E2E | 不进入真实试点 |

## 明确不做的事情

- 首轮不做全学科自动生成、无边界开放问答、学生排名、自动给学生贴人格标签。
- 首轮不做真实方言高准确率承诺、实时课堂自动诊断和自动替教师发布内容。
- 首轮不把 Figma/Vite 本地原型直接当成生产系统；它只能作为视觉和流程验收基线。
- 首轮不把高风险反馈交给普通聊天或完全自动化 AI 流程。
