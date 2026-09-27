import { useMemo, useState, type FormEvent } from "react"
import { ArrowRight, BookOpen, ClipboardList, Plus, Sparkles } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { KnowledgeSignal, Subject, Task } from "../../../app/prototype/types"
import { navigate } from "../../../app/routes"
import { Drawer } from "../../../components/shared/Drawer"
import { generateDraft } from "../../../services/localAi"
import { getGradeFromClassName, useTeacherSettings } from "../settings/teacherSettings"
import { toQuiz, toRemedialPlanDraft } from "../planning/generators"
import { buildInsightData, type InsightRange, type InsightSubject } from "./insightData"

const severityLabels = { watch: "持续观察", attention: "需要关注", priority: "优先处理" } as const
const severityStyles = { watch: "bg-[#edf4ee] text-[#496b52]", attention: "bg-[#fff4dc] text-[#806222]", priority: "bg-[#fff0e8] text-[#9a5138]" } as const
const taskStatusLabels = { draft: "草稿", active: "进行中", review: "待查看", completed: "已完成" } as const

type ObservationForm = {
  subject: Subject
  knowledgePoint: string
  step: string
  severity: KnowledgeSignal["severity"]
  affectedCount: number
  affectedStudentIds: string[]
  evidenceText: string
  sourceLessonId: string
}

function formFromSignal(signal?: KnowledgeSignal): ObservationForm {
  return {
    subject: signal?.subject ?? "数学",
    knowledgePoint: signal?.knowledgePoint ?? "",
    step: signal?.step ?? "",
    severity: signal?.severity ?? "watch",
    affectedCount: signal?.affectedCount ?? 0,
    affectedStudentIds: signal?.affectedStudentIds ?? [],
    evidenceText: signal?.evidence.join("\n") ?? "",
    sourceLessonId: signal?.sourceLessonId ?? "",
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Shanghai" }).format(date)
}

function taskCounts(task: Task) {
  return {
    submitted: task.completions.filter((item) => item.status === "submitted" || item.status === "reviewed").length,
    reviewed: task.completions.filter((item) => item.status === "reviewed").length,
    total: task.completions.length,
  }
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="min-h-32 rounded-[22px] border border-[#dce6dc] bg-white p-5"><p className="text-xs font-bold text-[#66806b]">{label}</p><strong className="mt-2 block text-2xl font-black">{value}</strong><p className="mt-2 text-xs leading-5 text-[#718076]">{detail}</p></div>
}

function EmptyCopy({ title, detail }: { title: string; detail: string }) {
  return <div className="py-8 text-center"><strong className="text-sm">{title}</strong><p className="mt-2 text-sm leading-6 text-[#718076]">{detail}</p></div>
}

export function InsightsPage() {
  const { currentClass } = useTeacherSettings()
  const { signals, lessons, tasks, students, addSignal, updateSignal, deleteSignal, addPlan, addQuiz } = usePrototype()
  const [range, setRange] = useState<InsightRange>("all")
  const [subject, setSubject] = useState<InsightSubject>("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ObservationForm>(() => formFromSignal())
  const [formError, setFormError] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState<"plan" | "quiz" | null>(null)
  const [notice, setNotice] = useState("")

  const data = useMemo(() => buildInsightData({ signals, lessons, tasks, students, className: currentClass, subject, range }), [signals, lessons, tasks, students, currentClass, subject, range])
  const classStudents = students.filter((student) => student.className === currentClass)
  const classLessons = lessons.filter((lesson) => lesson.className === currentClass && (lesson.evidence?.length || lesson.teacherReport)).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const selected = editingId && editingId !== "new" ? signals.find((item) => item.id === editingId) : undefined
  const sourceLesson = selected?.sourceLessonId ? lessons.find((lesson) => lesson.id === selected.sourceLessonId) : undefined
  const evidence = form.evidenceText.split("\n").map((item) => item.trim()).filter(Boolean)
  const knownIds = form.affectedStudentIds.filter((id) => classStudents.some((student) => student.id === id))

  function openNew() {
    setEditingId("new"); setForm(formFromSignal()); setFormError(""); setActionError("")
  }
  function openSignal(signal: KnowledgeSignal) {
    setEditingId(signal.id); setForm(formFromSignal(signal)); setFormError(""); setActionError("")
  }
  function saveObservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.knowledgePoint.trim() || !form.step.trim() || evidence.length === 0) {
      setFormError("请填写知识点、困难步骤和至少一条可核对的证据。")
      return
    }
    const count = knownIds.length || Math.min(classStudents.length, Math.max(0, Math.floor(form.affectedCount)))
    const patch = {
      className: currentClass, subject: form.subject, knowledgePoint: form.knowledgePoint.trim(),
      step: form.step.trim(), severity: form.severity, affectedStudentIds: knownIds,
      affectedCount: count, evidence, sourceLessonId: form.sourceLessonId || undefined,
    }
    if (selected) {
      updateSignal(selected.id, { ...patch, trend: selected.affectedCount === count ? selected.trend : [...selected.trend, count].slice(-5) })
      setNotice("观察已更新，课堂证据和人数以教师确认的内容为准。")
    } else {
      const id = crypto.randomUUID()
      addSignal({ id, ...patch, trend: [count], observedAt: new Date().toISOString() })
      setEditingId(id)
      setNotice("观察已保存，可以继续生成教案或测验草稿。")
    }
    setFormError("")
  }
  function removeObservation(signal: KnowledgeSignal) {
    if (!window.confirm("确认移除“" + signal.knowledgePoint + "”观察吗？")) return
    deleteSignal(signal.id); setEditingId(null); setNotice("观察已移除。")
  }
  async function generatePlan(signal: KnowledgeSignal) {
    setBusy("plan"); setActionError("")
    try {
      const response = await generateDraft("remedial-plan", {
        knowledgePoint: signal.knowledgePoint, step: signal.step, affectedCount: signal.affectedCount,
        trend: signal.trend.join(" → "), evidence: signal.evidence,
      }) as { content?: unknown }
      const plan = toRemedialPlanDraft(response.content, { subject: signal.subject, knowledgePoint: signal.knowledgePoint, evidence: signal.evidence })
      plan.grade = getGradeFromClassName(currentClass)
      plan.objective = "让学生能够解释并完成“" + signal.step + "”"
      plan.context = signal.evidence[0] ?? ""
      addPlan(plan)
      window.sessionStorage.setItem("zhiye-planning-open-plan", plan.id)
      navigate({ role: "teacher", page: "planning" })
    } catch (error) { setActionError(error instanceof Error ? error.message : "生成失败，请重试") }
    finally { setBusy(null) }
  }
  async function generateQuiz(signal: KnowledgeSignal) {
    setBusy("quiz"); setActionError("")
    try {
      const response = await generateDraft("quiz", {
        title: signal.knowledgePoint + " · " + signal.step + "自检",
        topic: signal.knowledgePoint, difficulty: signal.severity, focus: signal.step,
      }) as { content?: unknown }
      const quiz = toQuiz(response.content)
      addQuiz({ ...quiz, subject: signal.subject })
      window.sessionStorage.setItem("zhiye-quiz-edit-id", quiz.id)
      navigate({ role: "teacher", page: "tasks" })
    } catch (error) { setActionError(error instanceof Error ? error.message : "生成失败，请重试") }
    finally { setBusy(null) }
  }

  return <main className="mx-auto max-w-[1480px] space-y-5 p-4 text-[#17251b] sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black tracking-[.16em] text-[#66806b]">教学决策 · {currentClass}</p><h1 className="mt-2 text-3xl font-black tracking-tight">班级洞察</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#718076]">从课堂记录和任务提交核对学习卡点，决定下一次讲解与练习。观察需由教师确认。</p></div>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#193422] px-4 text-sm font-bold text-white" onClick={openNew} type="button"><Plus size={17} />记录课堂观察</button>
    </header>
    <div className="flex flex-wrap gap-3 rounded-2xl border border-[#dce6dc] bg-white p-3" aria-label="洞察筛选">
      <label className="grid min-w-36 flex-1 gap-1 text-xs font-bold text-[#53675a] sm:flex-none">时间范围<select aria-label="时间范围" className="planning-select" value={range} onChange={(event) => setRange(event.target.value as InsightRange)}><option value="all">全部记录</option><option value="7d">近 7 天</option><option value="30d">近 30 天</option></select></label>
      <label className="grid min-w-36 flex-1 gap-1 text-xs font-bold text-[#53675a] sm:flex-none">学科<select aria-label="学科" className="planning-select" value={subject} onChange={(event) => setSubject(event.target.value as InsightSubject)}><option value="all">全部学科</option><option value="数学">数学</option><option value="语文">语文</option><option value="英语">英语</option></select></label>
      <p className="self-center text-xs text-[#718076]">按记录日期筛选；任务没有学科字段，仅在“全部学科”展示提交统计。</p>
    </div>
    {notice && <p role="status" aria-label="洞察通知" className="rounded-xl bg-[#e7f2e7] px-4 py-3 text-sm font-bold text-[#365b3d]">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="班级概览">
      <Metric label="需关注的知识步骤" value={data.signals.length + " 个"} detail={data.priorityCount + " 个标为优先处理"} />
      <Metric label="涉及学生" value={"至少 " + data.affectedLowerBound + " 名"} detail="有重叠时按已识别学生去重；匿名记录取下界" />
      <Metric label="任务提交" value={data.totalSubmitted + " / " + data.totalExpected + " 份"} detail="只统计已发布任务的提交记录" />
      <Metric label="教师已查看" value={data.totalReviewed + " 份"} detail="来自任务中的实际评阅状态" />
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
      <section className="rounded-[24px] border border-[#dce6dc] bg-white p-5 sm:p-6" aria-labelledby="signal-title">
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-black tracking-[.14em] text-[#66806b]">证据 → 安排</p><h2 id="signal-title" className="mt-1 text-xl font-black">需要跟进的学习步骤</h2></div><span className="text-xs text-[#718076]">按记录时间排列</span></div>
        {data.signals.length ? <div className="divide-y divide-[#e6ece5]">{data.signals.map((signal) => <button key={signal.id} className="flex w-full items-start justify-between gap-4 py-4 text-left hover:bg-[#f7faf6] focus-visible:outline-2 focus-visible:outline-[#64836a]" onClick={() => openSignal(signal)} type="button"><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="text-base">{signal.knowledgePoint} · {signal.step}</strong><span className={"rounded-full px-2 py-1 text-xs font-bold " + severityStyles[signal.severity]}>{severityLabels[signal.severity]}</span></span><span className="mt-2 block line-clamp-2 text-sm leading-6 text-[#617266]">{signal.evidence[0]}</span><span className="mt-1 block text-xs text-[#839087]">{formatDate(signal.observedAt)} · {signal.affectedCount} 名学生</span></span><ArrowRight className="mt-1 shrink-0 text-[#69836f]" size={18} /></button>)}</div> : <EmptyCopy title="此范围暂无观察" detail="可切换时间，或用“记录课堂观察”保存一条有证据的记录。" />}
      </section>
      <div className="grid gap-5">
        <section className="rounded-[24px] border border-[#dce6dc] bg-white p-5 sm:p-6" aria-labelledby="task-feedback-title"><div className="flex items-center gap-2"><ClipboardList size={19} /><h2 id="task-feedback-title" className="text-lg font-black">任务回流</h2></div><p className="mt-2 text-sm leading-6 text-[#718076]">提交进度与评阅状态只说明任务流转，不自动判定知识掌握。</p>{data.tasks.length ? <div className="mt-3 divide-y divide-[#e6ece5]">{data.tasks.slice(0, 4).map((task) => { const count = taskCounts(task); return <button key={task.id} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[#f7faf6]" type="button" onClick={() => { window.sessionStorage.setItem("zhiye-task-open-id", task.id); navigate({ role: "teacher", page: "tasks" }) }}><span className="min-w-0"><strong className="block truncate text-sm">{task.title}</strong><span className="mt-1 block text-xs text-[#718076]">{taskStatusLabels[task.status]} · 已提交 {count.submitted}/{count.total} · 已查看 {count.reviewed}</span></span><ArrowRight className="shrink-0 text-[#69836f]" size={17} /></button> })}</div> : <EmptyCopy title="暂无任务回流" detail="发布任务并收到提交后，这里会显示真实进度。" />}</section>
        <section className="rounded-[24px] border border-[#dce6dc] bg-white p-5 sm:p-6" aria-labelledby="lesson-evidence-title"><div className="flex items-center gap-2"><BookOpen size={19} /><h2 id="lesson-evidence-title" className="text-lg font-black">课堂来源</h2></div>{data.lessons.length ? <div className="mt-3 divide-y divide-[#e6ece5]">{data.lessons.slice(0, 3).map((lesson) => <button className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[#f7faf6]" key={lesson.id} onClick={() => navigate({ role: "teacher", page: "lesson-detail", lessonId: lesson.id })} type="button"><span className="min-w-0"><strong className="block truncate text-sm">{lesson.title}</strong><span className="mt-1 block text-xs text-[#718076]">{formatDate(lesson.date)} · {lesson.evidence?.length ?? 0} 条证据</span></span><ArrowRight className="shrink-0 text-[#69836f]" size={17} /></button>)}</div> : <EmptyCopy title="暂无课堂证据" detail="完成课堂整理后，可在这里回看原始记录。" />}</section>
      </div>
    </div>

    <Drawer open={editingId !== null} onClose={() => setEditingId(null)} title={selected ? selected.knowledgePoint + " · 观察与安排" : "记录课堂观察"}>
      {editingId && <div className="space-y-5 text-[#203027]">
        {selected && <div className="rounded-2xl bg-[#f0f6ef] p-4 text-sm leading-6"><strong>观察来源</strong><p>{sourceLesson ? sourceLesson.title + " · " + formatDate(sourceLesson.date) : "教师记录"}</p>{sourceLesson && <button className="mt-2 font-bold text-[#315a3a] underline" onClick={() => navigate({ role: "teacher", page: "lesson-detail", lessonId: sourceLesson.id })} type="button">回看这节课</button>}</div>}
        <form className="grid gap-4" onSubmit={saveObservation}>
          <label className="grid gap-1 text-sm font-bold">学科<select aria-label="观察学科" className="planning-select" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value as Subject })}><option value="数学">数学</option><option value="语文">语文</option><option value="英语">英语</option></select></label>
          <label className="grid gap-1 text-sm font-bold">关联课堂（可选）<select aria-label="关联课堂" className="planning-select" value={form.sourceLessonId} onChange={(event) => { const id = event.target.value; const lesson = classLessons.find((item) => item.id === id); setForm((current) => ({ ...current, sourceLessonId: id, evidenceText: current.evidenceText || lesson?.evidence?.join("\n") || "" })) }}><option value="">教师现场观察</option>{classLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} · {formatDate(lesson.date)}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-bold">知识点<input aria-label="信号知识点" className="insight-input" value={form.knowledgePoint} onChange={(event) => setForm({ ...form, knowledgePoint: event.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold">困难步骤<input aria-label="信号困难步骤" className="insight-input" value={form.step} onChange={(event) => setForm({ ...form, step: event.target.value })} /></label>
          <label className="grid gap-1 text-sm font-bold">处理优先级<select aria-label="信号优先级" className="planning-select" value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value as KnowledgeSignal["severity"] })}><option value="watch">持续观察</option><option value="attention">需要关注</option><option value="priority">优先处理</option></select></label>
          <label className="grid gap-1 text-sm font-bold">受影响人数<input aria-label="信号受影响人数" className="insight-input" min={0} max={classStudents.length} type="number" disabled={knownIds.length > 0} value={knownIds.length || form.affectedCount} onChange={(event) => setForm({ ...form, affectedCount: Number(event.target.value) })} /></label>
          <details className="rounded-xl border border-[#dce6dc] p-3"><summary className="cursor-pointer text-sm font-bold">关联学生（可选，选中后自动计数）</summary><div className="mt-3 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">{classStudents.map((student) => <label className="flex items-center gap-2 text-sm" key={student.id}><input checked={knownIds.includes(student.id)} onChange={(event) => setForm((current) => ({ ...current, affectedStudentIds: event.target.checked ? [...current.affectedStudentIds, student.id] : current.affectedStudentIds.filter((id) => id !== student.id) }))} type="checkbox" />{student.name}</label>)}</div></details>
          <label className="grid gap-1 text-sm font-bold">可核对的证据（每行一条）<textarea aria-label="观察证据" className="insight-input min-h-28" placeholder="例如：随堂练习中 4 人在换算方向上停顿" value={form.evidenceText} onChange={(event) => setForm({ ...form, evidenceText: event.target.value })} /></label>
          {formError && <p role="alert" className="rounded-xl bg-[#fff1ed] p-3 text-sm text-[#9a5138]">{formError}</p>}
          <button className="min-h-11 rounded-xl bg-[#193422] px-4 text-sm font-bold text-white" type="submit">{selected ? "保存观察修改" : "保存观察"}</button>
        </form>
        {selected && <div className="space-y-3 border-t border-[#dce6dc] pt-5"><div><h3 className="font-black">安排下一步</h3><p className="mt-1 text-sm text-[#718076]">生成的内容会进入可编辑草稿，教师确认后再用于教学。</p></div><div className="grid gap-2 sm:grid-cols-2"><button className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#b7ccb7] px-3 text-sm font-bold text-[#315a3a]" disabled={busy !== null} onClick={() => void generatePlan(selected)} type="button"><Sparkles size={16} />{busy === "plan" ? "生成中" : "生成补讲教案"}</button><button className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#b7ccb7] px-3 text-sm font-bold text-[#315a3a]" disabled={busy !== null} onClick={() => void generateQuiz(selected)} type="button"><Sparkles size={16} />{busy === "quiz" ? "生成中" : "生成自检测验"}</button></div>{actionError && <p role="alert" className="rounded-xl bg-[#fff1ed] p-3 text-sm text-[#9a5138]">{actionError}</p>}<button className="text-sm font-bold text-[#9a5138] underline" onClick={() => removeObservation(selected)} type="button">移除这条观察</button></div>}
      </div>}
    </Drawer>
  </main>
}

export default InsightsPage
