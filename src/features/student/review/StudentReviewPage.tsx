import { useState } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Check, MessageCircle, Sparkles } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type StudentReviewPageProps = { lessonId: string; onNavigate?: (route: AppRoute) => void }
type SelfAssessment = "我已理解" | "还需要练习" | "我想问老师"

export function StudentReviewPage({ lessonId, onNavigate }: StudentReviewPageProps) {
  const { addStudentTimelineEvent, lessons, students, tasks } = usePrototype()
  const lesson = lessons.find((item) => item.id === lessonId && item.studentVisibility === "visible")
  const student = students.find((item) => item.id === "student-lin-xiaoyu") ?? students[0]
  const [assessment, setAssessment] = useState<SelfAssessment | null>(null)

  if (!lesson || !student) {
    return <div className="role-page role-page-narrow"><GlassSurface className="grid min-h-80 place-items-center p-8 text-center" weight="sheet"><div><BookOpen aria-hidden className="mx-auto text-[#6d8272]" size={34} /><h1 className="role-page-title mt-5">这张复习卡暂不可查看</h1><p className="role-page-description mx-auto">只有老师确认并发布的复习卡才会出现在学生端。</p><button className="role-action-primary mt-6" onClick={() => onNavigate?.({ role: "student", page: "home" })} type="button"><ArrowLeft aria-hidden size={18} />返回学生首页</button></div></GlassSurface></div>
  }

  const reviewTitle = lesson.title
  const reviewId = lesson.id
  const reviewTags = lesson.recapTags
  const linkedTask = tasks.find((task) => {
    if (task.status === "draft" || task.status === "completed") return false
    const assigned = task.audience.kind === "class"
      ? task.audience.label === student.className
      : task.audience.studentIds.includes(student.id)
    const related = task.title.includes(reviewTitle.replace("的", "")) || reviewTags.some((tag) => task.title.includes(tag))
    return assigned && related
  })

  function recordAssessment(nextAssessment: SelfAssessment) {
    setAssessment(nextAssessment)
    addStudentTimelineEvent(student.id, { id: `timeline-review-${reviewId}-${Date.now()}`, type: "review", title: `完成${reviewTitle}复习`, detail: nextAssessment, occurredAt: new Date().toISOString(), fact: true })
  }

  return (
    <div className="role-page role-page-flow role-page-narrow">
      <header className="role-page-header !block">
        <button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-black text-[#59705f] hover:bg-white/45" onClick={() => onNavigate?.({ role: "student", page: "home" })} type="button"><ArrowLeft aria-hidden size={17} />返回学生首页</button>
        <div className="mt-4 flex flex-wrap items-center gap-2"><StatusChip tone="info">{lesson.subject}复习卡</StatusChip><span className="text-xs font-bold text-[#7b8a80]">{lesson.date} · {lesson.className}</span></div>
        <h1 className="role-page-title">{lesson.title}</h1><p className="role-page-description">这是老师确认并发布的课堂重点。</p>
      </header>
      <main className="mt-6 grid gap-5">
        <GlassSurface aria-label="课堂关键知识" className="relative overflow-hidden p-6 sm:p-8" role="region" weight="sheet"><div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-[#dcebd7]/60 blur-3xl" /><div className="relative max-w-4xl"><div className="flex items-center gap-2 text-sm font-black text-[#55705c]"><Sparkles aria-hidden size={18} />关键知识</div><p className="mt-5 text-xl font-black leading-9 text-[#203427] sm:text-2xl">{lesson.recap}</p>{lesson.recapTags.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{lesson.recapTags.map((tag) => <span className="rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#516b58]" key={tag}>{tag}</span>)}</div> : null}</div></GlassSurface>

        <GlassSurface aria-label="复习反馈" className="p-6 sm:p-8" role="region" weight="card"><p className="text-sm font-black text-[#58715e]">读完以后，你现在需要什么？</p><h2 className="mt-2 text-2xl font-black text-[#203427]">选择真实的下一步</h2><div className="mt-6 grid gap-3 sm:grid-cols-3">{(["我已理解", "还需要练习", "我想问老师"] as const).map((item) => <button aria-pressed={assessment === item} className="min-h-12 rounded-2xl bg-white/75 px-5 text-sm font-black text-[#36513d] transition hover:bg-white aria-pressed:bg-[#2b4933] aria-pressed:text-white" key={item} onClick={() => recordAssessment(item)} type="button">{assessment === item ? <Check aria-hidden className="mr-2 inline" size={16} /> : null}{item}</button>)}</div>{assessment ? <p className="mt-4 text-sm font-black text-[#4e6d56]" role="status">已记录：{assessment}</p> : null}</GlassSurface>

        {assessment === "还需要练习" && linkedTask ? <GlassSurface className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between" weight="light"><div><p className="text-xs font-black tracking-[.12em] text-[#66806b]">老师布置的相关任务</p><h2 className="mt-2 text-lg font-black text-[#203427]">{linkedTask.title}</h2><p className="mt-1 text-sm text-[#718078]">{linkedTask.content}</p></div><button className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#24462f] px-5 font-black text-white" onClick={() => onNavigate?.({ role: "student", page: "tasks" })} type="button">去完成任务<ArrowRight aria-hidden size={17} /></button></GlassSurface> : null}
        {assessment === "我想问老师" ? <GlassSurface className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between" weight="light"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#e3ecdd] text-[#486750]"><MessageCircle aria-hidden size={19} /></span><div><h2 className="font-black text-[#203427]">把具体问题告诉老师</h2><p className="mt-1 text-sm text-[#718078]">消息中只需描述哪里没看懂。</p></div></div><button className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#24462f] px-5 font-black text-white" onClick={() => onNavigate?.({ role: "student", page: "messages" })} type="button">联系老师<ArrowRight aria-hidden size={17} /></button></GlassSurface> : null}
      </main>
    </div>
  )
}

export default StudentReviewPage
