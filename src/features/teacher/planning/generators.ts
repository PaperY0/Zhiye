import type { PlanDraft, Quiz, QuizQuestion } from "../../../app/prototype/types"
import { getGradeFromClassName, getTeacherSettings } from "../settings/teacherSettings"

export type LessonPlanGeneratorInput = {
  textbook: string
  chapter: string
  objective: string
  context: string
  evidence: string[]
  teachingAid?: string
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
  questions: Array<Pick<QuizQuestion, "prompt" | "type" | "options" | "answer">>
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
    outline: content.outline as string[],
    examples: content.examples as string[],
    misconceptions: content.misconceptions as string[],
    suggestions: content.suggestions as string[],
    extension: requireString(content.extension),
  }
}

function readQuizContent(value: unknown): QuizContent {
  const content = requireObject(value)
  if (!Array.isArray(content.questions) || content.questions.length < 3) {
    throw new Error("本地 AI 返回的草稿格式不正确，请重试")
  }
  return {
    title: requireString(content.title),
    questions: content.questions.slice(0, 3).map((question) => {
      const item = requireObject(question)
      const rawOptions = isStringList(item.options) ? item.options.map((option) => option.trim()) : null
      const judgment = item.type === "true-false" || item.type === "judgment" || item.type === "判断题" || (rawOptions?.length === 2 && (["正确", "错误"].every((option) => rawOptions.includes(option)) || ["对", "错"].every((option) => rawOptions.includes(option))))
      const options = judgment ? ["正确", "错误"] : rawOptions
        ? rawOptions
        : null
      if (
        !options ||
        options.length < 2 ||
        options.some((option) => !option) ||
        new Set(options).size !== options.length
      ) {
        throw new Error("本地 AI 返回的草稿格式不正确，请重试")
      }
      const rawAnswer = typeof item.answer === "boolean" ? (item.answer ? "正确" : "错误") : requireString(item.answer).trim()
      const answer = judgment ? ({ "对": "正确", "错": "错误", "true": "正确", "false": "错误" }[rawAnswer] ?? rawAnswer) : rawAnswer
      if (!options.includes(answer)) {
        throw new Error("本地 AI 返回的草稿格式不正确，请重试")
      }
      return {
        prompt: requireString(item.prompt),
        type: judgment ? "true-false" as const : "single-choice" as const,
        options,
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
    grade: getGradeFromClassName(getTeacherSettings().currentClass),
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
      explanation: "",
      score: 10,
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
