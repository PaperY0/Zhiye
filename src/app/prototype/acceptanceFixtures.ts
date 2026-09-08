import {
  auditEventFixtures,
  conversationFixtures,
  knowledgeSignalFixtures,
  lessonFixtures,
  parentSummaryFixture,
  planFixtures,
  quizFixtures,
  safetyCaseFixtures,
  studentFixtures,
  taskFixtures,
} from "./fixtures"
import type {
  AuditEvent,
  Conversation,
  KnowledgeSignal,
  Lesson,
  ParentSummary,
  PlanDraft,
  Quiz,
  SafetyCase,
  Student,
  Task,
} from "./types"

const acceptanceStudentId = "student-lin-xiaoyu"
const acceptanceLessonId = "lesson-fractions"

function clone<T>(value: T): T {
  return structuredClone(value)
}

function one<T extends { id: string }>(items: T[], id: string): T[] {
  const item = items.find((entry) => entry.id === id) ?? items[0]
  return item ? [clone(item)] : []
}

const lessons = one(lessonFixtures, acceptanceLessonId).map((lesson) => ({
  ...lesson,
  teacherReport: "课堂中学生能够复述分子和分母同时变化的规则，但仍有学生需要提醒‘不为零’条件。",
  progressSuggestion: "下一节课先用 5 分钟补充不为零条件，再进入约分与通分。",
  evidence: [
    "李老师：分子和分母要同时乘同一个不为零的数，分数值才不会改变。",
    "学生：如果只把分子乘二，分数是不是也一样？",
  ],
}))
const students = one(studentFixtures, acceptanceStudentId)

const signals: KnowledgeSignal[] = one(
  knowledgeSignalFixtures,
  "signal-unit-calculation",
).map((signal) => ({
  ...signal,
  affectedStudentIds: [acceptanceStudentId],
  affectedCount: 1,
}))

const tasks: Task[] = one(taskFixtures, "task-active-01").map((task) => ({
  ...task,
  audience: {
    ...task.audience,
    studentIds: [acceptanceStudentId],
  },
  completions: task.completions
    .filter((completion) => completion.studentId === acceptanceStudentId)
    .map((completion) => clone(completion)),
}))

const conversations: Conversation[] = conversationFixtures
  .filter((conversation) =>
    ["conversation-student-xiaoyu", "conversation-parent-li"].includes(
      conversation.id,
    ),
  )
  .map((conversation) => ({
    ...clone(conversation),
    participantIds: conversation.participantIds.filter(
      (id) => id === acceptanceStudentId || id === "teacher-li" || id === "parent-li",
    ),
  }))

export const acceptanceFixtureSet = {
  lessons,
  students,
  signals,
  plans: one(planFixtures, "plan-units-remedial") as PlanDraft[],
  quizzes: one(quizFixtures, "quiz-fractions-check") as Quiz[],
  tasks,
  conversations,
  parentSummary: clone(parentSummaryFixture) as ParentSummary,
  safetyCases: one(safetyCaseFixtures, "safety-case-01") as SafetyCase[],
  auditEvents: one(auditEventFixtures, "audit-event-01") as AuditEvent[],
}

export type PrototypeFixtureSet = typeof acceptanceFixtureSet
