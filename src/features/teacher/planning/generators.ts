import type {
  PlanDraft,
  Quiz,
  QuizQuestion,
} from "../../../app/prototype/types"

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

function deterministicToken(value: string) {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function generateLessonPlan(input: LessonPlanGeneratorInput): PlanDraft {
  const evidence = [...input.evidence]
  const evidencePrompt = evidence.length
    ? `结合${evidence.join("、")}进行即时判断`
    : "用课堂观察进行即时判断"

  return {
    id: `plan-${deterministicToken(JSON.stringify(input))}`,
    title: `${input.chapter}情境化教案`,
    subject: "数学",
    grade: "五年级",
    chapter: input.chapter,
    objective: input.objective,
    context: input.context,
    evidence,
    outline: [
      `从“${input.context}”提出真实问题`,
      `用学生已有经验梳理${input.chapter}的关键步骤`,
      evidencePrompt,
      "用出口卡完成解释、计算与检查",
    ],
    examples: [
      `在${input.context}中完成一次估算并说明依据`,
      `比较两种${input.chapter}方法，判断哪一种更合理`,
    ],
    misconceptions: [
      "只写计算结果，没有说明判断依据",
      "忽略单位、条件或结果合理性检查",
    ],
    suggestions: [
      `把“${input.objective}”拆成口述、示范和独立练习三步`,
      "先让学生解释，再由教师用板书固定可迁移步骤",
    ],
    extension: `请学生从${input.context}中设计一道同类问题，并写出检查方法。`,
    status: "ready",
    createdAt: "2026-07-25T09:20:00+08:00",
  }
}

function createQuestion(
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  score: number,
  type: QuizQuestion["type"] = "single-choice",
): QuizQuestion {
  return { id, prompt, type, options, answer, explanation, score }
}

export function generateThreeQuestionQuiz(input: QuizGeneratorInput): Quiz {
  const token = deterministicToken(JSON.stringify(input))
  const questions = [
    createQuestion(
      `question-${token}-1`,
      `关于“${input.topic}”，第一步应该先判断什么？`,
      ["数量变化方向", "只看最后一位", "跳过条件直接计算"],
      "数量变化方向",
      `先判断方向，才能为${input.focus}选择正确方法。`,
      5,
    ),
    createQuestion(
      `question-${token}-2`,
      `完成一道${input.topic}题后，哪一种检查最能说明结果合理？`,
      ["结合情境估算", "只抄一次答案", "忽略单位"],
      "结合情境估算",
      "估算、单位和原题条件可以共同验证结果。",
      5,
    ),
    createQuestion(
      `question-${token}-3`,
      `请用自己的话说明${input.topic}的关键步骤。`,
      [],
      `先判断，再计算，最后结合${input.focus}检查。`,
      `本题用于检查学生能否完整解释${input.focus}。`,
      10,
      "short-answer",
    ),
  ]

  return {
    id: `quiz-${token}`,
    title: input.title,
    subject: "数学",
    status: "ready",
    questions,
    createdAt: "2026-07-25T09:30:00+08:00",
  }
}
