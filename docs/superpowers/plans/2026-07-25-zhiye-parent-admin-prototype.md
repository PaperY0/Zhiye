# Zhiye Parent and Administration Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete parent learning-companion/contact flows and administrator school, protection-case, audit, and settings flows.

**Architecture:** Parent pages use a simplified low-pressure shell and strictly limited summary data. Administrator pages use denser operational layouts, confirmations, and audit-producing local state updates.

**Tech Stack:** React 19, TypeScript, shared hash router/state foundation, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Complete foundation, teacher, and student plans first.
- Parent pages never expose full conversations, private problem images, comparisons, ranking, unexplained judgments, or sensitive feedback.
- Protection UI uses “风险提示/需要人工核实”, never diagnosis or definitive conclusions.
- Assignment, transfer, notes, resolution, and views are local simulations with visible audit events.
- Access-sensitive actions require confirmation.

---

### Task 1: Parent weekly summary

**Files:**
- Create: `src/features/parent/ParentRoutes.tsx`
- Create: `src/features/parent/ParentRoutes.test.tsx`
- Create: `src/features/parent/home/ParentHomePage.tsx`
- Modify: `src/app/AppRouter.tsx`
- Create: `src/styles/parent-admin-pages.css`
- Modify: `src/index.css`

- [ ] Test weekly topics, voluntary question/practice counts, encouragement, teacher message, simulated audio-letter play, and contact-teacher navigation.
- [ ] Run focused test; expect RED.
- [ ] Implement calm summary cards without ranking/private detail and a clearly simulated audio player.
- [ ] Verify and commit `feat: add parent learning summary`.

### Task 2: Parent-teacher messages

**Files:**
- Create: `src/features/parent/messages/ParentMessagesPage.tsx`
- Create: `src/features/parent/messages/ParentMessagesPage.test.tsx`

- [ ] Test bound context “林晓雨 · 五年级（2）班”, send to 李老师, and local conversation update.
- [ ] Confirm RED.
- [ ] Implement one teacher conversation, timeline, composer, and privacy explanation; exclude classmates and safety content.
- [ ] Verify and commit `feat: add parent teacher communication`.

### Task 3: Administrator overview

**Files:**
- Create: `src/features/admin/AdminRoutes.tsx`
- Create: `src/features/admin/AdminRoutes.test.tsx`
- Create: `src/features/admin/home/AdminHomePage.tsx`
- Modify: `src/app/AppRouter.tsx`

- [ ] Test school/class/teacher metrics, invitations/binding codes, retention summary, and safety queue navigation.
- [ ] Confirm RED.
- [ ] Implement admin routing and overview with explicit simulated-data labels.
- [ ] Verify and commit `feat: add administration overview`.

### Task 4: Protection-case workflow

**Files:**
- Create: `src/features/admin/safety/SafetyPage.tsx`
- Create: `src/features/admin/safety/SafetyCaseDrawer.tsx`
- Create: `src/features/admin/safety/SafetyPage.test.tsx`
- Modify: `src/app/prototype/PrototypeContext.tsx`

- [ ] Test filtering new cases, opening a case, acknowledging access warning, assigning “王老师 · 德育负责人”, adding note, transfer, and resolve confirmation.
- [ ] Confirm RED.
- [ ] Extend context so case actions append deterministic audit events with actor/action/object/time.
- [ ] Implement queue, limited-context detail, trusted-adult guidance, action forms, and status chips without diagnosis language.
- [ ] Verify and commit `feat: add protection case workflow`.

### Task 5: Audit records

**Files:**
- Create: `src/features/admin/audit/AuditPage.tsx`
- Create: `src/features/admin/audit/AuditPage.test.tsx`

- [ ] Test actor/action/date filters and visibility of events created in Task 4.
- [ ] Confirm RED.
- [ ] Implement responsive audit table/cards with actor, action, object, purpose, and time; omit unnecessary sensitive content.
- [ ] Verify and commit `feat: add protection audit records`.

### Task 6: School and retention settings

**Files:**
- Create: `src/features/admin/settings/AdminSettingsPage.tsx`
- Create: `src/features/admin/settings/AdminSettingsPage.test.tsx`

- [ ] Test response contacts, invitation code simulation, retention 7→14 days, and save confirmation.
- [ ] Confirm RED.
- [ ] Implement school roles, contacts, invitation/binding controls, retention explanation, and local-only save feedback.
- [ ] Verify and commit `feat: add administration settings`.

### Task 7: Final integration and route coverage

**Files:**
- Modify: `src/features/parent/ParentRoutes.test.tsx`
- Modify: `src/features/admin/AdminRoutes.test.tsx`
- Modify: `src/app/AppRouter.test.tsx`
- Modify: `src/styles/parent-admin-pages.css`

- [ ] Add parent tracer: summary → contact teacher → send.
- [ ] Add admin tracer: safety → assign → note → resolve → audit.
- [ ] Add route-coverage test iterating every route from the design spec and asserting role shell plus non-empty named heading.
- [ ] Confirm RED for disconnected routes, then complete wiring.
- [ ] Run `pnpm test --run`; expect all pass.
- [ ] Run `pnpm build`; expect exit 0.
- [ ] Browser-check every route desktop/mobile: refresh, back/forward, active nav, dialogs/drawers, no horizontal overflow, role data boundaries.
- [ ] Inspect browser network/dev log and verify prototype actions make no network requests.
- [ ] Commit `feat: complete zhiye multi-role prototype`.
