import { useMemo, useState } from "react"
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardPenLine,
  FileCheck2,
  History,
  Lightbulb,
  MessageCircleQuestion,
  PencilLine,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import type {
  KnowledgeSignal,
  ParentSummary,
  StudentTimelineEvent,
} from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"

type Feedback = {
  id: number
  message: string
}

type ParentSummaryDraft = Pick<ParentSummary, "topics" | "encouragement" | "teacherMessage"> & {
  evidence: string[]
}

type StudentObservationDraft = {
  observation: string
  suggestedSupport: string
  evidence: string[]
}

export interface StudentDetailPageProps {
  studentId: string
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function timelineIcon(type: StudentTimelineEvent["type"]) {
  switch (type) {
    case "lesson":
      return BookOpen
    case "review":
      return FileCheck2
    case "mistake":
      return AlertCircle
    case "task":
      return CheckCircle2
    case "message":
      return MessageCircleQuestion
  }
}

function signalTone(severity: KnowledgeSignal["severity"]): StatusTone {
  if (severity === "priority") return "warning"
  if (severity === "attention") return "info"
  return "neutral"
}

function signalLabel(severity: KnowledgeSignal["severity"]) {
  if (severity === "priority") return "建议优先复核"
  if (severity === "attention") return "持续观察"
  return "留意变化"
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : []
}

function readParentSummaryDraft(response: unknown, evidence: string[]): ParentSummaryDraft | null {
  const content = asRecord(asRecord(response)?.content)
  if (!content) return null
  const topics = stringList(content.topics)
  const encouragement = typeof content.encouragement === "string" ? content.encouragement.trim() : ""
  const teacherMessage = typeof content.teacher_message === "string" ? content.teacher_message.trim() : ""
  return topics.length > 0 && encouragement && teacherMessage
    ? { topics, encouragement, teacherMessage, evidence }
    : null
}

function readObservationDraft(response: unknown): StudentObservationDraft | null {
  const content = asRecord(asRecord(response)?.content)
  if (!content) return null
  const observation = typeof content.observation === "string" ? content.observation.trim() : ""
  const suggestedSupport = typeof content.suggested_support === "string" ? content.suggested_support.trim() : ""
  const evidence = stringList(content.evidence)
  return observation && suggestedSupport && evidence.length > 0
    ? { observation, suggestedSupport, evidence }
    : null
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps) {
  const {
    addStudentTeacherNote,
    approveStudentObservation,
    parentSummary,
    publishParentSummary,
    signals,
    students,
  } = usePrototype()
  const student = students.find((item) => item.id === studentId)
  const [noteDraft, setNoteDraft] = useState("")
  const [savedNotes, setSavedNotes] = useState<string[]>(student?.teacherNotes ?? [])
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctionDraft, setCorrectionDraft] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [parentDraft, setParentDraft] = useState<ParentSummaryDraft | null>(null)
  const [observationDraft, setObservationDraft] = useState<StudentObservationDraft | null>(null)
  const [generating, setGenerating] = useState<"parent" | "observation" | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [failedGeneration, setFailedGeneration] = useState<"parent" | "observation" | null>(null)

  const evidenceSignals = useMemo(
    () =>
      signals.filter((signal) => signal.affectedStudentIds.includes(studentId)),
    [signals, studentId],
  )

  if (!student) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <GlassSurface
          className="grid min-h-[420px] place-items-center p-8 text-center"
          weight="card"
        >
          <div>
            <UserRoundCheck
              aria-hidden="true"
              className="mx-auto text-[#728579]"
              size={34}
            />
            <h1 className="mt-4 text-2xl font-black text-[#203427]">
              未找到学生档案
            </h1>
            <p className="mt-2 text-sm text-[#74837a]">
              请返回学生列表并重新选择。
            </p>
          </div>
        </GlassSurface>
      </div>
    )
  }

  const saveNote = () => {
    const normalized = noteDraft.trim()
    if (!normalized) return
    addStudentTeacherNote(studentId, normalized)
    setSavedNotes((current) => [normalized, ...current])
    setNoteDraft("")
    setFeedback({ id: Date.now(), message: "教师笔记已保存" })
  }

  const submitCorrection = () => {
    if (!correctionDraft.trim()) return
    setCorrectionOpen(false)
    setCorrectionDraft("")
    setFeedback({ id: Date.now(), message: "更正申请已提交，等待人工核实" })
  }

  const approvedFacts = [
    ...student.facts,
    ...evidenceSignals.flatMap((signal) => signal.evidence.map((item) => `课堂证据：${item}`)),
  ].slice(0, 30)

  const generateParentSummary = async () => {
    setGenerating("parent")
    setGenerationError(null)
    setFailedGeneration(null)
    try {
      const response = await generateDraft("parent-summary", {
        facts: approvedFacts,
        teacherMessage:
          parentSummary?.studentId === student.id
            ? parentSummary.teacherMessage
            : savedNotes[0] ?? "请结合本周学习过程陪伴孩子复习。",
      })
      const draft = readParentSummaryDraft(response, approvedFacts)
      if (!draft) throw new Error("AI 草稿格式无效，请重试")
      setParentDraft(draft)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "生成摘要失败，请重试")
      setFailedGeneration("parent")
    } finally {
      setGenerating(null)
    }
  }

  const generateObservation = async () => {
    setGenerating("observation")
    setGenerationError(null)
    setFailedGeneration(null)
    try {
      const response = await generateDraft("student-inference", {
        facts: student.facts.slice(0, 30),
        mistakes: student.mistakes.map((mistake) => mistake.prompt).slice(0, 30),
      })
      const draft = readObservationDraft(response)
      if (!draft) throw new Error("AI 草稿格式无效，请重试")
      setObservationDraft(draft)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "生成观察失败，请重试")
      setFailedGeneration("observation")
    } finally {
      setGenerating(null)
    }
  }

  const publishParentDraft = () => {
    if (!parentDraft) return
    publishParentSummary({
      id: `parent-summary-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      weekLabel: parentSummary?.weekLabel ?? "本周学习摘要",
      voluntaryQuestions: student.voluntaryQuestions,
      practiceCount: student.practiceCount,
      topics: parentDraft.topics,
      encouragement: parentDraft.encouragement,
      teacherMessage: parentDraft.teacherMessage,
      audioLetter: parentSummary?.audioLetter ?? {
        title: "李老师的本周语音信",
        durationSeconds: 48,
        simulated: true,
      },
      source: "deepseek",
      confirmedAt: new Date().toISOString(),
      evidence: parentDraft.evidence,
    })
    setParentDraft(null)
    setFeedback({ id: Date.now(), message: "家长摘要已由教师确认发布" })
  }

  const approveObservation = () => {
    if (!observationDraft) return
    approveStudentObservation(student.id, {
      observation: observationDraft.observation,
      suggestedSupport: observationDraft.suggestedSupport,
      evidence: observationDraft.evidence,
    })
    setObservationDraft(null)
    setFeedback({ id: Date.now(), message: "学生观察已由教师确认保存" })
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,.82),rgba(239,245,238,.67))] p-5 shadow-[0_22px_60px_rgba(48,74,56,.08)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(205,224,207,.72),transparent_68%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border border-white bg-[linear-gradient(145deg,#eee5c4,#cfe0ce)] text-2xl font-black text-[#426049] shadow-[0_10px_24px_rgba(68,96,73,.12)]">
              {student.avatarText}
            </div>
            <div>
              <p className="text-xs font-black tracking-[.14em] text-[#718276]">
                学生学习档案
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-[-.045em] text-[#15251a] sm:text-4xl">
                {student.name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#728178]">
                {student.className} · {student.guardianRelation}{" "}
                {student.guardianName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="success">档案同步完成</StatusChip>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white bg-white/75 px-4 text-sm font-black text-[#38523e] shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a7c2aa]/35"
              onClick={() => setCorrectionOpen(true)}
              type="button"
            >
              <PencilLine aria-hidden="true" size={16} />
              申请更正档案
            </button>
          </div>
        </div>
      </header>

      {feedback ? (
        <div
          className="mt-4 flex items-center gap-2 rounded-[18px] border border-[#cfe0cf] bg-[#edf5ea] px-4 py-3 text-sm font-black text-[#3f6147]"
          key={feedback.id}
          role="status"
        >
          <Check aria-hidden="true" size={17} />
          {feedback.message}
        </div>
      ) : null}

      <section
        aria-label="学习概览"
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          [MessageCircleQuestion, student.voluntaryQuestions, "本周主动提问"],
          [ClipboardPenLine, student.practiceCount, "本周完成练习"],
          [BarChart3, `${student.taskCompletionRate}%`, "任务完成率"],
          [BookOpen, student.mistakes.length, "在学错题"],
        ].map(([Icon, value, label]) => {
          const MetricIcon = Icon as typeof BookOpen
          return (
            <GlassSurface
              className="flex items-center gap-4 p-5"
              key={String(label)}
              weight="light"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf1e7] text-[#58725e]">
                <MetricIcon aria-hidden="true" size={20} />
              </div>
              <div>
                <strong className="text-2xl font-black text-[#203427]">
                  {String(value)}
                </strong>
                <p className="text-xs font-bold text-[#78877e]">
                  {String(label)}
                </p>
              </div>
            </GlassSurface>
          )
        })}
      </section>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
        <div className="min-w-0 space-y-5">
          <GlassSurface className="p-5 sm:p-7" weight="card">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e9f1e6] text-[#55705b]">
                <History aria-hidden="true" size={19} />
              </div>
              <div>
                <p className="text-xs font-black tracking-[.12em] text-[#77877c]">
                  真实学习记录
                </p>
                <h2 className="text-xl font-black text-[#203427]">
                  学习时间线
                </h2>
              </div>
            </div>

            <ol className="relative mt-6 space-y-1 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-[#dce6da]">
              {student.timeline.map((event) => {
                const EventIcon = timelineIcon(event.type)
                return (
                  <li
                    className="relative flex gap-4 rounded-[20px] p-3 transition hover:bg-white/52"
                    key={event.id}
                  >
                    <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-[#f7faf5] bg-[#dfeade] text-[#55705c]">
                      <EventIcon aria-hidden="true" size={15} />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-black text-[#263b2b]">
                          {event.title}
                        </h3>
                        <time
                          className="text-xs font-bold text-[#8a978f]"
                          dateTime={event.occurredAt}
                        >
                          {formatDateTime(event.occurredAt)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#6f7f75]">
                        {event.detail}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#66806c]">
                        <ShieldCheck aria-hidden="true" size={13} />
                        {event.fact ? "已记录事实" : "待核实记录"}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </GlassSurface>

          <GlassSurface
            aria-label="知识证据"
            className="p-5 sm:p-7"
            role="region"
            weight="card"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black tracking-[.12em] text-[#77877c]">
                  来自课堂、练习与自检
                </p>
                <h2 className="mt-1 text-xl font-black text-[#203427]">
                  知识证据
                </h2>
              </div>
              <StatusChip tone="neutral">仅展示可追溯证据</StatusChip>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {evidenceSignals.map((signal) => (
                <article
                  className="rounded-[22px] border border-white/90 bg-white/60 p-5"
                  key={signal.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[#263b2b]">
                        {signal.knowledgePoint}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-[#829087]">
                        观察步骤：{signal.step}
                      </p>
                    </div>
                    <StatusChip tone={signalTone(signal.severity)}>
                      {signalLabel(signal.severity)}
                    </StatusChip>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {signal.evidence.map((item) => (
                      <li
                        className="flex gap-2 text-sm leading-6 text-[#63746a]"
                        key={item}
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-[#718c75]"
                          size={15}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex items-center gap-2 border-t border-[#e4ebe2] pt-3 text-xs font-bold text-[#849188]">
                    <CalendarDays aria-hidden="true" size={14} />
                    最近观察：{formatDateTime(signal.observedAt)}
                  </p>
                </article>
              ))}
            </div>
          </GlassSurface>
        </div>

        <aside className="min-w-0 space-y-5">
          <GlassSurface
            aria-label="可核实事实"
            className="p-5 sm:p-6"
            role="region"
            weight="card"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e7f0e4] text-[#55715a]">
                <ShieldCheck aria-hidden="true" size={19} />
              </div>
              <div>
                <p className="text-xs font-black tracking-[.12em] text-[#78877e]">
                  FACTS
                </p>
                <h2 className="font-black text-[#203427]">可核实事实</h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {student.facts.map((fact) => (
                <li
                  className="flex gap-3 rounded-[18px] bg-white/58 p-4 text-sm font-bold leading-6 text-[#496050]"
                  key={fact}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#6f8e74]"
                    size={17}
                  />
                  {fact}
                </li>
              ))}
            </ul>
          </GlassSurface>

          <GlassSurface
            aria-label="AI 审核草稿"
            className="border-[#d8d9bd]/80 bg-[linear-gradient(145deg,rgba(255,255,255,.76),rgba(245,241,211,.62))] p-5 sm:p-6"
            role="region"
            weight="card"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eeecd3] text-[#777342]">
                <Sparkles aria-hidden="true" size={19} />
              </div>
              <div>
                <p className="text-xs font-black tracking-[.12em] text-[#88865f]">
                  仅教师生成、编辑与确认
                </p>
                <h2 className="mt-0.5 font-black text-[#3b4029]">可审核 AI 草稿</h2>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 text-[#777657]">
              仅将可核实事实、错题和课堂证据发送给本地 AI；家长不会看到待审核内容。
            </p>
            <div className="mt-4 grid gap-2">
              <button
                className="inline-flex h-11 items-center justify-center rounded-[16px] bg-[#3f4b30] px-4 text-sm font-black text-white disabled:opacity-45"
                disabled={generating !== null}
                onClick={generateParentSummary}
                type="button"
              >
                {generating === "parent" ? "正在生成摘要草稿" : "生成本周摘要草稿"}
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[#c9cfaf] bg-white/70 px-4 text-sm font-black text-[#505b39] disabled:opacity-45"
                disabled={generating !== null}
                onClick={generateObservation}
                type="button"
              >
                {generating === "observation" ? "正在生成观察草稿" : "生成观察草稿"}
              </button>
            </div>
            {generationError ? (
              <div className="mt-4 rounded-[16px] border border-[#e9c8bb] bg-[#fff2ed] p-3 text-sm font-bold text-[#9c4a35]" role="alert">
                <p>{generationError}</p>
                <button
                  className="mt-2 underline underline-offset-4"
                  onClick={() => failedGeneration === "parent" ? generateParentSummary() : generateObservation()}
                  type="button"
                >
                  {failedGeneration === "parent" ? "重试生成摘要" : "重试生成观察"}
                </button>
              </div>
            ) : null}
            {parentDraft ? (
              <div className="mt-5 rounded-[18px] border border-[#d9d8b4] bg-white/72 p-4">
                <p className="text-xs font-black tracking-[.1em] text-[#777342]">AI 草稿 · 待教师审核</p>
                <p className="mt-3 text-xs font-black text-[#71765f]">学习主题（用顿号分隔）</p>
                <input
                  aria-label="家长摘要学习主题"
                  className="mt-1 w-full rounded-xl border border-[#e5e7d4] bg-white p-2 text-sm"
                  onChange={(event) => setParentDraft((current) => current ? { ...current, topics: event.target.value.split("、").map((item) => item.trim()).filter(Boolean) } : current)}
                  value={parentDraft.topics.join("、")}
                />
                <label className="mt-3 block text-xs font-black text-[#71765f]">
                  鼓励语
                  <textarea aria-label="家长摘要鼓励语" className="mt-1 min-h-20 w-full rounded-xl border border-[#e5e7d4] bg-white p-2 text-sm" onChange={(event) => setParentDraft((current) => current ? { ...current, encouragement: event.target.value } : current)} value={parentDraft.encouragement} />
                </label>
                <label className="mt-3 block text-xs font-black text-[#71765f]">
                  教师留言
                  <textarea aria-label="家长摘要教师留言" className="mt-1 min-h-20 w-full rounded-xl border border-[#e5e7d4] bg-white p-2 text-sm" onChange={(event) => setParentDraft((current) => current ? { ...current, teacherMessage: event.target.value } : current)} value={parentDraft.teacherMessage} />
                </label>
                <p className="mt-3 text-xs font-semibold text-[#777657]">依据：{parentDraft.evidence.join("；")}</p>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-xl bg-[#3f4b30] px-3 py-2 text-sm font-black text-white" onClick={publishParentDraft} type="button">采纳并发布</button>
                  <button className="rounded-xl border border-[#d9d8b4] bg-white px-3 py-2 text-sm font-black text-[#66674d]" onClick={() => setParentDraft(null)} type="button">忽略草稿</button>
                </div>
              </div>
            ) : null}
            {observationDraft ? (
              <div className="mt-5 rounded-[18px] border border-[#d9d8b4] bg-white/72 p-4">
                <p className="text-xs font-black tracking-[.1em] text-[#777342]">AI 草稿 · 待教师审核</p>
                <label className="mt-3 block text-xs font-black text-[#71765f]">
                  观察描述
                  <textarea aria-label="学生观察描述" className="mt-1 min-h-20 w-full rounded-xl border border-[#e5e7d4] bg-white p-2 text-sm" onChange={(event) => setObservationDraft((current) => current ? { ...current, observation: event.target.value } : current)} value={observationDraft.observation} />
                </label>
                <label className="mt-3 block text-xs font-black text-[#71765f]">
                  后续支持
                  <textarea aria-label="学生观察后续支持" className="mt-1 min-h-20 w-full rounded-xl border border-[#e5e7d4] bg-white p-2 text-sm" onChange={(event) => setObservationDraft((current) => current ? { ...current, suggestedSupport: event.target.value } : current)} value={observationDraft.suggestedSupport} />
                </label>
                <p className="mt-3 text-xs font-semibold text-[#777657]">依据：{observationDraft.evidence.join("；")}</p>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-xl bg-[#3f4b30] px-3 py-2 text-sm font-black text-white" onClick={approveObservation} type="button">采纳观察</button>
                  <button className="rounded-xl border border-[#d9d8b4] bg-white px-3 py-2 text-sm font-black text-[#66674d]" onClick={() => setObservationDraft(null)} type="button">忽略草稿</button>
                </div>
              </div>
            ) : null}
          </GlassSurface>

          <GlassSurface
            aria-label="AI 推断 · 需教师判断"
            className="border-[#d8d9bd]/80 bg-[linear-gradient(145deg,rgba(255,255,255,.75),rgba(245,241,211,.68))] p-5 sm:p-6"
            role="region"
            weight="card"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eeecd3] text-[#777342]">
                <Sparkles aria-hidden="true" size={19} />
              </div>
              <div>
                <p className="text-xs font-black tracking-[.12em] text-[#88865f]">
                  辅助线索，不作结论
                </p>
                <h2 className="mt-0.5 font-black text-[#3b4029]">
                  AI 推断 · 需教师判断
                </h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {student.aiInferences.map((inference) => (
                <li
                  className="rounded-[18px] border border-white/80 bg-white/50 p-4 text-sm leading-6 text-[#66674d]"
                  key={inference}
                >
                  {inference}
                </li>
              ))}
              {(student.approvedObservations ?? []).map((observation) => (
                <li
                  className="rounded-[18px] border border-white/80 bg-white/50 p-4 text-sm leading-6 text-[#66674d]"
                  key={observation.id}
                >
                  <p>{observation.observation}</p>
                  <p className="mt-2 text-xs font-bold text-[#7d805d]">后续支持：{observation.suggestedSupport}</p>
                  <p className="mt-2 text-xs font-semibold text-[#85896a]">教师确认于 {formatDateTime(observation.confirmedAt)} · 来源：{observation.source}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-2 text-xs font-semibold leading-5 text-[#88866c]">
              <Lightbulb
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={14}
              />
              请结合课堂观察、学生表达和后续练习判断，不用于给学生贴固定标签。
            </p>
          </GlassSurface>

          <GlassSurface className="p-5 sm:p-6" weight="card">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e9f0e5] text-[#57705c]">
                <ClipboardPenLine aria-hidden="true" size={19} />
              </div>
              <div>
                <p className="text-xs font-black tracking-[.12em] text-[#78877e]">
                  仅教师可见
                </p>
                <h2 className="font-black text-[#203427]">教师笔记</h2>
              </div>
            </div>
            <label className="mt-5 block">
              <span className="sr-only">教师笔记</span>
              <textarea
                aria-label="教师笔记"
                className="min-h-28 w-full resize-y rounded-[18px] border border-white/90 bg-white/68 p-4 text-sm leading-6 text-[#314839] outline-none placeholder:text-[#9ba69f] focus:border-[#a8bea8] focus:ring-4 focus:ring-[#afc7b0]/25"
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="记录下一次课堂中需要观察或跟进的内容……"
                value={noteDraft}
              />
            </label>
            <button
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-[#18291e] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(24,41,30,.18)] transition hover:bg-[#263d2b] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7b9c80]/35"
              disabled={!noteDraft.trim()}
              onClick={saveNote}
              type="button"
            >
              <Check aria-hidden="true" size={16} />
              保存笔记
            </button>
            {savedNotes.length > 0 ? (
              <div className="mt-4 space-y-2 border-t border-[#e2e9df] pt-4">
                {savedNotes.map((note, index) => (
                  <article
                    className="rounded-[16px] bg-[#f5f7f1]/85 p-3 text-sm leading-6 text-[#506257]"
                    key={`${note}-${index}`}
                  >
                    {note}
                  </article>
                ))}
              </div>
            ) : null}
          </GlassSurface>
        </aside>
      </div>

      <Dialog
        description="更正不会直接覆盖原档案；提交后由学校授权人员人工核实。"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-full border border-[#dce5d9] bg-white px-5 text-sm font-black text-[#506456]"
              onClick={() => setCorrectionOpen(false)}
              type="button"
            >
              返回检查
            </button>
            <button
              className="h-11 rounded-full bg-[#18291e] px-5 text-sm font-black text-white disabled:opacity-45"
              disabled={!correctionDraft.trim()}
              onClick={submitCorrection}
              type="button"
            >
              提交更正申请
            </button>
          </div>
        }
        onClose={() => setCorrectionOpen(false)}
        open={correctionOpen}
        title="申请更正学生档案"
      >
        <label className="grid gap-2 text-sm font-black text-[#354c3a]">
          更正说明
          <textarea
            aria-label="更正说明"
            className="min-h-32 resize-y rounded-[18px] border border-[#dce6da] bg-white/80 p-4 font-normal leading-6 outline-none focus:border-[#a7bda8] focus:ring-4 focus:ring-[#afc7b0]/25"
            onChange={(event) => setCorrectionDraft(event.target.value)}
            placeholder="请说明需要更正的字段、当前内容和建议内容。"
            value={correctionDraft}
          />
        </label>
        <div className="mt-4 flex gap-3 rounded-[18px] bg-[#f3f5ea] p-4 text-xs font-semibold leading-5 text-[#697160]">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={16}
          />
          原始记录、更正原因与人工处理结果会一并保留，方便后续审计。
        </div>
      </Dialog>
    </div>
  )
}

export default StudentDetailPage
