# 知野沉浸式欢迎页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive animated 知野 welcome page that transitions into the classroom workspace.

**Architecture:** `App` owns one explicit `screen` state (`welcome` or `workspace`). `WelcomeScreen` renders the brand narrative and uses `VideoBackdrop` for a progressive native-video environment with a static fallback. `WorkspaceScreen` contains the existing classroom-review experience and returns users to the welcome page through an accessible action.

**Tech Stack:** Vite 8, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Lucide React.

## Global Constraints

- Preserve React 19 and Tailwind CSS 4; do not adopt the attachment's React 18 or Tailwind 3 dependency set.
- Use the supplied CloudFront video only as a muted native looping background; the page remains usable without it.
- Support `prefers-reduced-motion`, keyboard navigation, and 375px/1024px/1440px layouts.
- Do not add LinkFlow copy, a debug state picker, or canvas frame caching.

---

### Task 1: Add a runnable UI test harness

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts` test configuration extension
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: `App` default export.
- Produces: `npm.cmd run test` command that runs jsdom component tests.

- [ ] **Step 1: Write the failing screen-transition test**

```tsx
it('opens the classroom workspace from the welcome CTA', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: '进入今天的课堂' }));
  expect(screen.getByRole('heading', { name: '分数的基本性质' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test before implementation**

Run: `npm.cmd run test -- --run src/App.test.tsx`
Expected: FAIL because the welcome CTA and screen transition do not exist.

- [ ] **Step 3: Add Vitest, Testing Library and jsdom configuration**

Add `test` script `vitest`; set `test.environment` to `jsdom` and `test.setupFiles` to `src/test/setup.ts`; import `@testing-library/jest-dom/vitest` from setup.

- [ ] **Step 4: Re-run the test**

Run: `npm.cmd run test -- --run src/App.test.tsx`
Expected: still FAIL at the missing welcome CTA, confirming the harness is running.

### Task 2: Build the progressive video environment and welcome experience

**Files:**
- Create: `src/components/VideoBackdrop.tsx`
- Create: `src/components/WelcomeScreen.tsx`
- Create: `src/components/WelcomeScreen.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- `VideoBackdrop({ src: string }): JSX.Element` renders a decorative, muted, looping video and static fallback.
- `WelcomeScreen({ onEnter: () => void }): JSX.Element` exposes an accessible `进入今天的课堂` button.

- [ ] **Step 1: Write the failing welcome behavior tests**

```tsx
it('calls onEnter from the primary classroom CTA', async () => {
  const onEnter = vi.fn();
  const user = userEvent.setup();
  render(<WelcomeScreen onEnter={onEnter} />);
  await user.click(screen.getByRole('button', { name: '进入今天的课堂' }));
  expect(onEnter).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the test before implementation**

Run: `npm.cmd run test -- --run src/components/WelcomeScreen.test.tsx`
Expected: FAIL because `WelcomeScreen` does not exist.

- [ ] **Step 3: Implement `VideoBackdrop` and `WelcomeScreen`**

Use a native `video` with `autoPlay`, `loop`, `muted`, `playsInline`, `aria-hidden`, an `onError` fallback state, and a CSS gradient that always remains visible. Use one animated knowledge-ribbon layer and no continuously animated UI cards.

- [ ] **Step 4: Add global motion and responsive tokens**

Define color, typography and motion variables in `index.css`; add an explicit reduced-motion media query that stops ambient animation and leaves visible content intact.

- [ ] **Step 5: Run the welcome tests**

Run: `npm.cmd run test -- --run src/components/WelcomeScreen.test.tsx`
Expected: PASS.

### Task 3: Replace the mock screen with a real two-screen shell

**Files:**
- Create: `src/components/WorkspaceScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- `WorkspaceScreen({ onBackToWelcome: () => void }): JSX.Element` exposes an accessible `返回知野首页` action.
- `App` switches from `WelcomeScreen` to `WorkspaceScreen` without route dependencies.

- [ ] **Step 1: Extend the failing app test**

```tsx
await user.click(screen.getByRole('button', { name: '返回知野首页' }));
expect(screen.getByRole('heading', { name: /让一节课/ })).toBeInTheDocument();
```

- [ ] **Step 2: Run the test before implementation**

Run: `npm.cmd run test -- --run src/App.test.tsx`
Expected: FAIL because the workspace has no return action.

- [ ] **Step 3: Implement the screen shell and workspace**

Move the useful classroom recap content into `WorkspaceScreen`. Include semantic navigation, editable-looking review material, an evidence panel and one primary publish action. Remove the debug view-state picker and fixed-width overflow traps.

- [ ] **Step 4: Run all UI tests**

Run: `npm.cmd run test -- --run`
Expected: PASS.

### Task 4: Verify production behavior

**Files:**
- Modify: `index.html` only if font loading needs a safe fallback.

- [ ] **Step 1: Build production bundle**

Run: `npm.cmd run build`
Expected: Vite build succeeds without TypeScript errors.

- [ ] **Step 2: Inspect the welcome and workspace at desktop and mobile breakpoints**

Run: browser screenshot checks at 1440px and 375px.
Expected: primary CTA is visible, no horizontal clipping, and reduced-motion content remains understandable.

- [ ] **Step 3: Record completion**

Mark all tasks complete in this plan. No commit is possible because the workspace is not a Git repository.
