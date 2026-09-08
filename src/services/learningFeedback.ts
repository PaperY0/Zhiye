import type { Task, TaskFeedbackSummary } from "../app/prototype/types"

export function aggregateTaskFeedback(tasks: Task[]): TaskFeedbackSummary[] {
  return tasks
    .filter((task) => task.status !== "draft")
    .map((task) => {
      const totalCount = task.completions.length
      const submittedCount = task.completions.filter(
        (completion) => completion.status === "submitted" || completion.status === "reviewed",
      ).length
      const completionRate = totalCount === 0 ? 0 : Math.round((submittedCount / totalCount) * 100)
      const signal: TaskFeedbackSummary["signal"] = completionRate < 70 ? "needs-practice" : "stable"
      return {
        taskId: task.id,
        title: task.title,
        totalCount,
        submittedCount,
        completionRate,
        signal,
      }
    })
    .sort((left, right) => left.completionRate - right.completionRate)
}
