import { useMemo, useState } from "react"
import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react"
import type { AppRoute } from "../../../app/routes"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Student } from "../../../app/prototype/types"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

export interface StudentsPageProps {
  onNavigate: (route: AppRoute) => void
}

type AttentionFilter = "all" | "needs-review" | "steady"

function studentAttention(student: Student): Exclude<AttentionFilter, "all"> {
  return student.taskCompletionRate < 85 || student.currentFocus.length > 1
    ? "needs-review"
    : "steady"
}

function StudentCard({
  student,
  onOpen,
}: {
  student: Student
  onOpen: () => void
}) {
  const needsReview = studentAttention(student) === "needs-review"

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-white/80 bg-white/64 p-5 shadow-[0_18px_44px_rgba(48,74,56,.07)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/78 hover:shadow-[0_22px_52px_rgba(48,74,56,.11)]">
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(201,220,199,.55),transparent_68%)]" />
      <div className="relative flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[17px] border border-white/90 bg-[linear-gradient(145deg,rgba(238,231,199,.95),rgba(215,229,211,.86))] text-lg font-black text-[#426049] shadow-inner">
          {student.avatarText}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black tracking-[-.02em] text-[#17271c]">
                {student.name}
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#819086]">
                {student.className} · {student.guardianRelation}{" "}
                {student.guardianName}
              </p>
            </div>
            <StatusChip tone={needsReview ? "warning" : "success"}>
              {needsReview ? "建议关注" : "节奏稳定"}
            </StatusChip>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-[15px] bg-[#f5f7f1]/90 px-3 py-3 text-center">
              <strong className="block text-lg font-black text-[#263c2b]">
                {student.voluntaryQuestions}
              </strong>
              <span className="text-[11px] font-semibold text-[#7c8b81]">
                主动提问
              </span>
            </div>
            <div className="rounded-[15px] bg-[#f5f7f1]/90 px-3 py-3 text-center">
              <strong className="block text-lg font-black text-[#263c2b]">
                {student.practiceCount}
              </strong>
              <span className="text-[11px] font-semibold text-[#7c8b81]">
                完成练习
              </span>
            </div>
            <div className="rounded-[15px] bg-[#f5f7f1]/90 px-3 py-3 text-center">
              <strong className="block text-lg font-black text-[#263c2b]">
                {student.taskCompletionRate}%
              </strong>
              <span className="text-[11px] font-semibold text-[#7c8b81]">
                任务完成
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {student.currentFocus.map((focus) => (
              <span
                className="rounded-full border border-[#dce6d8] bg-[#edf3ea] px-3 py-1 text-xs font-bold text-[#58705d]"
                key={focus}
              >
                {focus}
              </span>
            ))}
          </div>

          <button
            aria-label={`查看${student.name}档案`}
            className="mt-5 flex w-full items-center justify-between rounded-[16px] border border-[#dfe8dc] bg-white/70 px-4 py-3 text-sm font-black text-[#36513c] transition hover:border-[#b8ccb8] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a7c2aa]/35"
            onClick={onOpen}
            type="button"
          >
            查看学习档案
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function StudentsPage({ onNavigate }: StudentsPageProps) {
  const { students, tasks } = usePrototype()
  const [query, setQuery] = useState("")
  const [focus, setFocus] = useState("all")
  const [attention, setAttention] = useState<AttentionFilter>("all")

  const focusOptions = useMemo(
    () =>
      Array.from(
        new Set(students.flatMap((student) => student.currentFocus)),
      ).sort(),
    [students],
  )

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN")
    return students.filter((student) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${student.name}${student.guardianName}${student.currentFocus.join("")}`
          .toLocaleLowerCase("zh-CN")
          .includes(normalizedQuery)
      const matchesFocus =
        focus === "all" || student.currentFocus.includes(focus)
      const matchesAttention =
        attention === "all" || studentAttention(student) === attention
      return matchesQuery && matchesFocus && matchesAttention
    })
  }, [attention, focus, query, students])

  const averageCompletion = Math.round(
    students.reduce((sum, student) => {
      const trackedTasks = tasks.filter(
        (task) =>
          task.status !== "draft" &&
          (task.audience.kind === "class" ||
            task.audience.studentIds.includes(student.id)),
      )
      if (trackedTasks.length === 0) return sum + student.taskCompletionRate
      const completed = trackedTasks.filter((task) =>
        task.completions.some(
          (completion) =>
            completion.studentId === student.id &&
            (completion.status === "submitted" || completion.status === "reviewed"),
        ),
      ).length
      return sum + Math.round((completed / trackedTasks.length) * 100)
    }, 0) / Math.max(students.length, 1),
  )
  const reviewCount = students.filter(
    (student) => studentAttention(student) === "needs-review",
  ).length

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-[.14em] text-[#6b816f]">
            <UsersRound aria-hidden="true" size={16} />
            班级学习档案
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-.045em] text-[#15251a] sm:text-4xl">
            学生档案
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#708078]">
            以可核实学习记录为主线查看成长轨迹，AI 只提供待教师判断的辅助线索。
          </p>
        </div>
        <StatusChip className="self-start lg:self-auto" tone="info">
          数据更新于今天 15:40
        </StatusChip>
      </header>

      <section
        aria-label="班级档案概览"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        <GlassSurface className="flex items-center gap-4 p-5" weight="light">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f1e5] text-[#54705a]">
            <UsersRound aria-hidden="true" size={21} />
          </div>
          <div>
            <strong className="text-2xl font-black text-[#203427]">
              {students.length}
            </strong>
            <p className="text-xs font-bold text-[#77877d]">名学生</p>
          </div>
          <span className="sr-only">{students.length} 名学生</span>
        </GlassSurface>
        <GlassSurface className="flex items-center gap-4 p-5" weight="light">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef0d9] text-[#73753d]">
            <CheckCircle2 aria-hidden="true" size={21} />
          </div>
          <div>
            <strong className="text-2xl font-black text-[#203427]">
              {averageCompletion}%
            </strong>
            <p className="text-xs font-bold text-[#77877d]">平均任务完成率</p>
          </div>
        </GlassSurface>
        <GlassSurface className="flex items-center gap-4 p-5" weight="light">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f6ead2] text-[#8e6d31]">
            <Sparkles aria-hidden="true" size={21} />
          </div>
          <div>
            <strong className="text-2xl font-black text-[#203427]">
              {reviewCount}
            </strong>
            <p className="text-xs font-bold text-[#77877d]">份档案建议复核</p>
          </div>
        </GlassSurface>
      </section>

      <GlassSurface className="mt-5 p-4 sm:p-5" weight="light">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">搜索学生</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7d8d82]"
              size={18}
            />
            <input
              aria-label="搜索学生"
              className="h-12 w-full rounded-[17px] border border-white/90 bg-white/72 pl-11 pr-4 text-sm font-semibold text-[#203427] outline-none transition placeholder:text-[#a0aba4] focus:border-[#a9c0aa] focus:ring-4 focus:ring-[#afc7b0]/25"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索姓名、监护人或知识点"
              type="search"
              value={query}
            />
          </label>
          <div className="flex items-center gap-2 text-xs font-black text-[#718177]">
            <SlidersHorizontal aria-hidden="true" size={16} />
            筛选
          </div>
          <label className="grid gap-1 text-xs font-bold text-[#65776a]">
            <span className="sr-only">关注知识点</span>
            <select
              aria-label="关注知识点"
              className="h-12 min-w-40 rounded-[17px] border border-white/90 bg-white/72 px-4 text-sm font-bold text-[#334b38] outline-none focus:ring-4 focus:ring-[#afc7b0]/25"
              onChange={(event) => setFocus(event.target.value)}
              value={focus}
            >
              <option value="all">全部知识点</option>
              {focusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">档案状态</span>
            <select
              aria-label="档案状态"
              className="h-12 min-w-36 rounded-[17px] border border-white/90 bg-white/72 px-4 text-sm font-bold text-[#334b38] outline-none focus:ring-4 focus:ring-[#afc7b0]/25"
              onChange={(event) =>
                setAttention(event.target.value as AttentionFilter)
              }
              value={attention}
            >
              <option value="all">全部状态</option>
              <option value="needs-review">建议关注</option>
              <option value="steady">节奏稳定</option>
            </select>
          </label>
        </div>
      </GlassSurface>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm font-bold text-[#68796e]">
          显示 {filteredStudents.length} / {students.length} 名学生
        </p>
        <button
          className="hidden items-center gap-2 text-sm font-black text-[#52705a] hover:text-[#263e2c] sm:flex"
          onClick={() => {
            setQuery("")
            setFocus("all")
            setAttention("all")
          }}
          type="button"
        >
          清除筛选 <ArrowUpRight aria-hidden="true" size={15} />
        </button>
      </div>

      {filteredStudents.length > 0 ? (
        <section
          aria-label="学生列表"
          className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
        >
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              onOpen={() =>
                onNavigate({
                  role: "teacher",
                  page: "student-detail",
                  studentId: student.id,
                })
              }
              student={student}
            />
          ))}
        </section>
      ) : (
        <GlassSurface
          className="mt-4 grid min-h-64 place-items-center p-8 text-center"
          weight="card"
        >
          <div>
            <BookOpenCheck
              aria-hidden="true"
              className="mx-auto text-[#7b907f]"
              size={28}
            />
            <h2 className="mt-4 text-xl font-black text-[#243a2a]">
              没有符合条件的学生
            </h2>
            <p className="mt-2 text-sm text-[#75847b]">
              尝试清除关键词或切换关注知识点。
            </p>
          </div>
        </GlassSurface>
      )}
    </div>
  )
}

export default StudentsPage
