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
import { acceptanceFixtureSet } from "./acceptanceFixtures"
import { emptyFixtureSet } from "./emptyFixtures"
import { isCompleteLessonAnalysis } from "../../services/lessonAnalysis"
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
  parentSummary: ParentSummary | null
  safetyCases: SafetyCase[]
  auditEvents: AuditEvent[]
  createLesson(): string
  updateLessonTitle(id: string, title: string): void
  updateLessonStatus(id: string, status: Lesson["status"]): void
  updateLessonSuggestionStatus(
    lessonId: string,
    suggestionId: string,
    status: Lesson["suggestions"][number]["status"],
  ): void
  updateLessonProgress(id: string, completedPercent: number, nextStep: string): void
  publishLesson(id: string): void
  updateLessonRecap(id: string, recap: string): void
  updateLessonAnalysis(
    id: string,
    transcript: Lesson["transcript"],
    recap: string,
    recapTags: string[],
    nextStep: string,
    durationMinutes: number,
    teacherReport: string,
    progressSuggestion: string,
    evidence: string[],
  ): void
  deleteLesson(id: string): void
  addPlan(plan: PlanDraft): void
  updatePlanTitle(id: string, title: string): void
  deletePlan(id: string): void
  addQuiz(quiz: Quiz): void
  updateQuizTitle(id: string, title: string): void
  deleteQuiz(id: string): void
  addTask(task: Task): void
  updateTaskTitle(id: string, title: string): void
  deleteTask(id: string): void
  updateTaskStatus(id: string, status: Task["status"]): void
  updateTaskCompletion(
    taskId: string,
    studentId: string,
    status: Task["completions"][number]["status"],
  ): void
  sendMessage(id: string, body: string): void
  updateConversationTitle(id: string, title: string): void
  deleteConversation(id: string): void
  addMistake(studentId: string, mistake: Student["mistakes"][number]): void
  updateMistake(studentId: string, mistakeId: string, patch: Partial<Mistake>): void
  addStudentTimelineEvent(studentId: string, event: StudentTimelineEvent): void
  addStudentTeacherNote(studentId: string, note: string): void
  resetPrototype(): void
  updateSafetyCase(id: string, patch: Partial<SafetyCase>): void
  addAuditEvent(event: AuditEvent): void
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)
const fullPrototypeStorageKey = "zhiye-prototype-state-v1"
const acceptancePrototypeStorageKey = "zhiye-prototype-state-acceptance-v1"

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

export function hasCompleteLessonAnalysis(lesson: Lesson) {
  return isCompleteLessonAnalysis({
    transcript: lesson.transcript,
    recap: lesson.recap,
    recapTags: lesson.recapTags,
    nextStep: lesson.progress.nextStep,
    teacherReport: lesson.teacherReport,
    progressSuggestion: lesson.progressSuggestion,
    evidence: lesson.evidence,
  })
}

export function hasCompleteAiDraft(lesson: Lesson) {
  return (
    lesson.status === "draft-ready" &&
    hasCompleteLessonAnalysis(lesson)
  )
}

function readPrototypeSnapshot(storageKey: string): Partial<PrototypeSnapshot> | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
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
  dataset = "full",
}: {
  children: ReactNode
  persist?: boolean
  dataset?: "acceptance" | "full" | "empty"
}) {
  const fixtureSet =
    dataset === "acceptance"
      ? acceptanceFixtureSet
      : dataset === "empty"
        ? emptyFixtureSet
        : null
  const storageKey =
    dataset === "acceptance"
      ? acceptancePrototypeStorageKey
      : fullPrototypeStorageKey
  if (persist && dataset === "empty") {
    window.localStorage.removeItem(fullPrototypeStorageKey)
    window.localStorage.removeItem(acceptancePrototypeStorageKey)
  }
  const persisted = persist && dataset !== "empty" ? readPrototypeSnapshot(storageKey) : null
  if (persist && dataset === "acceptance") {
    window.localStorage.removeItem(fullPrototypeStorageKey)
  }
  const [lessons, setLessons] = useState(() =>
    cloneFixture(persisted?.lessons ?? fixtureSet?.lessons ?? lessonFixtures),
  )
  const [students, setStudents] = useState(() =>
    cloneFixture(persisted?.students ?? fixtureSet?.students ?? studentFixtures),
  )
  const [signals] = useState(() =>
    cloneFixture(fixtureSet?.signals ?? knowledgeSignalFixtures),
  )
  const [plans, setPlans] = useState(() =>
    cloneFixture(persisted?.plans ?? fixtureSet?.plans ?? planFixtures),
  )
  const [quizzes, setQuizzes] = useState(() =>
    cloneFixture(persisted?.quizzes ?? fixtureSet?.quizzes ?? quizFixtures),
  )
  const [tasks, setTasks] = useState(() =>
    cloneFixture(persisted?.tasks ?? fixtureSet?.tasks ?? taskFixtures),
  )
  const [conversations, setConversations] = useState(() =>
    cloneFixture(
      persisted?.conversations ?? fixtureSet?.conversations ?? conversationFixtures,
    ),
  )
  const [parentSummary] = useState(() =>
    cloneFixture(
      dataset === "empty"
        ? null
        : fixtureSet?.parentSummary ?? parentSummaryFixture,
    ),
  )
  const [safetyCases, setSafetyCases] = useState(() =>
    cloneFixture(persisted?.safetyCases ?? fixtureSet?.safetyCases ?? safetyCaseFixtures),
  )
  const [auditEvents, setAuditEvents] = useState(() =>
    cloneFixture(persisted?.auditEvents ?? fixtureSet?.auditEvents ?? auditEventFixtures),
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
      window.localStorage.setItem(storageKey, JSON.stringify(snapshot))
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
      updateLessonTitle(id, title) {
        const normalized = title.trim()
        if (!normalized) return
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id ? { ...lesson, title: normalized } : lesson,
          ),
        )
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
            lesson.id === id && hasCompleteAiDraft(lesson)
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
      updateLessonAnalysis(
        id,
        transcript,
        recap,
        recapTags,
        nextStep,
        durationMinutes,
        teacherReport,
        progressSuggestion,
        evidence,
      ) {
        const analysis = {
          transcript,
          recap,
          recapTags,
          nextStep,
          teacherReport,
          progressSuggestion,
          evidence,
        }
        if (!isCompleteLessonAnalysis(analysis)) return
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id
              ? {
                  ...lesson,
                  transcript,
                  recap,
                  recapTags,
                  teacherReport,
                  progressSuggestion,
                  evidence,
                  status: "draft-ready",
                  syncStatus: "local",
                  durationMinutes: Math.max(1, Math.ceil(durationMinutes)),
                  progress: {
                    ...lesson.progress,
                    nextStep,
                  },
                }
              : lesson,
          ),
        )
      },
      deleteLesson(id) {
        setLessons((current) => current.filter((lesson) => lesson.id !== id))
      },
      addPlan(plan) {
        setPlans((current) => [...current, cloneFixture(plan)])
      },
      updatePlanTitle(id, title) {
        const normalized = title.trim()
        if (!normalized) return
        setPlans((current) =>
          current.map((plan) => (plan.id === id ? { ...plan, title: normalized } : plan)),
        )
      },
      deletePlan(id) {
        setPlans((current) => current.filter((plan) => plan.id !== id))
      },
      addQuiz(quiz) {
        setQuizzes((current) => [...current, cloneFixture(quiz)])
      },
      updateQuizTitle(id, title) {
        const normalized = title.trim()
        if (!normalized) return
        setQuizzes((current) =>
          current.map((quiz) => (quiz.id === id ? { ...quiz, title: normalized } : quiz)),
        )
      },
      deleteQuiz(id) {
        setQuizzes((current) => current.filter((quiz) => quiz.id !== id))
      },
      addTask(task) {
        setTasks((current) => [...current, cloneFixture(task)])
      },
      updateTaskTitle(id, title) {
        const normalized = title.trim()
        if (!normalized) return
        setTasks((current) =>
          current.map((task) => (task.id === id ? { ...task, title: normalized } : task)),
        )
      },
      deleteTask(id) {
        setTasks((current) => current.filter((task) => task.id !== id))
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
                          updatedAt: "2026-08-02T10:00:00+08:00",
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
      updateConversationTitle(id, title) {
        const normalized = title.trim()
        if (!normalized) return
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === id ? { ...conversation, title: normalized } : conversation,
          ),
        )
      },
      deleteConversation(id) {
        setConversations((current) => current.filter((conversation) => conversation.id !== id))
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
      addStudentTeacherNote(studentId, note) {
        const normalized = note.trim()
        if (!normalized) return
        setStudents((current) =>
          current.map((student) =>
            student.id === studentId
              ? { ...student, teacherNotes: [...student.teacherNotes, normalized] }
              : student,
          ),
        )
      },
      resetPrototype() {
        window.localStorage.removeItem("zhiye-teacher-settings-v1")
        window.localStorage.removeItem("zhiye-admin-settings-v1")
        window.localStorage.removeItem(storageKey)
        setLessons(cloneFixture(fixtureSet?.lessons ?? lessonFixtures))
        setStudents(cloneFixture(fixtureSet?.students ?? studentFixtures))
        setPlans(cloneFixture(fixtureSet?.plans ?? planFixtures))
        setQuizzes(cloneFixture(fixtureSet?.quizzes ?? quizFixtures))
        setTasks(cloneFixture(fixtureSet?.tasks ?? taskFixtures))
        setConversations(cloneFixture(fixtureSet?.conversations ?? conversationFixtures))
        setSafetyCases(cloneFixture(fixtureSet?.safetyCases ?? safetyCaseFixtures))
        setAuditEvents(cloneFixture(fixtureSet?.auditEvents ?? auditEventFixtures))
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

export function usePrototypeOptional(): PrototypeContextValue | null {
  return useContext(PrototypeContext)
}
