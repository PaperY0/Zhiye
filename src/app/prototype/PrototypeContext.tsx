import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  auditEventFixtures,
  conversationFixtures,
  knowledgeSignalFixtures,
  lessonFixtures,
  parentSummaryFixture,
  planFixtures,
  quizFixtures,
  safetyCaseFixtures,
  studentFixtures,
  taskFixtures,
} from "./fixtures"
import type {
  AuditEvent,
  Conversation,
  KnowledgeSignal,
  Lesson,
  ParentSummary,
  PlanDraft,
  Quiz,
  SafetyCase,
  Student,
  Task,
} from "./types"

export type PrototypeContextValue = {
  lessons: Lesson[]
  students: Student[]
  signals: KnowledgeSignal[]
  plans: PlanDraft[]
  quizzes: Quiz[]
  tasks: Task[]
  conversations: Conversation[]
  parentSummary: ParentSummary
  safetyCases: SafetyCase[]
  auditEvents: AuditEvent[]
  publishLesson(id: string): void
  updateLessonRecap(id: string, recap: string): void
  addPlan(plan: PlanDraft): void
  addQuiz(quiz: Quiz): void
  addTask(task: Task): void
  updateTaskStatus(id: string, status: Task["status"]): void
  sendMessage(id: string, body: string): void
  addMistake(studentId: string, mistake: Student["mistakes"][number]): void
  updateSafetyCase(id: string, patch: Partial<SafetyCase>): void
  addAuditEvent(event: AuditEvent): void
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)

function cloneFixture<T>(fixture: T): T {
  return structuredClone(fixture)
}

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState(() => cloneFixture(lessonFixtures))
  const [students, setStudents] = useState(() => cloneFixture(studentFixtures))
  const [signals] = useState(() => cloneFixture(knowledgeSignalFixtures))
  const [plans, setPlans] = useState(() => cloneFixture(planFixtures))
  const [quizzes, setQuizzes] = useState(() => cloneFixture(quizFixtures))
  const [tasks, setTasks] = useState(() => cloneFixture(taskFixtures))
  const [conversations, setConversations] = useState(() =>
    cloneFixture(conversationFixtures),
  )
  const [parentSummary] = useState(() => cloneFixture(parentSummaryFixture))
  const [safetyCases, setSafetyCases] = useState(() =>
    cloneFixture(safetyCaseFixtures),
  )
  const [auditEvents, setAuditEvents] = useState(() => cloneFixture(auditEventFixtures))

  const value = useMemo<PrototypeContextValue>(
    () => ({
      lessons,
      students,
      signals,
      plans,
      quizzes,
      tasks,
      conversations,
      parentSummary,
      safetyCases,
      auditEvents,
      publishLesson(id) {
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id
              ? {
                  ...lesson,
                  status: "published",
                  studentVisibility: "visible",
                }
              : lesson,
          ),
        )
      },
      updateLessonRecap(id, recap) {
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id ? { ...lesson, recap } : lesson,
          ),
        )
      },
      addPlan(plan) {
        setPlans((current) => [...current, cloneFixture(plan)])
      },
      addQuiz(quiz) {
        setQuizzes((current) => [...current, cloneFixture(quiz)])
      },
      addTask(task) {
        setTasks((current) => [...current, cloneFixture(task)])
      },
      updateTaskStatus(id, status) {
        setTasks((current) =>
          current.map((task) => (task.id === id ? { ...task, status } : task)),
        )
      },
      sendMessage(id, body) {
        const normalizedBody = body.trim()
        if (!normalizedBody) return

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === id
              ? {
                  ...conversation,
                  unreadCount: 0,
                  messages: [
                    ...conversation.messages,
                    {
                      id: `message-local-${conversation.messages.length + 1}`,
                      senderId: "teacher-li",
                      senderName: "李老师",
                      senderRole: "teacher",
                      body: normalizedBody,
                      sentAt: "2026-07-25T16:00:00+08:00",
                    },
                  ],
                }
              : conversation,
          ),
        )
      },
      addMistake(studentId, mistake) {
        setStudents((current) =>
          current.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  mistakes: [...student.mistakes, cloneFixture(mistake)],
                }
              : student,
          ),
        )
      },
      updateSafetyCase(id, patch) {
        setSafetyCases((current) =>
          current.map((safetyCase) =>
            safetyCase.id === id
              ? {
                  ...safetyCase,
                  ...cloneFixture(patch),
                  id: safetyCase.id,
                }
              : safetyCase,
          ),
        )
      },
      addAuditEvent(event) {
        setAuditEvents((current) => [...current, cloneFixture(event)])
      },
    }),
    [
      auditEvents,
      conversations,
      lessons,
      parentSummary,
      plans,
      quizzes,
      safetyCases,
      signals,
      students,
      tasks,
    ],
  )

  return (
    <PrototypeContext.Provider value={value}>
      {children}
    </PrototypeContext.Provider>
  )
}

export function usePrototype(): PrototypeContextValue {
  const value = useContext(PrototypeContext)
  if (!value) {
    throw new Error("usePrototype must be used within PrototypeProvider")
  }
  return value
}
