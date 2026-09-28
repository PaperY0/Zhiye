import { useState } from "react"
import { ChevronDown, LayoutDashboard, UsersRound } from "lucide-react"
import { navigate } from "../../../app/routes"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { schoolClasses, useTeacherSettings } from "../settings/teacherSettings"
import { TaskCharts } from "./TaskCharts"
import { TaskOverviewPie } from "./TaskOverviewPie"
import { taskStatusBreakdown } from "./taskChartData"

export function InsightsPage() {
  const { currentClass } = useTeacherSettings()
  const [viewClass, setViewClass] = useState<string>(currentClass)
  const [classMenuOpen, setClassMenuOpen] = useState(false)
  const { tasks, quizzes, students } = usePrototype()
  const summary = taskStatusBreakdown(tasks, viewClass, students)
  const classStudents = students.filter((student) => student.className === viewClass)

  function openTasks(taskId?: string) {
    window.sessionStorage.setItem("zhiye-task-class-filter", viewClass)
    if (taskId) window.sessionStorage.setItem("zhiye-task-open-id", taskId)
    navigate({ role: "teacher", page: "tasks" })
  }

  return <main className="role-page role-page-flow text-[#17251b]">
    <header className="role-page-header"><div><p className="role-page-kicker">任务状态与学生疑问</p><h1 className="role-page-title">班级洞察</h1><p className="role-page-description">先看任务整体状态，再查看每项任务的提交进度和学生疑问。</p></div></header>
    <section aria-label="当前范围" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e3d8] pb-4">
      <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5eee3] text-[#4f7055]"><UsersRound size={19} /></span><div><p className="text-xs font-bold text-[#69806e]">当前范围</p><div className="flex flex-wrap items-baseline gap-x-2"><h2 className="text-base font-extrabold text-[#203427]">{viewClass === "all" ? "全部授课班级" : viewClass}</h2><span className="text-xs font-semibold text-[#748579]">{viewClass === "all" ? `${schoolClasses.length} 个班级` : `${classStudents.length} 名学生`}</span></div></div></div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2"><div className="relative"><button aria-expanded={classMenuOpen} aria-haspopup="listbox" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-[#3f6148] transition hover:bg-[#e8f0e6] focus-visible:outline-2 focus-visible:outline-[#64836a]" onClick={() => setClassMenuOpen((open) => !open)} type="button">更换班级<ChevronDown aria-hidden="true" size={15} /></button>{classMenuOpen && <div aria-label="选择班级" className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-2xl border border-[#dce6dc] bg-white p-2 shadow-lg" role="listbox">{schoolClasses.map((className) => <button aria-selected={viewClass === className} className="block min-h-11 w-full rounded-xl px-3 text-left text-sm hover:bg-[#eff5ed]" key={className} onClick={() => { setViewClass(className); setClassMenuOpen(false) }} role="option" type="button">{className}</button>)}</div>}</div><button aria-pressed={viewClass === "all"} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-[#3f6148] transition hover:bg-[#e8f0e6] focus-visible:outline-2 focus-visible:outline-[#64836a]" onClick={() => { setViewClass(viewClass === "all" ? currentClass : "all"); setClassMenuOpen(false) }} type="button"><LayoutDashboard aria-hidden="true" size={16} />{viewClass === "all" ? "返回当前班级" : "全局预览"}</button></div>
    </section>
    <TaskOverviewPie summary={summary} scope={viewClass === "all" ? "全部授课班级" : viewClass} />
    <TaskCharts tasks={tasks} quizzes={quizzes} students={students} selectedClass={viewClass} onOpenTask={(taskId) => openTasks(taskId)} onOpenTasks={() => openTasks()} />
  </main>
}

export default InsightsPage
