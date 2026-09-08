# Day 02：课堂回顾任务契约验收

## 本日目标

把“课堂回顾数字员工”从一句产品描述，落成前后端可共同遵守、可校验的任务契约：固定五步流程、证据与推断可追溯、四项成果可交付。

## 已完成

- Python Pydantic 契约：`services/local-ai/schemas.py`
  - `RecapJob`
  - `RecapStep`
  - `EvidenceItem`
  - `InferenceItem`
  - `RecapDeliverables`
- TypeScript 契约：`src/app/prototype/types.ts`
- 可验收样例：`docs/evidence/recap-job-example.json`
- 针对性测试：`services/local-ai/test_recap_job.py`
- 前端 camelCase 与 Python snake_case 的字段兼容校验已补齐。

## AI 执行边界

任务必须按以下顺序推进：

1. `transcribe`
2. `extract-evidence`
3. `identify-gaps`
4. `generate-deliverables`
5. `teacher-review`

推断必须引用已有证据 ID；证据为空、步骤乱序、状态非法或推断引用不存在证据时，契约必须拒绝输入。

## TDD 证据

先写测试并确认模型不存在时收集失败；随后实现模型，修复前后端字段命名差异，再进入绿色阶段。

针对性测试结果：

```text
python -m pytest services/local-ai/test_recap_job.py -q
5 passed
```

样例 JSON 通过 Python 契约校验：

```text
RECAP_SAMPLE=PASS
```

## 回归结果

```text
python -m pytest services/local-ai -q   55 passed
pnpm test                                170 passed
pnpm typecheck                           passed
pnpm build                               passed
```

现有环境仍有依赖警告：`requests` 的 urllib3/chardet 版本提示、Starlette multipart 弃用提示，以及 Vite 主 bundle 超过 500 kB。这些不影响本日契约验收，但列入后续工程化优化。

## 用户验收方式

1. 打开 `docs/evidence/recap-job-example.json`，确认五步顺序、四项成果、证据和推断关系。
2. 运行：`python -m pytest services/local-ai/test_recap_job.py -q`。
3. 运行：`python -m pytest services/local-ai -q`、`pnpm test`、`pnpm typecheck`。
4. 可选破坏性验收：把样例中的 `evidenceIds` 改成不存在的 ID，或删掉 `evidence`，应当校验失败。

## 当前边界

本日只完成“任务契约与可验证样例”，尚未接入真实模型调用、音频转写或异步任务队列；这些属于后续步骤。
