# Task 2: 本地 PaddleOCR 端点报告

## 结果

已新增 `POST /solve-image`。它只将 multipart `image` 写入本机临时文件，调用本机懒加载 PaddleOCR，识别后在 `finally` 中删除该文件。端点返回 `recognizedText`、`ocrConfidence`、`needsConfirmation`，且不会把原始图片发送给 DeepSeek。

- 空文本或置信度小于 `0.65`：返回 `needsConfirmation: true` 和 `retryMessage: 题目文字不清晰，请重新拍摄。`
- 其余结果：仍返回 `needsConfirmation: true`，要求用户确认 OCR 文字后再使用。

## RED 证据

命令：

```text
python -m pytest services/local-ai/test_ocr.py -q
```

结果：失败，符合预期。测试在实现前因 `server` 没有 `recognize_image` 失败：

```text
AttributeError: <module 'server' ...> has no attribute 'recognize_image'
1 failed, 1 warning in 0.34s
```

## GREEN 证据

命令：

```text
python -m pytest services/local-ai/test_ocr.py services/local-ai/test_generation.py -q
```

结果：通过。

```text
41 passed, 1 warning in 0.26s
```

警告来自现有的 `python_multipart` 弃用提示，以及 `requests` 的依赖版本警告；没有测试失败。

## 变更文件

- `services/local-ai/requirements.txt`：加入 `paddleocr>=3,<4` 与 `paddlepaddle>=3,<4`。
- `services/local-ai/server.py`：加入 OCR 懒加载单例、文本/平均置信度汇总与 `/solve-image` 临时文件端点。
- `services/local-ai/test_ocr.py`：覆盖空结果、低置信度、清晰结果仍需确认、识别后临时文件清理。
- `scripts/start-local-ai.ps1`：OCR 可在无 DeepSeek Key 或无 ffmpeg 时启动；提示首次 OCR 会下载本地模型和图片不会上传至 DeepSeek。
- `docs/qa/local-ai-setup.md`：补充本地 OCR 数据边界、首次模型下载、启动条件与端点验收步骤。

## 自检

- `/solve-image` 不调用 `generate_with_deepseek` 或任何 DeepSeek 请求函数。
- OCR 引擎只在首次 `recognize_image` 时导入和创建，避免服务启动时加载模型。
- 上传路径始终由 `NamedTemporaryFile` 生成，且无论识别成功或抛错都会尝试删除。
- 低置信度阈值严格为 `< 0.65`；所有成功 OCR 结果均要求确认。
- 只会暂存并提交任务简报列出的五个 Task 2 实现/文档/测试文件；本报告保留在工作树中，不纳入该功能提交。

## 关注项

- PaddleOCR 模型为懒加载：首次实际 OCR 请求会下载模型并可能较慢，这是为了满足“懒加载”约束。
- 本次未下载大型 PaddleOCR 运行时模型进行端到端真实图片识别；测试通过替换识别函数验证端点契约、阈值与临时文件清理。
- 测试运行时仍出现已有依赖弃用/版本兼容警告，未影响本任务测试结果。

## 审查修复（2026-08-09）

### 修复内容

- PaddleOCR v3 结果现在会先解包 `result.json["res"]`，再读取 `rec_texts` 和 `rec_scores`；外层字段形式仍作为兼容回退。
- `/solve-image` 在创建 `NamedTemporaryFile` 后立即保存路径，并将异步读取和写入放入受 `finally` 保护的范围。即使 `image.read()` 或写入失败，也会删除该临时文件。

### 新增 RED 证据

命令：

```text
python -m pytest services/local-ai/test_ocr.py -q
```

实现前结果：`2 failed, 4 passed`。

- v3 结果 `{ "res": { "rec_texts": ["2/3"], "rec_scores": [0.92] } }` 被错误读为无文本。
- `image.read()` 抛出 `RuntimeError("read failed")` 后，已创建的临时文件仍然存在。

### GREEN 证据

命令：

```text
python -m pytest services/local-ai/test_ocr.py services/local-ai/test_generation.py -q
```

结果：`43 passed, 1 warning in 0.25s`。警告仍是现有 `python_multipart` 弃用提示与 `requests` 依赖版本警告。

### 审查后关注项

- PaddleOCR 真实模型仍是首次 OCR 请求时下载；本次对 v3 嵌套结果使用单元测试验证，未下载模型进行端到端识别。
