import { useState } from "react"
import type { PlanDraft } from "../../../app/prototype/types"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import { toPlanDraft, type LessonPlanGeneratorInput } from "./generators"

const textbooks = ["人教版数学五年级上册", "北师大版数学五年级上册"]
const chapters = ["分数的基本性质", "小数乘法 · 估算", "单位换算"]
const contexts = ["校园菜园采购", "班级图书角", "运动会物资准备"]
const evidenceOptions = ["课堂停顿", "自检错题", "学生提问", "课后练习"]

function LinesEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange(value: string[]): void
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#263b2b]">
      {label}
      <textarea
        aria-label={label}
        className="min-h-28 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 font-normal leading-7 outline-none focus:border-[#64836a] focus:ring-4 focus:ring-[#64836a]/15"
        value={value.join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n"))}
      />
    </label>
  )
}

export function LessonPlanBuilder() {
  const { addPlan } = usePrototype()
  const [input, setInput] = useState<LessonPlanGeneratorInput>({
    textbook: textbooks[0],
    chapter: chapters[0],
    objective: "理解知识步骤，并能在生活情境中解释方法",
    context: contexts[0],
    evidence: [],
  })
  const [draft, setDraft] = useState<PlanDraft | null>(null)
  const [notice, setNotice] = useState("")
  const [generationError, setGenerationError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  function toggleEvidence(label: string) {
    setInput((current) => ({
      ...current,
      evidence: current.evidence.includes(label)
        ? current.evidence.filter((item) => item !== label)
        : [...current.evidence, label],
    }))
  }

  function patchDraft(patch: Partial<PlanDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  async function generatePlan() {
    setIsGenerating(true)
    setGenerationError("")
    try {
      const response = await generateDraft("lesson-plan", input)
      const payload = response as { content?: unknown }
      setDraft(toPlanDraft(payload.content, input))
      setNotice("")
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "生成失败，请重试")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
      <section className="rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-[0_18px_50px_rgba(54,82,61,0.08)] backdrop-blur-2xl sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black tracking-[0.18em] text-[#66806b]">
            PLAN INPUT
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#15241a]">
            配置这节课
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#718076]">
            选择教材范围、目标和真实情境，再决定是否让课堂证据参与生成。
          </p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold">
            教材
            <select
              aria-label="教材"
              className="rounded-2xl border border-white bg-white/75 px-4 py-3 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              value={input.textbook}
              onChange={(event) =>
                setInput({ ...input, textbook: event.target.value })
              }
            >
              {textbooks.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            章节
            <select
              aria-label="章节"
              className="rounded-2xl border border-white bg-white/75 px-4 py-3 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              value={input.chapter}
              onChange={(event) =>
                setInput({ ...input, chapter: event.target.value })
              }
            >
              {chapters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            教学目标
            <textarea
              aria-label="教学目标"
              className="min-h-24 rounded-2xl border border-white bg-white/75 px-4 py-3 font-normal leading-6 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              value={input.objective}
              onChange={(event) =>
                setInput({ ...input, objective: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            生活情境
            <select
              aria-label="生活情境"
              className="rounded-2xl border border-white bg-white/75 px-4 py-3 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              value={input.context}
              onChange={(event) =>
                setInput({ ...input, context: event.target.value })
              }
            >
              {contexts.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <fieldset className="rounded-2xl border border-white/80 bg-white/45 p-4">
            <legend className="px-1 text-sm font-black">课堂证据开关</legend>
            <p className="mb-3 mt-1 text-xs leading-5 text-[#718076]">
              只使用教师主动勾选的本地模拟证据。
            </p>
            <div className="grid grid-cols-2 gap-3">
              {evidenceOptions.map((item) => (
                <label className="flex items-center gap-2 text-sm" key={item}>
                  <input
                    type="checkbox"
                    checked={input.evidence.includes(item)}
                    onChange={() => toggleEvidence(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            className="rounded-full bg-[#15241a] px-5 py-3 font-black text-white shadow-lg shadow-[#15241a]/15 transition hover:-translate-y-0.5"
            disabled={isGenerating}
            type="button"
            onClick={() => void generatePlan()}
          >
            {isGenerating ? "正在生成草稿" : "生成教案"}
          </button>
          {generationError ? (
            <div className="grid gap-3 rounded-2xl border border-[#e4b9b4] bg-[#fff5f3] p-4 text-sm text-[#8d332b]" role="alert">
              <p>{generationError}</p>
              <button className="w-fit rounded-full border border-current px-4 py-2 font-black" type="button" onClick={() => void generatePlan()}>
                重试生成
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section
        aria-label="教案编辑器"
        className="min-h-[480px] rounded-[30px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.88),rgba(247,250,244,.66))] p-5 shadow-[0_24px_70px_rgba(46,75,54,0.1)] backdrop-blur-3xl sm:p-7"
      >
        {draft ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <label className="grid min-w-0 flex-1 gap-2 text-sm font-black">
                教案标题
                <input
                  aria-label="教案标题"
                  className="w-full rounded-2xl border border-[#dfe8df] bg-white/75 px-4 py-3 text-xl font-black outline-none focus:ring-4 focus:ring-[#64836a]/15"
                  value={draft.title}
                  onChange={(event) =>
                    patchDraft({ title: event.target.value })
                  }
                />
              </label>
              <span className="rounded-full bg-[#e6efe3] px-3 py-2 text-xs font-black text-[#47644d]">
                AI 草稿 · 可编辑
              </span>
            </div>

            {draft.evidence.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#eef4eb] p-3 text-sm">
                <strong>已引用证据</strong>
                {draft.evidence.map((item) => (
                  <span className="rounded-full bg-white px-3 py-1" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <LinesEditor
                label="教学流程"
                value={draft.outline}
                onChange={(outline) => patchDraft({ outline })}
              />
              <LinesEditor
                label="生活化示例"
                value={draft.examples}
                onChange={(examples) => patchDraft({ examples })}
              />
              <LinesEditor
                label="常见误区"
                value={draft.misconceptions}
                onChange={(misconceptions) => patchDraft({ misconceptions })}
              />
              <LinesEditor
                label="教学建议"
                value={draft.suggestions}
                onChange={(suggestions) => patchDraft({ suggestions })}
              />
            </div>
            <label className="grid gap-2 text-sm font-black">
              课后延伸
              <textarea
                aria-label="课后延伸"
                className="min-h-24 rounded-2xl border border-[#dfe8df] bg-white/75 px-4 py-3 font-normal leading-7 outline-none focus:ring-4 focus:ring-[#64836a]/15"
                value={draft.extension}
                onChange={(event) =>
                  patchDraft({ extension: event.target.value })
                }
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe8df] pt-5">
              <p className="text-sm text-[#718076]">
                保存后会加入本地备课记录，仍可继续修改。
              </p>
              <button
                className="rounded-full bg-[#173021] px-5 py-3 font-black text-white"
                type="button"
                onClick={() => {
                  addPlan(draft)
                  setNotice("教案已保存")
                }}
              >
                保存到备课记录
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[430px] place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#e9f0e6] text-2xl">
                ✦
              </div>
              <h2 className="mt-5 text-2xl font-black">教案会在这里展开</h2>
              <p className="mt-2 leading-7 text-[#718076]">
                生成后可逐段编辑教学流程、例子、误区、建议与延伸活动。
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
    </div>
  )
}

export default LessonPlanBuilder
