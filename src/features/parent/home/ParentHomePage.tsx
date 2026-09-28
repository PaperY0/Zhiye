import { useState } from "react"
import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardList, MessageCircle, NotebookTabs, Sparkles } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { parentLearningSnapshot, type ParentTaskRow } from "../../../app/prototype/parentLearning"
import type { ParentSummary } from "../../../app/prototype/types"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"

const BOUND_STUDENT_ID = "student-lin-xiaoyu"

export type ParentHomePageProps = { onNavigate(route: AppRoute): void }

function isPublishedParentSummary(summary: ParentSummary | null, studentId: string): summary is ParentSummary & { source: "deepseek"; confirmedAt: string; evidence: string[] } {
  return Boolean(summary && summary.studentId === studentId && summary.source === "deepseek" && summary.confirmedAt?.trim() && summary.evidence?.some((item) => item.trim()) && summary.topics.length > 0 && summary.encouragement.trim() && summary.teacherMessage.trim())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(value))
}

function taskStateLabel(row: ParentTaskRow) {
  if (row.state === "reviewed") return "老师已查看"
  if (row.state === "submitted") return "孩子已提交"
  if (row.state === "in-progress") return "正在完成"
  return "等待开始"
}

function taskScoreLabel(row: ParentTaskRow) {
  if (typeof row.score !== "number") return null
  const automaticallyScored = row.state === "submitted" && Boolean(row.task.sourceQuizId && row.objectiveMax)
  const prefix = automaticallyScored ? "自动得分" : "已记录成绩"
  return `${prefix} ${row.score}${automaticallyScored ? ` / ${row.objectiveMax}` : ""} 分`
}

export function ParentHomePage({ onNavigate }: ParentHomePageProps) {
  const { parentSummary, students, tasks, quizzes, conversations } = usePrototype()
  const [showAllTasks, setShowAllTasks] = useState(false)
  const student = students.find((item) => item.id === BOUND_STUDENT_ID)

  if (!student) return <section className="role-page role-page-narrow"><GlassSurface className="p-8 text-center" weight="sheet"><h1 className="role-page-title">还没有绑定学生</h1><p className="role-page-description mx-auto">请联系老师确认孩子的学习档案。</p><button className="role-action-primary mt-5" onClick={() => onNavigate({ role: "parent", page: "messages" })} type="button">联系老师</button></GlassSurface></section>

  const learning = parentLearningSnapshot(student, tasks, quizzes)
  const publishedSummary = isPublishedParentSummary(parentSummary, student.id) ? parentSummary : null
  const parentConversation = conversations.find((item) => item.kind === "parent" && item.boundStudentId === student.id && item.participantIds.includes("parent-lin-xiaoyu"))
  const latestTeacherMessage = parentConversation?.messages.filter((item) => item.senderRole === "teacher").sort((left, right) => right.sentAt.localeCompare(left.sentAt))[0]
  const visibleTasks = showAllTasks ? learning.rows : learning.rows.slice(0, 3)

  return <main className="role-page role-page-flow text-[#1d3023]">
    <header className="role-page-header"><div><p className="role-page-kicker">家庭学习陪伴</p><h1 className="role-page-title">{student.name}的学习近况</h1><p className="role-page-description">{student.className} · 任务和学习记录更新后，这里会同步呈现。</p></div><span className="rounded-full border border-[#d7e4d7] bg-white/75 px-4 py-2 text-sm font-bold text-[#4f6b55]">已绑定孩子</span></header>

    <section aria-labelledby="parent-live-title" className="rounded-[26px] border border-[#dce7dc] bg-white p-5 shadow-[0_12px_32px_rgba(49,75,55,.05)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black tracking-[.12em] text-[#68806d]">与学生端同步</p><h2 className="mt-1 text-xl font-black" id="parent-live-title">当前学习动态</h2><p className="mt-2 text-sm leading-6 text-[#68796d]">只统计与{student.name}有关的已发布任务和已记录的学习活动。</p></div><span className="rounded-full bg-[#eaf3e8] px-3 py-2 text-xs font-black text-[#426b4b]">实时更新</span></div>
      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "待完成任务", value: learning.pendingCount, suffix: "项", color: "#bf9554" },
          { label: "已提交任务", value: learning.completedCount, suffix: "项", color: "#4d7958" },
          { label: "已解答疑问", value: learning.answeredInquiryCount, suffix: "次", color: "#6b8d78" },
          { label: "复习记录", value: learning.mistakeCount, suffix: "项", color: "#8a9b6d" },
        ].map((metric) => <div className="rounded-2xl border border-[#e3ebe2] bg-[#fafcf9] p-4" key={metric.label}><dt className="text-xs font-bold text-[#67796b]">{metric.label}</dt><dd className="mt-2 text-2xl font-black tabular-nums text-[#203b28]" style={{ borderLeft: `3px solid ${metric.color}`, paddingLeft: 10 }}>{metric.value} <span className="text-xs font-semibold">{metric.suffix}</span></dd></div>)}
      </dl>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <section aria-labelledby="parent-tasks-title" className="min-w-0 rounded-[26px] border border-[#dce7dc] bg-white p-5 sm:p-7">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7f0e4] text-[#4c7454]"><ClipboardList aria-hidden="true" size={20} /></span><div><p className="text-xs font-black tracking-[.12em] text-[#718276]">教师发布 → 学生完成</p><h2 className="mt-1 text-xl font-black" id="parent-tasks-title">孩子的任务</h2></div></div>
        {learning.rows.length ? <ol className="mt-5 grid gap-3">{visibleTasks.map((row) => <li className="rounded-2xl border border-[#e2ebe0] bg-[#fbfcfa] p-4" key={row.task.id}><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-black leading-6">{row.task.title}</h3><p className="mt-1 text-xs text-[#78877c]">{formatDate(row.task.createdAt)} 发布 · {row.task.type === "quiz" ? "三题自检" : "学习任务"}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${row.state === "submitted" || row.state === "reviewed" ? "bg-[#e4f1e4] text-[#3f704a]" : "bg-[#f7efdd] text-[#866d3e]"}`}>{taskStateLabel(row)}</span></div>{taskScoreLabel(row) && <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-[#3e6749]"><CheckCircle2 aria-hidden="true" size={16} />{taskScoreLabel(row)}</p>}</li>)}</ol> : <p className="mt-5 rounded-2xl bg-[#f5f8f3] p-5 text-sm text-[#6b7b6e]">老师发布任务后，这里会显示任务进展。</p>}
        {learning.rows.length > 3 && <button aria-expanded={showAllTasks} className="mt-3 min-h-11 text-sm font-black text-[#3e6749]" onClick={() => setShowAllTasks((current) => !current)} type="button">{showAllTasks ? "收起任务" : `查看全部 ${learning.rows.length} 项任务`}<ArrowRight aria-hidden="true" className="ml-1 inline" size={15} /></button>}
      </section>

      <div className="grid content-start gap-5">
        <section aria-label="学习支持" className="rounded-[26px] border border-[#dce7dc] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#e9efe5] text-[#5b795e]"><Sparkles aria-hidden="true" size={20} /></span><div><p className="text-xs font-black text-[#718276]">孩子主动提出的问题</p><h2 className="mt-1 text-lg font-black">学习支持</h2></div></div><p className="mt-4 text-sm leading-6 text-[#5f7365]">已记录 {learning.inquiryCount} 次任务询问，其中 {learning.answeredInquiryCount} 次已获得 AI 解答。</p>{learning.latestInquiryFocus && <p className="mt-3 rounded-xl bg-[#eff5ed] px-4 py-3 text-sm font-bold text-[#41634a]">最近关注：{learning.latestInquiryFocus}</p>}<p className="mt-3 text-xs leading-5 text-[#819084]">这里只显示学习关注点，不展示孩子的完整提问与 AI 对话。</p></section>
        <section aria-label="复习方向" className="rounded-[26px] border border-[#dce7dc] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#f4eddb] text-[#937548]"><NotebookTabs aria-hidden="true" size={20} /></span><h2 className="text-lg font-black">可以陪孩子回顾</h2></div><p className="mt-4 text-sm leading-6 text-[#627467]">{learning.latestMistakeTopic ? `最近的复习主题：${learning.latestMistakeTopic}` : "目前还没有新的复习记录。"}</p><p className="mt-2 text-xs leading-5 text-[#819084]">复习记录来自学生端；具体判断请以孩子的作答和老师反馈为准。</p></section>
      </div>
    </div>

    <section aria-labelledby="parent-summary-title" className="rounded-[26px] border border-[#dce7dc] bg-white p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7f0e4] text-[#4c7454]"><BookOpenCheck aria-hidden="true" size={20} /></span><div><p className="text-xs font-black tracking-[.12em] text-[#718276]">教师审核后发布</p><h2 className="mt-1 text-xl font-black" id="parent-summary-title">已确认的学习摘要</h2></div></div>{publishedSummary ? <><p className="mt-4 text-sm text-[#687a6d]">{publishedSummary.weekLabel} · 教师确认于 {formatDate(publishedSummary.confirmedAt)}</p><div className="mt-4 flex flex-wrap gap-2">{publishedSummary.topics.map((topic) => <span className="rounded-full bg-[#edf4ea] px-3 py-2 text-xs font-black text-[#496d51]" key={topic}>{topic}</span>)}</div><p className="mt-5 text-base font-semibold leading-8 text-[#3e5644]">{publishedSummary.encouragement}</p><div className="mt-4 rounded-2xl bg-[#f3f7f1] p-4"><p className="text-xs font-black text-[#6a806f]">李老师的陪伴建议</p><p className="mt-2 text-sm font-semibold leading-7 text-[#425a49]">{publishedSummary.teacherMessage}</p></div><details className="mt-4 text-xs text-[#6f8174]"><summary className="cursor-pointer font-bold">查看摘要依据</summary><p className="mt-2 leading-5">{publishedSummary.evidence.join("；")}</p></details></> : <p className="mt-5 rounded-2xl bg-[#f5f8f3] p-5 text-sm leading-6 text-[#68796d]">本次摘要还在等待教师确认。上方的任务和学习动态会继续更新。</p>}</section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section aria-label="最近学习记录" className="rounded-[26px] border border-[#dce7dc] bg-white p-5 sm:p-6"><h2 className="text-lg font-black">最近学习记录</h2>{learning.recentActivity.length ? <ol className="mt-4 grid gap-3">{learning.recentActivity.slice(0, 4).map((event) => <li className="flex items-start justify-between gap-3 border-b border-[#edf1ea] pb-3 text-sm last:border-0 last:pb-0" key={event.id}><span className="min-w-0"><strong className="block text-[#2c4833]">{event.title}</strong><span className="mt-1 block text-xs text-[#748478]">{event.detail}</span></span><time className="shrink-0 text-xs text-[#819084]" dateTime={event.at}>{formatDate(event.at)}</time></li>)}</ol> : <p className="mt-4 text-sm text-[#6b7b6e]">还没有新的学习记录。</p>}</section>
      <section aria-label="联系老师" className="rounded-[26px] border border-[#dce7dc] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#e9efe5] text-[#5b795e]"><MessageCircle aria-hidden="true" size={20} /></span><h2 className="text-lg font-black">与李老师保持联系</h2></div><p className="mt-4 rounded-2xl bg-[#f4f7f2] p-4 text-sm leading-7 text-[#506654]">{latestTeacherMessage?.body ?? "老师的最新留言会显示在这里。"}</p><p className="mt-3 text-xs leading-5 text-[#819084]">只展示与{student.name}绑定的家校沟通，不显示其他学生的信息。</p><button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#e5f1e3] px-4 text-sm font-black text-[#345b3d]" onClick={() => onNavigate({ role: "parent", page: "messages" })} type="button">查看家校消息<ArrowRight aria-hidden="true" size={16} /></button></section>
    </div>
  </main>
}

export default ParentHomePage
