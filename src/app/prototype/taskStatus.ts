import type { Student, Task } from "./types"

export function taskCompletionsForClass(task: Task, className: string, students: Student[]) {
  if (className === "all") return task.completions
  if (task.audience.kind === "class") return task.audience.label === className ? task.completions : []
  const classIds = new Set(students.filter((student) => student.className === className).map((student) => student.id))
  return task.completions.filter((completion) => classIds.has(completion.studentId))
}

/** Use the same completion scope in the task list and class insights. */
export function taskSubmissionCounts(task: Task, className: string, students: Student[]) {
  const completions = taskCompletionsForClass(task, className, students)
  return {
    total: completions.length,
    submitted: completions.filter((item) => item.status === "submitted" || item.status === "reviewed").length,
    reviewed: completions.filter((item) => item.status === "reviewed").length,
    pendingReview: completions.filter((item) => item.status === "submitted").length,
  }
}

/** Keep the teacher's task stage in step with the students' actual work. */
export function reconcileTaskStatus(task: Task): Task {
  if (task.status === "draft" || task.status === "completed") return task

  const completions = task.completions
  const status: Task["status"] = completions.some((item) => item.status === "submitted")
    ? "review"
    : completions.length > 0 && completions.every((item) => item.status === "reviewed")
      ? "completed"
      : "active"

  return status === task.status ? task : { ...task, status }
}
