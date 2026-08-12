import { describe, expect, it } from "vitest"
import { pilotSeed, pilotSeedInvariants } from "./seed-data"

describe("redacted pilot database seed", () => {
  it("contains one minimal chain and no plaintext protected content", () => {
    expect(pilotSeedInvariants).toEqual({
      schools: 1,
      classrooms: 1,
      students: 1,
      lessons: 1,
      lessonArtifacts: 1,
      feedbackCases: 1,
    })
    expect(pilotSeed.feedbackCase.protectedBodyEncrypted).toMatch(
      /^<encrypted-demo-payload>$/,
    )
    expect(pilotSeed.feedbackCase).not.toHaveProperty("body")
    expect(pilotSeed.lesson).not.toHaveProperty("transcript")
  })
})
