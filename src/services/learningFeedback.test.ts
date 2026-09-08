import { describe, expect, it } from "vitest"
import { aggregateTaskFeedback } from "./learningFeedback"
import type { Task } from "../app/prototype/types"

function task(statuses: Task["completions"][number]["status"][]): Task {
  return {
    id: "task-feedback",
    title: "单位换算巩固练习",
    type: "practice",
    content: "完成练习并说明理由",
    audience: { kind: "class", label: "五年级（2）班", studentIds: [] },
    dueAt: "2026-07-26T20:00:00+08:00",
    reminder: "截止前 2 小时",
    status: "active",
    completions: statuses.map((status, index) => ({ studentId: `student-${index}`, status })),
    createdAt: "2026-07-24T16:00:00+08:00",
  }
}

describe("aggregateTaskFeedback", () => {
  it("returns anonymous completion counts and a needs-practice signal", () => {
    expect(aggregateTaskFeedback([task(["submitted", "in-progress", "not-started"])])[0]).toMatchObject({
      totalCount: 3,
      submittedCount: 1,
      completionRate: 33,
      signal: "needs-practice",
    })
  })

  it("ignores draft tasks", () => {
    const draft = { ...task(["submitted"]), status: "draft" as const }
    expect(aggregateTaskFeedback([draft])).toEqual([])
  })
})
