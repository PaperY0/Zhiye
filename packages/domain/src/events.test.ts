import { describe, expect, it } from "vitest"
import { domainEventSchema } from "./events"

describe("pilot domain event schema", () => {
  it("accepts required metadata and rejects protected content", () => {
    const valid = domainEventSchema.parse({
      eventId: "evt-1",
      eventName: "lesson_published",
      occurredAt: "2026-08-02T12:00:00+08:00",
      actorType: "teacher",
      actorId: "teacher-li",
      schoolId: "school-1",
      classId: "class-1",
      subject: "数学",
      grade: "五年级",
      objectType: "lesson",
      objectId: "lesson-1",
      result: "published",
      idempotencyKey: "lesson-1-published-1",
      schemaVersion: 1,
    })

    expect(valid.eventName).toBe("lesson_published")
    expect(
      domainEventSchema.safeParse({ ...valid, protectedBody: "不得进入事件" })
        .success,
    ).toBe(false)
  })
})
