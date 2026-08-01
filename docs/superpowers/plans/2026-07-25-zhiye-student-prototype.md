# Zhiye Student Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the connected student learning prototype from teacher-published recap through tutoring, self-retell, transfer practice, and mistake-book review.

**Architecture:** Student pages use the shared route/shell/state foundation with larger controls and lower reading density. Tutoring is a reducer-driven state machine so the main path and alternative branches are deterministic and testable.

**Tech Stack:** React 19, TypeScript, shared hash router/state foundation, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Complete the foundation and teacher plans first.
- Avoid public rankings, blame, punitive language, and direct-answer-first behavior.
- Mobile is the primary layout; desktop remains usable.
- Photograph, voice, AI, and offline behavior are clearly simulated.
- Preserve the sequence: express sticking point → layered help → self-retell → transfer problem → mistake book.

---

### Task 1: Student routes, home, and recap

**Files:**
- Create: `src/features/student/StudentRoutes.tsx`
- Create: `src/features/student/StudentRoutes.test.tsx`
- Create: `src/features/student/home/StudentHomePage.tsx`
- Create: `src/features/student/review/StudentReviewPage.tsx`
- Modify: `src/app/AppRouter.tsx`
- Create: `src/styles/student-pages.css`
- Modify: `src/index.css`

- [ ] Write tests entering student home, opening “分数的基本性质”, simulated read-aloud, selecting “我能讲出来”, and opening knowledge learning with context.
- [ ] Run `pnpm test --run src/features/student/StudentRoutes.test.tsx`; expect RED.
- [ ] Implement student route switch, home cards for recap/tutoring/tasks/mistakes/progress, and recap sections for key point, mistake reminder, daily-life example, self-check, optional exercise, read-aloud, and self-assessment.
- [ ] Verify and commit `feat: add student home and recap`.

### Task 2: Tutoring state machine and upload

**Files:**
- Create: `src/features/student/tutoring/tutoringMachine.ts`
- Create: `src/features/student/tutoring/tutoringMachine.test.ts`
- Create: `src/features/student/tutoring/TutoringPage.tsx`
- Create: `src/features/student/tutoring/TutoringPage.test.tsx`

**Interfaces:** States: `upload`, `sticking-point`, `confirm-problem`, `hint`, `key-step`, `explanation`, `retell`, `transfer`, `save-mistake`, `complete`, `needs-clearer-photo`.

- [ ] Write reducer tests for main path, unclear-photo branch, and “describe what you tried first” branch.
- [ ] Confirm RED.
- [ ] Implement exhaustive state/event reducer; invalid events retain current state.
- [ ] Write component tests for simulated image selection/replacement and all four sticking-point choices.
- [ ] Implement large targets, progress, representative fraction problem preview, and simulation labels.
- [ ] Verify and commit `feat: add student tutoring entry flow`.

### Task 3: Layered help to mistake save

**Files:**
- Modify: `src/features/student/tutoring/TutoringPage.tsx`
- Modify: `src/features/student/tutoring/TutoringPage.test.tsx`

- [ ] Write integration test: upload → 卡在某一步 → confirm conditions → hint → key step → explanation → non-empty self-retell → transfer → edit metadata → save.
- [ ] Confirm RED.
- [ ] Implement “再给我一点提示” and “我想看完整讲解”. Require self-retell before transfer. Save through `addMistake("student-lin-xiaoyu", mistake)` and link to mistakes.
- [ ] Verify and commit `feat: complete layered tutoring workflow`.

### Task 4: Knowledge learning conversation

**Files:**
- Create: `src/features/student/learning/LearningPage.tsx`
- Create: `src/features/student/learning/LearningPage.test.tsx`

- [ ] Test selecting history, suggested prompt, simulated voice, deterministic explanation/daily-life example, knowledge card, and Feynman response.
- [ ] Confirm RED.
- [ ] Implement local conversation generation from a topic-response map, history grouped by topic, voice-state button, and suggested prompts.
- [ ] Verify and commit `feat: add knowledge learning conversation`.

### Task 5: Mistake book

**Files:**
- Create: `src/features/student/mistakes/MistakesPage.tsx`
- Create: `src/features/student/mistakes/MistakeDetailDrawer.tsx`
- Create: `src/features/student/mistakes/MistakesPage.test.tsx`

- [ ] Test subject/knowledge/date/mastery filters, opening the saved fraction mistake, changing mastery to “基本掌握”, and setting a reminder.
- [ ] Confirm RED.
- [ ] Implement responsive cards, representative original-problem preview, cause, notes, mastery control, and reminder feedback.
- [ ] Verify and commit `feat: add student mistake book`.

### Task 6: Student tasks and communication

**Files:**
- Create: `src/features/student/tasks/StudentTasksPage.tsx`
- Create: `src/features/student/tasks/StudentTasksPage.test.tsx`
- Create: `src/features/student/messages/StudentMessagesPage.tsx`
- Create: `src/features/student/messages/StudentMessagesPage.test.tsx`

- [ ] Test opening/completing a teacher task, messaging teacher, ordinary feedback, and separate “需要帮助” protection entry.
- [ ] Confirm RED.
- [ ] Implement task progress; restrict messages to teacher and managed class group. Protection entry shows trusted-adult/emergency guidance and never enters ordinary message timeline.
- [ ] Verify and commit `feat: add student tasks and communication`.

### Task 7: Student phase integration

**Files:**
- Modify: `src/features/student/StudentRoutes.test.tsx`
- Modify: `src/styles/student-pages.css`

- [ ] Add tracer test: home → tutoring → layered help → self-retell → transfer → mistake book.
- [ ] Confirm RED for missing wiring, then connect routes/actions.
- [ ] Run `pnpm test --run`; expect all pass.
- [ ] Run `pnpm build`; expect exit 0.
- [ ] Browser-check 390×844 first, then 1440×900: primary actions above safe area, no horizontal scrolling, clear progress, readable Chinese copy.
- [ ] Commit `feat: complete student learning prototype`.
