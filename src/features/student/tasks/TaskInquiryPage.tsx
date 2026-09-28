import { useState } from "react"
import { ArrowLeft, ArrowRight, BookMarked, MessageCircleQuestion, Send } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Subject, TaskInquiry } from "../../../app/prototype/types"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import { generateDraft } from "../../../services/localAi"

const STUDENT_ID = "student-lin-xiaoyu"

type InquiryReply = { answer: string; focus: string; reviewTip: string }

function isInquiryReply(value: unknown): value is InquiryReply {
  if (!value || typeof value !== "object") return false
  const result = value as Record<string, unknown>
  return ["answer", "focus", "reviewTip"].every((key) => typeof result[key] === "string" && Boolean((result[key] as string).trim()))
}

export function TaskInquiryPage({ taskId }: { taskId: string }) {
  const { tasks, quizzes, students, addTaskInquiry, updateTaskInquiry, addMistake } = usePrototype()
  const task = tasks.find((item) => item.id === taskId)
  const quiz = quizzes.find((item) => item.id === task?.sourceQuizId)
  const student = students.find((item) => item.id === STUDENT_ID)
  const available = task && task.status !== "draft" && student && (
    task.audience.kind === "class"
      ? task.audience.label === student.className
      : task.audience.studentIds.includes(STUDENT_ID)
  )
  const [question, setQuestion] = useState("")
  const [subject, setSubject] = useState<Subject>("数学")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (!task || !available) {
    return <section className="role-page role-page-flow"><GlassSurface className="p-8"><h1 className="role-page-title">找不到这项任务</h1><p className="mt-3 text-[#64766a]">请从自己的任务列表进入询问。</p><a className="mt-5 inline-block font-bold text-[#416449]" href="#/student/tasks">返回我的任务</a></GlassSurface></section>
  }

  const inquiries = (task.inquiries ?? []).filter((item) => item.studentId === STUDENT_ID)
  const latest = inquiries.at(-1)

  async function ask(existing?: TaskInquiry, suggestedQuestion?: string) {
    const text = existing?.question ?? suggestedQuestion ?? question.trim()
    if (!text || busy) return
    setError("")
    setBusy(true)
    const id = existing?.id ?? `inquiry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    if (existing) updateTaskInquiry(task!.id, id, { status: "asking" })
    else addTaskInquiry(task!.id, {
      id, studentId: STUDENT_ID, subject, question: text,
      status: "asking", createdAt: new Date().toISOString(),
    })
    setQuestion("")
    try {
      const response = await generateDraft("task-inquiry", {
        taskTitle: task!.title,
        taskObjective: task!.objective ?? "",
        taskContent: [task!.content, ...(quiz ? ["教师下发的三道自检题及标准答案（请按题目讲解，不要改动标准答案）：", ...quiz.questions.slice(0, 3).map((item, index) =>
          `第 ${index + 1} 题：${item.prompt}\n选项：${item.options.join("、") || "无"}\n标准答案：${Array.isArray(item.answer) ? item.answer.join("、") : item.answer}\n解析：${item.explanation || "暂无"}`,
        )] : [])].join("\n\n"),
        question: text,
        previousExchanges: inquiries.filter((item) => item.status === "answered").slice(-3).flatMap((item) => [item.question, item.answer ?? ""]),
      }) as { content?: unknown }
      if (!isInquiryReply(response.content)) throw new Error("AI 回答不完整，请重试。")
      const reply = response.content
      updateTaskInquiry(task!.id, id, { answer: reply.answer, focus: reply.focus, status: "answered" })
      // One notebook record per inquiry, including after a failed request is retried.
      addMistake(STUDENT_ID, {
          id: `mistake-${id}`, subject: existing?.subject ?? subject,
          knowledgePoint: reply.focus, prompt: text,
          cause: `任务疑问：${text}`, explanation: `${reply.answer}\n复习建议：${reply.reviewTip}`,
          mastery: "new", source: "task", taskId: task!.id, inquiryId: id,
          createdAt: new Date().toISOString(),
      })
    } catch (cause) {
      updateTaskInquiry(task!.id, id, { status: "failed" })
      setError(cause instanceof Error ? cause.message : "暂时无法回答，请重试。")
    } finally {
      setBusy(false)
    }
  }

  return <section className="role-page role-page-flow role-page-medium text-[#19271e]">
    <a className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-[#416449]" href="#/student/ask"><ArrowLeft aria-hidden="true" size={18} />返回询问</a>
    <header className="role-page-header"><div><p className="role-page-kicker inline-flex items-center gap-2"><MessageCircleQuestion aria-hidden="true" size={18} />任务询问</p><h1 className="role-page-title">有疑问，一起想</h1><p className="role-page-description">围绕当前任务提问。AI 会帮你梳理思路，疑问点会加入错题本供你复习。</p></div><StatusChip tone="info">当前任务</StatusChip></header>
    <GlassSurface className="p-5 sm:p-7" weight="sheet"><p className="text-xs font-black tracking-[0.12em] text-[#718076]">正在学习</p><h2 className="mt-2 text-xl font-black">{task.title}</h2><p className="mt-2 leading-7 text-[#5c7063]">{task.objective ?? task.content}</p>{quiz && <div className="mt-5 border-t border-[#dce8db] pt-4"><h3 className="text-sm font-black text-[#34513d]">这项任务的三道题</h3><p className="mt-1 text-xs text-[#718076]">题目已与 AI 同步，点击即可获得对应解答。</p><ol className="mt-3 grid gap-2">{quiz.questions.slice(0, 3).map((item, index) => <li className="rounded-xl border border-[#e0e9de] bg-white/80 p-3" key={item.id}><p className="text-sm font-bold leading-6">{index + 1}. {item.prompt}</p>{item.options.length > 0 && <p className="mt-1 text-xs leading-5 text-[#708076]">{item.options.join(" · ")}</p>}<button className="mt-2 min-h-11 rounded-xl bg-[#e4f0e2] px-4 text-sm font-bold text-[#345c40] disabled:opacity-50" disabled={busy} onClick={() => void ask(undefined, `请讲解第 ${index + 1} 题：${item.prompt}`)} type="button">解答第 {index + 1} 题</button></li>)}</ol></div>}</GlassSurface>
    <div className="grid gap-5">
      {inquiries.map((item) => <GlassSurface className="p-5 sm:p-6" key={item.id} weight="card"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-[#65796a]">我的疑问 · {item.subject}</span><time className="text-xs text-[#718076]" dateTime={item.createdAt}>{new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}</time></div><p className="mt-3 whitespace-pre-wrap text-lg font-black leading-7">{item.question}</p>{item.status === "answered" ? <div className="mt-5 rounded-2xl bg-[#edf4ed] p-4 sm:p-5"><p className="text-xs font-black text-[#4c7254]">AI 解答 · {item.focus}</p><p className="mt-2 whitespace-pre-wrap leading-7 text-[#2e4b36]">{item.answer}</p><p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#4d7255]"><BookMarked aria-hidden="true" size={16} />疑问点已整理进错题本</p></div> : <div className="mt-4"><p aria-live="polite" className={`text-sm font-bold ${item.status === "failed" ? "text-[#95553f]" : "text-[#57755d]"}`}>{item.status === "failed" ? "回答没有生成，疑问已保留。" : "正在整理回答…"}</p>{!busy && <button className="mt-2 min-h-11 rounded-xl bg-[#dceedd] px-4 font-bold text-[#416449]" onClick={() => void ask(item)} type="button">重新询问</button>}</div>}</GlassSurface>)}
    </div>
    <GlassSurface className="p-5 sm:p-7" weight="sheet"><h2 className="text-lg font-black">{latest ? "继续询问" : "告诉 AI 你卡在哪里"}</h2><p className="mt-1 text-sm leading-6 text-[#6b7b70]">可以写下题目、已经尝试的方法，或不明白的步骤。</p><div className="mt-5 flex flex-wrap items-end gap-3"><label className="text-sm font-bold text-[#34513d]">学科<select className="ml-3 min-h-12 rounded-xl border border-[#c4d4c4] bg-white px-3" onChange={(event) => setSubject(event.target.value as Subject)} value={subject}><option>数学</option><option>语文</option><option>英语</option></select></label></div><label className="mt-4 block text-sm font-bold text-[#34513d]" htmlFor="task-inquiry-question">我的疑问</label><textarea className="mt-2 min-h-28 w-full rounded-2xl border border-[#c4d4c4] bg-white p-4 leading-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#416449]" id="task-inquiry-question" maxLength={1000} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：我理解了第一步，但不知道为什么这里要先通分。" value={question} />{error ? <p className="mt-2 text-sm font-bold text-[#95553f]" role="alert">{error}</p> : null}<div className="mt-4 flex flex-wrap items-center gap-3"><button className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#345c40] px-6 font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !question.trim()} onClick={() => void ask()} type="button"><Send aria-hidden="true" size={17} />{busy ? "正在询问…" : "询问 AI"}</button><a className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[#416449]" href="#/student/mistakes">查看错题本<ArrowRight aria-hidden="true" size={16} /></a></div></GlassSurface>
  </section>
}

export default TaskInquiryPage
