import { describe, expect, it } from "vitest"
import { taskFixtures } from "./fixtures"
import { reconcileTaskStatus } from "./taskStatus"

const base = taskFixtures[0]

describe("task status reconciliation", () => {
  it("uses student evidence for review and completion", () => {
    const submitted = { ...base, status: "active" as const, completions: [{ studentId: "student-1", status: "submitted" as const }] }
    expect(reconcileTaskStatus(submitted).status).toBe("review")
    expect(reconcileTaskStatus({ ...submitted, status: "review", completions: [{ studentId: "student-1", status: "reviewed" }] }).status).toBe("completed")
    expect(reconcileTaskStatus({ ...submitted, status: "review", completions: [{ studentId: "student-1", status: "reviewed" }, { studentId: "student-2", status: "in-progress" }] }).status).toBe("active")
  })

  it("leaves unpublished drafts and explicitly closed tasks alone", () => {
    expect(reconcileTaskStatus(base).status).toBe("draft")
    expect(reconcileTaskStatus({ ...base, status: "completed" }).status).toBe("completed")
  })
})
