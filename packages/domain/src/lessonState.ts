export type LessonArtifactStatus = "DRAFT" | "CONFIRMED" | "PUBLISHED"

export class DomainRuleError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = "DomainRuleError"
  }
}

export function confirmLessonArtifact(
  status: LessonArtifactStatus,
): LessonArtifactStatus {
  if (status !== "DRAFT") {
    throw new DomainRuleError("LESSON_ARTIFACT_CONFIRMATION_INVALID")
  }
  return "CONFIRMED"
}

export function publishLessonArtifact(
  status: LessonArtifactStatus,
): LessonArtifactStatus {
  if (status !== "CONFIRMED") {
    throw new DomainRuleError("LESSON_ARTIFACT_CONFIRMATION_REQUIRED")
  }
  return "PUBLISHED"
}
