import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
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
import { PrototypeProvider, usePrototype } from "./PrototypeContext"
import type { Mistake, PlanDraft, Quiz, Task } from "./types"

function wrapper({ children }: { children: ReactNode }) {
  return <PrototypeProvider>{children}</PrototypeProvider>
}

describe("prototype fixtures", () => {
  it("provides deterministic fixtures for every prototype domain", () => {
    expect(lessonFixtures.map((lesson) => lesson.id)).toEqual(
      expect.arrayContaining(["lesson-fractions", "lesson-units"]),
    )
    expect(studentFixtures).toHaveLength(12)
    expect(studentFixtures.some((student) => student.id === "student-lin-xiaoyu")).toBe(true)

    expect(knowledgeSignalFixtures).toHaveLength(3)
    expect(new Set(knowledgeSignalFixtures.map((signal) => signal.severity))).toEqual(
      new Set(["watch", "attention", "priority"]),
    )

    expect(new Set(taskFixtures.map((task) => task.status))).toEqual(
      new Set(["draft", "active", "review", "completed"]),
    )
    expect(taskFixtures.some((task) => task.id === "task-review-01")).toBe(true)

    expect(new Set(conversationFixtures.map((conversation) => conversation.kind))).toEqual(
      new Set(["student", "parent", "group"]),
    )
    expect(conversationFixtures.some((item) => item.id === "conversation-parent-li")).toBe(true)

    expect(parentSummaryFixture.studentId).toBe("student-lin-xiaoyu")
    expect(safetyCaseFixtures).toHaveLength(3)
    expect(safetyCaseFixtures.some((item) => item.id === "safety-case-01")).toBe(true)
    expect(auditEventFixtures.length).toBeGreaterThan(0)
    expect(planFixtures.length).toBeGreaterThan(0)
    expect(quizFixtures.length).toBeGreaterThan(0)
  })
})

describe("PrototypeProvider", () => {
  it("creates a local lesson record for a new classroom recording", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })
    let lessonId = ""

    act(() => {
      lessonId = result.current.createLesson()
    })

    expect(lessonId).toMatch(/^lesson-recording-/)
    expect(result.current.lessons.at(-1)).toMatchObject({
      id: lessonId,
      title: "新课堂录音",
      status: "scheduled",
      syncStatus: "local",
    })
  })

  it("updates a lesson status for the shared classroom workflow", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })

    act(() => result.current.updateLessonStatus("lesson-fractions", "processing"))

    expect(
      result.current.lessons.find((item) => item.id === "lesson-fractions")?.status,
    ).toBe("processing")
  })

  it("persists a teacher decision on an AI lesson suggestion", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })

    act(() =>
      result.current.updateLessonSuggestionStatus(
        "lesson-fractions",
        "suggestion-fractions-01",
        "accepted",
      ),
    )

    expect(
      result.current.lessons
        .find((item) => item.id === "lesson-fractions")
        ?.suggestions.find((item) => item.id === "suggestion-fractions-01")
        ?.status,
    ).toBe("accepted")
  })

  it("persists course progress edits for a lesson", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })

    act(() =>
      result.current.updateLessonProgress("lesson-fractions", 80, "通分综合练习"),
    )

    expect(result.current.lessons.find((item) => item.id === "lesson-fractions")?.progress).toEqual({
      chapter: "第四单元 · 分数的意义和性质",
      completedPercent: 80,
      nextStep: "通分综合练习",
    })
  })

  it("persists a student's task completion state", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })

    act(() =>
      result.current.updateTaskCompletion(
        "task-review-01",
        "student-lin-xiaoyu",
        "submitted",
      ),
    )

    expect(
      result.current.tasks
        .find((item) => item.id === "task-review-01")
        ?.completions.find((item) => item.studentId === "student-lin-xiaoyu")
        ?.status,
    ).toBe("submitted")
  })

  it("persists a student's mistake learning record", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })

    act(() =>
      result.current.updateMistake("student-lin-xiaoyu", "mistake-fraction-seed", {
        mastery: "basic",
        note: "先确认分子和分母同步变化。",
      }),
    )

    expect(
      result.current.students
        .find((item) => item.id === "student-lin-xiaoyu")
        ?.mistakes.find((item) => item.id === "mistake-fraction-seed"),
    ).toMatchObject({
      mastery: "basic",
      note: "先确认分子和分母同步变化。",
    })
  })

  it("publishes a lesson, edits its recap, and sends a local message", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })

    act(() => result.current.publishLesson("lesson-fractions"))
    expect(
      result.current.lessons.find((item) => item.id === "lesson-fractions")?.status,
    ).toBe("published")

    act(() => result.current.updateLessonRecap("lesson-fractions", "新的复习卡内容"))
    expect(
      result.current.lessons.find((item) => item.id === "lesson-fractions")?.recap,
    ).toBe("新的复习卡内容")

    act(() => result.current.sendMessage("conversation-parent-li", "今晚会陪孩子复习。"))
    expect(
      result.current.conversations
        .find((item) => item.id === "conversation-parent-li")
        ?.messages.at(-1)?.body,
    ).toBe("今晚会陪孩子复习。")
    expect(
      result.current.conversations
        .find((item) => item.id === "conversation-parent-li")
        ?.messages.at(-1)?.senderRole,
    ).toBe("teacher")
  })

  it("adds plans, quizzes, tasks and updates task status", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })
    const plan: PlanDraft = {
      id: "plan-generated-01",
      title: "单位换算补讲",
      subject: "数学",
      grade: "五年级",
      chapter: "单位换算",
      objective: "区分乘除步骤",
      context: "校园菜园测量",
      evidence: ["12 名学生在计算步骤停下来"],
      outline: ["回顾单位关系", "示范换算", "分层练习"],
      examples: ["2.5 米等于多少厘米"],
      misconceptions: ["只换单位名称，不换数值"],
      suggestions: ["用单位阶梯图辅助"],
      extension: "解释为什么需要乘 100",
      status: "draft",
      createdAt: "2026-07-25T09:00:00+08:00",
    }
    const quiz: Quiz = {
      id: "quiz-generated-01",
      title: "单位换算随堂练习",
      subject: "数学",
      lessonId: "lesson-units",
      status: "draft",
      questions: [
        {
          id: "question-units-01",
          prompt: "3 米等于多少厘米？",
          type: "single-choice",
          options: ["30", "300", "3000"],
          answer: "300",
          explanation: "1 米等于 100 厘米。",
          score: 5,
        },
      ],
      createdAt: "2026-07-25T09:05:00+08:00",
    }
    const task: Task = {
      id: "task-generated-01",
      title: "单位换算巩固练习",
      type: "practice",
      content: "完成三道单位换算题",
      audience: { kind: "class", label: "五年级（2）班", studentIds: [] },
      dueAt: "2026-07-26T20:00:00+08:00",
      reminder: "截止前 2 小时",
      status: "draft",
      completions: [],
      createdAt: "2026-07-25T09:10:00+08:00",
    }

    act(() => {
      result.current.addPlan(plan)
      result.current.addQuiz(quiz)
      result.current.addTask(task)
    })
    expect(result.current.plans.at(-1)).toEqual(plan)
    expect(result.current.quizzes.at(-1)).toEqual(quiz)
    expect(result.current.tasks.at(-1)).toEqual(task)

    act(() => result.current.updateTaskStatus(task.id, "active"))
    expect(result.current.tasks.find((item) => item.id === task.id)?.status).toBe("active")
  })

  it("adds a mistake and patches a protection case without losing existing fields", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })
    const mistake: Mistake = {
      id: "mistake-fraction-01",
      subject: "数学",
      knowledgePoint: "分数的基本性质",
      prompt: "为什么分子分母要同时乘同一个数？",
      cause: "忽略了分数值不变的条件",
      explanation: "分子和分母同步变化，相当于乘以 1。",
      mastery: "learning",
      source: "tutoring",
      createdAt: "2026-07-25T10:00:00+08:00",
    }

    act(() => result.current.addMistake("student-lin-xiaoyu", mistake))
    expect(
      result.current.students
        .find((student) => student.id === "student-lin-xiaoyu")
        ?.mistakes.at(-1),
    ).toEqual(mistake)

    const original = result.current.safetyCases.find((item) => item.id === "safety-case-01")
    act(() =>
      result.current.updateSafetyCase("safety-case-01", {
        status: "reviewing",
        assignee: "王老师 · 德育负责人",
      }),
    )
    const updated = result.current.safetyCases.find((item) => item.id === "safety-case-01")
    expect(updated).toMatchObject({
      id: "safety-case-01",
      status: "reviewing",
      assignee: "王老师 · 德育负责人",
      title: original?.title,
    })
  })

  it("appends shared audit events for cross-page administration records", () => {
    const { result } = renderHook(() => usePrototype(), { wrapper })
    const event: AuditEvent = {
      id: "audit-local-safety-01",
      actor: "王老师 · 德育负责人",
      action: "分配保护性反馈",
      objectType: "safety-case",
      objectId: "safety-case-01",
      purpose: "人工核实学生支持需求",
      occurredAt: "2026-07-25T16:20:00+08:00",
    }

    act(() => result.current.addAuditEvent(event))

    expect(result.current.auditEvents.at(-1)).toEqual(event)
  })

  it("keeps exported fixtures immutable across provider instances", () => {
    const first = renderHook(() => usePrototype(), { wrapper })
    act(() => {
      first.result.current.publishLesson("lesson-fractions")
      first.result.current.sendMessage("conversation-parent-li", "只属于第一个 Provider")
    })

    const second = renderHook(() => usePrototype(), { wrapper })
    expect(
      second.result.current.lessons.find((item) => item.id === "lesson-fractions")?.status,
    ).toBe("draft-ready")
    expect(
      second.result.current.conversations
        .find((item) => item.id === "conversation-parent-li")
        ?.messages.some((message) => message.body === "只属于第一个 Provider"),
    ).toBe(false)
    expect(lessonFixtures.find((item) => item.id === "lesson-fractions")?.status).toBe(
      "draft-ready",
    )
  })

  it("throws a clear error when the hook is used outside its provider", () => {
    expect(() => renderHook(() => usePrototype())).toThrow(
      "usePrototype must be used within PrototypeProvider",
    )
  })
})
