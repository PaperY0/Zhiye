# 角色主题与拼音辅助 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为学生端、家长端、老师端和管理端建立按角色切换的背景主题，并让学生端与家长端的固定界面文案在中文下方显示拼音，同时为学生端加入不阻塞任务的学习陪伴 IP。

**Architecture:** 在 `RoleShell` 中统一注入角色主题类、背景图片和拼音开关；`PinyinText` 只负责双层文本排版，固定文案拼音集中在 `pinyin.ts`；页面通过显式使用组件覆盖主要固定文案，不自动处理数学题、姓名和 AI 动态内容。学生陪伴组件独立于业务数据，仅渲染静态提示和已有视觉素材。

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Vitest, Testing Library, lucide-react。

## Global Constraints

- 学生端使用用户提供的图一背景；家长端使用图三背景；老师端和管理端使用图二背景。
- 学生端和家长端中文下方固定显示拼音；老师端和管理端不显示拼音。
- 固定文案缺少拼音时只显示中文，不猜测或自动生成错误拼音。
- 数学题、学生姓名、AI 生成内容和其他动态业务内容不做未经确认的自动拼音拆分。
- 学生陪伴 IP 不新增网络请求，不遮挡主要业务操作，不改变 OCR、ASR、DeepSeek 和数据模型。
- 保留现有中文文本内容和路由结构，避免破坏已有测试选择器。
- 背景资源必须通过项目静态资源 import 使用，不依赖临时目录路径。

---

### Task 1: 导入背景资源并建立角色主题配置

**Files:**
- Create: `src/assets/role-backgrounds/student.png`
- Create: `src/assets/role-backgrounds/staff.png`
- Create: `src/assets/role-backgrounds/parent.png`
- Create: `src/components/shell/roleTheme.ts`
- Modify: `src/components/shell/RoleShell.tsx`
- Test: `src/components/shell/RoleShell.test.tsx`

**Interfaces:**
- `roleTheme.ts` exports `ROLE_THEME: Record<Role, { backgroundImage: string; showPinyin: boolean; className: string }>`.
- `RoleShell` reads `ROLE_THEME[route.role]` and exposes `data-role` and `data-show-pinyin` on its root element.

- [ ] **Step 1: Copy the supplied images into static project assets**

Run from the repository root:

```powershell
New-Item -ItemType Directory -Force src/assets/role-backgrounds
Copy-Item -LiteralPath 'C:/Users/wsy19/AppData/Local/Temp/codex-clipboard-ec5cbbc7-60f0-4646-8900-9bcac37a6dc1.png' -Destination 'src/assets/role-backgrounds/student.png'
Copy-Item -LiteralPath 'C:/Users/wsy19/AppData/Local/Temp/codex-clipboard-0f2ddd9b-25c8-4878-b3c5-85b2e4869265.png' -Destination 'src/assets/role-backgrounds/staff.png'
Copy-Item -LiteralPath 'C:/Users/wsy19/AppData/Local/Temp/codex-clipboard-6a9387bd-f715-4c99-a49d-163e64d3be69.png' -Destination 'src/assets/role-backgrounds/parent.png'
```

Expected: all three PNG files exist under `src/assets/role-backgrounds/`.

- [ ] **Step 2: Add the failing theme mapping test**

Add a test in `RoleShell.test.tsx` that renders each role and asserts:

```tsx
expect(screen.getByTestId("role-shell")).toHaveAttribute("data-role", "student")
expect(screen.getByTestId("role-shell")).toHaveAttribute("data-show-pinyin", "true")
```

Repeat for parent (`true`), teacher (`false`), and admin (`false`). Run:

```powershell
npm.cmd test -- --run src/components/shell/RoleShell.test.tsx
```

Expected: FAIL because the attributes and theme mapping do not exist yet.

- [ ] **Step 3: Implement the role theme mapping and shell background**

Create `roleTheme.ts` with static imports and update `RoleShell.tsx` so the root includes:

```tsx
const theme = ROLE_THEME[route.role]

<div
  data-testid="role-shell"
  data-role={route.role}
  data-show-pinyin={theme.showPinyin}
  className={`role-shell role-shell-${route.role} min-h-dvh ...`}
  style={{ "--role-background-image": `url(${theme.backgroundImage})` } as React.CSSProperties}
>
```

Add a low-contrast background layer using the CSS variable and keep the existing gradient as fallback. Apply `aria-hidden="true"` to the decorative layer.

- [ ] **Step 4: Run the focused test and build**

```powershell
npm.cmd test -- --run src/components/shell/RoleShell.test.tsx
npm.cmd run build
```

Expected: focused tests pass and Vite completes without asset import errors.

- [ ] **Step 5: Commit the independently testable theme change**

```powershell
git add src/assets/role-backgrounds src/components/shell/roleTheme.ts src/components/shell/RoleShell.tsx src/components/shell/RoleShell.test.tsx
git commit -m "feat: add role-based visual themes"
```

### Task 2: 建立拼音组件和固定文案映射

**Files:**
- Create: `src/components/pinyin/pinyin.ts`
- Create: `src/components/pinyin/PinyinText.tsx`
- Create: `src/components/pinyin/PinyinText.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- `getPinyin(text: string): string | undefined` returns only entries explicitly present in the map.
- `PinyinTextProps = { text: string; pinyin?: string; showPinyin?: boolean; className?: string; pinyinClassName?: string }`.
- `PinyinText` renders the original Chinese text as the primary visible text and an optional pinyin line with `lang="zh-Latn"`.

- [ ] **Step 1: Write failing component tests**

Create tests covering known, unknown, and disabled cases:

```tsx
render(<PinyinText text="首页" showPinyin />)
expect(screen.getByText("首页")).toBeInTheDocument()
expect(screen.getByText("shǒu yè")).toHaveAttribute("lang", "zh-Latn")

render(<PinyinText text="未收录动态题目" showPinyin />)
expect(screen.queryByText(/未收录动态题目/)).toBeInTheDocument()
expect(screen.queryByTestId("pinyin-line")).not.toBeInTheDocument()
```

Also assert `showPinyin={false}` renders Chinese without a pinyin line.

- [ ] **Step 2: Run the tests to confirm failure**

```powershell
npm.cmd test -- --run src/components/pinyin/PinyinText.test.tsx
```

Expected: FAIL because the component and map are not defined.

- [ ] **Step 3: Implement the explicit map and component**

Seed `pinyin.ts` with the fixed interface labels currently used by the shell and student/parent flows, including `首页`, `拍照答疑`, `知识点学习`, `错题本`, `任务`, `消息`, `历史记录`, `学习摘要`, `联系老师`, `管理概览`, `工作台`, `课堂`, `返回上一页`, `下一步`, `继续学习`, `需要提示吗`, `今日复习卡`, and `联系李老师`.

Use this rendering shape:

```tsx
export function PinyinText({ text, pinyin, showPinyin = true, className, pinyinClassName }: PinyinTextProps) {
  const resolvedPinyin = pinyin ?? getPinyin(text)
  return (
    <span className={cn("inline-flex min-w-0 flex-col", className)}>
      <span>{text}</span>
      {showPinyin && resolvedPinyin ? (
        <span data-testid="pinyin-line" lang="zh-Latn" className={cn("text-[0.68em] font-medium leading-tight tracking-normal text-[#789084]", pinyinClassName)}>
          {resolvedPinyin}
        </span>
      ) : null}
    </span>
  )
}
```

Use the repository's existing `cn` helper if present; otherwise use a small local class join without adding a dependency.

- [ ] **Step 4: Add shared pinyin styling and run tests**

Keep line height and wrapping safe for compact navigation. Run:

```powershell
npm.cmd test -- --run src/components/pinyin/PinyinText.test.tsx
```

Expected: all component tests pass.

- [ ] **Step 5: Commit the pinyin primitive**

```powershell
git add src/components/pinyin src/index.css
git commit -m "feat: add explicit pinyin text component"
```

### Task 3: 接入角色壳层、导航和顶部公共文案

**Files:**
- Modify: `src/components/shell/RoleShell.tsx`
- Modify: `src/components/shell/RoleSidebar.tsx`
- Modify: `src/components/shell/RoleMobileNav.tsx`
- Modify: `src/components/shell/RoleSwitcher.tsx`
- Modify: `src/components/shell/RoleShell.test.tsx`

**Interfaces:**
- The shell passes `showPinyin={ROLE_THEME[route.role].showPinyin}` to shared text renderers.
- Existing `aria-label`, route labels, and visible Chinese strings remain unchanged for test compatibility.

- [ ] **Step 1: Add failing role-specific navigation assertions**

Extend shell tests so student and parent navigation contain a `pinyin-line`, while teacher and admin navigation do not. Assert the visible labels and routes remain unchanged.

- [ ] **Step 2: Run focused tests and verify failure**

```powershell
npm.cmd test -- --run src/components/shell/RoleShell.test.tsx
```

Expected: new pinyin assertions fail.

- [ ] **Step 3: Replace shared visible labels with `PinyinText`**

Use `ROLE_THEME[route.role].showPinyin` in `RoleSidebar`, `RoleMobileNav`, and `RoleShell` for product label, role label, page title, and `返回上一页`. Pass `item.label` as `text`; the component resolves only fixed map entries. Keep `aria-label` as the original Chinese label so existing accessibility tests do not change.

- [ ] **Step 4: Run shell tests and build**

```powershell
npm.cmd test -- --run src/components/shell/RoleShell.test.tsx src/app/AppRouter.test.tsx
npm.cmd run build
```

Expected: all selected tests pass and build succeeds.

- [ ] **Step 5: Commit shell integration**

```powershell
git add src/components/shell
git commit -m "feat: show pinyin in student and parent navigation"
```

### Task 4: 增加学生端学习陪伴 IP

**Files:**
- Create: `src/features/student/companion/StudentCompanionCard.tsx`
- Create: `src/features/student/companion/StudentCompanionCard.test.tsx`
- Modify: `src/features/student/home/StudentHomePage.tsx`
- Modify: `src/components/shell/RoleShell.tsx`

**Interfaces:**
- `StudentCompanionCardProps = { onNavigate?: () => void }`.
- The component renders the existing `zhiye-kite-valley.png` asset, a short fixed encouragement, and optional navigation callback; it does not use `PrototypeContext` or issue network requests.

- [ ] **Step 1: Write failing component tests**

Assert the card has an accessible region, the companion copy, pinyin lines, and a button that invokes `onNavigate` when supplied.

- [ ] **Step 2: Run the focused test and confirm failure**

```powershell
npm.cmd test -- --run src/features/student/companion/StudentCompanionCard.test.tsx
```

Expected: FAIL because the card does not exist.

- [ ] **Step 3: Implement the static companion card**

Render the existing asset with a bounded size and `object-contain`; place the card beside or below the student's main task content so it is not fixed over controls. Use `PinyinText` for `小野陪你学习`, `继续学习`, and `需要提示吗`. On small screens stack it after the primary review card.

- [ ] **Step 4: Integrate only on student routes and test**

Render it in `StudentHomePage` after the primary review card. If a global shell placement is used instead, guard it with `route.role === "student"`. Run:

```powershell
npm.cmd test -- --run src/features/student/companion/StudentCompanionCard.test.tsx src/features/student/home/StudentHomePage.test.tsx
```

Expected: tests pass and no teacher, parent, or admin page includes the companion card.

- [ ] **Step 5: Commit the companion IP**

```powershell
git add src/features/student/companion src/features/student/home/StudentHomePage.tsx src/components/shell/RoleShell.tsx
git commit -m "feat: add student learning companion card"
```

### Task 5: 接入学生端和家长端主要页面固定文案

**Files:**
- Modify: `src/features/student/home/StudentHomePage.tsx`
- Modify: `src/features/student/tutoring/TutoringPage.tsx`
- Modify: `src/features/student/learning/LearningPage.tsx`
- Modify: `src/features/student/mistakes/MistakesPage.tsx`
- Modify: `src/features/student/tasks/StudentTasksPage.tsx`
- Modify: `src/features/student/messages/StudentMessagesPage.tsx`
- Modify: `src/features/student/review/StudentReviewPage.tsx`
- Modify: `src/features/parent/home/ParentHomePage.tsx`
- Modify: `src/features/parent/messages/ParentMessagesPage.tsx`
- Modify: `src/features/shared/HistoryPage.tsx`
- Modify: corresponding existing `*.test.tsx` files only where assertions need role-specific pinyin coverage

**Interfaces:**
- Every modified page uses `PinyinText` for fixed headings, buttons, empty states, step labels, and action hints.
- Dynamic student names, lesson titles, topic names, AI text, and mathematical content remain plain text unless an explicit pinyin string is already known.

- [ ] **Step 1: Add page-level failing assertions for representative screens**

For student home, tutoring, and parent home tests, assert fixed labels expose `pinyin-line`. For dynamic lesson title and student name, assert original text remains rendered unchanged without requiring generated pinyin.

- [ ] **Step 2: Run representative tests and confirm failure**

```powershell
npm.cmd test -- --run src/features/student/home/StudentHomePage.test.tsx src/features/student/tutoring/TutoringPage.test.tsx src/features/parent/home/ParentHomePage.test.tsx
```

Expected: new pinyin assertions fail.

- [ ] **Step 3: Convert fixed copy page by page**

Wrap only fixed interface copy with `PinyinText` and pass the role-level `showPinyin` value from a small hook or context established in `RoleShell`. Preserve all existing button names and accessible labels. Add explicit map entries for any fixed string that is visible in these pages, such as `打开复习卡`, `查看全部任务`, `打开错题本`, `联系老师完成绑定`, `确认题目`, `重新选择题目图片`, `本周学习主题`, `联系李老师`, and `播放语音家书`.

- [ ] **Step 4: Run the full frontend test suite**

```powershell
npm.cmd test -- --run
```

Expected: all existing tests and new pinyin tests pass.

- [ ] **Step 5: Commit page-level pinyin coverage**

```powershell
git add src/features/student src/features/parent src/features/shared src/components/pinyin
git commit -m "feat: add pinyin guidance to student and parent pages"
```

### Task 6: 全量构建、浏览器视觉验收和回归修复

**Files:**
- Modify: `src/index.css` or affected role/page files only when verification identifies a concrete visual issue.
- Test: existing frontend test suite and browser routes.

**Interfaces:**
- No new public interfaces. This task validates the completed role theme and pinyin behavior at runtime.

- [ ] **Step 1: Run formatting, tests, and production build**

```powershell
npm.cmd run format
npm.cmd test -- --run
npm.cmd run build
```

Expected: formatter completes, all tests pass, and Vite build completes.

- [ ] **Step 2: Verify four role routes in the running app**

Open these hashes in the local app:

```text
#/student/home
#/parent/home
#/teacher/workspace
#/admin/home
```

Verify student uses `student.png`, parent uses `parent.png`, teacher/admin use `staff.png`; verify fixed Chinese labels have pinyin only for student and parent, and student home shows the companion card.

- [ ] **Step 3: Check responsive behavior**

At desktop and narrow viewport widths, confirm the pinyin line wraps below its Chinese label, mobile navigation remains tappable, cards retain contrast, and the companion card does not cover the review/task buttons.

- [ ] **Step 4: Fix only concrete regressions and rerun targeted checks**

For each fix, run the nearest page test plus `npm.cmd run build`; do not mask missing pinyin by adding guessed entries to the map.

- [ ] **Step 5: Record acceptance evidence**

Capture the four role screens and report the verified route, background mapping, pinyin visibility, companion card visibility, test result, and build result.
