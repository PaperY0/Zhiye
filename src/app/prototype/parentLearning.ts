import type { Quiz, Student, Task } from "./types"

export type ParentTaskRow = {
  task: Task
  state: "not-started" | "in-progress" | "submitted" | "reviewed"
  score?: number
  objectiveMax?: number
}

export function parentLearningSnapshot(student: Student, tasks: Task[], quizzes: Quiz[]) {
  const rows: ParentTaskRow[] = tasks
    .filter((task) => task.status !== "draft" && (task.audience.kind === "class"
      ? task.audience.label === student.className
      : task.audience.studentIds.includes(student.id)))
    .map((task) => {
      const completion = task.completions.find((item) => item.studentId === student.id)
      const quiz = quizzes.find((item) => item.id === task.sourceQuizId)
      const objectiveMax = quiz?.questions.filter((question) => question.type !== "short-answer").reduce((sum, question) => sum + question.score, 0)
      return {
        task,
        state: completion?.status ?? "not-started",
        score: completion?.score,
        objectiveMax,
      }
    })
    .sort((left, right) => right.task.createdAt.localeCompare(left.task.createdAt))

  const inquiries = rows.flatMap(({ task }) => (task.inquiries ?? []).filter((item) => item.studentId === student.id).map((item) => ({ ...item, taskTitle: task.title })))
  const mistakes = [...student.mistakes].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const recentActivity = [
    ...rows.map(({ task, state }) => {
      const completion = task.completions.find((item) => item.studentId === student.id)
      return { id: `task-${task.id}`, at: completion?.updatedAt ?? completion?.submittedAt ?? task.createdAt, title: task.title, detail: state === "reviewed" ? "老师已查看" : state === "submitted" ? "已提交" : state === "in-progress" ? "正在完成" : "老师已发布" }
    }),
    ...inquiries.map((item) => ({ id: `inquiry-${item.id}`, at: item.createdAt, title: item.taskTitle, detail: item.status === "answered" ? "任务疑问已获得解答" : "记录了一次任务疑问" })),
    ...mistakes.map((item) => ({ id: `mistake-${item.id}`, at: item.createdAt, title: item.knowledgePoint, detail: "新增一项复习点" })),
  ].sort((left, right) => right.at.localeCompare(left.at))

  return {
    rows,
    pendingCount: rows.filter(({ state }) => state === "not-started" || state === "in-progress").length,
    completedCount: rows.filter(({ state }) => state === "submitted" || state === "reviewed").length,
    inquiryCount: inquiries.length,
    answeredInquiryCount: inquiries.filter((item) => item.status === "answered").length,
    latestInquiryFocus: inquiries.filter((item) => item.status === "answered" && item.focus?.trim()).sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]?.focus,
    mistakeCount: mistakes.length,
    latestMistakeTopic: mistakes[0]?.knowledgePoint,
    recentActivity,
  }
}
