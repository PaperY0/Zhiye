import {
  ArrowRight,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ImagePlus,
  Lightbulb,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { useReducer, useState, type ChangeEvent, type ReactNode } from "react"
import type { Mistake } from "../../../app/prototype/types"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import {
  initialTutoringState,
  tutoringReducer,
  type StickingPoint,
} from "./tutoringMachine"

const stickingChoices: Array<{
  value: StickingPoint
  label: string
  help: string
}> = [
  {
    value: "no-idea",
    label: "完全没思路",
    help: "先一起读懂条件，不直接给答案",
  },
  {
    value: "stuck-step",
    label: "卡在某一步",
    help: "说说你做到哪儿，我们接着往下",
  },
  {
    value: "check-idea",
    label: "想核对思路",
    help: "检查方法是否合理，再补一个提示",
  },
  {
    value: "check-answer",
    label: "已做完想检查",
    help: "核对步骤，也看看有没有更稳的方法",
  },
]

const progressSteps = ["上传题目", "找到卡点", "分层提示", "巩固保存"]

function progressIndex(step: string): number {
  if (step === "upload" || step === "needs-clearer-photo") return 0
  if (step === "sticking-point" || step === "confirm-problem") return 1
  if (["hint", "key-step", "explanation", "retell"].includes(step)) return 2
  return 3
}

function fileNameFrom(event: ChangeEvent<HTMLInputElement>): string | null {
  return event.target.files?.[0]?.name ?? null
}

function FlowCard({ children }: { children: ReactNode }) {
  return (
    <GlassSurface className="rounded-[32px] p-6 sm:p-9" weight="sheet">
      <div className="mx-auto max-w-3xl">{children}</div>
    </GlassSurface>
  )
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode
  onClick?: () => void
  type?: "button" | "submit"
}) {
  return (
    <button
      className="min-h-14 rounded-2xl bg-[#173221] px-7 font-black text-white shadow-lg shadow-[#173221]/15 transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#76947c]"
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

export function TutoringPage() {
  const [state, dispatch] = useReducer(tutoringReducer, initialTutoringState)
  const { addMistake } = usePrototype()
  const [attempt, setAttempt] = useState("")
  const [retell, setRetell] = useState("")
  const [transferAnswer, setTransferAnswer] = useState("")
  const currentProgress = progressIndex(state.step)

  function selectFile(event: ChangeEvent<HTMLInputElement>, replacing = false) {
    const fileName = fileNameFrom(event)
    if (!fileName) return
    dispatch({
      type: replacing ? "REPLACE_IMAGE" : "SELECT_IMAGE",
      fileName,
      quality: "clear",
    })
  }

  function saveMistake() {
    const mistake: Mistake = {
      id: "mistake-tutoring-fractions-20260725",
      subject: state.mistake.subject,
      knowledgePoint: state.mistake.knowledgePoint,
      prompt: "比较 2/3 和 3/5 的大小，并说明理由。",
      cause: state.mistake.cause,
      explanation: `先找公分母 15：2/3=10/15，3/5=9/15，所以 2/3 更大。我的复述：${state.retell}`,
      mastery: state.mistake.mastery,
      source: "tutoring",
      createdAt: state.mistake.createdAt,
      imageUrl: state.image
        ? `local-simulation://${encodeURIComponent(state.image.fileName)}`
        : undefined,
    }
    addMistake("student-lin-xiaoyu", mistake)
    dispatch({ type: "SAVE_MISTAKE" })
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#54705b]">
            <Sparkles aria-hidden="true" size={18} />
            一步一步来
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#102218] sm:text-4xl">
            拍照答疑
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64756a] sm:text-base">
            先告诉我你卡在哪里。我们从提示开始，保留你自己思考的空间。
          </p>
        </div>
        <StatusChip tone="info">原型演示，不会上传真实图片</StatusChip>
      </header>

      <ol
        aria-label="答疑进度"
        className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-[#6d7d72]"
      >
        {progressSteps.map((label, index) => (
          <li
            aria-current={currentProgress === index ? "step" : undefined}
            className="space-y-2"
            key={label}
          >
            <span
              className={`mx-auto grid size-8 place-items-center rounded-full shadow-sm ${
                index <= currentProgress
                  ? "bg-[#284b32] text-white"
                  : "bg-white/75"
              }`}
            >
              {index + 1}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      {state.step === "upload" ? (
        <GlassSurface
          className="grid min-h-[420px] place-items-center rounded-[32px] p-6 text-center sm:p-10"
          weight="sheet"
        >
          <div className="max-w-xl">
            <div className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#e5efe0] text-[#41694d]">
              <Camera aria-hidden="true" size={36} />
            </div>
            <h2 className="mt-6 text-2xl font-black text-[#14251b]">
              把题目放进来
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#68786e]">
              图片只用于当前原型预览。请选择能看清题干、数字和你的解题痕迹的图片。
            </p>
            <label className="mt-7 inline-flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#11271a] px-7 py-4 font-black text-white shadow-lg shadow-[#173723]/15 focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-[#789c80]">
              <ImagePlus aria-hidden="true" size={22} />
              选择题目图片
              <input
                accept="image/*"
                aria-label="选择一道清晰的题目图片"
                className="sr-only"
                onChange={(event) => selectFile(event)}
                type="file"
              />
            </label>
            <button
              className="mt-3 min-h-12 w-full rounded-xl px-4 text-sm font-bold text-[#5d7463] underline decoration-[#9eaf9f] underline-offset-4"
              onClick={() =>
                dispatch({
                  type: "SELECT_IMAGE",
                  fileName: "模糊的分数题.jpg",
                  quality: "unclear",
                })
              }
              type="button"
            >
              模拟一张不清晰的照片
            </button>
          </div>
        </GlassSurface>
      ) : null}

      {state.step === "needs-clearer-photo" ? (
        <FlowCard>
          <div className="text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#fff0cf] text-[#8a651c]">
              <RefreshCw aria-hidden="true" size={34} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-[#14251b]">
              这张照片有点看不清
            </h2>
            <p className="mt-3 leading-7 text-[#68786e]">
              请让题干、分数线和数字完整入镜，尽量从正上方拍摄。
            </p>
            <p className="mt-3 rounded-xl bg-white/60 px-4 py-3 text-sm font-bold text-[#526559]">
              当前图片：{state.image?.fileName}
            </p>
            <label className="mt-6 inline-flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#11271a] px-7 py-4 font-black text-white">
              重新选择清晰图片
              <input
                accept="image/*"
                aria-label="重新选择清晰图片"
                className="sr-only"
                onChange={(event) => selectFile(event, true)}
                type="file"
              />
            </label>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "sticking-point" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <GlassSurface className="rounded-[28px] p-5 sm:p-6" weight="card">
            <div className="aspect-[4/3] rounded-[22px] border border-white/80 bg-[linear-gradient(145deg,#fbfaf4,#e8efe4)] p-6 shadow-inner">
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs font-black tracking-[0.14em] text-[#748279]">
                  模拟题图预览
                </span>
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-[#17251c]">
                    比较 2/3 和 3/5 的大小
                  </p>
                  <p className="mt-5 font-handwriting text-lg text-[#788378]">
                    我的草稿：先通分……
                  </p>
                </div>
                <CheckCircle2
                  className="ml-auto text-[#6c8c72]"
                  aria-hidden="true"
                  size={22}
                />
              </div>
            </div>
            <p className="mt-4 text-center text-sm font-bold text-[#51645a]">
              {state.image?.fileName}
            </p>
            <p className="mt-1 text-center text-sm text-[#738178]">
              代表题目：比较 2/3 和 3/5 的大小
            </p>
            <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#aebdaf] bg-white/55 px-4 text-sm font-black text-[#35513d]">
              替换题目图片
              <input
                accept="image/*"
                aria-label="替换题目图片"
                className="sr-only"
                onChange={(event) => selectFile(event, true)}
                type="file"
              />
            </label>
          </GlassSurface>
          <GlassSurface className="rounded-[28px] p-5 sm:p-7" weight="sheet">
            <h2 className="text-2xl font-black text-[#14251b]">
              你现在卡在哪里？
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#68786e]">
              选最接近的一项，我们会从合适的提示层级开始。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {stickingChoices.map((choice) => (
                <button
                  aria-label={choice.label}
                  className="min-h-16 rounded-2xl border border-white/85 bg-white/65 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6f9277]"
                  key={choice.value}
                  onClick={() =>
                    dispatch({
                      type: "CHOOSE_STICKING_POINT",
                      choice: choice.value,
                    })
                  }
                  type="button"
                >
                  <strong className="block text-base text-[#183020]">
                    {choice.label}
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-[#718078]">
                    {choice.help}
                  </span>
                </button>
              ))}
            </div>
            {state.attemptRequired ? (
              <div className="mt-6 rounded-2xl bg-[#edf3e9]/85 p-4">
                <label
                  className="block text-sm font-black text-[#274631]"
                  htmlFor="attempt-description"
                >
                  描述你已经尝试到哪一步
                </label>
                <textarea
                  className="mt-3 min-h-28 w-full rounded-xl border border-[#c7d2c6] bg-white/85 p-3 text-[#1d3023] outline-none focus:border-[#618069] focus:ring-3 focus:ring-[#8baa91]/20"
                  id="attempt-description"
                  onChange={(event) => setAttempt(event.target.value)}
                  placeholder="例如：我尝试通分，但不知道公分母该选多少。"
                  value={attempt}
                />
                {state.validationError ? (
                  <p
                    className="mt-2 text-sm font-bold text-[#9a4f3d]"
                    role="alert"
                  >
                    {state.validationError}
                  </p>
                ) : null}
                <button
                  className="mt-4 min-h-12 w-full rounded-xl bg-[#183423] px-5 font-black text-white"
                  onClick={() =>
                    dispatch({ type: "SUBMIT_ATTEMPT", text: attempt })
                  }
                  type="button"
                >
                  继续确认题目
                </button>
              </div>
            ) : null}
          </GlassSurface>
        </div>
      ) : null}

      {state.step === "confirm-problem" ? (
        <FlowCard>
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#14251b]">
              先确认我们读到的题目
            </h2>
            <p className="mt-5 rounded-2xl bg-white/65 p-6 font-serif text-2xl font-bold text-[#1a2a20]">
              比较 2/3 和 3/5 的大小，并说明你的理由。
            </p>
            {state.attemptDescription ? (
              <p className="mt-4 text-sm leading-6 text-[#617168]">
                你已经尝试：{state.attemptDescription}
              </p>
            ) : null}
            <div className="mt-6">
              <PrimaryButton
                onClick={() => dispatch({ type: "CONFIRM_PROBLEM" })}
              >
                题目正确，开始提示
              </PrimaryButton>
            </div>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "hint" ? (
        <FlowCard>
          <StatusChip tone="info">先理解，不算答案</StatusChip>
          <h2 className="mt-4 text-2xl font-black text-[#14251b]">
            提示 1：先看条件
          </h2>
          <div className="mt-5 rounded-2xl bg-white/65 p-6">
            <p className="font-black text-[#284333]">
              两个分数的分母不同，暂时不能直接比较分子。
            </p>
            <p className="mt-3 leading-7 text-[#64746a]">
              想一想：有没有一个数，既是 3 的倍数，也是 5
              的倍数？把它作为公分母会发生什么？
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton
              onClick={() => dispatch({ type: "REQUEST_MORE_HINT" })}
            >
              再给我一点提示
            </PrimaryButton>
            <button
              className="min-h-14 rounded-2xl border border-[#aab9aa] bg-white/55 px-6 font-black text-[#34513d]"
              onClick={() => dispatch({ type: "CONTINUE_TO_RETELL" })}
              type="button"
            >
              我来复述
            </button>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "key-step" ? (
        <FlowCard>
          <StatusChip tone="warning">提示 2</StatusChip>
          <h2 className="mt-4 text-2xl font-black text-[#14251b]">关键步骤</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/65 p-6 text-center font-serif text-2xl font-bold">
              2/3 = 10/15
            </div>
            <div className="rounded-2xl bg-white/65 p-6 text-center font-serif text-2xl font-bold">
              3/5 = 9/15
            </div>
          </div>
          <p className="mt-5 leading-7 text-[#627168]">
            分母相同以后，只需要比较 10 和
            9。你可以先自己说出结论，也可以查看完整讲解。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton
              onClick={() => dispatch({ type: "REQUEST_EXPLANATION" })}
            >
              我想看完整讲解
            </PrimaryButton>
            <button
              className="min-h-14 rounded-2xl border border-[#aab9aa] bg-white/55 px-6 font-black text-[#34513d]"
              onClick={() => dispatch({ type: "CONTINUE_TO_RETELL" })}
              type="button"
            >
              我来复述
            </button>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "explanation" ? (
        <FlowCard>
          <StatusChip tone="success">完整方法</StatusChip>
          <h2 className="mt-4 text-2xl font-black text-[#14251b]">完整讲解</h2>
          <ol className="mt-5 space-y-3 text-[#4f6357]">
            <li className="rounded-2xl bg-white/65 p-4">
              <strong>1.</strong> 3 和 5 的最小公倍数是 15。
            </li>
            <li className="rounded-2xl bg-white/65 p-4">
              <strong>2.</strong> 把 2/3 化成 10/15，把 3/5 化成 9/15。
            </li>
            <li className="rounded-2xl bg-white/65 p-4">
              <strong>3.</strong> 10/15 大于 9/15，所以 2/3 大于 3/5。
            </li>
          </ol>
          <div className="mt-6">
            <PrimaryButton
              onClick={() => dispatch({ type: "CONTINUE_TO_RETELL" })}
            >
              我来复述
            </PrimaryButton>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "retell" ? (
        <FlowCard>
          <div className="flex items-center gap-3 text-[#446b4e]">
            <BookOpenCheck aria-hidden="true" size={24} />
            <StatusChip tone="success">费曼复述</StatusChip>
          </div>
          <h2 className="mt-4 text-2xl font-black text-[#14251b]">
            用自己的话讲一遍
          </h2>
          <p className="mt-2 leading-7 text-[#68786e]">
            不要照抄讲解。想象你正在把方法讲给同桌听。
          </p>
          <label
            className="mt-5 block text-sm font-black text-[#294532]"
            htmlFor="retell"
          >
            用自己的话复述解题方法
          </label>
          <textarea
            className="mt-3 min-h-36 w-full rounded-2xl border border-[#bdcabb] bg-white/75 p-4 outline-none focus:border-[#5d7e65] focus:ring-3 focus:ring-[#78927d]/20"
            id="retell"
            onChange={(event) => setRetell(event.target.value)}
            value={retell}
          />
          {state.validationError ? (
            <p className="mt-2 text-sm font-bold text-[#9a4f3d]" role="alert">
              {state.validationError}
            </p>
          ) : null}
          <div className="mt-6">
            <PrimaryButton
              onClick={() => dispatch({ type: "SUBMIT_RETELL", text: retell })}
            >
              提交复述并做迁移题
            </PrimaryButton>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "transfer" ? (
        <FlowCard>
          <div className="flex items-center gap-3 text-[#446b4e]">
            <Lightbulb aria-hidden="true" size={24} />
            <StatusChip tone="info">举一反三</StatusChip>
          </div>
          <h2 className="mt-4 text-2xl font-black text-[#14251b]">
            换一道题试试
          </h2>
          <p className="mt-5 rounded-2xl bg-white/65 p-6 text-center font-serif text-2xl font-bold">
            比较 3/4 和 5/8，哪个更大？
          </p>
          <fieldset className="mt-5 grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">选择迁移题答案</legend>
            {["3/4 更大", "5/8 更大", "一样大"].map((answer) => (
              <label
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-white/85 bg-white/65 px-5 font-bold"
                key={answer}
              >
                <input
                  checked={transferAnswer === answer}
                  name="transfer-answer"
                  onChange={() => setTransferAnswer(answer)}
                  type="radio"
                  value={answer}
                />
                {answer}
              </label>
            ))}
          </fieldset>
          <div className="mt-6">
            <PrimaryButton
              onClick={() =>
                dispatch({ type: "COMPLETE_TRANSFER", answer: transferAnswer })
              }
            >
              检查迁移题
            </PrimaryButton>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "save-mistake" ? (
        <FlowCard>
          <StatusChip
            tone={state.transferAnswer === "3/4 更大" ? "success" : "warning"}
          >
            {state.transferAnswer === "3/4 更大"
              ? "迁移题正确"
              : "已完成练习，建议稍后再看"}
          </StatusChip>
          <h2 className="mt-4 text-2xl font-black text-[#14251b]">
            整理进错题本
          </h2>
          <p className="mt-2 leading-7 text-[#68786e]">
            这些信息都可以修改。保存后只写入当前原型中的林晓雨档案。
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-black text-[#294532]">
              学科
              <select
                aria-label="学科"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#bdcabb] bg-white/80 px-3"
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_MISTAKE",
                    patch: {
                      subject: event.target.value as "数学" | "语文" | "英语",
                    },
                  })
                }
                value={state.mistake.subject}
              >
                <option>数学</option>
                <option>语文</option>
                <option>英语</option>
              </select>
            </label>
            <label className="text-sm font-black text-[#294532]">
              日期
              <input
                aria-label="日期"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#bdcabb] bg-white/80 px-3"
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_MISTAKE",
                    patch: { createdAt: event.target.value },
                  })
                }
                type="date"
                value={state.mistake.createdAt}
              />
            </label>
            <label className="text-sm font-black text-[#294532]">
              知识点
              <input
                aria-label="知识点"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#bdcabb] bg-white/80 px-3"
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_MISTAKE",
                    patch: { knowledgePoint: event.target.value },
                  })
                }
                value={state.mistake.knowledgePoint}
              />
            </label>
            <label className="text-sm font-black text-[#294532]">
              掌握状态
              <select
                aria-label="掌握状态"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#bdcabb] bg-white/80 px-3"
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_MISTAKE",
                    patch: {
                      mastery: event.target.value as Mistake["mastery"],
                    },
                  })
                }
                value={state.mistake.mastery}
              >
                <option value="new">刚加入</option>
                <option value="learning">正在学习</option>
                <option value="basic">基本掌握</option>
                <option value="mastered">已经掌握</option>
              </select>
            </label>
            <label className="text-sm font-black text-[#294532] sm:col-span-2">
              错因
              <textarea
                aria-label="错因"
                className="mt-2 min-h-28 w-full rounded-xl border border-[#bdcabb] bg-white/80 p-3"
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_MISTAKE",
                    patch: { cause: event.target.value },
                  })
                }
                value={state.mistake.cause}
              />
            </label>
          </div>
          <div className="mt-6">
            <PrimaryButton onClick={saveMistake}>保存到错题本</PrimaryButton>
          </div>
        </FlowCard>
      ) : null}

      {state.step === "complete" ? (
        <FlowCard>
          <div className="text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#e4f0df] text-[#477054]">
              <CheckCircle2 aria-hidden="true" size={38} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-[#14251b]">
              已经保存到错题本
            </h2>
            <div className="mx-auto mt-5 max-w-lg rounded-2xl bg-white/65 p-5 text-left">
              <p>
                <strong>知识点：</strong>
                {state.mistake.knowledgePoint}
              </p>
              <p className="mt-2">
                <strong>错因：</strong>
                {state.mistake.cause}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[#173221] px-7 font-black text-white"
                href="#/student/mistakes"
              >
                查看我的错题本
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <button
                className="min-h-14 rounded-2xl border border-[#aab9aa] bg-white/55 px-6 font-black text-[#34513d]"
                onClick={() => {
                  dispatch({ type: "RESET" })
                  setAttempt("")
                  setRetell("")
                  setTransferAnswer("")
                }}
                type="button"
              >
                再问一道题
              </button>
            </div>
          </div>
        </FlowCard>
      ) : null}
    </div>
  )
}

export default TutoringPage
