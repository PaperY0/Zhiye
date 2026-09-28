import { ArrowRight, MessageCircleQuestion } from "lucide-react"
import type { Quiz, Student, Task } from "../../../app/prototype/types"
import { taskSubmissionCounts } from "../../../app/prototype/taskStatus"
import { taskAccuracyBreakdown, tasksForClass } from "./taskChartData"

export function TaskCharts({ tasks, quizzes, students, selectedClass, onOpenTask, onOpenTasks }: {
  tasks: Task[]
  quizzes: Quiz[]
  students: Student[]
  selectedClass: string
  onOpenTask(taskId: string): void
  onOpenTasks(): void
}) {
  const studentIds = new Set(students.filter((student) => selectedClass === "all" || student.className === selectedClass).map((student) => student.id))
  const rows = tasksForClass(tasks, selectedClass, students)
    .filter((task) => task.status !== "draft")
    .map((task) => {
      const completion = taskSubmissionCounts(task, selectedClass, students)
      const accuracy = taskAccuracyBreakdown(task, quizzes.find((quiz) => quiz.id === task.sourceQuizId), selectedClass, students)
      const inquiries = (task.inquiries ?? []).filter((item) => studentIds.has(item.studentId))
      return { task, completion, accuracy, inquiries, askingStudents: new Set(inquiries.map((item) => item.studentId)).size }
    })
    .sort((a, b) => b.inquiries.length - a.inquiries.length || b.task.createdAt.localeCompare(a.task.createdAt))
  const totalInquiries = rows.reduce((count, row) => count + row.inquiries.length, 0)
  const mostInquiries = Math.max(1, ...rows.map((row) => row.inquiries.length))

  return <section aria-labelledby="task-chart-title" className="min-w-0 rounded-[24px] border border-[#dce6dc] bg-white p-5 shadow-[0_8px_24px_rgba(49,75,55,.035)] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-black tracking-[.14em] text-[#66806b]">任务 → 学生疑问</p><h2 id="task-chart-title" className="mt-1 text-xl font-black">每项任务的学习反馈</h2><p className="mt-2 text-sm leading-6 text-[#718076]">按询问次数优先展示已发布任务。小饼图按已提交自检题目的实际作答计算正确率。</p></div>
      <button className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-[#315e3d] hover:bg-[#edf4eb] focus-visible:outline-2 focus-visible:outline-[#64836a]" onClick={onOpenTasks} type="button">查看全部任务<ArrowRight aria-hidden="true" size={16} /></button>
    </div>
    <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-y border-[#e5ece4] py-4 text-sm text-[#52675a]"><span><strong className="text-lg tabular-nums text-[#203427]">{rows.length}</strong> 项已发布任务</span><span><strong className="text-lg tabular-nums text-[#315a3b]">{totalInquiries}</strong> 次任务询问</span></p>
    {rows.length ? <ul className="mt-4 grid gap-3 lg:grid-cols-2">{rows.map(({ task, completion, accuracy, inquiries, askingStudents }) => {
      const latest = inquiries.at(-1)
      const progress = completion.total ? completion.submitted / completion.total * 100 : 0
      return <li key={task.id}><button aria-label={`查看任务 ${task.title}，已提交 ${completion.submitted}/${completion.total}，${inquiries.length} 次询问`} className="h-full w-full rounded-2xl border border-[#e1e9df] bg-[#fbfcfa] p-4 text-left transition hover:border-[#a8c2ab] hover:bg-[#f5f9f3] focus-visible:outline-2 focus-visible:outline-[#64836a] sm:p-5" onClick={() => onOpenTask(task.id)} type="button">
        <span className="flex items-start justify-between gap-2"><span className="min-w-0"><strong className="block text-base leading-6 text-[#203427]">{task.title}</strong><span className="mt-1 block text-xs text-[#728278]">{task.audience.label} · {task.status === "completed" ? "已完成" : task.status === "review" ? "待查看" : "进行中"}</span></span><ArrowRight className="shrink-0 text-[#69836f]" size={17} /></span>
        <span className="mt-4 flex items-center gap-4"><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#5b7061]">已提交 {completion.submitted}/{completion.total}</span>
        <span aria-label={`${task.title}提交进度 ${completion.submitted}/${completion.total}`} className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[#e9f0e7]" role="img"><span className="block h-full rounded-full bg-[#77a07c]" style={{ width: `${progress}%` }} /></span>
        <span className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold text-[#416449]"><span className="inline-flex items-center gap-1"><MessageCircleQuestion aria-hidden="true" size={14} />{askingStudents} 人提问</span><span>{inquiries.length} 次询问</span></span>
        <span aria-label={`${task.title}询问次数 ${inquiries.length}，当前范围最多 ${mostInquiries} 次`} className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#e9f0e7]" role="img"><span className="block h-full rounded-full bg-[#365e42]" style={{ width: `${inquiries.length / mostInquiries * 100}%` }} /></span>
        </span><span className="grid shrink-0 justify-items-center gap-1"><span aria-label={accuracy.rate === null ? `${task.title}暂无正确率数据` : `${task.title}正确率 ${accuracy.rate}%，答对 ${accuracy.correct}/${accuracy.total} 题`} className="grid size-[72px] place-items-center rounded-full" role="img" style={{ background: accuracy.rate === null ? "#e9efea" : `conic-gradient(#52805c ${accuracy.rate}%, #e3ece2 ${accuracy.rate}% 100%)` }}><span className="grid size-[54px] place-items-center rounded-full bg-white text-xs font-black tabular-nums text-[#31583b]">{accuracy.rate === null ? "—" : `${accuracy.rate}%`}</span></span><span className="text-[11px] font-bold text-[#6b7d6e]">{accuracy.rate === null ? "暂无正确率" : "正确率"}</span></span></span>
        {latest && <span className="mt-3 block line-clamp-2 rounded-lg bg-[#eef5ed] px-3 py-2 text-xs leading-5 text-[#49614f]">最新疑问：{latest.question}</span>}
      </button></li>
    })}</ul> : <p className="py-8 text-center text-sm text-[#718076]">当前范围还没有已发布任务。</p>}
  </section>
}
