export type Subject = "数学" | "语文" | "英语"

export type LessonStatus =
  | "scheduled"
  | "recording"
  | "paused"
  | "processing"
  | "draft-ready"
  | "published"

export type SyncStatus = "local" | "syncing" | "synced"

export type TranscriptSegment = {
  id: string
  speaker: string
  startSeconds: number
  endSeconds: number
  body: string
  evidenceFor?: string[]
}

export type LessonSuggestion = {
  id: string
  title: string
  body: string
  confidence: "low" | "medium" | "high"
  status: "pending" | "accepted" | "ignored"
  evidenceIds: string[]
}

export type Lesson = {
  id: string
  title: string
  subject: Subject
  grade: string
  className: string
  date: string
  durationMinutes: number
  status: LessonStatus
  syncStatus: SyncStatus
  studentVisibility: "hidden" | "visible"
  recap: string
  recapTags: string[]
  transcript: TranscriptSegment[]
  suggestions: LessonSuggestion[]
  progress: {
    chapter: string
    completedPercent: number
    nextStep: string
  }
}

export type MistakeMastery = "new" | "learning" | "basic" | "mastered"

export type Mistake = {
  id: string
  subject: Subject
  knowledgePoint: string
  prompt: string
  cause: string
  explanation: string
  mastery: MistakeMastery
  source: "lesson" | "quiz" | "tutoring" | "task"
  createdAt: string
  reminderAt?: string
  note?: string
  imageUrl?: string
}

export type StudentTimelineEvent = {
  id: string
  type: "lesson" | "review" | "mistake" | "task" | "message"
  title: string
  detail: string
  occurredAt: string
  fact: boolean
}

export type Student = {
  id: string
  name: string
  avatarText: string
  className: string
  grade: string
  guardianName: string
  guardianRelation: string
  voluntaryQuestions: number
  practiceCount: number
  taskCompletionRate: number
  currentFocus: string[]
  facts: string[]
  aiInferences: string[]
  teacherNotes: string[]
  mistakes: Mistake[]
  timeline: StudentTimelineEvent[]
}

export type KnowledgeSignal = {
  id: string
  subject: Subject
  knowledgePoint: string
  step: string
  severity: "watch" | "attention" | "priority"
  affectedStudentIds: string[]
  affectedCount: number
  trend: number[]
  evidence: string[]
  observedAt: string
}

export type PlanDraft = {
  id: string
  title: string
  subject: Subject
  grade: string
  chapter: string
  objective: string
  context: string
  evidence: string[]
  outline: string[]
  examples: string[]
  misconceptions: string[]
  suggestions: string[]
  extension: string
  status: "draft" | "ready" | "published"
  createdAt: string
}

export type QuizQuestion = {
  id: string
  prompt: string
  type: "single-choice" | "multiple-choice" | "short-answer"
  options: string[]
  answer: string | string[]
  explanation: string
  score: number
}

export type Quiz = {
  id: string
  title: string
  subject: Subject
  lessonId?: string
  status: "draft" | "ready" | "published"
  questions: QuizQuestion[]
  createdAt: string
}

export type TaskStatus = "draft" | "active" | "review" | "completed"

export type TaskCompletion = {
  studentId: string
  status: "not-started" | "in-progress" | "submitted" | "reviewed"
  submittedAt?: string
  score?: number
}

export type Task = {
  id: string
  title: string
  type: "review" | "practice" | "quiz" | "reading"
  content: string
  audience: {
    kind: "class" | "students"
    label: string
    studentIds: string[]
  }
  dueAt: string
  reminder: string
  status: TaskStatus
  completions: TaskCompletion[]
  createdAt: string
}

export type MessageSenderRole = "teacher" | "student" | "parent" | "system"

export type Message = {
  id: string
  senderId: string
  senderName: string
  senderRole: MessageSenderRole
  body: string
  sentAt: string
  attachment?: {
    name: string
    kind: "image" | "document" | "audio"
  }
}

export type Conversation = {
  id: string
  kind: "student" | "parent" | "group"
  title: string
  participantIds: string[]
  participantNames: string[]
  boundStudentId?: string
  unreadCount: number
  messages: Message[]
}

export type ParentSummary = {
  id: string
  studentId: string
  studentName: string
  className: string
  weekLabel: string
  topics: string[]
  voluntaryQuestions: number
  practiceCount: number
  encouragement: string
  teacherMessage: string
  audioLetter: {
    title: string
    durationSeconds: number
    simulated: true
  }
}

export type SafetyCaseStatus = "new" | "reviewing" | "transferred" | "resolved"

export type SafetyCaseNote = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type SafetyCase = {
  id: string
  title: string
  signal: string
  source: "student-message" | "teacher-observation" | "system-pattern"
  status: SafetyCaseStatus
  priority: "normal" | "high" | "urgent"
  studentAlias: string
  className: string
  limitedContext: string
  guidance: string[]
  assignee?: string
  transferredTo?: string
  notes: SafetyCaseNote[]
  createdAt: string
  updatedAt: string
}

export type AuditEvent = {
  id: string
  actor: string
  action: string
  objectType: "safety-case" | "settings" | "invitation" | "lesson" | "task"
  objectId: string
  purpose: string
  occurredAt: string
}
