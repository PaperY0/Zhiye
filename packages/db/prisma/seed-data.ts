export const pilotSeed = {
  school: {
    id: "school-demo-01",
    name: "知野首轮脱敏试点学校",
  },
  users: [
    {
      id: "user-teacher-01",
      email: "teacher@example.test",
      role: "TEACHER",
      displayName: "演示教师",
    },
    {
      id: "user-student-01",
      email: "student@example.test",
      role: "STUDENT",
      displayName: "演示学生",
    },
    {
      id: "user-guardian-01",
      email: "guardian@example.test",
      role: "GUARDIAN",
      displayName: "演示监护人",
    },
    {
      id: "user-admin-01",
      email: "admin@example.test",
      role: "ADMIN",
      displayName: "演示管理员",
    },
  ],
  classroom: {
    id: "class-demo-01",
    name: "五年级（演示）班",
    grade: "五年级",
  },
  lesson: {
    id: "lesson-demo-01",
    title: "分数的基本性质（脱敏课堂）",
    subject: "数学",
    grade: "五年级",
    status: "DRAFT_READY",
  },
  lessonArtifact: {
    id: "artifact-demo-01",
    status: "DRAFT",
    recap: "分子和分母同时乘或除以相同的数，分数的大小不变。",
  },
  learningEvent: {
    id: "learning-event-demo-01",
    type: "RECAP_VIEWED",
    objectId: "artifact-demo-01",
  },
  task: {
    id: "task-demo-01",
    title: "分数基本性质自检",
    status: "DRAFT",
  },
  parentSummary: {
    id: "summary-demo-01",
    weekLabel: "首轮演示周",
    publishedAt: null,
  },
  feedbackCase: {
    id: "feedback-demo-01",
    status: "NEW",
    category: "需要人工核实",
    protectedBodyEncrypted: "<encrypted-demo-payload>",
  },
  auditLog: {
    id: "audit-demo-01",
    action: "创建脱敏演示数据",
    objectType: "seed",
    objectId: "school-demo-01",
    purpose: "本地开发与权限验收",
  },
} as const

export const pilotSeedInvariants = {
  schools: 1,
  classrooms: 1,
  students: 1,
  lessons: 1,
  lessonArtifacts: 1,
  feedbackCases: 1,
} as const
