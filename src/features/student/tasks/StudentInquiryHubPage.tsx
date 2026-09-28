import { ArrowRight, BookMarked, MessageCircleQuestion } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { GlassSurface } from "../../../components/shared/GlassSurface"

const STUDENT_ID = "student-lin-xiaoyu"

export function StudentInquiryHubPage() {
  const { tasks, students } = usePrototype()
  const student = students.find((item) => item.id === STUDENT_ID)
  const availableTasks = tasks.filter((task) => task.status !== "draft" && student && (
    task.audience.kind === "class"
      ? task.audience.label === student.className
      : task.audience.studentIds.includes(STUDENT_ID)
  )).sort((a, b) => (b.inquiries ?? []).filter((item) => item.studentId === STUDENT_ID).length - (a.inquiries ?? []).filter((item) => item.studentId === STUDENT_ID).length || b.createdAt.localeCompare(a.createdAt))
  const questionCount = availableTasks.reduce((total, task) => total + (task.inquiries ?? []).filter((item) => item.studentId === STUDENT_ID).length, 0)

  return <section className="role-page role-page-flow role-page-medium text-[#19271e]">
    <header className="role-page-header"><div><p className="role-page-kicker inline-flex items-center gap-2"><MessageCircleQuestion aria-hidden="true" size={18} />学习支持</p><h1 className="role-page-title">询问</h1><p className="role-page-description">选择正在学习的任务，告诉 AI 你卡在哪里。每次疑问都会留在任务中，并整理到错题本。</p></div></header>
    <div className="grid gap-3 sm:grid-cols-2" aria-label="询问概览"><div className="rounded-[22px] border border-[#dce6db] bg-white p-5"><strong className="block text-3xl font-black text-[#315a3b]">{availableTasks.length}</strong><span className="mt-1 block text-sm text-[#61766a]">项可以询问的任务</span></div><div className="rounded-[22px] border border-[#dce6db] bg-white p-5"><strong className="block text-3xl font-black text-[#315a3b]">{questionCount}</strong><span className="mt-1 block text-sm text-[#61766a]">次已记录的疑问</span></div></div>
    <div><h2 className="text-lg font-black">选择关联任务</h2><p className="mt-1 text-sm leading-6 text-[#68796d]">问题会附在所选任务下，老师也能在该任务中看到。</p></div>
    {availableTasks.length ? <ul className="grid gap-3">{availableTasks.map((task) => { const inquiries = (task.inquiries ?? []).filter((item) => item.studentId === STUDENT_ID); const latest = inquiries.at(-1); return <li key={task.id}><GlassSurface className="p-5 sm:p-6" weight="card"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black text-[#66806b]">{task.audience.label} · {task.status === "completed" ? "已完成" : "学习中"}</p><h3 className="mt-2 text-lg font-black">{task.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#617266]">{task.objective ?? task.content}</p></div><span className="rounded-full bg-[#edf4ed] px-3 py-1.5 text-xs font-black text-[#416449]">{inquiries.length} 次询问</span></div>{latest && <p className="mt-4 line-clamp-2 rounded-xl bg-[#f2f6ef] px-4 py-3 text-sm text-[#526858]">上次问：{latest.question}</p>}<a className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#345c40] px-4 py-2.5 text-sm font-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#345c40]" href={`#/student/ask/${encodeURIComponent(task.id)}`}>询问这项任务<ArrowRight aria-hidden="true" size={17} /></a></GlassSurface></li> })}</ul> : <GlassSurface className="p-8 text-center"><p className="font-black">还没有可以询问的任务</p><p className="mt-2 text-sm text-[#68796d]">老师发布任务后，就可以从这里选择。</p></GlassSurface>}
    <a className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-[#416449]" href="#/student/mistakes"><BookMarked aria-hidden="true" size={17} />查看错题本</a>
  </section>
}

export default StudentInquiryHubPage
