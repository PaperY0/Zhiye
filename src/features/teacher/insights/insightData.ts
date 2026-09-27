import type { KnowledgeSignal, Lesson, Student, Subject, Task } from "../../../app/prototype/types"

export type InsightRange = "all" | "7d" | "30d"
export type InsightSubject = "all" | Subject

function inRange(value: string, range: InsightRange, now: Date) {
  if (range === "all") return true
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const days = range === "7d" ? 7 : 30
  return date.getTime() <= now.getTime() && date.getTime() >= now.getTime() - days * 24 * 60 * 60 * 1000
}

function byNewest<T>(items: T[], dateOf: (item: T) => string) {
  return [...items].sort((a, b) => Date.parse(dateOf(b)) - Date.parse(dateOf(a)))
}

export function buildInsightData(input: {
  signals: KnowledgeSignal[]
  lessons: Lesson[]
  tasks: Task[]
  students: Student[]
  className: string
  subject: InsightSubject
  range: InsightRange
  now?: Date
}) {
  const { signals, lessons, tasks, students, className, subject, range } = input
  const now = input.now ?? new Date()
  const subjectMatches = (value: Subject) => subject === "all" || value === subject
  const scopedSignals = byNewest(signals.filter((signal) =>
    (!signal.className || signal.className === className) &&
    subjectMatches(signal.subject) && inRange(signal.observedAt, range, now),
  ), (signal) => signal.observedAt)
  const scopedLessons = byNewest(lessons.filter((lesson) =>
    lesson.className === className && subjectMatches(lesson.subject) &&
    inRange(lesson.date, range, now) &&
    (lesson.evidence?.length || lesson.teacherReport),
  ), (lesson) => lesson.date)
  const scopedTasks = byNewest(tasks.filter((task) =>
    task.status !== "draft" &&
    (task.audience.kind === "class" ? task.audience.label === className : task.audience.studentIds.some((id) => students.some((student) => student.id === id && student.className === className))) &&
    inRange(task.createdAt, range, now),
  ), (task) => task.createdAt)
  // Tasks have no subject field yet. Do not silently claim a subject-specific
  // submission total; only show them in the unfiltered class view.
  const visibleTasks = subject === "all" ? scopedTasks : []
  const classIds = new Set(students.filter((student) => student.className === className).map((student) => student.id))
  const identifiedStudents = new Set(scopedSignals.flatMap((signal) => signal.affectedStudentIds).filter((id) => classIds.has(id)))
  const affectedLowerBound = Math.max(identifiedStudents.size, ...scopedSignals.map((signal) => signal.affectedCount), 0)
  const totalExpected = visibleTasks.reduce((sum, task) => sum + task.completions.length, 0)
  const totalSubmitted = visibleTasks.reduce((sum, task) => sum + task.completions.filter((item) => item.status === "submitted" || item.status === "reviewed").length, 0)
  const totalReviewed = visibleTasks.reduce((sum, task) => sum + task.completions.filter((item) => item.status === "reviewed").length, 0)

  return {
    signals: scopedSignals,
    lessons: scopedLessons,
    tasks: visibleTasks,
    affectedLowerBound,
    priorityCount: scopedSignals.filter((signal) => signal.severity === "priority").length,
    totalExpected,
    totalSubmitted,
    totalReviewed,
  }
}
