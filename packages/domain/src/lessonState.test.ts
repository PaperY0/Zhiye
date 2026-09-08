import { describe, expect, it } from "vitest"
import { confirmLessonArtifact, publishLessonArtifact } from "./lessonState"

describe("lesson artifact publication state", () => {
  it("requires teacher confirmation before publishing to students", () => {
    expect(confirmLessonArtifact("DRAFT")).toBe("CONFIRMED")
    expect(publishLessonArtifact("CONFIRMED")).toBe("PUBLISHED")
    expect(() => publishLessonArtifact("DRAFT")).toThrow(
      "LESSON_ARTIFACT_CONFIRMATION_REQUIRED",
    )
  })
})
