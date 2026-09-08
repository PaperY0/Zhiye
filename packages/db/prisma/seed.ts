import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { pilotSeed } from "./seed-data.ts"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the database seed")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function seed() {
  await prisma.$transaction(async (tx) => {
    await tx.school.upsert({
      where: { id: pilotSeed.school.id },
      update: { name: pilotSeed.school.name },
      create: pilotSeed.school,
    })

    for (const user of pilotSeed.users) {
      await tx.user.upsert({
        where: { id: user.id },
        update: { email: user.email, displayName: user.displayName, role: user.role, schoolId: pilotSeed.school.id },
        create: { ...user, schoolId: pilotSeed.school.id },
      })
    }

    await tx.classroom.upsert({
      where: { id: pilotSeed.classroom.id },
      update: { name: pilotSeed.classroom.name, grade: pilotSeed.classroom.grade },
      create: { ...pilotSeed.classroom, schoolId: pilotSeed.school.id },
    })

    await tx.enrollment.upsert({
      where: { classroomId_userId: { classroomId: pilotSeed.classroom.id, userId: "user-student-01" } },
      update: {},
      create: { classroomId: pilotSeed.classroom.id, userId: "user-student-01" },
    })

    await tx.guardianLink.upsert({
      where: { guardianId_studentId: { guardianId: "user-guardian-01", studentId: "user-student-01" } },
      update: {},
      create: { guardianId: "user-guardian-01", studentId: "user-student-01" },
    })

    await tx.lesson.upsert({
      where: { id: pilotSeed.lesson.id },
      update: { title: pilotSeed.lesson.title, status: pilotSeed.lesson.status },
      create: {
        ...pilotSeed.lesson,
        schoolId: pilotSeed.school.id,
        classroomId: pilotSeed.classroom.id,
        createdById: "user-teacher-01",
        date: new Date("2026-08-01T09:00:00.000Z"),
      },
    })

    await tx.lessonArtifact.upsert({
      where: { id: pilotSeed.lessonArtifact.id },
      update: { status: pilotSeed.lessonArtifact.status, recap: pilotSeed.lessonArtifact.recap },
      create: { ...pilotSeed.lessonArtifact, lessonId: pilotSeed.lesson.id },
    })

    await tx.learningEvent.upsert({
      where: { id: pilotSeed.learningEvent.id },
      update: {},
      create: {
        ...pilotSeed.learningEvent,
        studentId: "user-student-01",
        lessonId: pilotSeed.lesson.id,
        occurredAt: new Date("2026-08-01T10:00:00.000Z"),
        metadata: { source: "pilot-seed" },
      },
    })

    await tx.task.upsert({
      where: { id: pilotSeed.task.id },
      update: { title: pilotSeed.task.title, status: pilotSeed.task.status },
      create: {
        ...pilotSeed.task,
        classroomId: pilotSeed.classroom.id,
        lessonId: pilotSeed.lesson.id,
        content: "完成一题分数约分自检，并写下你的判断依据。",
      },
    })

    await tx.parentSummary.upsert({
      where: { id: pilotSeed.parentSummary.id },
      update: { weekLabel: pilotSeed.parentSummary.weekLabel, publishedAt: null },
      create: {
        ...pilotSeed.parentSummary,
        studentId: "user-student-01",
        createdById: "user-teacher-01",
        topics: ["分数的基本性质"],
        content: { learningFacts: ["查看课堂复习卡"], encouragement: "继续先想再问。" },
      },
    })

    await tx.feedbackCase.upsert({
      where: { id: pilotSeed.feedbackCase.id },
      update: { status: pilotSeed.feedbackCase.status, category: pilotSeed.feedbackCase.category },
      create: {
        ...pilotSeed.feedbackCase,
        schoolId: pilotSeed.school.id,
        reporterId: "user-student-01",
      },
    })

    await tx.auditLog.upsert({
      where: { id: pilotSeed.auditLog.id },
      update: { action: pilotSeed.auditLog.action },
      create: {
        ...pilotSeed.auditLog,
        schoolId: pilotSeed.school.id,
        actorId: "user-admin-01",
      },
    })
  })
}

try {
  await seed()
  console.log("Seeded one sanitized pilot chain.")
} finally {
  await prisma.$disconnect()
}
