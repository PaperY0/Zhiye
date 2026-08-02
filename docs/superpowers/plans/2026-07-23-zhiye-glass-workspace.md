# 知野玻璃课堂编辑台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将教师工作台与欢迎页统一为山野色调、品牌中文显示字体和克制玻璃材质。

**Architecture:** 保持 `WorkspaceScreen` 的课堂复习卡与班级脉搏信息闭环，只替换视觉层级。全局字体变量为欢迎页和工作台提供同一套品牌显示字；背景呼吸只作用于装饰层并支持 reduced motion。

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- 使用天空白、草坡绿、日光黄；绿色需搭配文字或图标表达状态。
- 玻璃卡片使用半透明、背后模糊、细边高光和有限阴影；正文保持可读。
- 保留返回首页和确认发布操作；不新增外部运行时依赖。

---

### Task 1: 统一品牌文字与课堂编辑台

**Files:**
- Modify: `src/styles/fonts.css`, `src/index.css`, `src/styles/theme.css`
- Modify: `src/components/WelcomeScreen.tsx`, `src/components/WorkspaceScreen.tsx`
- Test: `src/components/WelcomeScreen.test.tsx`, `src/components/WorkspaceScreen.test.tsx`

**Interfaces:**
- Consumes: `WelcomeScreen({ onEnter })` and `WorkspaceScreen({ onBackToWelcome })`
- Produces: 仍可进入/返回的双语欢迎页与课堂编辑台。

- [ ] **Step 1: Write failing UI contract tests**

```tsx
expect(screen.getByText("课堂回响 · Classroom Echo")).toBeInTheDocument()
expect(screen.getByText("学习信号")).toBeInTheDocument()
expect(screen.getByRole("heading", { name: "让每一间课堂，长出自己的 回响。" })).toHaveClass("font-brand")
```

- [ ] **Step 2: Verify tests fail**

Run: `npm.cmd run test -- --run src/components/WelcomeScreen.test.tsx src/components/WorkspaceScreen.test.tsx`

Expected: FAIL because the old pages do not expose the new editorial label, signal label, or brand display font class.

- [ ] **Step 3: Implement typography, glass surfaces, and restrained breathing background**

Use `Noto Sans SC` as `font-brand`; rebuild workbench surfaces with semantic glass classes and a low-frequency background light animation.

- [ ] **Step 4: Verify tests and build**

Run: `npm.cmd run test -- --run; npm.cmd run build`

Expected: all tests pass and Vite produces a build.
