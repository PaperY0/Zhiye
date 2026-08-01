# Teacher Workspace Activity Rail Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend and center the two right-side workspace cards so their desktop bottom edge aligns with the sidebar teacher profile area.

**Architecture:** Add explicit layout hooks to the existing workspace row and activity cards. Use responsive CSS to fill the remaining desktop viewport, divide the rail into equal rows, and center card content without changing mobile natural-height behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, project theme CSS, Vitest, Testing Library.

## Global Constraints

- Preserve the existing component hierarchy and visual language.
- Do not add dependencies.
- Desktop cards fill and split available height; mobile cards remain natural height.
- Center all visible content in the two right cards.

---

### Task 1: Lock the activity-rail layout contract

**Files:**
- Modify: `src/components/WorkspaceScreen.test.tsx`
- Modify: `src/components/WorkspaceScreen.tsx`
- Modify: `src/components/workspace/WorkspaceActivityRail.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:**
- Consumes: existing `WorkspaceScreen` and `WorkspaceActivityRail` rendered DOM.
- Produces: `workspace-content-row-fill` on the content row and `workspace-side-surface-centered` on both activity cards.

- [ ] **Step 1: Write the failing test**

Add assertions that the content row includes `workspace-content-row-fill` and both right-side cards expose `workspace-side-surface-centered`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run src/components/WorkspaceScreen.test.tsx`
Expected: FAIL because the new layout classes do not yet exist.

- [ ] **Step 3: Write minimal implementation**

Add the layout classes in JSX. In `theme.css`, give the desktop content row a viewport-relative minimum height, make the desktop rail a two-row grid, stretch both cards, center their content, and reset forced heights at smaller breakpoints.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run src/components/WorkspaceScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify all tests and production build**

Run: `pnpm test --run`
Expected: all tests pass.

Run: `pnpm build`
Expected: exit code 0.

- [ ] **Step 6: Inspect the desktop preview**

Open the running workspace view at a desktop viewport and confirm the two right cards reach the bottom content line, share the height, and have centered content.
