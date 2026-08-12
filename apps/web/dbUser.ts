export type DatabaseUser = {
  id: string
  email: string | null
  displayName: string
  role: "TEACHER" | "STUDENT" | "GUARDIAN" | "ADMIN" | "SAFEGUARDING_LEAD"
  schoolId: string
}

export type SessionDatabaseUser = {
  id: string
  email: string
  name: string
  role: "teacher" | "student" | "guardian" | "admin" | "safeguarding_lead"
  schoolId: string
}

export function toSessionUser(user: DatabaseUser): SessionDatabaseUser | null {
  if (!user.email) return null
  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    role: user.role.toLowerCase() as SessionDatabaseUser["role"],
    schoolId: user.schoolId,
  }
}
