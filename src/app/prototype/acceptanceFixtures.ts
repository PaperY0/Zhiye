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

const lessons = one(lessonFixtures, acceptanceLessonId)
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
