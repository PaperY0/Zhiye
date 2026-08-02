# Zhiye Teacher Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver all eight connected teacher pages and primary recording, publication, insights, planning, student, task, message, and settings workflows.

**Architecture:** Teacher routes render inside `RoleShell`. Pages consume typed fixtures/actions from `PrototypeContext`; local filters and dialogs remain page state. Lesson/student details are routed pages, while list-preserving secondary details use drawers.

**Tech Stack:** React 19, TypeScript, shared hash router/state foundation, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

## Global Constraints

- Complete `2026-07-25-zhiye-prototype-foundation.md` first.
- Preserve the existing high-fidelity workspace as teacher home.
- Every teacher navigation destination must be designed and interactive.
- Facts and AI inference are displayed separately; no student ranking.
- Recording and AI generation are clearly simulated and local.
- Desktop and mobile navigation work on every route.

---

## File Map

- `src/features/teacher/TeacherRoutes.tsx`: teacher route switch.
- `src/features/teacher/workspace/`: current workspace adapter.
- `src/features/teacher/classroom/`: lesson list, recording, lesson details.
- `src/features/teacher/insights/`: heatmap, trend, detail drawer.
- `src/features/teacher/planning/`: lesson-plan and quiz builders.
- `src/features/teacher/students/`: student list and detail.
- `src/features/teacher/tasks/`: task board, create dialog, detail drawer.
- `src/features/teacher/messages/`: conversations and chat.
- `src/features/teacher/settings/`: teacher settings.
- `src/styles/teacher-pages.css`: teacher page layouts.

### Task 1: Teacher routing and workspace navigation

**Files:**
- Create: `src/features/teacher/TeacherRoutes.tsx`
- Create: `src/features/teacher/TeacherRoutes.test.tsx`
- Create: `src/features/teacher/workspace/TeacherWorkspacePage.tsx`
- Modify: `src/app/AppRouter.tsx`
- Modify: `src/components/WorkspaceScreen.tsx`
- Modify: `src/components/workspace/CurrentLessonStage.tsx`
- Modify: `src/components/workspace/WorkspaceActivityRail.tsx`

- [ ] Write a failing test: current recap navigates to `lesson-fractions`; class pulse opens insights; queue entries open lesson/tasks/messages/planning.
- [ ] Run `pnpm test --run src/features/teacher/TeacherRoutes.test.tsx`; expect RED.
- [ ] Add `onNavigate(AppRoute)` to current workspace composition without changing visual output.
- [ ] Implement exhaustive `TeacherRoutes({ route, navigate })` branching and remove the teacher phase notice.
- [ ] Run focused tests; expect GREEN.
- [ ] Commit `feat: connect teacher workspace navigation`.

### Task 2: Classroom list and recording workflow

**Files:**
- Create: `src/features/teacher/classroom/ClassroomPage.tsx`
- Create: `src/features/teacher/classroom/RecordingPanel.tsx`
- Create: `src/features/teacher/classroom/ClassroomPage.test.tsx`

**Interfaces:** Recording state is `"idle" | "recording" | "paused" | "processing" | "draft-ready"`.

- [ ] Write tests for status filtering and start → pause → resume → end → processing → draft-ready. Use fake timers for 800ms processing.
- [ ] Confirm RED.
- [ ] Implement page header, status segmented control, lesson list/cards, duration, sync state, student visibility, and recording dialog. “查看 AI 初稿” navigates to `lesson-fractions`.
- [ ] Verify accessibility names and focused test.
- [ ] Commit `feat: add teacher classroom workflow`.

### Task 3: Lesson detail and publication

**Files:**
- Create: `src/features/teacher/classroom/LessonDetailPage.tsx`
- Create: `src/features/teacher/classroom/LessonDetailPage.test.tsx`

- [ ] Write tests for tabs 课堂转写/学生复习卡/教师课堂报告/课程进度, recap editing, evidence drawer, suggestion accept/ignore, and confirmation publication.
- [ ] Confirm RED.
- [ ] Implement controlled recap editor, quoted transcript evidence, uncertainty-labelled report suggestions, progress update controls, and publish dialog using `updateLessonRecap` and `publishLesson`.
- [ ] Verify and commit `feat: add teacher lesson review and publication`.

### Task 4: Class insights

**Files:**
- Create: `src/features/teacher/insights/InsightsPage.tsx`
- Create: `src/features/teacher/insights/KnowledgeHeatmap.tsx`
- Create: `src/features/teacher/insights/InsightsPage.test.tsx`

- [ ] Test time/subject filters, selecting “单位换算 × 计算”, detail drawer, evidence, and generation of a remedial plan or exercise.
- [ ] Confirm RED.
- [ ] Implement summary metrics, CSS heatmap with text equivalents, simple SVG trend, signal detail drawer, and generation calls to `addPlan`/`addQuiz`. Never render ranking.
- [ ] Verify and commit `feat: add class difficulty insights`.

### Task 5: Lesson plan and quiz builders

**Files:**
- Create: `src/features/teacher/planning/PlanningPage.tsx`
- Create: `src/features/teacher/planning/LessonPlanBuilder.tsx`
- Create: `src/features/teacher/planning/QuizBuilder.tsx`
- Create: `src/features/teacher/planning/generators.ts`
- Create: `src/features/teacher/planning/PlanningPage.test.tsx`

- [ ] Test selecting textbook/chapter/objective/context/evidence, generating and editing a plan, then creating/previewing/publishing a three-question quiz.
- [ ] Confirm RED.
- [ ] Implement two modes. Plan output includes outline, examples, misconceptions, suggestions, extension. Quiz editors include prompt, options, answer, explanation, score. Generators are deterministic pure functions.
- [ ] Verify and commit `feat: add planning and quiz builders`.

### Task 6: Student records

**Files:**
- Create: `src/features/teacher/students/StudentsPage.tsx`
- Create: `src/features/teacher/students/StudentDetailPage.tsx`
- Create: `src/features/teacher/students/StudentsPage.test.tsx`

- [ ] Test search/filter, opening 林晓雨, timeline, knowledge evidence, facts/inference separation, teacher note, and correction request.
- [ ] Confirm RED.
- [ ] Implement responsive list/cards and detail route. Title inference section exactly “AI 推断 · 需教师判断”; never use fixed negative labels.
- [ ] Verify and commit `feat: add teacher student records`.

### Task 7: Task management

**Files:**
- Create: `src/features/teacher/tasks/TasksPage.tsx`
- Create: `src/features/teacher/tasks/CreateTaskDialog.tsx`
- Create: `src/features/teacher/tasks/TaskDetailDrawer.tsx`
- Create: `src/features/teacher/tasks/TasksPage.test.tsx`

- [ ] Test 草稿/进行中/待查看/已完成 segments, opening task, creating “单位换算巩固练习”, publishing, completion metrics, and reminder toast.
- [ ] Confirm RED.
- [ ] Implement task board/list, type/title/content/audience/due/reminder fields, completion rows, and context actions.
- [ ] Verify and commit `feat: add teacher task management`.

### Task 8: Teacher messages and protection prompt

**Files:**
- Create: `src/features/teacher/messages/MessagesPage.tsx`
- Create: `src/features/teacher/messages/MessagesPage.test.tsx`

- [ ] Test selecting parent conversation, sending, filtering class groups, simulated attachment, and typing “我不敢回家” to open a protection dialog instead of normal send.
- [ ] Confirm RED.
- [ ] Implement conversation filters/list, chat timeline, composer, simulated attachment preview, and explicit “转入保护流程演示 / 返回修改” dialog. No external transmission.
- [ ] Verify and commit `feat: add teacher messaging prototype`.

### Task 9: Teacher settings

**Files:**
- Create: `src/features/teacher/settings/TeacherSettingsPage.tsx`
- Create: `src/features/teacher/settings/TeacherSettingsPage.test.tsx`

- [ ] Test textbook scope, AI detail, dialect, notifications, retention, and save confirmation.
- [ ] Confirm RED.
- [ ] Implement profile/class, scope, generation, speech, notification, retention, privacy, and role-switch sections with local-state explanation.
- [ ] Verify and commit `feat: add teacher settings prototype`.

### Task 10: Teacher phase integration

**Files:**
- Create: `src/styles/teacher-pages.css`
- Modify: `src/index.css`
- Modify: `src/features/teacher/TeacherRoutes.test.tsx`

- [ ] Add tracer tests: workspace → lesson → edit → publish; insights → generate plan; tasks → create → publish.
- [ ] Confirm RED for disconnected actions, then complete wiring.
- [ ] Import `teacher-pages.css` and align shared glass/radii/responsive layouts.
- [ ] Run `pnpm test --run`; expect all pass.
- [ ] Run `pnpm build`; expect exit 0.
- [ ] Browser-check all teacher routes at 1440×900 and 390×844: active nav, no horizontal overflow, Chinese wrapping, dialogs/drawers, consistent materials.
- [ ] Commit `feat: complete teacher interactive prototype`.
