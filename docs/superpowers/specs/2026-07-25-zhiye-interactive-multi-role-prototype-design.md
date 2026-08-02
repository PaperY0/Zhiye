# Zhiye Interactive Multi-Role Prototype Design

## 1. Objective

Build a connected, high-fidelity interactive prototype for Zhiye's core product loop in three deliverable phases:

1. Complete the teacher experience.
2. Complete the student's core learning flow.
3. Complete the parent and school-administration experiences.

The prototype must feel like one product rather than a collection of static mockups. Navigation, filters, drawers, dialogs, forms, status changes, simulated uploads, message sending, publishing, and role switching must work with local in-memory data. No backend integration is required in this scope.

## 2. Product Scope

### 2.1 Included

- Responsive desktop and mobile layouts.
- URL-addressable screens using hash routes.
- Shared Apple-inspired translucent materials, rounded surfaces, depth, and interaction states.
- Reusable role shells, headers, side navigation, mobile navigation, cards, filters, dialogs, drawers, tables, timelines, charts, and status indicators.
- Realistic Chinese sample content based on the existing fifth-grade mathematics scenario.
- Local interactive state for form entries, filters, simulated publishing, task progress, messages, uploads, and workflow steps.
- Empty, loading, syncing, processing, success, warning, and needs-more-information states where relevant.
- Accessible labels, keyboard-operable controls, reduced-motion behavior, and reduced-transparency fallbacks.

### 2.2 Excluded

- Real authentication or account security.
- Real audio recording, speech recognition, image recognition, AI generation, SMS, file storage, or network synchronization.
- Backend APIs or databases.
- Persistent business data across browser sessions. The hash route persists across refreshes; transient prototype data may reset.
- Real safeguarding notifications or external transmissions. Protection workflows are visual simulations only.
- Production-grade authorization enforcement. Role boundaries are represented in UI and mock data only.

## 3. Routing Architecture

Use a small native hash router rather than adding a routing dependency. The application listens to `hashchange`, resolves a typed route, and renders the matching role shell and page.

### 3.1 Route Format

```text
#/welcome

#/teacher/workspace
#/teacher/classroom
#/teacher/classroom/:lessonId
#/teacher/insights
#/teacher/planning
#/teacher/students
#/teacher/students/:studentId
#/teacher/tasks
#/teacher/messages
#/teacher/settings

#/student/home
#/student/review/:lessonId
#/student/tutoring
#/student/learning
#/student/mistakes
#/student/tasks
#/student/messages

#/parent/home
#/parent/messages

#/admin/home
#/admin/safety
#/admin/audit
#/admin/settings
```

Dynamic identifiers may be represented with deterministic mock IDs. The router must provide a safe role home fallback when the hash is missing or unknown.

### 3.2 Navigation Behavior

- Sidebar, mobile navigation, cards, breadcrumbs, and primary actions update the hash.
- Refreshing the browser preserves the current page through the hash.
- Browser back and forward navigation work naturally.
- Active navigation is derived from the current route, never hard-coded.
- Role switching opens the selected role's home route.
- The welcome page provides explicit role-entry actions for teacher, student, parent, and administrator.

## 4. Shared Design System

### 4.1 Visual Direction

Keep the current Zhiye visual identity: calm rural-natural colors, pale green and cool blue atmosphere, warm gold accents, Chinese-first typography, and Apple-inspired web glass materials.

Material hierarchy:

1. Background landscape/gradient: lowest contrast, decorative only.
2. Role shell and large workspace surfaces: light translucent material with broad blur and restrained shadow.
3. Interactive cards, drawers, and primary content sheets: brighter material, stronger separation, larger corner radii.
4. Chips and controls: smaller solid or lightly translucent surfaces for legibility.

Avoid stacking multiple equally bright glass surfaces. Large surfaces use stronger blur and deeper but softer shadows. Text over glass uses sufficient contrast and weight.

### 4.2 Shared Tokens

Create or consolidate tokens for:

- Background and surface colors.
- Text hierarchy.
- Brand green, warm gold, informative blue, warning amber, and critical red.
- Surface radii: small, control, card, large card, sheet.
- Spacing and content widths.
- Blur and saturation strengths.
- Border highlights and shadows.
- Motion durations and easing.
- Navigation widths and mobile safe areas.

### 4.3 Shared Components

Reusable components should include:

- `AppRouter`
- `RoleShell`
- `RoleSidebar`
- `RoleMobileNav`
- `PageHeader`
- `GlassSurface`
- `StatusChip`
- `MetricCard`
- `FilterBar`
- `SegmentedControl`
- `DataTable` or responsive item list
- `Timeline`
- `ProgressRing` / progress bar
- `EmptyState`
- `Dialog`
- `Drawer`
- `ToastRegion`
- `FormField`
- `RoleSwitcher`

Only create abstractions that are reused by multiple pages. Page-specific compositions remain in their feature directory.

## 5. Mock Data and Interaction Model

### 5.1 Data Organization

Use typed local fixtures grouped by domain:

- Classes and lessons.
- Classroom recordings and generated artifacts.
- Knowledge points and class difficulty signals.
- Students and learning timelines.
- Plans, quizzes, questions, and published assignments.
- Tasks and completion states.
- Conversations and messages.
- Parent summaries.
- Protection cases and audit events.

### 5.2 Prototype State

Use React state and focused context providers where state crosses page boundaries. Do not introduce a global state dependency.

Examples of interactive state:

- Recording: idle → recording → paused → processing → draft ready.
- Lesson recap: draft → edited → confirmed → published.
- Planning: configuration → generated draft → edited → published/exported.
- Tasks: draft → published → in progress → complete/overdue.
- Student tutoring: upload → select sticking point → hints → explanation → self-retell → transfer problem → saved to mistakes.
- Messages: conversation selection, draft input, simulated send.
- Safety case: new → assigned → under review → resolved.

Actions produce immediate local feedback through status chips and toasts. Destructive-looking prototype actions require a confirmation dialog but do not delete external data.

## 6. Phase 1 — Teacher Experience

### 6.1 Teacher Shell

Keep and generalize the existing workspace shell.

Desktop navigation:

- 工作台
- 课堂
- 班级洞察
- 备课与测验
- 学生档案
- 任务
- 消息
- 设置

Mobile navigation shows the highest-frequency destinations and an overflow/menu entry for the rest. The current class, sync status, search, teacher identity, and role switcher remain accessible across teacher pages.

### 6.2 工作台

Preserve the current high-fidelity dashboard and make its cards navigable:

- Current lesson recap opens the lesson detail.
- Queue items open the corresponding page or drawer.
- Class pulse opens insights with a preselected knowledge point.
- Bottom lesson, planning, and class-change items navigate to their details.

### 6.3 课堂

#### Classroom List

- Filter by status: 进行中、处理中、待确认、已发布.
- Show lesson date, subject, duration, sync state, artifact state, and student visibility.
- Primary action starts a new classroom recording simulation.

#### Recording Flow

- Start, pause, continue, and end controls.
- Visible recording duration, network condition, and pending-sync status.
- Ending transitions to a processing state, then exposes generated draft artifacts.

#### Lesson Detail

Tabs or segments:

- 课堂转写
- 学生复习卡
- 教师课堂报告
- 课程进度

Teachers can edit draft copy, inspect evidence, accept/ignore suggestions, regenerate a simulated section, and confirm publication. The lesson detail reuses the existing recap card visual language.

### 6.4 班级洞察

- Heatmap by chapter, knowledge point, and solving step.
- Time range, subject, and class filters.
- Summary metrics: affected students, rising difficulty, resolved difficulty, and frequent step.
- Trend visualization and selected knowledge-point detail drawer.
- Generate remedial lesson or targeted exercise draft from the selected difficulty.
- No default student ranking.

### 6.5 备课与测验

Two main modes:

#### Lesson Planning

- Select textbook, chapter, lesson objective, class context, and evidence sources.
- Generate a simulated plan containing lesson outline, examples, misconceptions, teaching suggestions, and extension ideas.
- Edit sections and mark suggestions as included/excluded.
- Preview and export simulation.

#### Quiz Builder

- Choose diagnostic, in-class, homework, or unit test.
- Configure number of questions, difficulty, knowledge points, and target students/class.
- Edit question text, options, answers, explanations, and scoring.
- Preview and publish locally.

A recent-generation panel shows drafts and published items.

### 6.6 学生档案

#### Student List

- Search and filter by task status, recent activity, knowledge point, and support need.
- Show learning facts, not rankings or fixed labels.

#### Student Detail

- Summary facts and recent activity.
- Learning timeline: lessons, reviews, tutoring, questions, mistakes, practice, and tasks.
- Knowledge-point evidence.
- Separate panels for factual records and clearly labeled AI inferences.
- Teacher note and correction-request interaction.

### 6.7 任务

- Kanban/list segments: 草稿、进行中、待查看、已完成.
- Create task dialog with type, title, content, assignees, due date, and reminder.
- Task detail drawer with completion metrics and student states.
- Simulated reminder and publish actions.

### 6.8 消息

- Conversation list for students, parents, class groups, and feedback.
- Search and category filters.
- Chat view with timestamps, simulated attachment previews and simulated send.
- Ordinary feedback uses normal conversation handling.
- High-risk keywords in a demonstration conversation show a protection-flow prompt and route to the safety workflow rather than silently sending as an ordinary message.

### 6.9 设置

Sections:

- Teacher profile and active class.
- Textbook scope and subjects.
- AI generation preferences.
- Speech/language and dialect preferences.
- Notification preferences.
- Data retention explanation and simulated choices.
- Privacy and role-switch access.

## 7. Phase 2 — Student Core Learning Flow

### 7.1 Student Shell

Student navigation prioritizes:

- 首页
- 拍照答疑
- 知识点学习
- 错题本
- 任务
- 消息

The design uses larger controls, shorter copy, clearer progress, and lower reading burden than the teacher experience.

### 7.2 学生首页

- Today's teacher-published recap card.
- Continue-learning action.
- Photograph tutoring entry.
- Due tasks and recent mistake review.
- Learning streak/progress without public ranking.

### 7.3 课程复习卡

- Topic, key knowledge points, common mistake, daily-life example, self-check question, and optional exercise.
- Simulated read-aloud control.
- Self-assessment: 还不太懂、基本明白、我能讲出来.
- Ask-about-this-point action opens knowledge learning with context.

### 7.4 拍照答疑

A step-based interactive flow:

1. Simulated image upload/camera choice.
2. Preview and replace image.
3. Choose sticking-point type:
   - 完全没思路
   - 卡在某一步
   - 想核对思路
   - 已做完想检查
4. Confirm interpreted problem information.
5. Progressive help: understand conditions → first hint → key step → full explanation when requested.
6. Student self-retell input.
7. Transfer problem.
8. Save to mistake book with editable subject, date, knowledge point, cause, and mastery.

Include a “needs clearer photo” branch and a “describe what you tried first” branch.

### 7.5 知识点学习

- Conversation-based lesson with typed local messages.
- Suggested prompts and simulated voice entry state.
- Age-appropriate explanation, daily-life example, knowledge card, and Feynman question.
- History grouped by knowledge-point title.

### 7.6 错题本

- Filters for subject, knowledge point, date, and mastery.
- Responsive mistake cards with a representative original-problem preview, cause, notes, and review status.
- Update mastery and schedule a simulated reminder.
- Open an item into a review detail drawer/page.

### 7.7 学生任务与消息

- Task list and task detail with completion action.
- Message view limited to teacher and teacher-managed class group.
- Separate low-pressure feedback entry.
- Protection entry visually separated from ordinary messages.

## 8. Phase 3 — Parent and Administration

### 8.1 Parent Shell and Home

- Weekly learning-companion summary.
- Topics studied.
- Counts of voluntary questions and completed practice, presented without ranking.
- One specific encouragement suggestion.
- Teacher message.
- Simulated audio letter player.
- Contact-teacher action.

Parent pages must not expose complete student conversations, specific private problem images, peer comparison, rankings, unexplained model judgments, or sensitive feedback.

### 8.2 Parent Messages

- Teacher conversation only.
- Simulated message send.
- Clear context that the channel concerns the bound child/class.

### 8.3 Admin Home

- School/class/teacher summary.
- Pending invitations and binding codes.
- Data-retention overview.
- Safety queue summary.

### 8.4 Protection Cases

- Queue with status and severity presentation that avoids definitive diagnosis.
- Case detail shows the triggering category, limited necessary context, assignment, handling notes, and support guidance.
- Assign, transfer, add note, and resolve simulations.
- Access warnings and confirmation dialogs.

### 8.5 Audit and Settings

- Audit event list with filters for actor, action, object, and date.
- School roles, response contacts, data retention, and invitation/binding settings.

## 9. Responsive Design

### Desktop

- Persistent role sidebar.
- Context/header bar.
- Multi-column data layouts where useful.
- Drawers for details that should preserve list context.

### Tablet

- Collapsed navigation rail.
- Reduced multi-column density.
- Drawers may become wider overlays.

### Mobile

- Bottom navigation plus a role/page menu.
- Natural page height; no forced desktop viewport-height cards.
- Tables become cards or horizontally safe lists.
- Dialogs become bottom sheets or near-full-screen sheets.
- Primary actions remain reachable above the safe area.

## 10. Accessibility and Safety

- All interactive controls have accessible names.
- Active navigation uses `aria-current`.
- Dialogs and drawers expose correct roles and headings.
- Status is communicated with text, not color alone.
- Focus states remain visible.
- Reduced-motion removes decorative transforms and long movement.
- Reduced-transparency replaces blur with solid readable surfaces.
- Student and safeguarding copy avoids blame, diagnosis, ranking, and definitive automated judgments.

## 11. Testing Strategy

### Unit/Component Tests

- Hash route parsing and fallback.
- Active navigation and role switching.
- Core dialog/drawer open-close behavior.
- Teacher recording workflow state changes.
- Lesson publication state.
- Planning/quiz form interactions.
- Student tutoring step progression and alternative branches.
- Message sending.
- Safety case status changes.

### Integration Tests

At minimum, verify these tracer flows:

1. Teacher: workspace → lesson detail → edit recap → publish.
2. Teacher: insights → select difficulty → generate remedial draft.
3. Teacher: create and publish task → inspect completion state.
4. Student: home → tutoring upload → layered help → self-retell → mistake book.
5. Parent: open weekly summary → contact teacher.
6. Admin: open safety case → assign → record handling → resolve.

### Browser Visual Verification

Check representative desktop and mobile sizes for:

- No unintended page clipping or horizontal scroll.
- Navigation active states.
- Glass and corner consistency.
- Long Chinese copy wrapping.
- Dialog and drawer positioning.
- Empty and dense list states.

## 12. Delivery Sequence

### Phase 1 Deliverable

A complete connected teacher prototype with all eight navigation destinations and their primary workflows.

### Phase 2 Deliverable

A connected student prototype that completes the learning loop from recap or tutoring through self-retell and mistake-book entry.

### Phase 3 Deliverable

Parent summary/contact flows and administrator safety/audit flows.

Each phase must pass its tests and build independently before the next phase begins.

## 13. Acceptance Criteria

- Every listed route renders a designed page, not merely a page title or empty shell.
- All visible navigation controls lead somewhere meaningful.
- Primary workflows are interactive with local state and clear feedback.
- Refresh preserves the current route.
- Browser back/forward works.
- Desktop and mobile navigation are usable.
- Shared visual tokens and components keep materials, radii, typography, and spacing consistent.
- Teacher, student, parent, and admin experiences are visually related but appropriately adapted to each role.
- No simulated high-risk or personal data leaves the browser.
- `pnpm test --run` and `pnpm build` pass at each phase boundary.
