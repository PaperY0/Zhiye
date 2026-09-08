import { describe, expect, it } from "vitest"
import { canReadLesson, canReadStudent, type AccessContext } from "./permissions"

const baseContext: AccessContext = {
  actor: { id: "student-1", type: "student", schoolId: "school-1" },
  classId: "class-1",
  studentId: "student-1",
  lesson: { schoolId: "school-1", classId: "class-1", status: "PUBLISHED" },
}

describe("domain access rules", () => {
  it("allows a student to read own published lesson but denies another student or draft", () => {
    expect(canReadLesson(baseContext)).toBe(true)
    expect(
      canReadLesson({ ...baseContext, studentId: "student-2" }),
    ).toBe(false)
    expect(
      canReadLesson({
        ...baseContext,
        lesson: { schoolId: "school-1", classId: "class-1", status: "DRAFT" },
      }),
    ).toBe(false)
  })

  it("allows a teacher to read only students in the same school and class", () => {
    const teacherContext: AccessContext = {
      actor: { id: "teacher-1", type: "teacher", schoolId: "school-1" },
      classId: "class-1",
      studentId: "student-1",
      studentSchoolId: "school-1",
      studentClassId: "class-1",
    }
    expect(canReadStudent(teacherContext)).toBe(true)
    expect(canReadStudent({ ...teacherContext, studentClassId: "class-2" })).toBe(false)
    expect(canReadStudent({ ...teacherContext, actor: { ...teacherContext.actor, schoolId: "school-2" } })).toBe(false)
  })
})
