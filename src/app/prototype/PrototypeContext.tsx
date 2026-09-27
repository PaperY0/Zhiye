import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  auditEventFixtures,
  conversationFixtures,
  knowledgeSignalFixtures,
  learningTopicFixtures,
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
import { isCompleteLessonAnalysis, lessonTopicFromContent } from "../../services/lessonAnalysis"
import { listenForPrototypeSync, publishPrototypeSync } from "./prototypeSync"
import { unreadForRole } from "./conversationOrder"
import {
  getGradeFromClassName,
  getTeacherSettings,
  resetTeacherSettings,
} from "../../features/teacher/settings/teacherSettings"
import type {
  AuditEvent,
  ApprovedStudentObservation,
  Conversation,
  KnowledgeSignal,
  LearningTopic,
  Lesson,
  Message,
  Mistake,
  ParentSummary,
  PlanDraft,
  Quiz,
  RecapJob,
  SafetyCase,
  Student,
  StudentTimelineEvent,
  Task,
} from "./types"

export type PrototypeContextValue = {
  storageError: string | null
  lessons: Lesson[]
  students: Student[]
  signals: KnowledgeSignal[]
  learningTopics: LearningTopic[]
  plans: PlanDraft[]
  quizzes: Quiz[]
  tasks: Task[]
  conversations: Conversation[]
  parentSummary: ParentSummary | null
  safetyCases: SafetyCase[]
  auditEvents: AuditEvent[]
  recapJobs: RecapJob[]
  createLesson(defaults?: { className?: string; chapter?: string }): string
  restoreLesson(lesson: Lesson): void
  updateLessonTitle(id: string, title: string): void
  updateLessonStatus(id: string, status: Lesson["status"]): void
  updateLessonSuggestionStatus(
    lessonId: string,
    suggestionId: string,
    status: Lesson["suggestions"][number]["status"],
  ): void
  updateLessonProgress(id: string, completedPercent: number, nextStep: string, chapter?: string): void
  publishLesson(id: string, recap?: string): void
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
    title: string,
    chapter?: string,
  ): void
  deleteLesson(id: string): void
  addStudent(student: Student): void
  updateStudent(id: string, patch: Partial<Student>): void
  deleteStudent(id: string): void
  addSignal(signal: KnowledgeSignal): void
  updateSignal(id: string, patch: Partial<KnowledgeSignal>): void
  deleteSignal(id: string): void
  addPlan(plan: PlanDraft): void
  updatePlanTitle(id: string, title: string): void
  updatePlan(id: string, patch: Partial<PlanDraft>): void
  deletePlan(id: string): void
  addQuiz(quiz: Quiz): void
  updateQuizTitle(id: string, title: string): void
  updateQuiz(id: string, patch: Partial<Quiz>): void
  deleteQuiz(id: string): void
  addTask(task: Task): void
  updateTaskTitle(id: string, title: string): void
  deleteTask(id: string): void
  updateTaskStatus(id: string, status: Task["status"]): void
  updateTaskCompletion(
    taskId: string,
    studentId: string,
    status: Task["completions"][number]["status"],
    result?: Partial<Pick<Task["completions"][number], "score" | "answers" | "responseText">>,
  ): void
  sendMessage(
    id: string,
    body: string,
    sender?: Pick<Message, "senderId" | "senderName" | "senderRole">,
  ): void
  markConversationRead(id: string, role: "teacher" | "student" | "parent"): void
  updateConversationTitle(id: string, title: string): void
  deleteConversation(id: string): void
  addConversation(conversation: Conversation): void
  upsertLearningTopic(topic: LearningTopic): void
  deleteLearningTopic(id: string): void
  addMistake(studentId: string, mistake: Student["mistakes"][number]): void
  updateMistake(studentId: string, mistakeId: string, patch: Partial<Mistake>): void
  addStudentTimelineEvent(studentId: string, event: StudentTimelineEvent): void
  addStudentTeacherNote(studentId: string, note: string): void
  publishParentSummary(summary: ParentSummary): void
  approveStudentObservation(
    studentId: string,
    observation: Omit<ApprovedStudentObservation, "id" | "source" | "confirmedAt">,
  ): void
  resetPrototype(): void
  updateSafetyCase(id: string, patch: Partial<SafetyCase>): void
  addAuditEvent(event: AuditEvent): void
  upsertRecapJob(job: RecapJob): void
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)
const fullPrototypeStorageKey = "zhiye-prototype-state-v1"
const acceptancePrototypeStorageKey = "zhiye-prototype-state-acceptance-v1"

type PrototypeSnapshot = Pick<
  PrototypeContextValue,
  | "lessons"
  | "students"
  | "signals"
  | "learningTopics"
  | "plans"
  | "quizzes"
  | "tasks"
  | "conversations"
  | "parentSummary"
  | "safetyCases"
  | "auditEvents"
  | "recapJobs"
>

export function hasCompleteLessonAnalysis(lesson: Lesson) {
  return isCompleteLessonAnalysis({
    title: lesson.title,
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

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  const [signals, setSignals] = useState(() =>
    cloneFixture(persisted?.signals ?? fixtureSet?.signals ?? knowledgeSignalFixtures),
  )
  const [learningTopics, setLearningTopics] = useState(() =>
    cloneFixture(persisted?.learningTopics ?? fixtureSet?.learningTopics ?? learningTopicFixtures),
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
  const [parentSummary, setParentSummary] = useState(() =>
    cloneFixture(
      dataset === "empty"
        ? null
        : persisted?.parentSummary ?? fixtureSet?.parentSummary ?? parentSummaryFixture,
    ),
  )
  const [safetyCases, setSafetyCases] = useState(() =>
    cloneFixture(persisted?.safetyCases ?? fixtureSet?.safetyCases ?? safetyCaseFixtures),
  )
  const [auditEvents, setAuditEvents] = useState(() =>
    cloneFixture(persisted?.auditEvents ?? fixtureSet?.auditEvents ?? auditEventFixtures),
  )
  const [recapJobs, setRecapJobs] = useState(() =>
    cloneFixture(persisted?.recapJobs ?? []),
  )
  const [storageError, setStorageError] = useState<string | null>(null)
  const skipNextSyncPublishRef = useRef(false)

  useEffect(() => {
    if (!persist) return
    if (skipNextSyncPublishRef.current) {
      skipNextSyncPublishRef.current = false
      return
    }
    try {
      const snapshot: PrototypeSnapshot = {
        lessons,
        students,
        signals,
        learningTopics,
        plans,
        quizzes,
        tasks,
        conversations,
        parentSummary,
        safetyCases,
        auditEvents,
        recapJobs,
      }
      window.localStorage.setItem(storageKey, JSON.stringify(snapshot))
      setStorageError(null)
      publishPrototypeSync(storageKey, snapshot)
    } catch {
      setStorageError("浏览器本地存储失败。当前修改只在本次打开期间可见，请检查可用空间或浏览器存储权限。")
    }
  }, [auditEvents, conversations, learningTopics, lessons, parentSummary, persist, plans, quizzes, recapJobs, safetyCases, signals, students, tasks])

  useEffect(() => {
    if (!persist || dataset === "empty") return
    return listenForPrototypeSync(storageKey, (incoming) => {
      const snapshot = incoming as Partial<PrototypeSnapshot>
      skipNextSyncPublishRef.current = true
      if (snapshot.lessons) setLessons(cloneFixture(snapshot.lessons))
      if (snapshot.students) setStudents(cloneFixture(snapshot.students))
      if (snapshot.signals) setSignals(cloneFixture(snapshot.signals))
      if (snapshot.learningTopics) setLearningTopics(cloneFixture(snapshot.learningTopics))
      if (snapshot.plans) setPlans(cloneFixture(snapshot.plans))
      if (snapshot.quizzes) setQuizzes(cloneFixture(snapshot.quizzes))
      if (snapshot.tasks) setTasks(cloneFixture(snapshot.tasks))
      if (snapshot.conversations) setConversations(cloneFixture(snapshot.conversations))
      if ("parentSummary" in snapshot) setParentSummary(cloneFixture(snapshot.parentSummary ?? null))
      if (snapshot.safetyCases) setSafetyCases(cloneFixture(snapshot.safetyCases))
      if (snapshot.auditEvents) setAuditEvents(cloneFixture(snapshot.auditEvents))
      if (snapshot.recapJobs) setRecapJobs(cloneFixture(snapshot.recapJobs))
    })
  }, [dataset, persist, storageKey])

  const value = useMemo<PrototypeContextValue>(
    () => ({
      storageError,
      lessons,
      students,
      signals,
      learningTopics,
      plans,
      quizzes,
      tasks,
      conversations,
      parentSummary,
      safetyCases,
      auditEvents,
      recapJobs,
      createLesson(defaults) {
        const id = `lesson-recording-${lessons.length + 1}`
        const className = defaults?.className?.trim() || "五年级（2）班"
        setLessons((current) => [
          ...current,
          {
            id,
            title: "新课堂录音",
            subject: "数学",
            grade: getGradeFromClassName(className),
            className,
            date: formatLocalDate(new Date()),
            durationMinutes: 0,
            status: "scheduled",
            syncStatus: "local",
            studentVisibility: "hidden",
            recap: "",
            recapTags: [],
            transcript: [],
            suggestions: [],
            progress: {
              chapter: defaults?.chapter?.trim() || "待确认",
              completedPercent: 0,
              nextStep: "等待课堂内容整理",
            },
          },
        ])
        return id
      },
      restoreLesson(lesson) {
        setLessons((current) => current.some((item) => item.id === lesson.id)
          ? current
          : [...current, cloneFixture(lesson)])
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
      updateLessonProgress(id, completedPercent, nextStep, chapter) {
        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === id
              ? {
                  ...lesson,
                  progress: {
                    ...lesson.progress,
                    chapter: chapter?.trim() || lesson.progress.chapter,
                    completedPercent: Math.min(100, Math.max(0, completedPercent)),
                    nextStep: nextStep.trim(),
                  },
                }
              : lesson,
          ),
        )
      },
      publishLesson(id, recap) {
        setLessons((current) =>
          current.map((lesson) => {
            if (lesson.id !== id) return lesson
            const nextLesson = recap === undefined ? lesson : { ...lesson, recap }
            const canPublish = hasCompleteAiDraft(nextLesson) ||
              (recap !== undefined && hasCompleteLessonAnalysis(nextLesson))
            return canPublish
              ? { ...nextLesson, status: "published", studentVisibility: "visible" }
              : lesson
          }),
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
        title,
        chapter,
      ) {
        const requireReview = getTeacherSettings().requireReviewBeforePublish
        const analysis = {
          title,
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
                  title: title.trim(),
                  date: lesson.id.startsWith("lesson-recording-")
                    ? formatLocalDate(new Date())
                    : lesson.date,
                  transcript,
                  recap,
                  recapTags,
                  teacherReport,
                  progressSuggestion,
                  evidence,
                  status: requireReview ? "draft-ready" : "published",
                  syncStatus: "local",
                  studentVisibility: requireReview ? lesson.studentVisibility : "visible",
                  durationMinutes: Math.max(1, Math.ceil(durationMinutes)),
                  progress: {
                    ...lesson.progress,
                    chapter: lesson.progress.chapter === "待确认" || lesson.progress.chapter === "待识别"
                      ? chapter?.trim() || lessonTopicFromContent(title, recapTags)
                      : lesson.progress.chapter,
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
      addStudent(student) {
        setStudents((current) => [...current, cloneFixture(student)])
      },
      updateStudent(id, patch) {
        setStudents((current) => current.map((student) =>
          student.id === id ? { ...student, ...cloneFixture(patch), id } : student))
      },
      deleteStudent(id) {
        setStudents((current) => current.filter((student) => student.id !== id))
      },
      addSignal(signal) {
        setSignals((current) => [...current, cloneFixture(signal)])
      },
      updateSignal(id, patch) {
        setSignals((current) => current.map((signal) =>
          signal.id === id ? { ...signal, ...cloneFixture(patch), id } : signal))
      },
      deleteSignal(id) {
        setSignals((current) => current.filter((signal) => signal.id !== id))
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
      updatePlan(id, patch) {
        setPlans((current) => current.map((plan) =>
          plan.id === id ? { ...plan, ...cloneFixture(patch), id } : plan))
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
      updateQuiz(id, patch) {
        if (tasks.some((task) => task.sourceQuizId === id)) return
        setQuizzes((current) => current.map((quiz) =>
          quiz.id === id ? { ...quiz, ...cloneFixture(patch), id } : quiz))
      },
      deleteQuiz(id) {
        if (tasks.some((task) => task.sourceQuizId === id)) return
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
      updateTaskCompletion(taskId, studentId, status, result) {
        const updatedAt = new Date().toISOString()
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
                          ...(result ?? {}),
                          updatedAt,
                          submittedAt:
                            status === "submitted" || status === "reviewed"
                              ? updatedAt
                              : completion.submittedAt,
                        }
                      : completion,
                  )
                : [
                    ...task.completions,
                    { studentId, status, ...(result ?? {}) },
                  ],
            }
          }),
        )
      },
      sendMessage(id, body, sender) {
        const normalizedBody = body.trim()
        if (!normalizedBody) return

        const author = sender ?? {
          senderId: "teacher-li",
          senderName: "李老师",
          senderRole: "teacher" as const,
        }

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === id
              ? {
                  ...conversation,
                  unreadCount:
                    author.senderRole === "teacher"
                      ? unreadForRole(conversation, "teacher")
                      : unreadForRole(conversation, "teacher") + 1,
                  unreadByRole: {
                    teacher:
                      unreadForRole(conversation, "teacher") +
                      (author.senderRole === "teacher" ? 0 : 1),
                    student:
                      (conversation.unreadByRole?.student ?? 0) +
                      (author.senderRole !== "student" &&
                      (conversation.kind === "student" || conversation.kind === "group") ? 1 : 0),
                    parent:
                      (conversation.unreadByRole?.parent ?? 0) +
                      (author.senderRole !== "parent" && conversation.kind === "parent" ? 1 : 0),
                  },
                  messages: [
                    ...conversation.messages,
                    {
                      id: `message-local-${author.senderRole}-${Date.now()}-${conversation.messages.length + 1}`,
                      ...author,
                      body: normalizedBody,
                      sentAt: new Date().toISOString(),
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
      markConversationRead(id, role) {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === id
              ? {
                  ...conversation,
                  unreadCount: role === "teacher" ? 0 : conversation.unreadCount,
                  unreadByRole: {
                    ...conversation.unreadByRole,
                    [role]: 0,
                  },
                }
              : conversation,
          ),
        )
      },
      addConversation(conversation) {
        setConversations((current) => [...current, cloneFixture(conversation)])
      },
      upsertLearningTopic(topic) {
        setLearningTopics((current) => current.some((item) => item.id === topic.id)
          ? current.map((item) => item.id === topic.id ? cloneFixture(topic) : item)
          : [...current, cloneFixture(topic)])
      },
      deleteLearningTopic(id) {
        setLearningTopics((current) => current.filter((topic) => topic.id !== id))
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
      publishParentSummary(summary) {
        if (
          summary.source !== "deepseek" ||
          !summary.confirmedAt ||
          !summary.encouragement.trim() ||
          !summary.teacherMessage.trim() ||
          summary.topics.length === 0
        ) {
          return
        }
        setParentSummary(cloneFixture(summary))
      },
      approveStudentObservation(studentId, observation) {
        if (
          !observation.observation.trim() ||
          !observation.suggestedSupport.trim() ||
          observation.evidence.length === 0
        ) {
          return
        }
        const approvedObservation: ApprovedStudentObservation = {
          ...cloneFixture(observation),
          id: `observation-${Date.now()}`,
          source: "deepseek",
          confirmedAt: new Date().toISOString(),
        }
        setStudents((current) =>
          current.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  approvedObservations: [
                    ...(student.approvedObservations ?? []),
                    approvedObservation,
                  ],
                }
              : student,
          ),
        )
      },
      resetPrototype() {
        resetTeacherSettings()
        window.localStorage.removeItem("zhiye-admin-settings-v1")
        window.localStorage.removeItem(storageKey)
        setLessons(cloneFixture(fixtureSet?.lessons ?? lessonFixtures))
        setStudents(cloneFixture(fixtureSet?.students ?? studentFixtures))
        setSignals(cloneFixture(fixtureSet?.signals ?? knowledgeSignalFixtures))
        setLearningTopics(cloneFixture(fixtureSet?.learningTopics ?? learningTopicFixtures))
        setPlans(cloneFixture(fixtureSet?.plans ?? planFixtures))
        setQuizzes(cloneFixture(fixtureSet?.quizzes ?? quizFixtures))
        setTasks(cloneFixture(fixtureSet?.tasks ?? taskFixtures))
        setConversations(cloneFixture(fixtureSet?.conversations ?? conversationFixtures))
        setParentSummary(
          cloneFixture(
            dataset === "empty"
              ? null
              : fixtureSet?.parentSummary ?? parentSummaryFixture,
          ),
        )
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
      upsertRecapJob(job) {
        setRecapJobs((current) => {
          const next = current.filter((item) => item.id !== job.id)
          return [...next, cloneFixture(job)]
        })
      },
    }),
    [
      auditEvents,
      conversations,
      lessons,
      parentSummary,
      plans,
      quizzes,
      recapJobs,
      safetyCases,
      signals,
      learningTopics,
      students,
      storageError,
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

export function useOptionalPrototype(): PrototypeContextValue | null {
  return useContext(PrototypeContext)
}

export function usePrototypeOptional(): PrototypeContextValue | null {
  return useContext(PrototypeContext)
}
