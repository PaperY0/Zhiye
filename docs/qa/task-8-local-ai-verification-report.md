# Task 8 本地 AI 验证报告

> 记录时间：2026-08-11。此报告只记录 Task 8 的实际执行证据；它不覆盖 `zhiye-prototype-acceptance.md` 中用户已有的验收结论或未提交改动。

## 实际命令与结果

| 命令 | 实际结果 |
| --- | --- |
| `npm.cmd run test -- --run` | 已完成：45 个测试文件、178 个测试；177 通过、1 失败。 |
| `python -m pytest services/local-ai -q` | 49 通过、1 个 `python_multipart` PendingDeprecationWarning；另有当前 Python 环境的 `requests` 依赖兼容性 warning。 |
| `npm.cmd run build` | 成功构建；Vite 报告单个压缩前 JS chunk 为 `539.76 kB`，超过 500 kB 警告阈值。 |

前端唯一失败为用户工作区未提交的 [`src/components/WorkspaceScreen.test.tsx`](../../src/components/WorkspaceScreen.test.tsx:115)：“确认并发布”按钮仍在文档中。该文件不属于 Task 8 提交 `b059918`，本轮没有修改、暂存或归因给 Task 8。

## 可复现源码扫描

在项目根目录 PowerShell 执行：

```powershell
rg -n --glob '!*.test.*' 'DEEPSEEK_API_KEY' src

$aiEntryFiles = rg -l --glob '!*.test.*' 'generateDraft\(|recognizeQuestionImage\(|analyzeLessonAudio\(' src/features
$aiEntryFiles | ForEach-Object {
  $file = $_
  rg -n -i 'fixture|fallback|固定.*(答案|草稿|成功)|模拟.*(答案|草稿|成功)' $file
}

rg -n -i 'DEEPSEEK_API_KEY|fixture|fallback|固定.*(答案|草稿|成功)' `
  src/services/localAi.ts src/services/lessonAnalysis.ts
```

本次实际输出摘要：

- `src` 的浏览器源码密钥扫描：0 匹配。
- 检出的 AI 入口文件：7 个；固定成功/fixture fallback 标记扫描：0 匹配。
- `src/services/localAi.ts` 与 `src/services/lessonAnalysis.ts` 的密钥与 fallback 扫描：0 匹配。

扫描仅证明上述静态规则；它不替代对本地服务网络、真实 DeepSeek 凭据或浏览器录音权限的人工验收。

## 本次范围结论

- DeepSeek 结果仍只作为草稿；没有自动发布、自动采纳或用 fixture 伪造成功的例外。
- 原始题图仍仅进入本地 OCR；只有确认后的文本才可进入 DeepSeek 草稿生成。
- 浏览器与服务端都以 `0.65` 为 OCR 低置信度补拍阈值。
