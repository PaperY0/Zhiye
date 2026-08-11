import { ArrowRight, BookOpenCheck, Camera, CheckCircle2, ImagePlus, Lightbulb, RefreshCw, Sparkles } from "lucide-react"
import { useReducer, useState, type ChangeEvent, type ReactNode } from "react"
import type { Mistake } from "../../../app/prototype/types"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import { generateDraft, recognizeQuestionImage } from "../../../services/localAi"
import { initialTutoringState, tutoringReducer, type StickingPoint, type TutoringDraft } from "./tutoringMachine"

const stickingChoices: Array<{ value: StickingPoint; label: string; help: string }> = [
  { value: "no-idea", label: "完全没思路", help: "先一起读懂条件，不直接给答案" },
  { value: "stuck-step", label: "卡在某一步", help: "说说你做到哪儿，我们接着往下" },
  { value: "check-idea", label: "想核对思路", help: "检查方法是否合理，再补一个提示" },
  { value: "check-answer", label: "已做完想检查", help: "核对步骤，也看看有没有更稳的方法" },
]

function isTutoringDraft(value: unknown): value is TutoringDraft {
  if (!value || typeof value !== "object") return false
  const draft = value as Record<string, unknown>
  const textFields = ["hint", "keyStep", "explanation", "retellPrompt", "transferQuestion", "transferAnswer"]
  const options = draft.transferOptions
  return textFields.every((key) => typeof draft[key] === "string" && draft[key].trim())
    && Array.isArray(options)
    && options.length > 0
    && options.every((option) => typeof option === "string" && option.trim())
    && options.includes(draft.transferAnswer)
}

function progressIndex(step: string): number {
  if (["upload", "recognizing-image", "confirm-ocr", "ocr-failed"].includes(step)) return 0
  if (["sticking-point", "generating", "generation-failed"].includes(step)) return 1
  if (["hint", "key-step", "explanation", "retell"].includes(step)) return 2
  return 3
}

function FlowCard({ children }: { children: ReactNode }) {
  return <GlassSurface className="rounded-[32px] p-6 sm:p-9" weight="sheet"><div className="mx-auto max-w-3xl">{children}</div></GlassSurface>
}

function PrimaryButton({ children, onClick, disabled = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button className="min-h-14 rounded-2xl bg-[#173221] px-7 font-black text-white shadow-lg shadow-[#173221]/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} onClick={onClick} type="button">{children}</button>
}

export function TutoringPage() {
  const [state, dispatch] = useReducer(tutoringReducer, initialTutoringState)
  const { addMistake } = usePrototype()
  const [ocrText, setOcrText] = useState("")
  const [attempt, setAttempt] = useState("")
  const [retell, setRetell] = useState("")
  const [transferAnswer, setTransferAnswer] = useState("")
  const progressSteps = ["上传题目", "找到卡点", "分层提示", "巩固保存"]

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    dispatch({ type: "SELECT_IMAGE", fileName: file.name })
    try {
      const recognition = await recognizeQuestionImage(file)
      const text = recognition.recognizedText.trim()
      if (!text || recognition.ocrConfidence < 0.6) {
        dispatch({ type: "OCR_FAILED", message: recognition.retryMessage ?? "题目没有识别清楚，请补拍。" })
        return
      }
      setOcrText(text)
      dispatch({ type: "OCR_RECOGNIZED", text })
    } catch (error) {
      dispatch({ type: "OCR_FAILED", message: error instanceof Error ? error.message : "题目识别失败，请补拍后重试。" })
    }
  }

  async function requestTutoring(stickingPoint: StickingPoint, submittedAttempt: string) {
    try {
      const response = await generateDraft("tutoring", { questionText: state.questionText, stickingPoint, attempt: submittedAttempt })
      if (!isTutoringDraft(response)) throw new Error("答疑内容不完整，请重试生成。")
      dispatch({ type: "DRAFT_READY", draft: response })
    } catch (error) {
      dispatch({ type: "DRAFT_FAILED", message: error instanceof Error ? error.message : "生成提示失败，请重试。" })
    }
  }

  async function chooseStickingPoint(choice: StickingPoint) {
    dispatch({ type: "CHOOSE_STICKING_POINT", choice })
    if (choice !== "stuck-step") await requestTutoring(choice, "")
  }

  async function submitAttempt() {
    const text = attempt.trim()
    dispatch({ type: "SUBMIT_ATTEMPT", text })
    if (text && state.stickingPoint) await requestTutoring(state.stickingPoint, text)
  }

  async function retryDraft() {
    if (!state.stickingPoint) return
    dispatch({ type: "RETRY_DRAFT" })
    await requestTutoring(state.stickingPoint, state.attemptDescription)
  }

  function saveMistake() {
    if (!state.draft) return
    const mistake: Mistake = {
      id: `mistake-tutoring-${Date.now()}`,
      subject: state.mistake.subject,
      knowledgePoint: state.mistake.knowledgePoint,
      prompt: state.questionText,
      cause: state.mistake.cause,
      explanation: `${state.draft.explanation} 我的复述：${state.retell}`,
      mastery: state.mistake.mastery,
      source: "tutoring",
      createdAt: state.mistake.createdAt,
      imageUrl: state.image ? `local-simulation://${encodeURIComponent(state.image.fileName)}` : undefined,
    }
    addMistake("student-lin-xiaoyu", mistake)
    dispatch({ type: "SAVE_MISTAKE" })
  }

  const draft = state.draft
  const currentProgress = progressIndex(state.step)

  return <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#54705b]"><Sparkles aria-hidden="true" size={18} />一步一步来</div><h1 className="text-3xl font-black tracking-tight text-[#102218] sm:text-4xl">拍照答疑</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#64756a] sm:text-base">先确认题目，再告诉我你卡在哪里。我们从提示开始，保留你自己思考的空间。</p></div><StatusChip tone="info">题图仅发送至本地 OCR 服务</StatusChip></header>
    <ol aria-label="答疑进度" className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-[#6d7d72]">{progressSteps.map((label, index) => <li aria-current={currentProgress === index ? "step" : undefined} className="space-y-2" key={label}><span className={`mx-auto grid size-8 place-items-center rounded-full shadow-sm ${index <= currentProgress ? "bg-[#284b32] text-white" : "bg-white/75"}`}>{index + 1}</span><span>{label}</span></li>)}</ol>

    {state.step === "upload" ? <GlassSurface className="grid min-h-[420px] place-items-center rounded-[32px] p-6 text-center sm:p-10" weight="sheet"><div className="max-w-xl"><div className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#e5efe0] text-[#41694d]"><Camera aria-hidden="true" size={36} /></div><h2 className="mt-6 text-2xl font-black text-[#14251b]">把题目放进来</h2><p className="mt-3 text-sm leading-6 text-[#68786e]">请选择能看清题干、数字和解题痕迹的图片。识别后你可以修改题目文本。</p><label className="mt-7 inline-flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#11271a] px-7 py-4 font-black text-white"><ImagePlus aria-hidden="true" size={22} />选择题目图片<input accept="image/*" aria-label="选择题目图片" className="sr-only" onChange={selectFile} type="file" /></label></div></GlassSurface> : null}
    {state.step === "recognizing-image" ? <FlowCard><div className="text-center"><RefreshCw className="mx-auto animate-spin text-[#41694d]" size={36} /><h2 className="mt-5 text-2xl font-black text-[#14251b]">正在识别题目</h2><p className="mt-3 text-[#68786e]">正在读取 {state.image?.fileName} 中的题干与数字。</p></div></FlowCard> : null}
    {state.step === "ocr-failed" ? <FlowCard><div className="text-center"><RefreshCw className="mx-auto text-[#8a651c]" size={36} /><h2 className="mt-5 text-2xl font-black text-[#14251b]">请补拍一张清晰题图</h2><p className="mt-3 text-[#68786e]" role="alert">{state.ocrError}</p><label className="mt-6 inline-flex min-h-14 cursor-pointer items-center justify-center rounded-2xl bg-[#173221] px-7 font-black text-white">重新选择题目图片<input accept="image/*" aria-label="重新选择题目图片" className="sr-only" onChange={selectFile} type="file" /></label></div></FlowCard> : null}
    {state.step === "confirm-ocr" ? <FlowCard><h2 className="text-2xl font-black text-[#14251b]">确认识别出的题目</h2><p className="mt-2 text-sm leading-6 text-[#68786e]">请校对题干、数字和符号；确认后才会开始答疑。</p><label className="mt-5 block text-sm font-black text-[#294532]" htmlFor="ocr-question">识别文本</label><textarea className="mt-3 min-h-36 w-full rounded-2xl border border-[#bdcabb] bg-white/75 p-4" id="ocr-question" onChange={(event) => setOcrText(event.target.value)} value={ocrText} />{state.validationError ? <p className="mt-2 text-sm font-bold text-[#9a4f3d]" role="alert">{state.validationError}</p> : null}<div className="mt-6"><PrimaryButton onClick={() => dispatch({ type: "CONFIRM_OCR", text: ocrText })}>确认题目，继续</PrimaryButton></div></FlowCard> : null}
    {state.step === "sticking-point" ? <FlowCard><h2 className="text-2xl font-black text-[#14251b]">你现在卡在哪里？</h2><p className="mt-3 rounded-2xl bg-white/65 p-5 font-serif text-xl font-bold text-[#1a2a20]">{state.questionText}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{stickingChoices.map((choice) => <button aria-label={choice.label} className="min-h-16 rounded-2xl border border-white/85 bg-white/65 p-4 text-left shadow-sm" key={choice.value} onClick={() => void chooseStickingPoint(choice.value)} type="button"><strong className="block text-base text-[#183020]">{choice.label}</strong><span className="mt-1 block text-xs leading-5 text-[#718078]">{choice.help}</span></button>)}</div>{state.attemptRequired ? <div className="mt-6 rounded-2xl bg-[#edf3e9]/85 p-4"><label className="block text-sm font-black text-[#274631]" htmlFor="attempt-description">描述你已经尝试到哪一步</label><textarea className="mt-3 min-h-28 w-full rounded-xl border border-[#c7d2c6] bg-white/85 p-3" id="attempt-description" onChange={(event) => setAttempt(event.target.value)} value={attempt} />{state.validationError ? <p className="mt-2 text-sm font-bold text-[#9a4f3d]" role="alert">{state.validationError}</p> : null}<div className="mt-4"><PrimaryButton onClick={() => void submitAttempt()}>开始提示</PrimaryButton></div></div> : null}</FlowCard> : null}
    {state.step === "generating" ? <FlowCard><div className="text-center"><RefreshCw className="mx-auto animate-spin text-[#41694d]" size={36} /><h2 className="mt-5 text-2xl font-black text-[#14251b]">正在生成分层提示</h2><p className="mt-3 text-[#68786e]">会先给提示，再按你的节奏展开。</p></div></FlowCard> : null}
    {state.step === "generation-failed" ? <FlowCard><div className="text-center"><RefreshCw className="mx-auto text-[#8a651c]" size={36} /><h2 className="mt-5 text-2xl font-black text-[#14251b]">暂时没有生成答疑</h2><p className="mt-3 text-[#68786e]" role="alert">{state.validationError}</p><div className="mt-6"><PrimaryButton onClick={() => void retryDraft()}>重试生成提示</PrimaryButton></div></div></FlowCard> : null}
    {state.step === "hint" && draft ? <FlowCard><StatusChip tone="info">先理解，不算答案</StatusChip><h2 className="mt-4 text-2xl font-black text-[#14251b]">提示 1：先看条件</h2><p className="mt-5 rounded-2xl bg-white/65 p-6 leading-7 text-[#284333]">{draft.hint}</p><div className="mt-6 flex flex-wrap gap-3"><PrimaryButton onClick={() => dispatch({ type: "REQUEST_MORE_HINT" })}>再给我一点提示</PrimaryButton><button className="min-h-14 rounded-2xl border border-[#aab9aa] bg-white/55 px-6 font-black text-[#34513d]" onClick={() => dispatch({ type: "CONTINUE_TO_RETELL" })} type="button">我来复述</button></div></FlowCard> : null}
    {state.step === "key-step" && draft ? <FlowCard><StatusChip tone="warning">提示 2</StatusChip><h2 className="mt-4 text-2xl font-black text-[#14251b]">关键步骤</h2><p className="mt-5 rounded-2xl bg-white/65 p-6 leading-7 text-[#4f6357]">{draft.keyStep}</p><div className="mt-6 flex flex-wrap gap-3"><PrimaryButton onClick={() => dispatch({ type: "REQUEST_EXPLANATION" })}>我想看完整讲解</PrimaryButton><button className="min-h-14 rounded-2xl border border-[#aab9aa] bg-white/55 px-6 font-black text-[#34513d]" onClick={() => dispatch({ type: "CONTINUE_TO_RETELL" })} type="button">我来复述</button></div></FlowCard> : null}
    {state.step === "explanation" && draft ? <FlowCard><StatusChip tone="success">完整方法</StatusChip><h2 className="mt-4 text-2xl font-black text-[#14251b]">完整讲解</h2><p className="mt-5 rounded-2xl bg-white/65 p-6 leading-7 text-[#4f6357]">{draft.explanation}</p><div className="mt-6"><PrimaryButton onClick={() => dispatch({ type: "CONTINUE_TO_RETELL" })}>我来复述</PrimaryButton></div></FlowCard> : null}
    {state.step === "retell" && draft ? <FlowCard><div className="flex items-center gap-3 text-[#446b4e]"><BookOpenCheck aria-hidden="true" size={24} /><StatusChip tone="success">费曼复述</StatusChip></div><h2 className="mt-4 text-2xl font-black text-[#14251b]">用自己的话讲一遍</h2><p className="mt-2 leading-7 text-[#68786e]">{draft.retellPrompt}</p><label className="mt-5 block text-sm font-black text-[#294532]" htmlFor="retell">用自己的话复述解题方法</label><textarea className="mt-3 min-h-36 w-full rounded-2xl border border-[#bdcabb] bg-white/75 p-4" id="retell" onChange={(event) => setRetell(event.target.value)} value={retell} />{state.validationError ? <p className="mt-2 text-sm font-bold text-[#9a4f3d]" role="alert">{state.validationError}</p> : null}<div className="mt-6"><PrimaryButton onClick={() => dispatch({ type: "SUBMIT_RETELL", text: retell })}>提交复述并做迁移题</PrimaryButton></div></FlowCard> : null}
    {state.step === "transfer" && draft ? <FlowCard><div className="flex items-center gap-3 text-[#446b4e]"><Lightbulb aria-hidden="true" size={24} /><StatusChip tone="info">举一反三</StatusChip></div><h2 className="mt-4 text-2xl font-black text-[#14251b]">换一道题试试</h2><p className="mt-5 rounded-2xl bg-white/65 p-6 text-center font-serif text-xl font-bold">{draft.transferQuestion}</p><fieldset className="mt-5 grid gap-3 sm:grid-cols-3"><legend className="sr-only">选择迁移题答案</legend>{draft.transferOptions.map((option) => <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-white/85 bg-white/65 px-5 font-bold" key={option}><input checked={transferAnswer === option} name="transfer-answer" onChange={() => setTransferAnswer(option)} type="radio" value={option} />{option}</label>)}</fieldset><div className="mt-6"><PrimaryButton onClick={() => dispatch({ type: "COMPLETE_TRANSFER", answer: transferAnswer })}>检查迁移题</PrimaryButton></div></FlowCard> : null}
    {state.step === "save-mistake" && draft ? <FlowCard><StatusChip tone={state.transferAnswer === draft.transferAnswer ? "success" : "warning"}>{state.transferAnswer === draft.transferAnswer ? "迁移题正确" : "已完成练习，建议稍后再看"}</StatusChip><h2 className="mt-4 text-2xl font-black text-[#14251b]">整理进错题本</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-black text-[#294532]">学科<select aria-label="学科" className="mt-2 min-h-12 w-full rounded-xl border border-[#bdcabb] bg-white/80 px-3" onChange={(event) => dispatch({ type: "UPDATE_MISTAKE", patch: { subject: event.target.value as Mistake["subject"] } })} value={state.mistake.subject}><option>数学</option><option>语文</option><option>英语</option></select></label><label className="text-sm font-black text-[#294532]">知识点<input aria-label="知识点" className="mt-2 min-h-12 w-full rounded-xl border border-[#bdcabb] bg-white/80 px-3" onChange={(event) => dispatch({ type: "UPDATE_MISTAKE", patch: { knowledgePoint: event.target.value } })} value={state.mistake.knowledgePoint} /></label><label className="text-sm font-black text-[#294532] sm:col-span-2">错因<textarea aria-label="错因" className="mt-2 min-h-28 w-full rounded-xl border border-[#bdcabb] bg-white/80 p-3" onChange={(event) => dispatch({ type: "UPDATE_MISTAKE", patch: { cause: event.target.value } })} value={state.mistake.cause} /></label></div><div className="mt-6"><PrimaryButton onClick={saveMistake}>保存到错题本</PrimaryButton></div></FlowCard> : null}
    {state.step === "complete" ? <FlowCard><div className="text-center"><CheckCircle2 className="mx-auto text-[#477054]" size={38} /><h2 className="mt-5 text-2xl font-black text-[#14251b]">已经保存到错题本</h2><div className="mt-7 flex flex-wrap justify-center gap-3"><a className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[#173221] px-7 font-black text-white" href="#/student/mistakes">查看我的错题本<ArrowRight aria-hidden="true" size={18} /></a><button className="min-h-14 rounded-2xl border border-[#aab9aa] bg-white/55 px-6 font-black text-[#34513d]" onClick={() => { dispatch({ type: "RESET" }); setOcrText(""); setAttempt(""); setRetell(""); setTransferAnswer("") }} type="button">再问一道题</button></div></div></FlowCard> : null}
  </div>
}

export default TutoringPage
