# Teacher Workspace Recap Stage Reflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Stretch and center the recap card while anchoring the supporting lesson information to the bottom of the central stage.

**Architecture:** Convert the lesson stage into a responsive vertical flex layout. Add a dedicated centered recap-content region and keep the action bar separate. Use the final feedback dock with auto top margin to consume no extra visual space and remain in normal flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Preserve Apple-style glass materials and rounded corners.
- Do not use absolute positioning for the bottom feedback dock.
- Desktop fills available height; mobile remains natural height.
- Do not add dependencies.

---

### Task 1: Add the central-stage layout contract

**Files:**
- Modify: `src/components/WorkspaceScreen.test.tsx`
- Modify: `src/components/workspace/CurrentLessonStage.tsx`
- Modify: `src/styles/theme.css`

- [ ] Add a failing test for stage flex behavior, stretchable recap card, centered content, and bottom feedback dock.
- [ ] Run `pnpm test --run src/components/WorkspaceScreen.test.tsx` and confirm RED.
- [ ] Add semantic layout hooks and restructure recap content/actions.
- [ ] Add desktop stretch and mobile natural-height CSS.
- [ ] Re-run the focused test and confirm GREEN.
- [ ] Run all tests and production build.
- [ ] Inspect desktop and mobile geometry in the running preview.
