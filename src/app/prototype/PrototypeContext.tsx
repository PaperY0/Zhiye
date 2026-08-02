import {
  createContext,
  useContext,
  useEffect,
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
  Mistake,
  ParentSummary,
  PlanDraft,
  Quiz,
  SafetyCase,
  Student,
  StudentTimelineEvent,
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
  createLesson(): string
  updateLessonStatus(id: string, status: Lesson["status"]): void
  updateLessonSuggestionStatus(
    lessonId: string,
    suggestionId: string,
    status: Lesson["suggestions"][number]["status"],
  ): void
  updateLessonProgress(id: string, completedPercent: number, nextStep: string): void
  publishLesson(id: string): void
  updateLessonRecap(id: string, recap: string): void
  addPlan(plan: PlanDraft): void
  addQuiz(quiz: Quiz): void
  addTask(task: Task): void
  updateTaskStatus(id: string, status: Task["status"]): void
  updateTaskCompletion(
    taskId: string,
    studentId: string,
    status: Task["completions"][number]["status"],
  ): void
  sendMessage(id: string, body: string): void
  addMistake(studentId: string, mistake: Student["mistakes"][number]): void
  updateMistake(studentId: string, mistakeId: string, patch: Partial<Mistake>): void
  addStudentTimelineEvent(studentId: string, event: StudentTimelineEvent): void
  updateSafetyCase(id: string, patch: Partial<SafetyCase>): void
  addAuditEvent(event: AuditEvent): void
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)
const prototypeStorageKey = "zhiye-prototype-state-v1"

type PrototypeSnapshot = Pick<
  PrototypeContextValue,
  | "lessons"
  | "students"
  | "plans"
  | "quizzes"
  | "tasks"
  | "conversations"
  | "safetyCases"
  | "auditEvents"
>

function readPrototypeSnapshot(): Partial<PrototypeSnapshot> | null {
  try {
    const raw = window.localStorage.getItem(prototypeStorageKey)
    return raw ? (JSON.parse(raw) as Partial<PrototypeSnapshot>) : null
  } catch {
    return null
  }
}

function cloneFixture<T>(fixture: T): T {
  return structuredClone(fixture)
}

export function PrototypeProvider({
  children,
  persist = false,
}: {
  children: ReactNode
  persist?: boolean
}) {
  const persisted = persist ? readPrototypeSnapshot() : null
  const [lessons, setLessons] = useState(() =>
    cloneFixture(persisted?.lessons ?? lessonFixtures),
  )
  const [students, setStudents] = useState(() =>
    cloneFixture(persisted?.students ?? studentFixtures),
  )
  const [signals] = useState(() => cloneFixture(knowledgeSignalFixtures))
  const [plans, setPlans] = useState(() =>
    cloneFixture(persisted?.plans ?? planFixtures),
  )
  const [quizzes, setQuizzes] = useState(() =>
    cloneFixture(persisted?.quizzes ?? quizFixtures),
  )
  const [tasks, setTasks] = useState(() =>
    cloneFixture(persisted?.tasks ?? taskFixtures),
  )
  const [conversations, setConversations] = useState(() =>
    cloneFixture(persisted?.conversations ?? conversationFixtures),
  )
  const [parentSummary] = useState(() => cloneFixture(parentSummaryFixture))
  const [safetyCases, setSafetyCases] = useState(() =>
    cloneFixture(persisted?.safetyCases ?? safetyCaseFixtures),
  )
  const [auditEvents, setAuditEvents] = useState(() =>
    cloneFixture(persisted?.auditEvents ?? auditEventFixtures),
  )

  useEffect(() => {
    if (!persist) return
    try {
      const snapshot: PrototypeSnapshot = {
        lessons,
        students,
        plans,
        quizzes,
        tasks,
        conversations,
        safetyCases,
        auditEvents,
      }
      window.localStorage.setItem(prototypeStorageKey, JSON.stringify(snapshot))
    } catch {
      // Storage is best-effort in the prototype; in-memory state remains usable.
    }
  }, [auditEvents, conversations, lessons, persist, plans, quizzes, safetyCases, students, tasks])

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
      createLesson() {
        const id = `lesson-recording-${lessons.length + 1}`
        setLessons((current) => [
          ...current,
          {
            id,
            title: "新课堂录音",
            subject: "数学",
            grade: "五年级",
            className: "五年级（2）班",
            date: "2026-07-26",
            durationMinutes: 0,
            status: "scheduled",
            syncStatus: "local",
            studentVisibility: "hidden",
            recap: "",
            recapTags: [],
            transcript: [],
            suggestions: [],
            progress: {
              chapter: "待识别",
              completedPercent: 0,
              nextStep: "等待课堂内容整理",
            },
          },
        ])
        return id
      },
      updateLessonStatus(id, status) {
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id ? { ...lesson, status } : lesson,
          ),
        )
      },
      updateLessonSuggestionStatus(lessonId, suggestionId, status) {
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  suggestions: lesson.suggestions.map((suggestion) =>
                    suggestion.id === suggestionId
                      ? { ...suggestion, status }
                      : suggestion,
                  ),
                }
              : lesson,
          ),
        )
      },
      updateLessonProgress(id, completedPercent, nextStep) {
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id
              ? {
                  ...lesson,
                  progress: {
                    ...lesson.progress,
                    completedPercent: Math.min(100, Math.max(0, completedPercent)),
                    nextStep: nextStep.trim(),
                  },
                }
              : lesson,
          ),
        )
      },
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
      updateTaskCompletion(taskId, studentId, status) {
        setTasks((current) =>
          current.map((task) => {
            if (task.id !== taskId) return task
            const hasCompletion = task.completions.some(
              (completion) => completion.studentId === studentId,
            )
            return {
              ...task,
              completions: hasCompletion
                ? task.completions.map((completion) =>
                    completion.studentId === studentId
                      ? {
                          ...completion,
                          status,
                          submittedAt:
                            status === "submitted" || status === "reviewed"
                              ? "2026-08-01T16:00:00+08:00"
                              : completion.submittedAt,
                        }
                      : completion,
                  )
                : [
                    ...task.completions,
                    { studentId, status },
                  ],
            }
          }),
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
      updateMistake(studentId, mistakeId, patch) {
        setStudents((current) =>
          current.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  mistakes: student.mistakes.map((mistake) =>
                    mistake.id === mistakeId
                      ? { ...mistake, ...cloneFixture(patch) }
                      : mistake,
                  ),
                }
              : student,
          ),
        )
      },
      addStudentTimelineEvent(studentId, event) {
        setStudents((current) =>
          current.map((student) =>
            student.id === studentId
              ? { ...student, timeline: [...student.timeline, cloneFixture(event)] }
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
