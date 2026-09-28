import { ArrowRight, BookOpenCheck, ListTodo, MessageCircle, NotebookTabs } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { PinyinText } from "../../../components/pinyin/PinyinText"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type StudentHomePageProps = { onNavigate(route: AppRoute): void }

export function StudentHomePage({ onNavigate }: StudentHomePageProps) {
  const { lessons, students, tasks, conversations } = usePrototype()
  const student = students.find((item) => item.id === "student-lin-xiaoyu") ?? students[0]

  if (!student) {
    return (
      <div className="role-page role-page-narrow">
        <GlassSurface className="p-8 text-center" weight="sheet">
          <h1 className="role-page-title"><PinyinText text="还没有找到学生资料" /></h1>
          <p className="role-page-description mx-auto">请先联系老师完成学生绑定，之后这里会显示老师发布的复习卡和任务。</p>
          <button className="role-action-primary mt-5" onClick={() => onNavigate({ role: "student", page: "messages" })} type="button">联系老师</button>
        </GlassSurface>
      </div>
    )
  }

  const latestReview = [...lessons]
    .filter((lesson) => lesson.className === student.className && lesson.studentVisibility === "visible" && lesson.recap.trim())
    .sort((left, right) => right.date.localeCompare(left.date))[0]
  const assignedTasks = tasks.filter((task) => {
    if (task.status === "draft") return false
    return task.audience.kind === "class"
      ? task.audience.label === student.className
      : task.audience.studentIds.includes(student.id)
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const isCompleted = (task: (typeof assignedTasks)[number]) => task.completions.some((completion) => completion.studentId === student.id && (completion.status === "submitted" || completion.status === "reviewed"))
  const pendingCount = assignedTasks.filter((task) => !isCompleted(task)).length
  const latestTask = assignedTasks[0]
  const latestTaskCompletion = latestTask?.completions.find((completion) => completion.studentId === student.id)
  const latestTaskScore = typeof latestTaskCompletion?.score === "number"
    ? ` · ${latestTask?.sourceQuizId && latestTaskCompletion.status === "submitted" ? "自动得分" : "已记录成绩"} ${latestTaskCompletion.score} 分`
    : ""
  const latestTaskState = latestTaskCompletion?.status === "reviewed" ? "老师已查看" : "已提交"
  const latestMistake = [...student.mistakes].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  const latestInquiry = assignedTasks.flatMap((task) => (task.inquiries ?? []).filter((item) => item.studentId === student.id).map((item) => ({ task, inquiry: item }))).sort((left, right) => right.inquiry.createdAt.localeCompare(left.inquiry.createdAt))[0]
  const latestTeacherMessage = conversations.filter((conversation) => (conversation.kind === "student" || conversation.kind === "group") && conversation.participantIds.includes(student.id)).flatMap((conversation) => conversation.messages.filter((message) => message.senderRole === "teacher")).sort((left, right) => right.sentAt.localeCompare(left.sentAt))[0]
  const showInquiry = Boolean(latestInquiry && (!latestTeacherMessage || latestInquiry.inquiry.createdAt >= latestTeacherMessage.sentAt))

  function openLatestTask() {
    if (latestTask) window.sessionStorage.setItem("zhiye-student-task-open-id", latestTask.id)
    onNavigate({ role: "student", page: "tasks" })
  }

  return (
    <div className="role-page role-page-flow">
      <header className="role-page-header">
        <div>
          <p className="role-page-kicker"><PinyinText text="今天的学习" /></p>
          <h1 className="role-page-title">{student.name}，从下一步开始</h1>
          <p className="role-page-description">只展示老师已经发布的内容和你真实需要完成的任务。</p>
        </div>
        <StatusChip tone="success">{student.className}</StatusChip>
      </header>

      <GlassSurface aria-label="继续学习" className="relative overflow-hidden p-6 sm:p-8" role="region" weight="sheet">
        <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[#dcebd7]/55 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2"><StatusChip tone="info">老师发布的复习卡</StatusChip>{latestReview ? <span className="text-xs font-bold text-[#819087]">{latestReview.date} · {latestReview.subject}</span> : null}</div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[#1d3224] sm:text-3xl">{latestReview?.title ?? "目前没有新的复习卡"}</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-[#65776b] sm:text-base">{latestReview?.recap ?? "老师发布新的课堂复习后，会自动出现在这里。"}</p>
            {latestReview && latestReview.recapTags.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{latestReview.recapTags.map((tag) => <span className="rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#536b59]" key={tag}>{tag}</span>)}</div> : null}
          </div>
          {latestReview ? <button className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-[20px] bg-[#24462f] px-6 font-black text-white shadow-[0_12px_26px_rgba(36,70,47,.18)]" onClick={() => onNavigate({ role: "student", page: "review", lessonId: latestReview.id })} type="button"><BookOpenCheck aria-hidden size={20} /><PinyinText text="开始复习" pinyinClassName="text-white/80" /><ArrowRight aria-hidden size={17} /></button> : null}
        </div>
      </GlassSurface>

      <section aria-label="接下来" className="mt-5 grid gap-5 lg:grid-cols-3">
        <GlassSurface className="flex min-h-56 flex-col p-5 sm:p-6" weight="card">
          <div className="flex items-center justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#eee6cf] text-[#81682e]"><ListTodo aria-hidden size={21} /></span><StatusChip tone={pendingCount ? "warning" : "success"}>{pendingCount} 项待办</StatusChip></div>
          <h2 className="mt-5 text-xl font-black text-[#203427]">最新任务</h2><p className="mt-2 text-sm font-black text-[#3f5946]">{latestTask?.title ?? "还没有老师发布的任务"}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a8980]">{latestTask ? isCompleted(latestTask) ? `${latestTaskState}${latestTaskScore}` : latestTask.content : "老师发布任务后会显示在这里。"}</p>
          <button className="mt-auto inline-flex min-h-11 items-center justify-between rounded-2xl bg-white/70 px-4 text-sm font-black text-[#31503a]" onClick={openLatestTask} type="button">{latestTask ? "打开这项任务" : "查看任务"}<ArrowRight aria-hidden size={17} /></button>
        </GlassSurface>
        <GlassSurface className="flex min-h-56 flex-col p-5 sm:p-6" weight="card">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#eadfd9] text-[#815746]"><NotebookTabs aria-hidden size={21} /></span><h2 className="mt-5 text-xl font-black text-[#203427]">最近错题</h2><p className="mt-2 text-sm font-black text-[#3f5946]">{latestMistake?.knowledgePoint ?? "还没有记录错题"}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a8980]">{latestMistake?.cause ?? "练习中记录的错题会保存在这里。"}</p>
          <button className="mt-auto inline-flex min-h-11 items-center justify-between rounded-2xl bg-white/70 px-4 text-sm font-black text-[#31503a]" onClick={() => onNavigate({ role: "student", page: "mistakes" })} type="button">打开错题本<ArrowRight aria-hidden size={17} /></button>
        </GlassSurface>
        <GlassSurface className="flex min-h-56 flex-col p-5 sm:p-6" weight="card">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#e3ecdd] text-[#486750]"><MessageCircle aria-hidden size={21} /></span><h2 className="mt-5 text-xl font-black text-[#203427]">学习交流</h2><p className="mt-2 text-sm font-black text-[#3f5946]">{showInquiry ? `最近询问 · ${latestInquiry.task.title}` : latestTeacherMessage ? "老师的最新消息" : "还没有新的交流"}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a8980]">{showInquiry ? latestInquiry.inquiry.status === "answered" && latestInquiry.inquiry.answer ? `AI 已解答：${latestInquiry.inquiry.answer}` : latestInquiry.inquiry.question : latestTeacherMessage?.body ?? "有任务疑问时，可以直接询问 AI 或联系老师。"}</p>
          <button className="mt-auto inline-flex min-h-11 items-center justify-between rounded-2xl bg-white/70 px-4 text-sm font-black text-[#31503a]" onClick={() => onNavigate(showInquiry ? { role: "student", page: "task-inquiry", taskId: latestInquiry.task.id } : { role: "student", page: "messages" })} type="button">{showInquiry ? "继续询问" : "查看消息"}<ArrowRight aria-hidden size={17} /></button>
        </GlassSurface>
      </section>
    </div>
  )
}

export default StudentHomePage
