# Day 03：受控 AI 工具链验收

## 本日目标

把课堂回顾拆成可单测、可替换、可追溯的工具链，并提供不需要 API Key 的固定转写验收通路。

## 已完成

- 新增 `services/local-ai/recap_tools.py`
  - `transcribe_audio(path)`：复用惰性加载的 FunASR，输出 `EvidenceItem[]`
  - `extract_evidence(transcript)`：只保留已校验的课堂原话证据
  - `identify_learning_gaps(goal, evidence)`：输出带 `evidence_ids` 的 `InferenceItem[]`
  - `generate_deliverables(goal, evidence, gaps)`：输出四项结构化成果和证据清单
- 新增 `services/local-ai/test_recap_tools.py`
- 新增 `POST /recap-jobs`
  - 支持 `goal + transcript` 固定文本验收
  - 支持 `goal + audio` 真实音频入口
  - 返回五步状态快照和四项成果
- `/health` 保持原有 ASR / DeepSeek 可用性状态，不返回 Key
- FunASR 改为在第一次真实转写时才导入，避免服务启动与测试阶段触发原生依赖崩溃

## 固定文本验收证据

以下请求不消耗 DeepSeek API：

```text
POST /recap-jobs
goal=为明天准备 5 分钟补讲
transcript=分子和分母要同时乘同一个不为零的数。
            如果只把分子乘二，分数是不是也一样？
```

响应状态为 `needs-review`，并包含：

- 五个按顺序完成的步骤
- 学生复习卡
- 教师报告
- 补讲方案
- 练习题
- 原话证据
- 引用证据 ID 的学习缺口推断

## TDD / 回归结果

```text
python -m pytest services/local-ai/test_recap_tools.py -q   4 passed
python -m pytest services/local-ai -q                       59 passed
pnpm test                                                    170 passed
pnpm typecheck                                               passed
pnpm build                                                   passed
```

现有环境仍有一个 Starlette multipart 弃用警告，以及 Vite 主 bundle 超过 500 kB 的构建提醒；均未影响本日验收。

## 用户验收方式

1. 运行 `python -m pytest services/local-ai/test_recap_tools.py -q`。
2. 检查测试中的固定文本接口结果，确认四项成果、五步状态和 `evidence_ids` 都存在。
3. 运行 `python -m pytest services/local-ai -q`、`pnpm test`、`pnpm typecheck`。
4. 可选：关闭网络后调用真实音频入口，确认错误应落在具体的 FunASR 工具，而不是笼统“AI 出错”。

## 当前边界

本日的固定文本路径使用确定性规则，保证比赛演示和验收不依赖 API 费用；DeepSeek 的结构化单职责调用与失败重试属于后续编排阶段，尚未把外部模型接入默认路径。
