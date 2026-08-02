import type { LucideIcon } from "lucide-react"

import {
  ArrowRight,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ListTodo,
  NotebookTabs,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type StudentHomePageProps = {
  onNavigate(route: AppRoute): void
}

type EntryCardProps = {
  action: string
  description: string
  icon: LucideIcon
  onClick(): void
  title: string
}

function EntryCard({
  action,
  description,
  icon: Icon,
  onClick,
  title,
}: EntryCardProps) {
  return (
    <GlassSurface
      className="group flex min-h-48 flex-col justify-between p-5 sm:p-6"
      weight="card"
    >
      <div>
        <span className="grid size-11 place-items-center rounded-2xl bg-[#e3ecdd] text-[#486750]">
          <Icon aria-hidden size={22} />
        </span>
        <h2 className="mt-5 text-xl font-black text-[#203427]">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#708078]">
          {description}
        </p>
      </div>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white/65 px-4 text-left text-sm font-black text-[#31503a] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35"
        onClick={onClick}
        type="button"
      >
        {action}
        <ArrowRight aria-hidden size={17} />
      </button>
    </GlassSurface>
  )
}

export function StudentHomePage({ onNavigate }: StudentHomePageProps) {
  const { lessons, students, tasks } = usePrototype()
  const student =
    students.find((item) => item.id === "student-lin-xiaoyu") ?? students[0]
  const visibleLessons = lessons
    .filter(
      (lesson) => lesson.studentVisibility === "visible" && lesson.recap.trim(),
    )
    .sort((left, right) => right.date.localeCompare(left.date))
  const todayReview =
    visibleLessons[0] ?? lessons.find((lesson) => lesson.recap.trim())
  const studentTasks = tasks.filter((task) => {
    if (task.status === "draft" || task.status === "completed") return false
    return (
      task.audience.kind === "class" ||
      task.audience.studentIds.includes(student?.id ?? "")
    )
  })
  const nextTask =
    studentTasks.find((task) => task.status === "review") ?? studentTasks[0]
  const latestMistake = student?.mistakes[0]
  const latestTimelineEvent = student?.timeline.at(-1)

  if (!student) {
    return (
      <GlassSurface className="mx-auto max-w-xl p-8 text-center" weight="sheet">
        <h1 className="text-2xl font-black text-[#203427]">
          还没有找到学生资料
        </h1>
        <p className="mt-3 text-sm text-[#718078]">
          请稍后再试，或返回角色入口。
        </p>
      </GlassSurface>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-1 pb-8 sm:px-2">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#58725e]">
            <Sparkles aria-hidden size={17} />
            今天也按自己的节奏来
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#17291d] sm:text-4xl">
            {student.name}，下午好
          </h1>
          <p className="mt-2 text-sm font-medium text-[#718078]">
            先看一张复习卡，再决定今天想练什么。
          </p>
        </div>
        <StatusChip tone="success">
          {student.className} · 学习内容已同步
        </StatusChip>
      </header>

      <section aria-label="今日复习卡">
        <GlassSurface
          className="relative overflow-hidden p-6 sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-8"
          weight="sheet"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[#dcebd7]/55 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone="info">今日复习卡</StatusChip>
              <span className="text-xs font-bold text-[#819087]">
                {todayReview
                  ? `${todayReview.subject} · ${todayReview.durationMinutes} 分钟课堂`
                  : "等待老师发布"}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[#1d3224] sm:text-3xl">
              {todayReview?.title ?? "今天还没有新的复习卡"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[#65776b] sm:text-base">
              {todayReview?.recap ||
                "有新内容时会出现在这里，你可以先去错题本温习。"}
            </p>
            {todayReview && (
              <div className="mt-5 flex flex-wrap gap-2">
                {todayReview.recapTags.map((tag) => (
                  <span
                    className="rounded-full bg-white/70 px-3 py-2 text-xs font-black text-[#536b59]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="relative mt-6 flex justify-start lg:mt-0 lg:justify-end">
            <button
              className="inline-flex min-h-14 items-center gap-3 rounded-[20px] bg-[#17291d] px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(23,41,29,.2)] transition hover:-translate-y-0.5 hover:bg-[#243b2a] focus:outline-none focus:ring-4 focus:ring-[#8daa91]/40 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!todayReview}
              onClick={() =>
                todayReview &&
                onNavigate({
                  role: "student",
                  page: "review",
                  lessonId: todayReview.id,
                })
              }
              type="button"
            >
              <BookOpenCheck aria-hidden size={21} />
              {todayReview ? `打开${todayReview.title}复习卡` : "等待复习卡"}
            </button>
          </div>
        </GlassSurface>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        <EntryCard
          action="拍照问一道题"
          description="先说说卡在哪里，再一步一步获得提示。拍照和识别均为原型模拟。"
          icon={Camera}
          onClick={() => onNavigate({ role: "student", page: "tutoring" })}
          title="我有一道题不会"
        />

        <GlassSurface
          aria-label="我的待办"
          className="flex min-h-48 flex-col p-5 sm:p-6"
          role="region"
          weight="card"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#eee6cf] text-[#81682e]">
              <ListTodo aria-hidden size={22} />
            </span>
            <StatusChip tone="warning">{studentTasks.length} 项待办</StatusChip>
          </div>
          <h2 className="mt-5 text-xl font-black text-[#203427]">我的待办</h2>
          <p className="mt-2 text-sm font-black text-[#3f5946]">
            {nextTask?.title ?? "今天的任务已完成"}
          </p>
          <p className="mt-1 text-xs font-medium text-[#7a8980]">
            {nextTask?.content ?? "可以自由复习喜欢的内容"}
          </p>
          <button
            className="mt-auto inline-flex min-h-11 items-center justify-between rounded-2xl bg-white/65 px-4 text-sm font-black text-[#31503a] focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35"
            onClick={() => onNavigate({ role: "student", page: "tasks" })}
            type="button"
          >
            查看全部任务 <ArrowRight aria-hidden size={17} />
          </button>
        </GlassSurface>

        <GlassSurface
          aria-label="我的错题"
          className="flex min-h-48 flex-col p-5 sm:p-6"
          role="region"
          weight="card"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-[#eadfd9] text-[#815746]">
            <NotebookTabs aria-hidden size={22} />
          </span>
          <h2 className="mt-5 text-xl font-black text-[#203427]">我的错题</h2>
          <p className="mt-2 text-sm font-black text-[#3f5946]">
            {latestMistake?.knowledgePoint ?? "还没有记录错题"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#7a8980]">
            {latestMistake?.cause ?? "遇到卡点时可以把题目收进这里"}
          </p>
          <button
            className="mt-auto inline-flex min-h-11 items-center justify-between rounded-2xl bg-white/65 px-4 text-sm font-black text-[#31503a] focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35"
            onClick={() => onNavigate({ role: "student", page: "mistakes" })}
            type="button"
          >
            打开错题本 <ArrowRight aria-hidden size={17} />
          </button>
        </GlassSurface>

        <GlassSurface
          aria-label="我的进度"
          className="flex min-h-48 flex-col p-5 sm:p-6"
          role="region"
          weight="card"
        >
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#dce9e7] text-[#3d6e68]">
              <TrendingUp aria-hidden size={22} />
            </span>
            <span className="text-xs font-black text-[#76867c]">
              只和自己的记录比较
            </span>
          </div>
          <h2 className="mt-5 text-xl font-black text-[#203427]">我的进度</h2>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#7a8980]">任务完成率</p>
              <strong className="mt-1 block text-3xl font-black text-[#31523a]">
                {student.taskCompletionRate}%
              </strong>
            </div>
            <div className="text-right text-xs font-bold leading-6 text-[#708078]">
              <p>主动提问 {student.voluntaryQuestions} 次</p>
              <p>完成练习 {student.practiceCount} 次</p>
            </div>
          </div>
          <div
            aria-label={`任务完成率 ${student.taskCompletionRate}%`}
            className="mt-auto h-2 overflow-hidden rounded-full bg-[#dfe7df]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={student.taskCompletionRate}
          >
            <div
              className="h-full rounded-full bg-[#6f9978]"
              style={{ width: `${student.taskCompletionRate}%` }}
            />
          </div>
        </GlassSurface>
      </div>

      <GlassSurface
        aria-label="最近学习记录"
        className="mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
        role="region"
        weight="light"
      >
        <div>
          <p className="text-xs font-black tracking-[0.12em] text-[#66806b]">
            最近学习记录
          </p>
          <p className="mt-2 text-base font-black text-[#2d4935]">
            {latestTimelineEvent?.title ?? "还没有新的学习记录"}
          </p>
          <p className="mt-1 text-sm font-medium text-[#738178]">
            {latestTimelineEvent?.detail ?? "完成一次复习后，这里会留下你的学习标记。"}
          </p>
        </div>
        <StatusChip tone="success">
          {latestTimelineEvent ? "已记录" : "等待记录"}
        </StatusChip>
      </GlassSurface>

      <GlassSurface
        className="mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
        weight="light"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-white/70 text-[#55725c]">
            <Target aria-hidden size={20} />
          </span>
          <div>
            <p className="text-sm font-black text-[#2e4935]">今天的小目标</p>
            <p className="text-xs font-medium text-[#76867c]">
              能用自己的话讲清一个知识点，就已经很棒。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#728178]">
          <Clock3 aria-hidden size={15} /> 建议学习 15–20 分钟
          <CheckCircle2 aria-hidden size={15} /> 不比较速度
          <CircleHelp aria-hidden size={15} /> 随时可以求助
        </div>
      </GlassSurface>
    </div>
  )
}

export default StudentHomePage
