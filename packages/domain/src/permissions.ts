export type ActorType =
  | "teacher"
  | "student"
  | "guardian"
  | "admin"
  | "safeguarding_lead"

export type AccessContext = {
  actor: {
    id: string
    type: ActorType
    schoolId: string
  }
  schoolId?: string
  classId?: string
  studentId?: string
  studentSchoolId?: string
  studentClassId?: string
  guardianStudentIds?: string[]
  lesson?: {
    schoolId: string
    classId: string
    status: "DRAFT" | "CONFIRMED" | "PUBLISHED"
  }
}

function belongsToSchool(context: AccessContext, schoolId: string) {
  return context.actor.schoolId === schoolId
}

export function canReadStudent(context: AccessContext): boolean {
  if (!context.studentId || !context.studentClassId || !context.classId) return false
  if (!context.studentSchoolId || !belongsToSchool(context, context.studentSchoolId)) return false

  if (context.actor.type === "student") {
    return context.actor.id === context.studentId
  }
  if (context.actor.type === "teacher") {
    return context.studentClassId === context.classId
  }
  if (context.actor.type === "guardian") {
    return context.guardianStudentIds?.includes(context.studentId) ?? false
  }
  return false
}

export function canReadLesson(context: AccessContext): boolean {
  const lesson = context.lesson
  if (!lesson || !context.classId) return false
  if (!belongsToSchool(context, lesson.schoolId) || lesson.classId !== context.classId) {
    return false
  }

  if (context.actor.type === "teacher") return true
  if (context.actor.type === "student") {
    return lesson.status === "PUBLISHED" && context.actor.id === context.studentId
  }
  if (context.actor.type === "guardian") return false
  return false
}
