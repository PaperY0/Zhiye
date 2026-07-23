# 知野双语欢迎页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将电影感欢迎页重塑为保留知野品牌与课堂语境的中英双语入口。

**Architecture:** 保持 `WelcomeScreen` 负责导航、品牌叙事与进入动作，`VideoBackdrop` 保持现有循环与渐变实现。仅替换欢迎页可见文案、导航锚点与可访问名称；`App` 的工作台切换接口不变。

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- 保留现有视频 URL、手动淡入淡出循环与白色渐变遮罩。
- 品牌统一为“知野 Zhì Yě”，不再出现 Aethera。
- 中央 CTA 的可访问名称为“进入知野 · Enter Zhiye”，并继续调用 `onEnter`。

---

### Task 1: 验证双语品牌入口

**Files:**
- Modify: `src/components/WelcomeScreen.test.tsx`
- Modify: `src/components/WelcomeScreen.tsx`

**Interfaces:**
- Consumes: `WelcomeScreen({ onEnter: () => void })`
- Produces: 可被屏幕阅读器识别的“知野 Zhì Yě”品牌链接和“进入知野 · Enter Zhiye”按钮。

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole("link", { name: "知野 Zhì Yě" })).toBeInTheDocument()
await user.click(screen.getByRole("button", { name: "进入知野 · Enter Zhiye" }))
expect(onEnter).toHaveBeenCalledOnce()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd run test -- --run src/components/WelcomeScreen.test.tsx`

Expected: FAIL because the current UI only exposes Aethera and Begin Journey.

- [ ] **Step 3: Write minimal implementation**

Replace the English-first logo, navigation labels, headline, supporting copy, and CTA labels in `WelcomeScreen.tsx`; retain `onEnter` as the CTA action.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm.cmd run test -- --run src/components/WelcomeScreen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run: `npm.cmd run test -- --run; npm.cmd run build`

Expected: all tests pass and Vite production build succeeds.
