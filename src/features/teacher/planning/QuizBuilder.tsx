import { useEffect, useState } from "react"
import type { Quiz, QuizQuestion } from "../../../app/prototype/types"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import { toQuiz, type QuizGeneratorInput } from "./generators"
import { getTeacherSettings } from "../settings/teacherSettings"

const difficulties: QuizGeneratorInput["difficulty"][] = [
  "基础",
  "递进",
  "挑战",
]

function normalizeAnswer(value: string): string | string[] {
  return value.includes("、")
    ? value.split("、").map((item) => item.trim())
    : value
}

function answerText(answer: QuizQuestion["answer"]) {
  return Array.isArray(answer) ? answer.join("、") : answer
}

export function QuestionEditor({
  index,
  question,
  onChange,
}: {
  index: number
  question: QuizQuestion
  onChange(question: QuizQuestion): void
}) {
  return (
    <fieldset
      aria-label={`第 ${index + 1} 题`}
      className="min-w-0 rounded-[24px] border border-white/90 bg-white/60 p-4 shadow-[0_12px_36px_rgba(54,82,61,0.06)]"
    >
      <legend className="px-2 text-sm font-black text-[#526b57]">
        第 {index + 1} 题
      </legend>
      <div className="grid gap-4">
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          题干
          <textarea
            aria-label="题干"
            className="min-h-20 min-w-0 w-full rounded-2xl border border-[#dfe8df] bg-white/80 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-[#64836a]/15"
            value={question.prompt}
            onChange={(event) =>
              onChange({ ...question, prompt: event.target.value })
            }
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-bold">
            题型
            <select
              aria-label="题型"
              className="min-w-0 w-full rounded-2xl border border-[#dfe8df] bg-white/80 px-4 py-3"
              value={question.type}
              onChange={(event) => {
                const type = event.target.value as QuizQuestion["type"]
                onChange({
                  ...question,
                  type,
                  options: type === "short-answer" ? [] : type === "true-false" ? ["正确", "错误"] : question.type === "true-false" ? ["", "", "", ""] : question.options,
                  answer: type === "true-false" ? "" : question.type === "true-false" ? "" : question.answer,
                })
              }}
            >
              <option value="single-choice">单选题</option>
              <option value="multiple-choice">多选题</option>
              <option value="true-false">判断题</option>
              <option value="short-answer">简答题</option>
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-bold">
            分值
            <input
              aria-label="分值"
              className="min-w-0 w-full rounded-2xl border border-[#dfe8df] bg-white/80 px-4 py-3"
              min="1"
              type="number"
              value={question.score}
              onChange={(event) =>
                onChange({ ...question, score: Number(event.target.value) })
              }
            />
          </label>
        </div>
        {question.type !== "short-answer" && question.type !== "true-false" && (
          <label className="grid min-w-0 gap-2 text-sm font-bold">
            选项（每行一个）
            <textarea
              aria-label="选项"
              className="min-h-20 min-w-0 w-full rounded-2xl border border-[#dfe8df] bg-white/80 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-[#64836a]/15"
              value={question.options.join("\n")}
              onChange={(event) =>
                onChange({
                  ...question,
                  options: event.target.value.split("\n"),
                })
              }
            />
          </label>
        )}
        {question.type === "true-false" ? (
          <fieldset className="grid gap-2 text-sm font-bold">
            <legend className="mb-2">正确答案</legend>
            <div className="grid grid-cols-2 gap-2">{["正确", "错误"].map((option) => (
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white px-4 has-[:checked]:border-[#64836a] has-[:checked]:bg-[#edf5eb]" key={option}>
                <input checked={question.answer === option} name={`correct-${question.id}`} onChange={() => onChange({ ...question, answer: option })} type="radio" />{option}
              </label>
            ))}</div>
          </fieldset>
        ) : <label className="grid min-w-0 gap-2 text-sm font-bold">
          答案
          <input
            aria-label="答案"
            className="min-w-0 w-full rounded-2xl border border-[#dfe8df] bg-white/80 px-4 py-3 font-normal"
            value={answerText(question.answer)}
            onChange={(event) =>
              onChange({
                ...question,
                answer: normalizeAnswer(event.target.value),
              })
            }
          />
        </label>}
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          解析
          <textarea
            aria-label="解析"
            className="min-h-20 min-w-0 w-full rounded-2xl border border-[#dfe8df] bg-white/80 px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-[#64836a]/15"
            value={question.explanation}
            onChange={(event) =>
              onChange({ ...question, explanation: event.target.value })
            }
          />
        </label>
      </div>
    </fieldset>
  )
}

export function QuizBuilder({ selectedQuiz }: { selectedQuiz?: Quiz | null }) {
  const { addQuiz, updateQuiz, plans } = usePrototype()
  const settings = getTeacherSettings()
  const [input, setInput] = useState<QuizGeneratorInput>({
    title: `${settings.chapter}课堂自检`,
    topic: settings.chapter,
    difficulty: "递进",
    focus: "概念、步骤与解释",
  })
  const [draft, setDraft] = useState<Quiz | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [generationError, setGenerationError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [sourcePlanId, setSourcePlanId] = useState("")

  useEffect(() => {
    if (!selectedQuiz) return
    setDraft(selectedQuiz)
    setSavedId(selectedQuiz.id)
    setSourcePlanId(selectedQuiz.sourcePlanId ?? "")
    setInput((current) => ({ ...current, title: selectedQuiz.title, topic: plans.find((plan) => plan.id === selectedQuiz.sourcePlanId)?.chapter ?? selectedQuiz.title }))
    setNotice("")
  }, [selectedQuiz?.id])

  function updateQuestion(index: number, next: QuizQuestion) {
    setDraft((current) =>
      current
        ? {
            ...current,
            questions: current.questions.map((item, itemIndex) =>
              itemIndex === index ? next : item,
            ),
          }
        : current,
    )
  }

  async function generateQuiz() {
    setIsGenerating(true)
    setGenerationError("")
    try {
      const response = await generateDraft("quiz", input)
      const payload = response as { content?: unknown }
      const generated = { ...toQuiz(payload.content), sourcePlanId: sourcePlanId || undefined }
      setDraft(generated)
      setSavedId(null)
      setNotice("")
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "生成失败，请重试")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.68fr)_minmax(0,1.32fr)]">
      <section className="rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-[0_18px_50px_rgba(54,82,61,0.08)] backdrop-blur-2xl sm:p-6">
        <p className="text-xs font-black tracking-[0.18em] text-[#66806b]">
          THREE QUESTION QUIZ
        </p>
        <h2 className="mt-2 text-2xl font-black">配置三题测验</h2>
        <p className="mt-2 text-sm leading-6 text-[#718076]">
          固定三题结构，覆盖概念识别、步骤应用和学生解释。
        </p>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">关联教案<select className="rounded-2xl border border-white bg-white/75 px-4 py-3" value={sourcePlanId} onChange={(event) => { const id = event.target.value; setSourcePlanId(id); const plan = plans.find((item) => item.id === id); if (plan) setInput((current) => ({ ...current, title: `${plan.chapter}课堂自检`, topic: plan.chapter, focus: plan.objective })) }}><option value="">不关联教案</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">
            测验标题
            <input
              aria-label="测验标题"
              className="rounded-2xl border border-white bg-white/75 px-4 py-3 font-normal"
              value={input.title}
              onChange={(event) =>
                setInput({ ...input, title: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            知识主题
            <input
              aria-label="知识主题"
              className="rounded-2xl border border-white bg-white/75 px-4 py-3"
              value={input.topic}
              onChange={(event) =>
                setInput({ ...input, topic: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            难度结构
            <select
              aria-label="难度结构"
              className="rounded-2xl border border-white bg-white/75 px-4 py-3"
              value={input.difficulty}
              onChange={(event) =>
                setInput({
                  ...input,
                  difficulty: event.target
                    .value as QuizGeneratorInput["difficulty"],
                })
              }
            >
              {difficulties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            考查重点
            <textarea
              aria-label="考查重点"
              className="min-h-24 rounded-2xl border border-white bg-white/75 px-4 py-3 font-normal"
              value={input.focus}
              onChange={(event) =>
                setInput({ ...input, focus: event.target.value })
              }
            />
          </label>
          <button
            className="rounded-full bg-[#15241a] px-5 py-3 font-black text-white shadow-lg shadow-[#15241a]/15"
            disabled={isGenerating}
            type="button"
            onClick={() => void generateQuiz()}
          >
            {isGenerating ? "正在生成草稿" : "生成三题测验"}
          </button>
          {generationError ? (
            <div className="grid gap-3 rounded-2xl border border-[#e4b9b4] bg-[#fff5f3] p-4 text-sm text-[#8d332b]" role="alert">
              <p>{generationError}</p>
              <button className="w-fit rounded-full border border-current px-4 py-2 font-black" type="button" onClick={() => void generateQuiz()}>
                重试生成
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section
        aria-label="三题测验编辑器"
        className="min-h-[500px] rounded-[30px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.88),rgba(247,250,244,.66))] p-5 shadow-[0_24px_70px_rgba(46,75,54,0.1)] backdrop-blur-3xl sm:p-7"
      >
        {draft ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-[#66806b]">
                  QUIZ EDITOR
                </p>
                <h2 className="mt-1 text-2xl font-black">{draft.title}</h2>
              </div>
              <span className="rounded-full bg-[#e6efe3] px-3 py-2 text-xs font-black text-[#47644d]">
                3 题 · 可编辑
              </span>
            </div>
            {draft.questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                index={index}
                question={question}
                onChange={(next) => updateQuestion(index, next)}
              />
            ))}
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#dfe8df] pt-5">
              <button
                className="rounded-full border border-[#adc0af] bg-white/75 px-5 py-3 font-black text-[#29452f]"
                type="button"
                onClick={() => setPreviewOpen(true)}
              >
                预览测验
              </button>
              <button
                className="rounded-full bg-[#173021] px-5 py-3 font-black text-white"
                type="button"
                onClick={() => {
                  if (draft.questions.some((question) => {
                    const answer = Array.isArray(question.answer) ? question.answer : question.answer.split("、").map((item) => item.trim())
                    const options = question.options.map((item) => item.trim()).filter(Boolean)
                    return !question.prompt.trim() || !question.explanation.trim() || !answer.length || answer.some((item) => !item) || question.score <= 0 || (question.type !== "short-answer" && (options.length < 2 || new Set(options).size !== options.length || answer.some((item) => !options.includes(item))))
                  })) { setNotice("请检查每题的题干、选项、答案、解析和分值"); return }
                  if (savedId) updateQuiz(savedId, { ...draft, sourcePlanId: sourcePlanId || undefined, status: "ready" })
                  else { addQuiz({ ...draft, sourcePlanId: sourcePlanId || undefined, status: "ready" }); setSavedId(draft.id) }
                  setNotice("测验已保存，可从上方创建任务并发布给学生")
                }}
              >
                保存测验
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[450px] place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#e9f0e6] text-2xl">
                ✓
              </div>
              <h2 className="mt-5 text-2xl font-black">三题，完成一次小闭环</h2>
              <p className="mt-2 leading-7 text-[#718076]">
                生成后可编辑题干、选项、答案、解析与分值，再预览发布。
              </p>
            </div>
          </div>
        )}
        {notice && (
          <p
            role="status"
            className="mt-4 rounded-2xl bg-[#e4f2e5] px-4 py-3 text-sm font-bold text-[#355b3d]"
          >
            {notice}
          </p>
        )}
      </section>

      {previewOpen && draft && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#102016]/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPreviewOpen(false)
          }}
        >
          <section
            aria-label="测验预览"
            aria-modal="true"
            role="dialog"
            className="max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-[30px] border border-white/90 bg-[#fbfcf8]/95 p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-[#66806b]">
                  学生端预览
                </p>
                <h2 className="mt-2 text-2xl font-black">{draft.title}</h2>
              </div>
              <button
                aria-label="返回编辑"
                className="rounded-full bg-[#e7eee5] px-4 py-2 text-sm font-black"
                type="button"
                onClick={() => setPreviewOpen(false)}
              >
                返回编辑
              </button>
            </div>
            <ol className="mt-6 grid gap-4">
              {draft.questions.map((question, index) => (
                <li
                  className="rounded-[22px] border border-[#e0e8df] bg-white p-5"
                  key={question.id}
                >
                  <p className="text-xs font-black text-[#66806b]">
                    第 {index + 1} 题 · {question.score} 分
                  </p>
                  <p className="mt-2 font-black leading-7">{question.prompt}</p>
                  {question.options.length > 0 && (
                    <p className="mt-3 text-sm leading-6 text-[#68766d]">
                      {question.options.join("　/　")}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  )
}

export default QuizBuilder
