import type { PlanDraft, Quiz, QuizQuestion } from "../../../app/prototype/types"

export type LessonPlanGeneratorInput = {
  textbook: string
  chapter: string
  objective: string
  context: string
  evidence: string[]
}

export type QuizGeneratorInput = {
  title: string
  topic: string
  difficulty: "基础" | "递进" | "挑战"
  focus: string
}

type LessonPlanContent = Pick<
  PlanDraft,
  "title" | "outline" | "examples" | "misconceptions" | "suggestions" | "extension"
>

type QuizContent = {
  title: string
  questions: Array<Pick<QuizQuestion, "prompt" | "options" | "answer">>
}

type RemedialPlanContent = {
  title: string
  goals: string[]
  steps: string[]
  examples: string[]
  check_for_understanding: string
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("本地 AI 返回的草稿格式不正确，请重试")
  }
  return value as Record<string, unknown>
}

function requireString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("本地 AI 返回的草稿格式不正确，请重试")
  }
  return value
}

function readLessonPlanContent(value: unknown): LessonPlanContent {
  const content = requireObject(value)
  const fields = [
    "outline",
    "examples",
    "misconceptions",
    "suggestions",
  ] as const
  if (!fields.every((field) => isStringList(content[field]))) {
    throw new Error("本地 AI 返回的草稿格式不正确，请重试")
  }
  return {
    title: requireString(content.title),
    outline: content.outline,
    examples: content.examples,
    misconceptions: content.misconceptions,
    suggestions: content.suggestions,
    extension: requireString(content.extension),
  }
}

function readQuizContent(value: unknown): QuizContent {
  const content = requireObject(value)
  if (!Array.isArray(content.questions) || content.questions.length !== 3) {
    throw new Error("本地 AI 返回的草稿格式不正确，请重试")
  }
  return {
    title: requireString(content.title),
    questions: content.questions.map((question) => {
      const item = requireObject(question)
      if (
        !isStringList(item.options) ||
        item.options.length < 2 ||
        item.options.some((option) => !option.trim()) ||
        new Set(item.options).size !== item.options.length
      ) {
        throw new Error("本地 AI 返回的草稿格式不正确，请重试")
      }
      const answer = requireString(item.answer)
      if (!item.options.includes(answer)) {
        throw new Error("本地 AI 返回的草稿格式不正确，请重试")
      }
      return {
        prompt: requireString(item.prompt),
        options: item.options,
        answer,
      }
    }),
  }
}

function readRemedialPlanContent(value: unknown): RemedialPlanContent {
  const content = requireObject(value)
  if (
    !isStringList(content.goals) ||
    !isStringList(content.steps) ||
    !isStringList(content.examples)
  ) {
    throw new Error("本地 AI 返回的草稿格式不正确，请重试")
  }
  return {
    title: requireString(content.title),
    goals: content.goals,
    steps: content.steps,
    examples: content.examples,
    check_for_understanding: requireString(content.check_for_understanding),
  }
}

export function toPlanDraft(
  value: unknown,
  input: LessonPlanGeneratorInput,
): PlanDraft {
  const content = readLessonPlanContent(value)
  return {
    ...content,
    id: crypto.randomUUID(),
    subject: "数学",
    grade: "五年级",
    chapter: input.chapter,
    objective: input.objective,
    context: input.context,
    evidence: input.evidence,
    status: "draft",
    createdAt: new Date().toISOString(),
  }
}

export function toQuiz(value: unknown): Quiz {
  const content = readQuizContent(value)
  return {
    id: crypto.randomUUID(),
    title: content.title,
    subject: "数学",
    status: "draft",
    createdAt: new Date().toISOString(),
    questions: content.questions.map((question) => ({
      ...question,
      id: crypto.randomUUID(),
      type: "single-choice",
      explanation: "",
      score: 0,
    })),
  }
}

export function toRemedialPlanDraft(
  value: unknown,
  context: {
    subject: PlanDraft["subject"]
    knowledgePoint: string
    evidence: string[]
  },
): PlanDraft {
  const content = readRemedialPlanContent(value)
  return {
    id: crypto.randomUUID(),
    title: content.title,
    subject: context.subject,
    grade: "五年级",
    chapter: context.knowledgePoint,
    objective: "",
    context: "",
    evidence: context.evidence,
    outline: content.steps,
    examples: content.examples,
    misconceptions: [],
    suggestions: content.goals,
    extension: content.check_for_understanding,
    status: "draft",
    createdAt: new Date().toISOString(),
  }
}
