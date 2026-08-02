# Zhiye Prototype Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish typed hash routing, shared prototype state, role-aware navigation shells, reusable interaction primitives, and role entry for all later pages.

**Architecture:** A dependency-free hash router converts `window.location.hash` into a discriminated `AppRoute`. `PrototypeProvider` owns cross-page mock state. `AppRouter` composes role shells and feature route components.

**Tech Stack:** React 19, TypeScript 5.7, Vite 8, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

## Global Constraints

- Do not add routing or state-management dependencies.
- Preserve the current welcome experience and teacher dashboard.
- Refresh and browser back/forward must preserve the hash route.
- All controls require accessible names and visible focus.
- Prototype actions remain local and transmit no personal or safeguarding data.
- Support reduced motion, reduced transparency, desktop, and mobile.

---

## File Map

- `src/app/routes.ts`: route types, parser, formatter, role homes.
- `src/app/useHashRoute.ts`: reactive hash subscription and navigation.
- `src/app/AppRouter.tsx`: route-to-role composition.
- `src/app/prototype/{types,fixtures,PrototypeContext}.tsx`: typed mock state.
- `src/components/shared/`: glass, status, dialog, drawer, toast, filters, empty state.
- `src/components/shell/`: role sidebar, mobile nav, header, role switcher.
- `src/styles/prototype.css`: shared routed-prototype styles.

### Task 1: Typed hash router

**Files:**
- Create: `src/app/routes.ts`
- Create: `src/app/routes.test.ts`
- Create: `src/app/useHashRoute.ts`

**Interfaces:** Produces `Role`, `AppRoute`, `parseHash`, `formatRoute`, `getRoleHome`, and `navigate`.

- [ ] **Step 1: Write the failing route test**

```ts
import { expect, it } from "vitest"
import { formatRoute, getRoleHome, parseHash } from "./routes"

it("parses dynamic routes and falls back safely", () => {
  expect(parseHash("#/teacher/classroom/lesson-fractions")).toEqual({
    role: "teacher", page: "lesson-detail", lessonId: "lesson-fractions",
  })
  expect(parseHash("#/student/review/lesson-fractions")).toEqual({
    role: "student", page: "review", lessonId: "lesson-fractions",
  })
  expect(parseHash("#/bad/path")).toEqual({ page: "welcome" })
  expect(getRoleHome("parent")).toEqual({ role: "parent", page: "home" })
  expect(formatRoute({ role: "admin", page: "safety" })).toBe("#/admin/safety")
})
```

- [ ] **Step 2: Verify RED**

Run: `pnpm test --run src/app/routes.test.ts`
Expected: FAIL because `routes.ts` does not exist.

- [ ] **Step 3: Implement exact route union**

```ts
export type Role = "teacher" | "student" | "parent" | "admin"
export type AppRoute =
  | { page: "welcome" }
  | { role: "teacher"; page: "workspace" | "classroom" | "insights" | "planning" | "students" | "tasks" | "messages" | "settings" }
  | { role: "teacher"; page: "lesson-detail"; lessonId: string }
  | { role: "teacher"; page: "student-detail"; studentId: string }
  | { role: "student"; page: "home" | "tutoring" | "learning" | "mistakes" | "tasks" | "messages" }
  | { role: "student"; page: "review"; lessonId: string }
  | { role: "parent"; page: "home" | "messages" }
  | { role: "admin"; page: "home" | "safety" | "audit" | "settings" }
```

Implement canonical formatting, URI decoding, known-page validation, safe welcome fallback, and `getRoleHome`. Implement `useHashRoute` with `useSyncExternalStore`, `hashchange`, empty-hash initialization, and `navigate(route)`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `pnpm test --run src/app/routes.test.ts`
Expected: PASS.

```powershell
git add src/app/routes.ts src/app/routes.test.ts src/app/useHashRoute.ts
git commit -m "feat: add typed hash routing"
```

### Task 2: Typed fixtures and shared state

**Files:**
- Create: `src/app/prototype/types.ts`
- Create: `src/app/prototype/fixtures.ts`
- Create: `src/app/prototype/PrototypeContext.tsx`
- Create: `src/app/prototype/PrototypeContext.test.tsx`

**Interfaces:** Produces `PrototypeProvider` and `usePrototype()`.

- [ ] **Step 1: Write failing state test**

```tsx
const { result } = renderHook(() => usePrototype(), { wrapper: PrototypeProvider })
act(() => result.current.publishLesson("lesson-fractions"))
expect(result.current.lessons.find((item) => item.id === "lesson-fractions")?.status).toBe("published")
act(() => result.current.sendMessage("conversation-parent-li", "今晚会陪孩子复习。"))
expect(result.current.conversations.find((item) => item.id === "conversation-parent-li")?.messages.at(-1)?.body).toBe("今晚会陪孩子复习。")
```

- [ ] **Step 2: Verify RED**

Run: `pnpm test --run src/app/prototype/PrototypeContext.test.tsx`
Expected: FAIL because the provider is absent.

- [ ] **Step 3: Define types and deterministic fixtures**

Define `Lesson`, `Student`, `KnowledgeSignal`, `PlanDraft`, `Quiz`, `Task`, `Conversation`, `ParentSummary`, `SafetyCase`, and `AuditEvent`. Fixtures must include `lesson-fractions`, `lesson-units`, `student-lin-xiaoyu`, twelve students, three difficulty signals, four task states, student/parent/group conversations, a weekly parent summary, three safety cases, and audit events.

- [ ] **Step 4: Implement context actions**

```ts
export type PrototypeContextValue = {
  lessons: Lesson[]; students: Student[]; signals: KnowledgeSignal[]
  plans: PlanDraft[]; quizzes: Quiz[]; tasks: Task[]
  conversations: Conversation[]; parentSummary: ParentSummary
  safetyCases: SafetyCase[]; auditEvents: AuditEvent[]
  publishLesson(id: string): void
  updateLessonRecap(id: string, recap: string): void
  addPlan(plan: PlanDraft): void; addQuiz(quiz: Quiz): void
  addTask(task: Task): void
  updateTaskStatus(id: string, status: Task["status"]): void
  sendMessage(id: string, body: string): void
  addMistake(studentId: string, mistake: Student["mistakes"][number]): void
  updateSafetyCase(id: string, patch: Partial<SafetyCase>): void
}
```

Use lazy `useState` copies so fixture modules are immutable during tests.

- [ ] **Step 5: Verify and commit**

Run: `pnpm test --run src/app/prototype/PrototypeContext.test.tsx`
Expected: PASS.

```powershell
git add src/app/prototype
git commit -m "feat: add prototype data model"
```

### Task 3: Shared components and visual tokens

**Files:**
- Create: `src/components/shared/GlassSurface.tsx`
- Create: `src/components/shared/StatusChip.tsx`
- Create: `src/components/shared/Dialog.tsx`
- Create: `src/components/shared/Drawer.tsx`
- Create: `src/components/shared/ToastRegion.tsx`
- Create: `src/components/shared/FilterBar.tsx`
- Create: `src/components/shared/EmptyState.tsx`
- Create: `src/components/shared/shared.test.tsx`
- Create: `src/styles/prototype.css`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing primitive tests**

Test labelled `role="dialog"`, labelled drawer, close buttons, Escape close, trigger focus restoration, visible status text/tone, and empty-state action.

- [ ] **Step 2: Verify RED**

Run: `pnpm test --run src/components/shared/shared.test.tsx`
Expected: FAIL because the primitives are absent.

- [ ] **Step 3: Implement public APIs**

```ts
GlassSurface: HTML div props + weight "light" | "card" | "sheet"
StatusChip: children + tone "neutral" | "success" | "info" | "warning" | "critical"
Dialog: open, title, description?, onClose, children, footer?
Drawer: open, title, onClose, children
FilterBar: children
EmptyState: title, description, action?
```

`prototype.css` defines shared radii, glass weights, shadows, focus rings, dialog/drawer layout, status tones, mobile sheets, and accessibility media queries. Import it after `theme.css`.

- [ ] **Step 4: Verify and commit**

Run: `pnpm test --run src/components/shared/shared.test.tsx`
Expected: PASS.

```powershell
git add src/components/shared src/styles/prototype.css src/index.css
git commit -m "feat: add shared prototype components"
```

### Task 4: Role shell and navigation

**Files:**
- Create: `src/components/shell/navigation.ts`
- Create: `src/components/shell/RoleShell.tsx`
- Create: `src/components/shell/RoleSidebar.tsx`
- Create: `src/components/shell/RoleMobileNav.tsx`
- Create: `src/components/shell/RoleSwitcher.tsx`
- Create: `src/components/shell/RoleShell.test.tsx`

- [ ] **Step 1: Write failing navigation test**

Render teacher insights and assert “班级洞察” has `aria-current="page"`; switch to student and assert `{ role: "student", page: "home" }` is requested.

- [ ] **Step 2: Verify RED**

Run: `pnpm test --run src/components/shell/RoleShell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement role navigation**

Teacher: 工作台、课堂、班级洞察、备课与测验、学生档案、任务、消息、设置. Student: 首页、拍照答疑、知识点学习、错题本、任务、消息. Parent: 学习摘要、联系老师. Admin: 管理概览、保护性反馈、审计记录、学校设置.

The shell includes skip link, desktop sidebar, contextual header, mobile nav, role switcher, and `<main id="main-content">`.

- [ ] **Step 4: Verify and commit**

Run: `pnpm test --run src/components/shell/RoleShell.test.tsx`
Expected: PASS.

```powershell
git add src/components/shell
git commit -m "feat: add role-aware application shell"
```

### Task 5: Routed app and welcome role entry

**Files:**
- Create: `src/app/AppRouter.tsx`
- Create: `src/app/AppRouter.test.tsx`
- Create: `src/features/welcome/WelcomeRoute.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/WelcomeScreen.tsx`
- Modify: `src/components/WelcomeScreen.test.tsx`

- [ ] **Step 1: Write failing route-entry test**

Assert welcome exposes four role buttons, teacher entry changes hash to `#/teacher/workspace`, teacher route renders the teacher shell, and invalid hash returns to welcome.

- [ ] **Step 2: Verify RED**

Run: `pnpm test --run src/app/AppRouter.test.tsx src/components/WelcomeScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement composition**

```tsx
export default function App() {
  return <PrototypeProvider><AppRouter /></PrototypeProvider>
}
```

Adapt `WelcomeScreen` to `onEnterRole(role: Role)`. `AppRouter` uses `useHashRoute` and role shells. During foundation only, unimplemented feature routes may use one fully designed phase notice surface; every such notice must be removed by its role phase.

- [ ] **Step 4: Verify foundation**

Run: `pnpm test --run`
Expected: all tests pass.

Run: `pnpm build`
Expected: exit 0.

Browser-check role entry, refresh, back/forward, desktop shell, and 390px mobile navigation.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/app src/features/welcome src/components/WelcomeScreen.tsx src/components/WelcomeScreen.test.tsx
git commit -m "feat: establish multi-role prototype foundation"
```
