import { describe, expect, it } from "vitest"
import { quizFixtures, studentFixtures, taskFixtures } from "../../../app/prototype/fixtures"
import { classTaskSummaries, taskAccuracyBreakdown, taskCompletionBreakdown, taskStatusBreakdown } from "./taskChartData"

describe("task chart data", () => {
  it("calculates quiz accuracy from submitted answers in the selected class", () => {
    const task = { ...taskFixtures[1], completions: [
      { studentId: "student-lin-xiaoyu", status: "submitted" as const, answers: { "question-fractions-01": "6/10", "question-fractions-02": "可以" } },
      { studentId: "student-guo-haoran", status: "submitted" as const, answers: { "question-fractions-01": "6/10", "question-fractions-02": "不可以" } },
    ] }
    expect(taskAccuracyBreakdown(task, quizFixtures[0], "五年级（2）班", studentFixtures)).toEqual({ correct: 3, total: 4, rate: 75 })
    expect(taskAccuracyBreakdown(task, undefined, "五年级（2）班", studentFixtures).rate).toBeNull()
  })
  it("counts task records once, including drafts, instead of expected student submissions", () => {
    expect(taskStatusBreakdown(taskFixtures, "五年级（2）班", studentFixtures)).toEqual({ total: 4, draft: 1, active: 1, review: 1, completed: 1 })
    expect(taskStatusBreakdown(taskFixtures, "五年级（1）班", studentFixtures).total).toBe(0)
    expect(taskStatusBreakdown(taskFixtures, "all", studentFixtures).total).toBe(4)
  })
  it("counts only published assignments and separates submitted from reviewed", () => {
    const summary = taskCompletionBreakdown(taskFixtures, "五年级（2）班", studentFixtures)
    expect(summary).toMatchObject({ total: 15, submitted: 12, pendingReview: 4, reviewed: 8, inProgress: 2, notStarted: 1, completionRate: 80 })
  })

  it("splits a task assigned across both classes and leaves a class with no assignments empty", () => {
    const mixedTask = { ...taskFixtures[0], status: "active" as const, audience: { kind: "students" as const, label: "指定学生", studentIds: ["student-lin-xiaoyu", "student-guo-haoran"] }, completions: [
      { studentId: "student-lin-xiaoyu", status: "submitted" as const },
      { studentId: "student-guo-haoran", status: "in-progress" as const },
    ] }
    const classes = classTaskSummaries([mixedTask], studentFixtures)
    expect(classes.map(({ total, submitted, completionRate }) => ({ total, submitted, completionRate }))).toEqual([
      { total: 1, submitted: 0, completionRate: 0 },
      { total: 1, submitted: 1, completionRate: 100 },
    ])
    expect(taskCompletionBreakdown([taskFixtures[0]], "五年级（1）班", studentFixtures).completionRate).toBeNull()
  })

  it("keeps a class-wide task with its published class if a student later changes class", () => {
    const changedRoster = studentFixtures.map((student) => student.id === "student-lin-xiaoyu" ? { ...student, className: "五年级（1）班" } : student)
    const task = { ...taskFixtures[0], status: "active" as const, completions: [{ studentId: "student-lin-xiaoyu", status: "submitted" as const }] }
    expect(taskCompletionBreakdown([task], "五年级（2）班", changedRoster).total).toBe(1)
    expect(taskCompletionBreakdown([task], "五年级（1）班", changedRoster).submitted).toBe(0)
  })
})
