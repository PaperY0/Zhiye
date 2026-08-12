import { describe, expect, it } from "vitest"
import { toSessionUser, type DatabaseUser } from "./dbUser"

describe("seeded database user mapping", () => {
  it("maps a fake database user to the shared session shape", () => {
    const user: DatabaseUser = {
      id: "user-teacher-01",
      email: "teacher@example.test",
      displayName: "演示教师",
      role: "TEACHER",
      schoolId: "school-demo-01",
    }
    expect(toSessionUser(user)).toEqual({
      id: "user-teacher-01",
      email: "teacher@example.test",
      name: "演示教师",
      role: "teacher",
      schoolId: "school-demo-01",
    })
  })
})
