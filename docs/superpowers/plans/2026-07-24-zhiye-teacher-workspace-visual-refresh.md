# 知野教师工作台视觉重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将双卡片课堂页重构为 A5“精炼自然光场”多功能教师工作台，同时保持欢迎页往返和移动端可用性。

**Architecture:** `WorkspaceScreen` 只维护侧边栏折叠状态；侧边栏、上下文栏、当前课堂舞台、行动右栏和移动导航拆到 `src/components/workspace/`。Tailwind 负责布局，`theme.css` 负责自然光背景、纸张表面和等高线装饰。

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Lucide React, Vitest, Testing Library.

## Global Constraints

- 不新增依赖、路由、后端或真实 AI 调用。
- 保持 `WorkspaceScreen({ onBackToWelcome: () => void })` 接口。
- 桌面侧栏显示图标与中文名称；中屏可折叠；手机使用底部导航。
- 使用 `#F7F9F6 / #D5E1E2 / #DCE8D5 / #526F59 / #C9A660 / #172019`。
- 禁止具象风筝、山坡、河流、云朵和高饱和大色块。
- “确认并发布”是唯一强主操作。
- 点击目标至少 44px；折叠后保留可访问名称；支持 reduced motion。
- 不修改欢迎页和用户已有改动。

---

### Task 1: 功能侧边栏与壳层

**Files:**
- Create: `src/components/workspace/WorkspaceSidebar.tsx`
- Modify: `src/components/WorkspaceScreen.tsx`
- Test: `src/components/WorkspaceScreen.test.tsx`

**Interfaces:**
- `WorkspaceSidebar({ collapsed, onToggleCollapsed, onBackToWelcome }): JSX.Element`
- `WorkspaceScreenProps = { onBackToWelcome: () => void }`

- [ ] **Step 1: Write failing navigation tests**

Add these contracts to `WorkspaceScreen.test.tsx`:

```tsx
it("renders named teacher navigation", () => {
  render(<WorkspaceScreen onBackToWelcome={vi.fn()} />)
  expect(screen.getByRole("navigation", { name: "教师功能导航" })).toBeInTheDocument()
  for (const label of ["工作台", "课堂", "班级洞察", "备课与测验", "学生档案", "任务", "消息", "设置"]) {
    expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
  }
})

it("collapses navigation without losing accessible names", async () => {
  const user = userEvent.setup()
  render(<WorkspaceScreen onBackToWelcome={vi.fn()} />)
  await user.click(screen.getByRole("button", { name: "折叠功能导航" }))
  expect(screen.getByRole("button", { name: "展开功能导航" })).toHaveAttribute("aria-expanded", "false")
  expect(screen.getByRole("button", { name: "班级洞察" })).toBeInTheDocument()
})
```

Keep the existing `返回知野首页` callback test.

- [ ] **Step 2: Verify failure**

```powershell
npm.cmd run test -- --run src/components/WorkspaceScreen.test.tsx
```

Expected: FAIL because named navigation and collapse controls do not exist.

- [ ] **Step 3: Implement WorkspaceSidebar**

Use these exact items and props:

```tsx
import {
  ArrowLeft, BarChart3, BookOpen, CheckSquare2, Home, MessageCircle,
  Mic, PanelLeftClose, PanelLeftOpen, Settings, Users, type LucideIcon,
} from "lucide-react"

type WorkspaceSidebarProps = {
  collapsed: boolean
  onBackToWelcome: () => void
  onToggleCollapsed: () => void
}

type NavItem = { label: string; icon: LucideIcon; badge?: string; active?: boolean }

const teachingItems: NavItem[] = [
  { label: "工作台", icon: Home, badge: "4", active: true },
  { label: "课堂", icon: Mic, badge: "1" },
  { label: "班级洞察", icon: BarChart3 },
  { label: "备课与测验", icon: BookOpen },
]
const classItems: NavItem[] = [
  { label: "学生档案", icon: Users },
  { label: "任务", icon: CheckSquare2, badge: "3" },
  { label: "消息", icon: MessageCircle, badge: "2" },
]
```

Each item is a `<button aria-label={item.label}>`. Render its visible text as `<span className={collapsed ? "sr-only" : "workspace-nav-label"}>{item.label}</span>` so the medium breakpoint may visually hide labels without losing the accessible name. Brand action uses `aria-label="返回知野首页"`. Toggle uses:

```tsx
<button
  aria-expanded={!collapsed}
  aria-label={collapsed ? "展开功能导航" : "折叠功能导航"}
  className="workspace-sidebar-toggle"
  onClick={onToggleCollapsed}
  type="button"
>
  {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
</button>
```

- [ ] **Step 4: Compose the shell**

Replace `WorkspaceScreen.tsx` with:

```tsx
import { useState } from "react"
import WorkspaceSidebar from "./workspace/WorkspaceSidebar"

type WorkspaceScreenProps = { onBackToWelcome: () => void }

export default function WorkspaceScreen({ onBackToWelcome }: WorkspaceScreenProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return (
    <main className="workspace-natural-shell min-h-dvh text-[#172019]" data-testid="teacher-workspace">
      <div className={`workspace-app-grid ${sidebarCollapsed ? "workspace-app-grid-collapsed" : ""}`}>
        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          onBackToWelcome={onBackToWelcome}
          onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        />
        <div className="min-w-0 p-4"><h1>分数的基本性质</h1></div>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Run tests and commit**

```powershell
npm.cmd run test -- --run src/components/WorkspaceScreen.test.tsx
git add src/components/WorkspaceScreen.tsx src/components/WorkspaceScreen.test.tsx src/components/workspace/WorkspaceSidebar.tsx
git commit -m "feat: add named teacher workspace navigation"
```

Expected: navigation tests PASS.

---
### Task 2: 上下文栏与当前课堂任务舞台

**Files:**
- Create: `src/components/workspace/WorkspaceContextBar.tsx`
- Create: `src/components/workspace/CurrentLessonStage.tsx`
- Modify: `src/components/WorkspaceScreen.tsx`
- Test: `src/components/WorkspaceScreen.test.tsx`

**Interfaces:**
- `WorkspaceContextBar(): JSX.Element`
- `CurrentLessonStage(): JSX.Element`

- [ ] **Step 1: Write the failing task-stage test**

```tsx
it("presents classroom recap as the primary task", () => {
  render(<WorkspaceScreen onBackToWelcome={vi.fn()} />)
  expect(screen.getByText("五年级（2）班")).toBeInTheDocument()
  expect(screen.getByRole("searchbox", { name: "搜索课堂、学生或知识点" })).toBeInTheDocument()
  expect(screen.getByText("今日最重要")).toBeInTheDocument()
  expect(screen.getByRole("heading", { name: "完成这一节课堂复盘" })).toBeInTheDocument()
  for (const label of ["课堂录音", "已转写", "复习卡草稿", "学生困难"]) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  expect(screen.getByRole("button", { name: "确认并发布" })).toBeInTheDocument()
})
```

- [ ] **Step 2: Verify failure**

```powershell
npm.cmd run test -- --run src/components/WorkspaceScreen.test.tsx
```

Expected: FAIL on the missing searchbox and primary-task heading.

- [ ] **Step 3: Create WorkspaceContextBar**

```tsx
import { Check, Search } from "lucide-react"

export default function WorkspaceContextBar() {
  return (
    <header className="workspace-context-bar">
      <div className="min-w-0">
        <strong className="block truncate text-sm">五年级（2）班</strong>
        <span className="text-[11px] text-[#718076] sm:pl-2">数学 · 7 月 21 日</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="workspace-search hidden md:flex">
          <Search aria-hidden="true" className="h-4 w-4" />
          <input aria-label="搜索课堂、学生或知识点" placeholder="搜索课堂、学生或知识点" type="search" />
        </label>
        <span className="workspace-sync-status"><Check className="h-3.5 w-3.5" />已同步</span>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Create CurrentLessonStage**

Implement these required sections in order:

```tsx
import { ArrowRight, Sparkles, Waves } from "lucide-react"

const timeline = ["课堂录音", "已转写", "复习卡草稿", "学生困难"]

export default function CurrentLessonStage() {
  return (
    <section aria-labelledby="current-lesson-title" className="workspace-task-stage">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-stage-kicker"><Sparkles className="h-4 w-4" />今日最重要</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl" id="current-lesson-title">完成这一节课堂复盘</h1>
          <h2 className="mt-4 text-xl font-black">分数的基本性质</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776e]">40 分钟课堂录音已经整理好，确认后 32 名学生将看到复习卡。</p>
        </div>
        <span className="workspace-status-chip">待确认</span>
      </div>

      <ol aria-label="课堂回响处理进度" className="workspace-echo-timeline">
        {timeline.map((label, index) => (
          <li className={index === 2 ? "workspace-echo-step workspace-echo-step-active" : "workspace-echo-step"} key={label}>
            <span aria-hidden="true" className="workspace-echo-dot" />{label}
          </li>
        ))}
      </ol>

      <section className="workspace-recap-sheet">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black tracking-[0.12em] text-[#687b6c]">给学生的复习卡</p>
          <span className="workspace-ai-chip">AI 草稿 · 可编辑</span>
        </div>
        <p className="mt-4 text-base font-semibold leading-7 sm:text-lg">分子和分母同时乘或除以相同的数，分数的大小不变。</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["约分", "分数基本性质", "自检问题"].map((tag) => <span className="workspace-topic-tag" key={tag}>{tag}</span>)}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#34583d]/10 pt-5">
          <button className="workspace-tertiary-action" type="button"><Waves className="h-4 w-4" />查看课堂依据</button>
          <button className="workspace-primary-action" type="button">确认并发布 <ArrowRight className="h-4 w-4" /></button>
        </div>
      </section>

      <div className="workspace-feedback-strip">
        <div><span>最近课堂</span><strong>约分与通分</strong><small>昨天 · 已发布给学生</small></div>
        <div><span>备课建议</span><strong>单位换算补讲</strong><small>预计用时 5 分钟</small></div>
        <div><span>班级变化</span><strong>计算步骤求助增加</strong><small>进入知识点回响地图查看 <ArrowRight className="inline h-3 w-3" /></small></div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Compose and verify**

Inside the content column of `WorkspaceScreen.tsx` render:

```tsx
<WorkspaceContextBar />
<div className="mt-3"><CurrentLessonStage /></div>
```

Run:

```powershell
npm.cmd run test -- --run src/components/WorkspaceScreen.test.tsx src/App.test.tsx
```

Expected: focused tests PASS and App still finds the `分数的基本性质` heading.

- [ ] **Step 6: Commit**

```powershell
git add src/components/WorkspaceScreen.tsx src/components/WorkspaceScreen.test.tsx src/components/workspace/WorkspaceContextBar.tsx src/components/workspace/CurrentLessonStage.tsx
git commit -m "feat: build the current lesson task stage"
```

---

### Task 3: 今日行动右栏与移动端导航

**Files:**
- Create: `src/components/workspace/WorkspaceActivityRail.tsx`
- Create: `src/components/workspace/WorkspaceMobileNav.tsx`
- Modify: `src/components/WorkspaceScreen.tsx`
- Test: `src/components/WorkspaceScreen.test.tsx`

**Interfaces:**
- `WorkspaceActivityRail(): JSX.Element`
- `WorkspaceMobileNav(): JSX.Element`

- [ ] **Step 1: Write failing activity tests**

```tsx
it("shows the action queue and aggregated class pulse", () => {
  render(<WorkspaceScreen onBackToWelcome={vi.fn()} />)
  expect(screen.getByRole("complementary", { name: "今日行动与班级脉搏" })).toBeInTheDocument()
  expect(screen.getByText("今日队列")).toBeInTheDocument()
  expect(screen.getByText("批改随堂练习")).toBeInTheDocument()
  expect(screen.getByText("回复家长消息")).toBeInTheDocument()
  expect(screen.getByText("班级脉搏")).toBeInTheDocument()
  expect(screen.getByText("单位换算 × 计算")).toBeInTheDocument()
  expect(screen.getByRole("navigation", { name: "移动端教师导航" })).toBeInTheDocument()
})
```

- [ ] **Step 2: Verify failure**

```powershell
npm.cmd run test -- --run src/components/WorkspaceScreen.test.tsx
```

- [ ] **Step 3: Implement WorkspaceActivityRail**

Use queue entries exactly as follows:

```tsx
const queue = [
  { label: "确认课堂复盘", detail: "现在最值得处理", icon: Sparkles },
  { label: "批改随堂练习", detail: "32 份待查看", icon: CheckSquare2 },
  { label: "回复家长消息", detail: "2 条新消息", icon: MessageCircle },
  { label: "准备明天课堂", detail: "建议已经生成", icon: BookOpen },
]
```

Render an `<aside aria-label="今日行动与班级脉搏" className="workspace-activity-rail">` containing:

- `workspace-side-surface` queue section with one `workspace-queue-item` button per entry.
- `workspace-pulse-surface` section with an eight-cell `workspace-pulse-grid`.
- Cell 6 uses `workspace-pulse-cell-warm`, cell 7 uses `workspace-pulse-cell-active`.
- Visible copy: `12 位学生在“单位换算 × 计算”处停下来。`

- [ ] **Step 4: Implement WorkspaceMobileNav**

```tsx
const items = [
  { label: "工作台", icon: Home, active: true },
  { label: "课堂", icon: Mic },
  { label: "洞察", icon: BarChart3 },
  { label: "学生", icon: Users },
  { label: "消息", icon: MessageCircle },
]
```

Render `<nav aria-label="移动端教师导航" className="workspace-mobile-nav">` and one 52px-minimum button per item.

- [ ] **Step 5: Compose the final layout**

```tsx
<div className="min-w-0 p-3 pb-24 sm:p-5 sm:pb-24 lg:pb-5">
  <WorkspaceContextBar />
  <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
    <CurrentLessonStage />
    <WorkspaceActivityRail />
  </div>
</div>
<WorkspaceMobileNav />
```

- [ ] **Step 6: Verify and commit**

```powershell
npm.cmd run test -- --run src/components/WorkspaceScreen.test.tsx src/App.test.tsx
git add src/components/WorkspaceScreen.tsx src/components/WorkspaceScreen.test.tsx src/components/workspace/WorkspaceActivityRail.tsx src/components/workspace/WorkspaceMobileNav.tsx
git commit -m "feat: add teacher action rail and mobile navigation"
```

Expected: focused tests PASS.

---
### Task 4: A5 精炼自然光视觉系统

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/index.css` only if a shared token is required
- Test: `src/components/WorkspaceScreen.test.tsx`

**Interfaces:**
- Consumes all `workspace-*` classes from Tasks 1–3.
- Produces desktop, collapsed, tablet, and mobile layouts.

- [ ] **Step 1: Add the visual shell contract**

```tsx
expect(screen.getByTestId("teacher-workspace")).toHaveClass("workspace-natural-shell")
```

The `<main>` in `WorkspaceScreen` must have `data-testid="teacher-workspace"`.

- [ ] **Step 2: Remove superseded workspace styles**

Delete old `.workspace-shell`, `.workspace-breath*`, `.workspace-glass`, `.workspace-paper`, `.workspace-flow`, and `.workspace-cell*` rules from `theme.css`. Do not change the living-landscape welcome styles.

- [ ] **Step 3: Add the A5 background and shell**

```css
.workspace-natural-shell {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(90% 76% at 92% -10%, rgba(185,207,219,.48), transparent 61%),
    radial-gradient(76% 62% at -8% 108%, rgba(188,207,174,.36), transparent 64%),
    radial-gradient(35% 28% at 76% 74%, rgba(224,205,157,.16), transparent 72%),
    linear-gradient(145deg, #f7f9f6 0%, #edf3f0 55%, #f3f1e9 100%);
}
.workspace-natural-shell::before {
  content: "";
  position: absolute;
  z-index: -1;
  right: -10rem;
  bottom: -12rem;
  width: 36rem;
  height: 32rem;
  border-radius: 50%;
  background: repeating-radial-gradient(ellipse at 50% 50%, transparent 0 28px, rgba(56,91,65,.045) 29px 30px, transparent 31px 58px);
  transform: rotate(-13deg);
  pointer-events: none;
}
.workspace-natural-shell::after {
  content: "";
  position: absolute;
  z-index: -1;
  inset: auto 0 0;
  height: 9rem;
  background: linear-gradient(180deg, transparent, rgba(213,224,207,.22));
  pointer-events: none;
}
.workspace-app-grid { display: grid; min-height: 100dvh; grid-template-columns: 196px minmax(0,1fr); transition: grid-template-columns 180ms ease; }
.workspace-app-grid-collapsed { grid-template-columns: 76px minmax(0,1fr); }
```

- [ ] **Step 4: Add navigation and surface rules**

Implement these exact material rules:

```css
.workspace-sidebar { position: relative; z-index: 10; display: flex; min-height: 100dvh; flex-direction: column; padding: 18px 12px 14px; border-right: 1px solid rgba(37,69,48,.08); background: rgba(248,250,246,.91); box-shadow: 10px 0 30px rgba(45,73,53,.045); backdrop-filter: blur(22px) saturate(112%); }
.workspace-sidebar-collapsed { align-items: center; padding-inline: 10px; }
.workspace-brand-action, .workspace-nav-item { display: flex; width: 100%; align-items: center; gap: 10px; border-radius: 12px; }
.workspace-brand-action { min-height: 48px; padding: 5px 7px; }
.workspace-brand-mark { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border-radius: 11px; background: #172019; color: white; font-weight: 900; }
.workspace-nav-item { min-height: 44px; padding: 0 10px; color: #56675c; font-size: .875rem; font-weight: 650; transition: background-color 180ms ease, color 180ms ease; }
.workspace-nav-item:hover { background: #e9efe5; color: #315a34; }
.workspace-nav-item-active { background: #dce8d5; color: #294b30; font-weight: 800; }
.workspace-nav-group-label { margin: 9px 0 5px; padding: 0 10px; color: #91a096; font-size: .65rem; font-weight: 800; letter-spacing: .14em; }
.workspace-nav-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.workspace-nav-badge { margin-left: auto; display: grid; min-width: 21px; height: 21px; place-items: center; border-radius: 999px; background: #edf2eb; padding: 0 6px; font-size: .7rem; font-weight: 800; }
.workspace-nav-dot { margin-left: auto; width: 7px; height: 7px; border-radius: 50%; background: #c9a660; }
.workspace-teacher-profile { display: flex; min-height: 48px; align-items: center; gap: 9px; padding: 7px; }
.workspace-teacher-avatar { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; background: #e9d6a8; color: #5f4519; font-weight: 900; }
.workspace-sidebar-toggle { position: absolute; right: -12px; top: 68px; display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid rgba(35,78,50,.1); border-radius: 50%; background: white; color: #526f59; box-shadow: 0 5px 12px rgba(39,74,49,.13); }
.workspace-context-bar, .workspace-side-surface { border: 1px solid rgba(255,255,255,.9); background: rgba(250,251,247,.87); box-shadow: inset 0 1px white, 0 10px 24px rgba(49,75,55,.055); }
.workspace-context-bar { display: flex; min-height: 52px; align-items: center; justify-content: space-between; gap: 12px; border-radius: 15px; padding: 8px 12px; }
.workspace-search { min-height: 36px; align-items: center; gap: 7px; border-radius: 999px; background: rgba(239,244,237,.92); padding: 0 11px; }
.workspace-search input { width: 13rem; background: transparent; outline: none; font-size: .8rem; }
.workspace-sync-status { display: inline-flex; min-height: 34px; align-items: center; gap: 5px; border-radius: 999px; background: #e4ecdf; padding: 0 10px; color: #48644c; font-size: .75rem; font-weight: 800; }
```

- [ ] **Step 5: Add task, timeline, rail, and mobile rules**

```css
.workspace-task-stage { position: relative; overflow: hidden; min-height: calc(100dvh - 95px); border: 1px solid rgba(255,255,255,.92); border-radius: 21px; background: rgba(250,251,247,.9); padding: 24px; box-shadow: inset 0 1px white, 0 14px 32px rgba(49,76,56,.065); }
.workspace-task-stage::before { content: ""; position: absolute; right: -30px; top: -45px; width: 210px; height: 210px; border-radius: 50%; background: radial-gradient(circle, rgba(186,207,194,.24), transparent 66%); box-shadow: 0 0 0 26px rgba(73,105,79,.018), 0 0 0 52px rgba(73,105,79,.013); }
.workspace-task-stage::after { content: ""; position: absolute; left: 0; top: 28px; bottom: 28px; width: 3px; border-radius: 999px; background: linear-gradient(180deg, transparent, #90aa85 25%, #cfad69 68%, transparent); opacity: .5; }
.workspace-stage-kicker { display: inline-flex; align-items: center; gap: 7px; color: #577455; font-size: .75rem; font-weight: 900; letter-spacing: .13em; }
.workspace-status-chip, .workspace-ai-chip { display: inline-flex; align-items: center; border-radius: 999px; font-size: .75rem; font-weight: 800; }
.workspace-status-chip { min-height: 32px; background: #eee3c9; padding: 0 11px; color: #6e5527; }
.workspace-ai-chip { background: #e6ede1; padding: 6px 9px; color: #4b654d; }
.workspace-echo-timeline { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); margin: 28px 0 18px; }
.workspace-echo-timeline::before { content: ""; position: absolute; left: 10%; right: 10%; top: 7px; height: 2px; background: linear-gradient(90deg,#c9a660,#8da17e,#526f59); }
.workspace-echo-step { position: relative; display: grid; justify-items: center; gap: 8px; color: #6b7b70; font-size: .75rem; text-align: center; }
.workspace-echo-dot { position: relative; z-index: 1; width: 14px; height: 14px; border-radius: 50%; background: #91a684; box-shadow: 0 0 0 5px rgba(119,144,119,.1); }
.workspace-echo-step:first-child .workspace-echo-dot { background: #c9a660; }
.workspace-echo-step-active .workspace-echo-dot { background: #526f59; box-shadow: 0 0 0 6px rgba(82,111,89,.11); }
.workspace-recap-sheet { position: relative; z-index: 1; border: 1px solid rgba(255,255,255,.95); border-radius: 16px; background: #fffefa; padding: 20px; box-shadow: 0 10px 22px rgba(47,72,53,.055); }
.workspace-topic-tag { border-radius: 8px; background: #f0f3ed; padding: 7px 10px; font-size: .8rem; }
.workspace-tertiary-action, .workspace-primary-action { display: inline-flex; min-height: 44px; align-items: center; gap: 7px; border-radius: 999px; font-size: .875rem; font-weight: 800; }
.workspace-tertiary-action { padding: 0 12px; color: #49684d; }
.workspace-primary-action { min-height: 46px; background: #172019; padding: 0 18px; color: white; font-weight: 900; box-shadow: 0 8px 17px rgba(18,30,21,.15); }
.workspace-primary-action:active { transform: scale(.98); }
.workspace-feedback-strip { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); margin-top: 22px; border-top: 1px solid rgba(42,71,49,.08); }
.workspace-feedback-strip > div { display: grid; gap: 4px; padding: 16px 12px 0; }
.workspace-feedback-strip > div + div { border-left: 1px solid rgba(42,71,49,.065); }
.workspace-feedback-strip span { color: #748477; font-size: .75rem; }
.workspace-feedback-strip strong { font-size: .875rem; }
.workspace-feedback-strip small { color: #78877d; font-size: .75rem; line-height: 1.4; }
.workspace-activity-rail { display: flex; gap: 12px; }
.workspace-side-surface { border-radius: 18px; padding: 16px; }
.workspace-queue-item { display: grid; width: 100%; min-height: 62px; grid-template-columns: 34px minmax(0,1fr); align-items: center; gap: 10px; }
.workspace-queue-icon { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 9px; background: #e5ece0; color: #526f59; }
.workspace-pulse-surface { background: linear-gradient(145deg,rgba(239,244,234,.92),rgba(247,243,231,.88)); }
.workspace-pulse-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin: 14px 0; }
.workspace-pulse-cell { height: 30px; border-radius: 7px; background: rgba(81,112,79,.11); }
.workspace-pulse-cell-warm { background: #d2b16f; }
.workspace-pulse-cell-active { background: #6f9271; }
.workspace-mobile-nav { position: fixed; z-index: 30; left: 12px; right: 12px; bottom: 10px; display: none; min-height: 64px; align-items: center; justify-content: space-around; border: 1px solid rgba(255,255,255,.9); border-radius: 20px; background: rgba(250,251,248,.94); box-shadow: 0 14px 34px rgba(35,66,45,.16); }
.workspace-mobile-nav-item { display: grid; min-width: 52px; min-height: 52px; place-items: center; gap: 3px; color: #718076; font-size: .65rem; }
.workspace-mobile-nav-item-active { color: #294b30; font-weight: 900; }
```

- [ ] **Step 6: Add responsive and reduced-motion rules**

```css
@media (min-width: 1280px) { .workspace-activity-rail { flex-direction: column; } }
@media (max-width: 1199px) { .workspace-app-grid { grid-template-columns: 76px minmax(0,1fr); } .workspace-sidebar { align-items: center; padding-inline: 10px; } .workspace-nav-label, .workspace-nav-group-label, .workspace-brand-action > span:not(.workspace-brand-mark), .workspace-teacher-profile > span:not(.workspace-teacher-avatar) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; } }
@media (max-width: 767px) { .workspace-app-grid, .workspace-app-grid-collapsed { display: block; } .workspace-activity-rail { flex-direction: column; } .workspace-sidebar { display: none; } .workspace-mobile-nav { display: flex; } .workspace-task-stage { min-height: auto; padding: 18px; } .workspace-feedback-strip { grid-template-columns: 1fr; } .workspace-feedback-strip > div + div { border-left: 0; } .workspace-echo-timeline { overflow-x: auto; grid-template-columns: repeat(4,110px); } }
@media (prefers-reduced-motion: reduce) { .workspace-app-grid, .workspace-nav-item, .workspace-primary-action { transition: none; } }
```

- [ ] **Step 7: Run automated and responsive verification**

```powershell
npm.cmd run test -- --run
npm.cmd run build
```

Inspect `1440 × 1024`, `1024 × 768`, and `375 × 812`. Expected: no horizontal page overflow, no literal scenic illustration, named sidebar at desktop, icon sidebar at tablet, bottom navigation at mobile.

- [ ] **Step 8: Commit**

```powershell
git add src/styles/theme.css src/index.css src/components/WorkspaceScreen.tsx src/components/WorkspaceScreen.test.tsx src/components/workspace
git commit -m "feat: apply the refined natural teacher workspace"
```

---

### Task 5: Final regression and spec audit

**Files:**
- Verify: `docs/superpowers/specs/2026-07-24-zhiye-teacher-workspace-visual-refresh-design.md`
- Verify: all files changed in Tasks 1–4

- [ ] **Step 1: Audit acceptance criteria**

```text
[ ] Every desktop function has an icon and Chinese name.
[ ] The brand action returns to the welcome screen.
[ ] The classroom recap is stronger than the queue and pulse.
[ ] The background uses only diffused light, contours and an echo halo.
[ ] No kite, mountain, river or cloud illustration exists in the workspace.
[ ] Tablet and mobile layouts do not overflow.
[ ] Reduced motion removes non-essential transitions.
```

- [ ] **Step 2: Run fresh final verification**

```powershell
npm.cmd run test -- --run
npm.cmd run build
git status --short
```

Expected: all tests pass and build exits 0. Git status may contain pre-existing user changes but no accidental verification files.

- [ ] **Step 3: Review scope**

```powershell
git diff HEAD~4 -- src/components src/styles src/index.css
```

Expected: only teacher workspace files changed; `WelcomeScreen.tsx`, `LivingLandscapeBackdrop.tsx`, and the welcome image remain untouched.


