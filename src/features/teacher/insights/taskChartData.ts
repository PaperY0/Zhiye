import type { Quiz, Student, Task } from "../../../app/prototype/types"
import { isCorrectAnswer, isObjectiveQuestion } from "../../../app/prototype/quizScoring"
import { taskCompletionsForClass } from "../../../app/prototype/taskStatus"
import { schoolClasses } from "../settings/teacherSettings"

export type TaskCompletionBreakdown = {
  notStarted: number
  inProgress: number
  pendingReview: number
  reviewed: number
  total: number
  submitted: number
  completionRate: number | null
}

export function taskCompletionBreakdown(tasks: Task[], className: string, students: Student[]): TaskCompletionBreakdown {
  const counts = { notStarted: 0, inProgress: 0, pendingReview: 0, reviewed: 0 }
  for (const task of tasks) {
    if (task.status === "draft") continue
    for (const completion of taskCompletionsForClass(task, className, students)) {
      if (completion.status === "not-started") counts.notStarted += 1
      else if (completion.status === "in-progress") counts.inProgress += 1
      else if (completion.status === "submitted") counts.pendingReview += 1
      else counts.reviewed += 1
    }
  }
  const total = counts.notStarted + counts.inProgress + counts.pendingReview + counts.reviewed
  const submitted = counts.pendingReview + counts.reviewed
  return { ...counts, total, submitted, completionRate: total ? Math.round(submitted / total * 100) : null }
}

export function classTaskSummaries(tasks: Task[], students: Student[]) {
  return schoolClasses.map((className) => ({
    className,
    studentCount: students.filter((student) => student.className === className).length,
    ...taskCompletionBreakdown(tasks, className, students),
  }))
}

/** Count each task once in the selected scope, including drafts. */
export function tasksForClass(tasks: Task[], className: string, students: Student[]) {
  if (className === "all") return tasks
  const classStudentIds = new Set(students.filter((student) => student.className === className).map((student) => student.id))
  return tasks.filter((task) => task.audience.kind === "class"
    ? task.audience.label === className
    : task.audience.studentIds.some((id) => classStudentIds.has(id)))
}

export function taskStatusBreakdown(tasks: Task[], className: string, students: Student[]) {
  const scoped = tasksForClass(tasks, className, students)
  const counts = { draft: 0, active: 0, review: 0, completed: 0 }
  for (const task of scoped) counts[task.status] += 1
  return { ...counts, total: scoped.length }
}

export function taskAccuracyBreakdown(task: Task, quiz: Quiz | undefined, className: string, students: Student[]) {
  const questions = quiz?.questions.filter(isObjectiveQuestion) ?? []
  let correct = 0
  let total = 0
  for (const completion of taskCompletionsForClass(task, className, students)) {
    if (!completion.answers || !["submitted", "reviewed"].includes(completion.status)) continue
    for (const question of questions) {
      if (!completion.answers[question.id]?.trim()) continue
      total += 1
      if (isCorrectAnswer(question, completion.answers[question.id])) correct += 1
    }
  }
  return { correct, total, rate: total ? Math.round(correct / total * 100) : null }
}
