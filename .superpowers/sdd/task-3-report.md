# Task 3 report: 前端本地 AI 客户端和课堂分析扩展

## Status

第二次复审问题已修复。录音取消、AI 分析完整性、课堂详情空态与编辑同步、原生暂停/继续，以及仅完整草稿可发布的约束均已覆盖。

## TDD evidence

RED：在本轮修复前运行 Task 3 聚焦 Vitest，暴露了三个失败：课堂测试 mock 没有导出完整性校验器；保存复习卡后提示被详情页同步 effect 清除；保存进度后同一 effect 清除了提示。

GREEN：

```powershell
npm.cmd test -- --run src/services/lessonAnalysis.test.ts src/app/prototype/PrototypeContext.test.tsx src/features/teacher/classroom/ClassroomPage.test.tsx src/features/teacher/classroom/LessonDetailPage.test.tsx
```

结果：4 个测试文件、38 项测试全部通过。

## Changes

- 关闭或取消录音时解除 MediaRecorder 的 `onstop`/`ondataavailable` 回调，只停止媒体轨道并中止在途本地 AI 请求；因此取消不会进入分析链路或创建草稿。
- 确认“结束并生成 AI 初稿”保留真实 MediaRecorder `onstop` 分析路径；请求失败进入 `failed`，不伪造 draft-ready。暂停和继续分别安全调用原生 `MediaRecorder.pause()`、`resume()`。
- 在 `src/services/lessonAnalysis.ts` 建立单一 `isCompleteLessonAnalysis` 校验器，并复用于响应解析、`updateLessonAnalysis` 和 `publishLesson` 的前置完整性判断。
- 完整性要求：非空 transcript、recapTags、evidence；转写对象的 id、speaker、body 与时间完整；recap、nextStep、teacherReport、progressSuggestion 为非空白字符串。无效结果不能写入 draft-ready 或发布。
- 课堂详情的转写、复习卡、教师报告、课程进度四个标签均以完整的本次 AI 结果为门槛；没有结果展示空态，不再回落 fixture。复习卡草稿随 `lesson.recap` 更新，同一课堂内保存后保持提示与当前标签。
- 新增/更新前端测试，包含：真实录音成功写入、失败不生成草稿、关闭不调用分析且 Context 无 `lesson-recording-*` draft-ready、pause/resume、无效 Context 写入、四标签空态和复习卡保存同步。
- 浏览器源码中未发现 `DEEPSEEK_API_KEY`。

## Verification

```powershell
Push-Location services/local-ai; python -m pytest; Pop-Location
```

结果：48 passed，1 个已有依赖警告。

```powershell
npm.cmd run build
```

结果：通过。Vite 仍报告一个大于 500 kB 的压缩后 chunk 警告，不影响产物。

## Concern

本轮没有阻塞。构建仅保留上述非阻塞 chunk-size 警告。
