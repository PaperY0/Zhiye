import type { ActorType } from "./permissions"
import { readSessionCookie } from "./sessionCookie"

export type SessionUser = {
  id: string
  role: ActorType
  schoolId: string
}

export type SessionStore = {
  get: (opaqueToken: string) => Promise<SessionUser | null>
}

export type ClassroomAccessTarget = {
  id: string
  schoolId: string
  memberUserIds: string[]
}

export type ParentSummaryAccessTarget = {
  id: string
  schoolId: string
  studentId: string
  published: boolean
  guardianIds: string[]
}

export type SafeguardingCaseAccessTarget = {
  id: string
  schoolId: string
  assigneeId: string | null
}

export class AuthorizationError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "ROLE_FORBIDDEN") {
    super(code)
    this.name = "AuthorizationError"
  }
}

export function requireRole(
  user: SessionUser | null,
  role: ActorType,
): SessionUser {
  if (!user) throw new AuthorizationError("UNAUTHENTICATED")
  if (user.role !== role) throw new AuthorizationError("ROLE_FORBIDDEN")
  return user
}

export async function getSessionUser(
  cookieHeader: string | null | undefined,
  store: SessionStore,
): Promise<SessionUser | null> {
  const token = readSessionCookie(cookieHeader)
  return token ? store.get(token) : null
}

export function canAccessClassroom(
  user: SessionUser,
  classroom: ClassroomAccessTarget,
): boolean {
  if (user.schoolId !== classroom.schoolId) return false
  if (user.role === "admin") return true
  return classroom.memberUserIds.includes(user.id)
}

export function canReadParentSummary(
  user: SessionUser,
  summary: ParentSummaryAccessTarget,
): boolean {
  return (
    user.role === "guardian" &&
    user.schoolId === summary.schoolId &&
    summary.published &&
    summary.guardianIds.includes(user.id)
  )
}

export function canAccessSafeguardingCase(
  user: SessionUser,
  caseTarget: SafeguardingCaseAccessTarget,
): boolean {
  return (
    user.role === "safeguarding_lead" &&
    user.schoolId === caseTarget.schoolId &&
    user.id === caseTarget.assigneeId
  )
}
