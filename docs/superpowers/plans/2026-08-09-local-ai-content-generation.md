# 本地 AI 内容生成接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将课堂录音、备课、测验、补讲、学生问答、拍题答疑和审核草稿接入本地 PaddleOCR、FunASR 与 DeepSeek。

**Architecture:** React 只调用 `127.0.0.1:8787`；FastAPI 用任务专属 JSON schema 验证 DeepSeek 输出。PaddleOCR 在本机读取题图，只有学生确认过的文字会传给模型。失败一律显示真实可重试状态。

**Tech Stack:** React 19、TypeScript、Vitest、FastAPI、Pydantic、PaddleOCR、FunASR、DeepSeek Chat Completions。

## Global Constraints

- `DEEPSEEK_API_KEY` 仅存在于本地服务进程环境变量，严禁进入浏览器、fixture 或日志。
- 原始题图只在 PaddleOCR 本机处理；发送 DeepSeek 的是确认后的题目文字和最小上下文。
- 全部结果均为 AI 草稿；发布、保护反馈定性、审计、排名和人格标签不由模型自动执行。
- 当前 Vite 原型只保存本次会话结果，不声明写入生产数据库。

---

## 文件边界

| 路径 | 责任 |
| --- | --- |
| `services/local-ai/schemas.py` | 任务输入、输出 schema。 |
| `services/local-ai/generation.py` | DeepSeek 调用、prompt、JSON 校验。 |
| `services/local-ai/server.py` | `/analyze`、`/generate`、`/solve-image`。 |
| `src/services/localAi.ts` | 无密钥前端 HTTP 客户端与统一错误。 |
| `src/services/lessonAnalysis.ts` | 课堂响应校验。 |
| `src/features/teacher/*` | 教师草稿生成、编辑、确认。 |
| `src/features/student/*` | 学生问答、OCR 确认、分层答疑。 |

## Task 1: 服务端结构化生成端点

**Files:**
- Create: `services/local-ai/schemas.py`
- Create: `services/local-ai/generation.py`
- Create: `services/local-ai/test_generation.py`
- Modify: `services/local-ai/server.py`

**Interfaces:** `GenerateRequest(kind, context)`；`generate_draft(request)`；`POST /generate` 返回 `{ draft: true, source: "deepseek", content }`。

- [ ] **Step 1: 写失败测试**

```python
def test_quiz_rejects_less_than_three_questions():
    with pytest.raises(ValidationError):
        QuizDraft.model_validate({"title": "测验", "questions": [{"prompt": "只有一题"}]})

def test_unexpected_model_json_is_rejected(monkeypatch):
    monkeypatch.setattr(generation, "call_deepseek", lambda _: '{"unsafe": true}')
    with pytest.raises(GenerationValidationError):
        generate_draft(GenerateRequest(kind="learning-reply", context={"question": "为什么"}))
```

- [ ] **Step 2: 运行失败测试**

Run: `python -m pytest services/local-ai/test_generation.py -q`  
Expected: FAIL，缺少生成器和 schema。

- [ ] **Step 3: 实现 schema 与生成器**

```python
class GenerateRequest(BaseModel):
    kind: Literal["lesson-plan", "quiz", "remedial-plan", "learning-reply", "retell-follow-up", "parent-summary", "student-inference", "tutoring"]
    context: dict[str, Any]

def generate_draft(request: GenerateRequest) -> dict[str, Any]:
    raw = call_deepseek(build_request_body(request))
    return RESPONSE_MODELS[request.kind].model_validate_json(raw).model_dump()
```

为每种任务建独立 schema。测验强制三题；选择题答案必须属于选项。每个 prompt 明确要求 JSON、禁止编造课堂事实或学生标签，并设置 `max_tokens`。

- [ ] **Step 4: 暴露端点和错误映射**

```python
@app.post("/generate")
def generate(request: GenerateRequest):
    try:
        return {"draft": True, "source": "deepseek", "content": generate_draft(request)}
    except GenerationValidationError as error:
        raise HTTPException(status_code=502, detail="模型返回格式无效，请重试") from error
```

缺密钥为 503、输入无效为 422、超时为 504；不返回 fixture。

- [ ] **Step 5: 验证与提交**

Run: `python -m pytest services/local-ai/test_generation.py -q`  
Expected: PASS。

```powershell
git add services/local-ai/schemas.py services/local-ai/generation.py services/local-ai/test_generation.py services/local-ai/server.py
git commit -m "feat: add validated local AI generation endpoint"
```

## Task 2: 本地 PaddleOCR 端点

**Files:**
- Modify: `services/local-ai/requirements.txt`
- Modify: `services/local-ai/server.py`
- Create: `services/local-ai/test_ocr.py`
- Modify: `scripts/start-local-ai.ps1`
- Modify: `docs/qa/local-ai-setup.md`

**Interfaces:** `POST /solve-image` multipart `image`，返回 `recognizedText`、`ocrConfidence`、`needsConfirmation`、`retryMessage?`。

- [ ] **Step 1: 写失败测试**

```python
def test_empty_ocr_requires_retake(client, monkeypatch):
    monkeypatch.setattr(server, "recognize_image", lambda _: ("", 0.0))
    response = client.post("/solve-image", files={"image": ("blur.png", b"x", "image/png")})
    assert response.json()["needsConfirmation"] is True
    assert response.json()["retryMessage"] == "题目文字不清晰，请重新拍摄。"
```

- [ ] **Step 2: 运行失败测试**

Run: `python -m pytest services/local-ai/test_ocr.py -q`  
Expected: FAIL，`/solve-image` 尚未实现。

- [ ] **Step 3: 实现懒加载 OCR**

将 `paddleocr>=3,<4` 和 `paddlepaddle>=3,<4` 写入 requirements。使用懒加载单例 `get_ocr_engine()`，`recognize_image(path) -> tuple[str, float]` 汇总文字行和平均置信度。上传文件仅写入临时文件，识别完成即删除。

- [ ] **Step 4: 实现低置信度处理和启动说明**

`ocrConfidence < 0.65` 或无文字返回补拍提示，其他结果也一律 `needsConfirmation: true`。脚本和文档说明首次启动会下载 OCR 模型，题图不会上传到 DeepSeek。

- [ ] **Step 5: 验证与提交**

Run: `python -m pytest services/local-ai/test_ocr.py services/local-ai/test_generation.py -q`  
Expected: PASS。

```powershell
git add services/local-ai/requirements.txt services/local-ai/server.py services/local-ai/test_ocr.py scripts/start-local-ai.ps1 docs/qa/local-ai-setup.md
git commit -m "feat: add local OCR for question images"
```

## Task 3: 前端本地 AI 客户端和课堂分析扩展

**Files:**
- Create: `src/services/localAi.ts`
- Create: `src/services/localAi.test.ts`
- Modify: `src/services/lessonAnalysis.ts`
- Modify: `src/app/prototype/types.ts`
- Modify: `src/app/prototype/PrototypeContext.tsx`
- Modify: `src/app/prototype/PrototypeContext.test.tsx`
- Modify: `src/features/teacher/classroom/ClassroomPage.tsx`

**Interfaces:** `generateDraft(kind, context)`、`recognizeQuestionImage(file)`、`LessonAnalysisResult` 增加 `teacherReport`、`progressSuggestion`、`evidence`。

- [ ] **Step 1: 写失败测试**

```tsx
it("does not fabricate a draft when local AI is offline", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
  await expect(generateDraft("lesson-plan", { chapter: "单位换算" })).rejects.toThrow("本地 AI 服务未启动")
})

it("stores the returned teacher report", () => {
  updateLessonAnalysis("lesson-1", [], "复习卡", ["单位换算"], "补讲", 30, "教师报告", "进度建议", ["课堂依据"])
  expect(result.current.lessons[0].teacherReport).toBe("教师报告")
})
```

- [ ] **Step 2: 运行失败测试**

Run: `npm.cmd run test -- --run src/services/localAi.test.ts src/app/prototype/PrototypeContext.test.tsx --maxWorkers=1`  
Expected: FAIL，客户端和字段不存在。

- [ ] **Step 3: 实现客户端和状态更新**

```ts
const baseUrl = import.meta.env.VITE_LOCAL_AI_BASE_URL ?? "http://127.0.0.1:8787"
export async function generateDraft(kind: GenerationKind, context: Record<string, unknown>) {
  return requestJson(`${baseUrl}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, context }) })
}
```

`requestJson` 提取 `{ detail }`；网络异常提示“本地 AI 服务未启动，请运行 start-local-ai.ps1”。Context 原子保存课堂新增草稿字段。

- [ ] **Step 4: 扩展 `/analyze` 响应使用链路**

服务端输出教师报告、进度建议和依据；`lessonAnalysis.ts` 完整校验，`ClassroomPage` 写入 context。详情页只显示返回的草稿，不将 fixture 当作新结果。

- [ ] **Step 5: 验证与提交**

Run: `npm.cmd run test -- --run src/services/localAi.test.ts src/app/prototype/PrototypeContext.test.tsx src/features/teacher/classroom/ClassroomPage.test.tsx --maxWorkers=1`  
Expected: PASS。

```powershell
git add src/services/localAi.ts src/services/localAi.test.ts src/services/lessonAnalysis.ts src/app/prototype/types.ts src/app/prototype/PrototypeContext.tsx src/app/prototype/PrototypeContext.test.tsx src/features/teacher/classroom/ClassroomPage.tsx
git commit -m "feat: connect prototype to local AI client"
```

## Task 4: 教师教案、测验、补讲草稿

**Files:**
- Modify: `src/features/teacher/planning/generators.ts`
- Modify: `src/features/teacher/planning/LessonPlanBuilder.tsx`
- Modify: `src/features/teacher/planning/QuizBuilder.tsx`
- Modify: `src/features/teacher/insights/InsightsPage.tsx`
- Modify: `src/features/teacher/planning/PlanningPage.test.tsx`
- Modify: `src/features/teacher/insights/InsightsPage.test.tsx`

**Interfaces:** `generateDraft("lesson-plan" | "quiz" | "remedial-plan", context)`；`toPlanDraft(content)`；`toQuiz(content)`。

- [ ] **Step 1: 写失败 UI 测试**

```tsx
it("renders the plan returned by local AI", async () => {
  vi.mocked(generateDraft).mockResolvedValue({ content: { title: "单位换算补讲", outline: ["先复习"], examples: ["1 米"], misconceptions: ["方向错误"], suggestions: ["先估算"], extension: "设计一道题" } })
  await user.click(screen.getByRole("button", { name: "生成教案" }))
  expect(await screen.findByDisplayValue("单位换算补讲")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行失败测试**

Run: `npm.cmd run test -- --run src/features/teacher/planning/PlanningPage.test.tsx src/features/teacher/insights/InsightsPage.test.tsx --maxWorkers=1`  
Expected: FAIL，按钮仍调用确定性模板。

- [ ] **Step 3: 用异步生成替换模板成功路径**

保留 `generators.ts` 仅将服务端结构加上 `id`、`createdAt`、`status: "draft"`；删除固定题干、固定选项和固定建议。按钮显示“正在生成草稿”，失败展示错误和“重试生成”。洞察只传知识点、步骤、人数、趋势与证据，绝不传姓名。

- [ ] **Step 4: 验证与提交**

Run: `npm.cmd run test -- --run src/features/teacher/planning/PlanningPage.test.tsx src/features/teacher/insights/InsightsPage.test.tsx --maxWorkers=1`  
Expected: PASS。

```powershell
git add src/features/teacher/planning/generators.ts src/features/teacher/planning/LessonPlanBuilder.tsx src/features/teacher/planning/QuizBuilder.tsx src/features/teacher/insights/InsightsPage.tsx src/features/teacher/planning/PlanningPage.test.tsx src/features/teacher/insights/InsightsPage.test.tsx
git commit -m "feat: generate teacher drafts with local AI"
```

## Task 5: 学生文本问答和复述追问

**Files:**
- Modify: `src/features/student/learning/LearningPage.tsx`
- Modify: `src/features/student/learning/LearningPage.test.tsx`

**Interfaces:** `generateDraft("learning-reply", { topic, recap, question })`；`generateDraft("retell-follow-up", { topic, retell })`。

- [ ] **Step 1: 写失败测试**

```tsx
it("uses the student question as local AI input", async () => {
  vi.mocked(generateDraft).mockResolvedValue({ content: { explanation: "先判断方向", example: "1 米等于 100 厘米", card: "大变小乘", followUp: "3 米是多少厘米？" } })
  await user.type(screen.getByLabelText("输入你的问题"), "为什么要乘？")
  await user.click(screen.getByRole("button", { name: "发送问题" }))
  expect(await screen.findByText("先判断方向")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行失败测试**

Run: `npm.cmd run test -- --run src/features/student/learning/LearningPage.test.tsx --maxWorkers=1`  
Expected: FAIL，页面读取 `responses` 固定答案。

- [ ] **Step 3: 实现异步会话条目**

立即插入学生消息和 loading 条目；成功时替换为 AI 草稿回答，失败时保留问题并提供“重试回答”。复述提交单独调用 `retell-follow-up`；不自动写入掌握等级。保留语音按钮“模拟语音输入”标签。

- [ ] **Step 4: 验证与提交**

Run: `npm.cmd run test -- --run src/features/student/learning/LearningPage.test.tsx --maxWorkers=1`  
Expected: PASS。

```powershell
git add src/features/student/learning/LearningPage.tsx src/features/student/learning/LearningPage.test.tsx
git commit -m "feat: connect student learning replies to local AI"
```

## Task 6: OCR 确认和分层拍题答疑

**Files:**
- Modify: `src/features/student/tutoring/TutoringPage.tsx`
- Modify: `src/features/student/tutoring/tutoringMachine.ts`
- Modify: `src/features/student/tutoring/TutoringPage.test.tsx`

**Interfaces:** `recognizeQuestionImage(file)`；`generateDraft("tutoring", { questionText, stickingPoint, attempt })`；`TutoringStep` 增加 `recognizing-image`、`confirm-ocr`、`ocr-failed`。

- [ ] **Step 1: 写失败测试**

```tsx
it("requires confirmation of OCR text before invoking AI", async () => {
  vi.mocked(recognizeQuestionImage).mockResolvedValue({ recognizedText: "比较 2/3 和 3/5", ocrConfidence: 0.92, needsConfirmation: true })
  await user.upload(screen.getByLabelText("选择题目图片"), new File(["image"], "question.png", { type: "image/png" }))
  expect(await screen.findByDisplayValue("比较 2/3 和 3/5")).toBeInTheDocument()
  expect(generateDraft).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: 运行失败测试**

Run: `npm.cmd run test -- --run src/features/student/tutoring/TutoringPage.test.tsx --maxWorkers=1`  
Expected: FAIL，上传后仍显示固定分数题。

- [ ] **Step 3: 实现 OCR 确认页和动态答疑内容**

上传后先显示可编辑 OCR 文本与“确认题目，开始提示”；低置信度仅显示补拍。学生确认、选择卡点后请求 `tutoring`。响应 schema 必含 `hint`、`keyStep`、`explanation`、`retellPrompt`、`transferQuestion`、`transferOptions`、`transferAnswer`，并验证答案属于选项。失败不得进入下一步或展示固定答案。

- [ ] **Step 4: 验证与提交**

Run: `npm.cmd run test -- --run src/features/student/tutoring/tutoringMachine.test.ts src/features/student/tutoring/TutoringPage.test.tsx --maxWorkers=1`  
Expected: PASS。

```powershell
git add src/features/student/tutoring/TutoringPage.tsx src/features/student/tutoring/tutoringMachine.ts src/features/student/tutoring/TutoringPage.test.tsx
git commit -m "feat: use local OCR and AI for guided tutoring"
```

## Task 7: 可审核的家长摘要与学生观察草稿

**Files:**
- Modify: `src/features/parent/home/ParentHomePage.tsx`
- Modify: `src/features/teacher/students/StudentDetailPage.tsx`
- Modify: `src/features/parent/home/ParentHomePage.test.tsx`
- Modify: `src/features/teacher/students/StudentDetailPage.test.tsx`
- Modify: `src/app/prototype/types.ts`
- Modify: `src/app/prototype/PrototypeContext.tsx`

**Interfaces:** `generateDraft("parent-summary", { facts, teacherMessage })`；`generateDraft("student-inference", { facts, mistakes })`；草稿需显式采纳才可覆盖已发布展示。

- [ ] **Step 1: 写失败审核测试**

```tsx
it("keeps published summary unchanged until teacher adopts the draft", async () => {
  vi.mocked(generateDraft).mockResolvedValue({ content: { topics: ["单位换算"], encouragement: "愿意解释想法", teacherMessage: "完成自检" } })
  await user.click(screen.getByRole("button", { name: "生成本周摘要草稿" }))
  expect(await screen.findByText("AI 草稿 · 待教师审核")).toBeInTheDocument()
  expect(screen.getByText("已发布摘要")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行失败测试**

Run: `npm.cmd run test -- --run src/features/parent/home/ParentHomePage.test.tsx src/features/teacher/students/StudentDetailPage.test.tsx --maxWorkers=1`  
Expected: FAIL，页面仅使用 fixture 和静态推断。

- [ ] **Step 3: 实现生成、审核、采纳**

教师学生详情页提供两种生成按钮；草稿展示依据和“采纳/忽略”。家长页只展示已采纳摘要。采纳后才写入 `PrototypeContext`，并保留 `source: "deepseek"` 与确认时间。模型不可改写学习事实、错题、保护反馈。

- [ ] **Step 4: 验证与提交**

Run: `npm.cmd run test -- --run src/features/parent/home/ParentHomePage.test.tsx src/features/teacher/students/StudentDetailPage.test.tsx --maxWorkers=1`  
Expected: PASS。

```powershell
git add src/features/parent/home/ParentHomePage.tsx src/features/teacher/students/StudentDetailPage.tsx src/features/parent/home/ParentHomePage.test.tsx src/features/teacher/students/StudentDetailPage.test.tsx src/app/prototype/types.ts src/app/prototype/PrototypeContext.tsx
git commit -m "feat: add reviewable AI summary drafts"
```

## Task 8: 全量验收、构建与操作文档

**Files:**
- Modify: `docs/qa/local-ai-setup.md`
- Modify: `docs/qa/zhiye-prototype-acceptance.md`
- Modify: `src/App.test.tsx`
- Modify: `src/features/teacher/classroom/ClassroomPage.test.tsx`

- [ ] **Step 1: 写离线失败断言**

```tsx
it("offers a retry action when local AI is offline", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
  await user.click(screen.getByRole("button", { name: "生成教案" }))
  expect(await screen.findByText("本地 AI 服务未启动，请运行 start-local-ai.ps1")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行失败测试**

Run: `npm.cmd run test -- --run src/App.test.tsx src/features/teacher/classroom/ClassroomPage.test.tsx --maxWorkers=1`  
Expected: FAIL，直到所有入口使用统一错误映射。

- [ ] **Step 3: 记录可重复验收步骤**

在文档写入以下命令和预期：

```powershell
$env:DEEPSEEK_API_KEY="你的密钥"
& .\scripts\start-local-ai.ps1
Invoke-RestMethod http://127.0.0.1:8787/health
npm.cmd run test -- --run
npm.cmd run build
```

验收矩阵覆盖：服务未启动、录音、清晰/不清晰题图、OCR 编辑确认、教案、测验、学生追问、补讲、摘要草稿、教师采纳。

- [ ] **Step 4: 全量验证与提交**

Run: `npm.cmd run test -- --run`  
Expected: PASS。  
Run: `npm.cmd run build`  
Expected: `✓ built`。

```powershell
git add docs/qa/local-ai-setup.md docs/qa/zhiye-prototype-acceptance.md src/App.test.tsx src/features/teacher/classroom/ClassroomPage.test.tsx
git commit -m "test: document and verify local AI workflows"
```

