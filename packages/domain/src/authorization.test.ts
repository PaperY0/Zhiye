import { describe, expect, it } from "vitest"
import {
  canAccessClassroom,
  canAccessSafeguardingCase,
  canReadParentSummary,
  requireRole,
  getSessionUser,
  type SessionUser,
} from "./authorization"

const teacher: SessionUser = {
  id: "teacher-1",
  role: "teacher",
  schoolId: "school-1",
}

describe("server authorization", () => {
  it("rejects missing sessions and wrong roles with stable errors", () => {
    expect(() => requireRole(null, "teacher")).toThrowError("UNAUTHENTICATED")
    expect(() => requireRole(teacher, "admin")).toThrowError("ROLE_FORBIDDEN")
    expect(requireRole(teacher, "teacher")).toEqual(teacher)
  })

  it("resolves the session user from the cookie token and rejects a stale token", async () => {
    const store = {
      get: async (token: string) => (token === "valid-token" ? teacher : null),
    }
    const cookie = "zhiye.session=valid-token; Path=/; HttpOnly"
    await expect(getSessionUser(cookie, store)).resolves.toEqual(teacher)
    await expect(getSessionUser("zhiye.session=stale-token", store)).resolves.toBeNull()
  })

  it("allows only same-school assigned teachers or enrolled students", () => {
    expect(
      canAccessClassroom(teacher, {
        id: "class-1",
        schoolId: "school-1",
        memberUserIds: ["teacher-1"],
      }),
    ).toBe(true)
    expect(
      canAccessClassroom(teacher, {
        id: "class-2",
        schoolId: "school-1",
        memberUserIds: [],
      }),
    ).toBe(false)
    expect(
      canAccessClassroom(teacher, {
        id: "class-3",
        schoolId: "school-2",
        memberUserIds: ["teacher-1"],
      }),
    ).toBe(false)
  })

  it("requires a published summary and an active guardian link", () => {
    const guardian: SessionUser = {
      id: "guardian-1",
      role: "guardian",
      schoolId: "school-1",
    }
    const summary = {
      id: "summary-1",
      schoolId: "school-1",
      studentId: "student-1",
      published: true,
      guardianIds: ["guardian-1"],
    }
    expect(canReadParentSummary(guardian, summary)).toBe(true)
    expect(canReadParentSummary({ ...guardian, id: "guardian-2" }, summary)).toBe(false)
    expect(canReadParentSummary(guardian, { ...summary, published: false })).toBe(false)
  })

  it("limits safeguarding case access to the assigned safeguarding lead", () => {
    const lead: SessionUser = {
      id: "lead-1",
      role: "safeguarding_lead",
      schoolId: "school-1",
    }
    const caseTarget = {
      id: "case-1",
      schoolId: "school-1",
      assigneeId: "lead-1",
    }
    expect(canAccessSafeguardingCase(lead, caseTarget)).toBe(true)
    expect(canAccessSafeguardingCase({ ...lead, id: "lead-2" }, caseTarget)).toBe(false)
    expect(canAccessSafeguardingCase({ ...lead, schoolId: "school-2" }, caseTarget)).toBe(false)
  })
})
