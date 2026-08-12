# 知野生产应用边界与迁移契约

状态：生产基础阶段技术契约草案

日期：2026-08-02

## 1. 目标

把当前 Vite + React 本地原型保留为演示与交互验收入口，同时为真实试点建立独立的生产 Web、领域包、数据库和异步 Worker。两者共享产品语言和领域契约，但不共享生产数据，不把浏览器本地状态当作真实业务状态。

## 2. 目标目录

```text
apps/
  web/       # Next.js App Router、会话、页面和 API 边界
  worker/    # BullMQ 任务、课堂分析、重试和清理任务
packages/
  domain/    # Zod schema、状态机、权限规则、事件类型
  db/        # Prisma schema、迁移和仓储实现
  config/    # 环境变量 schema 与运行配置
src/         # 当前 Vite 原型，仅用于演示与交互验收
```

首轮不把 `src/` 重命名为生产应用，也不在当前原型中接入真实学校账号或模型密钥。

## 3. 责任边界

### Web

- 通过 HttpOnly Cookie 建立会话。
- 在服务端完成组织、班级、绑定关系和角色权限检查。
- 暴露课堂、复习卡、任务、摘要、消息和保护流程 API。
- 只向浏览器返回当前主体有权读取的最小数据。

### Worker

- 消费课堂分析、通知、事件写入和数据清理任务。
- 使用幂等键处理重试，不重复发布、不重复计数。
- 所有失败进入明确状态：`LOW_CONFIDENCE`、`MODEL_TIMEOUT`、`NEEDS_HUMAN_REVIEW` 等。

### Domain

- 定义 `Lesson`、`LessonArtifact`、`LearningEvent`、`Task`、`ParentSummary`、`FeedbackCase`、`AuditLog` 等领域类型。
- 定义草稿→确认→发布状态机。
- 定义权限函数和事件 schema。
- 不依赖 React、浏览器 localStorage 或具体数据库客户端。

### DB / Storage

- PostgreSQL 保存结构化业务数据和状态。
- Redis/BullMQ 保存异步任务和重试状态。
- S3 兼容对象存储保存受控文件，使用预签名 URL，不经 Web 服务器中转。
- 所有迁移可回滚或有明确备份恢复方案。

## 4. 首轮最小生产数据模型

```text
School
User
Classroom
Enrollment
GuardianLink
Lesson
LessonRecording
LessonArtifact
LearningEvent
PracticeSet
PracticeSubmission
ClassInsight
Task
ParentSummary
Conversation
Message
FeedbackCase
FeedbackAction
AuditLog
AIJob
```

首轮只实现数学五年级和已冻结的四条用户闭环；语文、英语不进入质量指标和生产数据种子。

## 5. API 第一批边界

```text
POST /api/lessons
POST /api/lessons/:id/recordings/upload-url
POST /api/lessons/:id/recordings/complete
POST /api/lessons/:id/finish-recording
GET  /api/lessons/:id/status
GET  /api/lessons/:id/artifacts
PATCH /api/lesson-artifacts/:id
POST /api/lesson-artifacts/:id/confirm
POST /api/lesson-artifacts/:id/publish
GET  /api/students/:id/learning-events
POST /api/question-attempts
POST /api/tasks
PATCH /api/tasks/:id/status
GET  /api/parent-summaries/:id
POST /api/feedback-cases
PATCH /api/feedback-cases/:id
GET  /api/audit-events
```

每个接口必须先调用权限函数，再执行领域操作；不能以页面是否显示按钮作为授权依据。

## 6. 迁移顺序

1. 建立 `packages/domain`：类型、schema、状态机和权限测试。
2. 建立数据库 schema、迁移和脱敏种子数据。
3. 建立 Web 会话、组织关系和拒绝响应。
4. 建立确定性 Worker，先不接真实模型。
5. 迁移教师课堂发布闭环，并与原型验收脚本对照。
6. 迁移学生复习/答疑、班级回流、家长摘要和保护流程。
7. 增加弱网、幂等、审计、备份和 E2E 测试。

## 7. 第一批完成定义

- 未登录或跨组织访问无法读取业务数据。
- 草稿和低置信度结果无法对学生可见。
- 发布事务具有确认人、发布时间和审计事件。
- 重试不会重复产生发布、消息或指标事件。
- 原型仍能独立运行：`npm.cmd run test -- --run` 与 `npm.cmd run build` 不受生产应用目录影响。
- 所有模型密钥、数据库连接串和对象存储凭据只存在服务端环境变量，不进入浏览器或仓库。

## 8. 当前明确不做

- 不在这一步把当前 Vite 项目直接改造成 Next.js。
- 不在没有认证和权限层的情况下接入真实学生或学校数据。
- 不先接真实 AI 再补状态机、审计和权限。
