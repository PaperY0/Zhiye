# Day 04：编排、失败保留与单步重试验收

## 本日目标

让课堂复盘任务严格按五步执行；后续工具失败时保留前序成功结果，并支持只重试失败的生成步骤。

## 已完成

- 新增 `services/local-ai/recap_job.py`
  - `new_recap_job(goal)`：创建固定五步任务
  - `run_recap_job(job, transcript)`：按顺序运行并保存证据/推断
  - `retry_recap_step(job, step_key)`：只允许重试 `failed` 的 `generate-deliverables`
- `RecapJob` 增加持久化的 `evidence` 与 `inferences`，生成失败时前序结果不丢失
- `POST /recap-jobs` 改为使用统一编排器
- 新增 `POST /recap-jobs/{job_id}/retry`
- 前端 `localAi.ts` 增加创建与重试接口
- `PrototypeContext` 增加 `recapJobs` 和 `upsertRecapJob`，纳入现有 localStorage / 跨窗口同步
- 新增 `services/local-ai/test_recap_orchestrator.py`

## 失败—恢复验收证据

测试让 `generate_deliverables` 第一次抛出 `DeepSeek 暂时不可用`：

- 前 3 步仍为 `succeeded`
- 第 4 步为 `failed`
- 失败步骤保存具体错误
- 证据和学习缺口仍保留
- 重试后只追加一次第 4 步调用，转写、提取证据和识别缺口没有重复执行

## 回归结果

```text
python -m pytest services/local-ai -q   61 passed
pnpm test                                170 passed
pnpm typecheck                           passed
pnpm build                               passed
```

## 用户验收方式

1. 运行 `python -m pytest services/local-ai/test_recap_orchestrator.py -q`。
2. 查看测试断言：失败时前三步结果保留，重试时调用序列只增加 `generate-deliverables-retry`。
3. 运行 `python -m pytest services/local-ai -q`、`pnpm test`、`pnpm typecheck`。
4. 前端刷新后检查 `recapJobs` 已被纳入 `zhiye-prototype-state-v1` 的 localStorage 快照。

## 当前边界

重试接口目前只开放生成补讲包这一步；任务页按钮和可视化失败/重试状态属于下一步 Task 5。
