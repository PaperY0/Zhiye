import { z } from "zod"

export const domainEventSchema = z
  .object({
    eventId: z.string().min(1),
    eventName: z.string().min(1),
    occurredAt: z.string().min(1),
    actorType: z.enum(["teacher", "student", "guardian", "admin", "safeguarding_lead"]),
    actorId: z.string().min(1),
    schoolId: z.string().min(1),
    classId: z.string().min(1).optional(),
    subject: z.enum(["数学", "语文", "英语"]).optional(),
    grade: z.string().min(1).optional(),
    objectType: z.enum([
      "lesson",
      "lesson_artifact",
      "learning_loop",
      "class_insight",
      "parent_summary",
      "feedback_case",
      "safeguarding_case",
    ]),
    objectId: z.string().min(1),
    result: z.enum(["opened", "confirmed", "published", "viewed", "completed", "routed", "updated"]),
    failureCode: z.string().min(1).optional(),
    idempotencyKey: z.string().min(1),
    schemaVersion: z.number().int().positive(),
  })
  .strict()

export type DomainEvent = z.infer<typeof domainEventSchema>
