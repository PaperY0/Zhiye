# 本地语音转写、题图 OCR 与 DeepSeek 验收

当前链路：浏览器 `MediaRecorder` → 本机 FunASR / SenseVoice → DeepSeek JSON 复盘；题图 → 本机 PaddleOCR → 用户确认文字。题图只写入本机临时文件供 PaddleOCR 识别，识别后立即删除，绝不会上传到 DeepSeek。

## 启动

在项目根目录 PowerShell 中设置 Key（不要提交到 Git，也不要发到聊天里）：

```powershell
$env:DEEPSEEK_API_KEY="你的 DeepSeek Key"
$env:DEEPSEEK_MODEL="deepseek-v4-flash"
```

首次启动会安装 Python 依赖；首次进行语音转写或题图 OCR 时，会下载对应的本地模型：

```powershell
& .\scripts\start-local-ai.ps1
```

依赖中包含与 PyTorch 匹配的 `torchaudio`。如果启动日志出现
`ModuleNotFoundError: No module named 'torchaudio'`，重新执行上面的启动命令即可。

服务启动后检查：

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

预期 `ok` 为 `true`，`asr` 为 `local-funasr`，`deepseek` 为 `true`。

完整的可重复验证顺序（在项目根目录运行）：

```powershell
$env:DEEPSEEK_API_KEY="你的 DeepSeek Key"
& .\scripts\start-local-ai.ps1
Invoke-RestMethod http://127.0.0.1:8787/health
npm.cmd run test -- --run
python -m pytest services/local-ai -q
npm.cmd run build
```

Python 测试只验证本地服务的 schema、错误映射和 OCR 低置信度分支；它们不会请求 DeepSeek。浏览器测试也不读取或打印密钥。

未设置 `DEEPSEEK_API_KEY` 时，本地题图 OCR 仍可以使用；仅课堂 AI 初稿接口会返回 503。
未安装 `ffmpeg` 时，题图 OCR 仍可使用；浏览器音频转写需要先安装 `ffmpeg` 并加入 `PATH`。

## 题图 OCR 验收

向本地端点上传题图：

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8787/solve-image -Form @{ image = Get-Item .\question.png }
```

响应包含 `recognizedText`、`ocrConfidence` 与始终为 `true` 的 `needsConfirmation`，让用户确认后再使用识别文字。未识别到文字或置信度低于 `0.65` 时，还会返回“题目文字不清晰，请重新拍摄。”；浏览器以同一 `0.65` 阈值拦截，不会进入答疑生成。原始图片不会发送给 DeepSeek。

## 浏览器验收

1. 打开 `http://127.0.0.1:8443/?data=empty#/teacher/classroom`。
2. 点击“开始新课堂录音”。
3. 允许浏览器访问麦克风。
4. 说 10–20 秒中文课堂内容。
5. 点击“结束并生成 AI 初稿”。
6. 等待“AI 初稿已就绪”。
7. 点击“查看 AI 初稿”，检查“课堂转写”和“学生复习卡”。

## 失败判断

- “本地 AI 服务未启动，请运行 start-local-ai.ps1”：浏览器无法连接 `127.0.0.1:8787`；启动服务后使用页面的重试操作，绝不以固定成功内容代替结果。
- “本地 AI 服务返回 503”：服务已启动但没有 `DEEPSEEK_API_KEY`；设置 Key 后重试。OCR 仍可单独使用。
- “没有识别到清晰的人声”：录音为空、音量过低或音频格式无法解码。
- “题目文字不清晰，请重新拍摄。”：OCR 为空或置信度低于 `0.65`；重新拍摄，不要跳过文字确认。
- “DeepSeek 请求失败”或“模型返回格式无效，请重试”：Key、模型名、网络或模型 JSON 不合约；保留当前已审核内容，通过对应入口重试。
