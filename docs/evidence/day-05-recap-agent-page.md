# Day 05：课堂复盘数字员工执行页验收

## 本日目标

把 Task 3/4 的工具链和状态结果变成评委可以在 30 秒内读懂的教师工作台页面。

## 已完成

- 新增教师路由：`#/teacher/recap-agent`
- 新增页面：`src/features/teacher/recap-agent/RecapAgentPage.tsx`
- 新增组件：
  - `RecapPlanTimeline.tsx`
  - `RecapEvidenceDrawer.tsx`
  - `RecapDeliverablesPreview.tsx`
- 教师导航新增“课堂复盘数字员工”入口
- 首屏呈现：
  - 教师目标
  - 五步计划
  - 每步工具名、状态、摘要、证据数量
  - 失败原因与单步重试入口
  - 课堂原话与时间范围
  - 独立黄色 AI 推断标签
  - 学生复习卡、教师报告、补讲方案、练习题
- 证据条目默认收起，点击后展开原话，确保计划和成果区域首屏可见

## TDD 证据

新增页面测试覆盖：

- 成功状态：目标、五步计划、证据、成果区
- 失败状态：显示具体错误与“仅重试生成补讲包”按钮
- 证据语义：课堂原话与 AI 推断分开标记

```text
RecapAgentPage.test.tsx   3 passed
全量前端测试              173 passed
```

## 真实渲染验收

已在本地真实页面打开 `#/teacher/recap-agent`，确认：

- 1440×900 级别视口下无横向滚动
- 左侧五步工作流完整显示
- 右侧课堂证据、AI 推断和“四项成果”标题同屏出现
- 教师导航高亮“课堂复盘数字员工”
- 证据抽屉可展开，原话与时间可见

浏览器 DOM 检查：

```text
scrollWidth = clientWidth = 1676
```

## 回归结果

```text
pnpm test       42 test files / 173 tests passed
pnpm typecheck  passed
pnpm build      passed
```

构建仍有既有 Vite 主 bundle 超过 500 kB 提醒，但未影响页面渲染。

## 当前边界

本日页面使用确定性 demo 任务作为无 Key 的演示入口；真实任务创建和失败重试接口已在 Task 4 完成，教师审核、编辑、发布和导出属于 Task 6。
