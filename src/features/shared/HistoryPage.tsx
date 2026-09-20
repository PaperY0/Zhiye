import { useMemo, useState } from "react"
import { ArrowUpRight, Clock3, History, Search } from "lucide-react"
import type { AppRoute, Role } from "../../app/routes"
import { getRoleHome } from "../../app/routes"
import { usePrototype } from "../../app/prototype/PrototypeContext"
import { EmptyState } from "../../components/shared/EmptyState"
import { GlassSurface } from "../../components/shared/GlassSurface"
import { StatusChip } from "../../components/shared/StatusChip"

type HistoryRecord = {
  id: string
  category: string
  title: string
  summary: string
  updatedAt: string
  route: AppRoute
}

const categoryLabels = ["全部记录", "课堂", "学生", "备课", "测验", "任务", "消息", "安全", "审计"]

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function roleCategories(role: Role) {
  if (role === "admin") return new Set(["课堂", "任务", "安全", "审计"])
  if (role === "parent") return new Set(["课堂", "消息"])
  if (role === "student") return new Set(["课堂", "任务", "消息"])
  return new Set(["课堂", "学生", "备课", "测验", "任务", "消息"])
}

function sectionRoute(role: Role, section: "tasks" | "messages"): AppRoute {
  if (role === "teacher" || role === "student") return { role, page: section }
  if (role === "parent" && section === "messages") return { role, page: "messages" }
  return getRoleHome(role)
}

export default function HistoryPage({
  role,
  onNavigate,
}: {
  role: Role
  onNavigate: (route: AppRoute) => void
}) {
  const {
    lessons,
    students,
    plans,
    quizzes,
    tasks,
    conversations,
    safetyCases,
    auditEvents,
  } = usePrototype()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("全部记录")
  const allowedCategories = useMemo(() => roleCategories(role), [role])

  const records = useMemo<HistoryRecord[]>(() => {
    const result: HistoryRecord[] = []
    if (allowedCategories.has("课堂")) {
      result.push(...lessons.map((lesson) => ({
        id: lesson.id,
        category: "课堂",
        title: lesson.title,
        summary: `${lesson.className} · ${lesson.subject} · ${lesson.status === "published" ? "已发布" : "待确认"}`,
        updatedAt: lesson.date,
        route: (role === "teacher"
          ? { role, page: "lesson-detail", lessonId: lesson.id }
          : role === "student"
            ? { role, page: "review", lessonId: lesson.id }
            : getRoleHome(role)) as AppRoute,
      })))
    }
    if (allowedCategories.has("学生")) {
      result.push(...students.map((student) => ({
        id: student.id,
        category: "学生",
        title: `${student.name}的学生档案`,
        summary: `${student.className} · ${student.timeline.length} 条学习记录 · ${student.mistakes.length} 道错题`,
        updatedAt: student.timeline.at(-1)?.occurredAt ?? "暂无时间",
        route: { role: "teacher", page: "student-detail", studentId: student.id } as AppRoute,
      })))
    }
    if (allowedCategories.has("备课")) {
      result.push(...plans.map((plan) => ({
        id: plan.id,
        category: "备课",
        title: plan.title,
        summary: `${plan.subject} · ${plan.chapter} · ${plan.status}`,
        updatedAt: plan.createdAt,
        route: { role: "teacher", page: "planning" } as AppRoute,
      })))
    }
    if (allowedCategories.has("测验")) {
      result.push(...quizzes.map((quiz) => ({
        id: quiz.id,
        category: "测验",
        title: quiz.title,
        summary: `${quiz.questions.length} 题 · ${quiz.status}`,
        updatedAt: quiz.createdAt,
        route: { role: "teacher", page: "planning" } as AppRoute,
      })))
    }
    if (allowedCategories.has("任务")) {
      result.push(...tasks.map((task) => ({
        id: task.id,
        category: "任务",
        title: task.title,
        summary: `${task.audience.label} · ${task.status} · ${task.completions.length} 条完成记录`,
        updatedAt: task.createdAt,
        route: sectionRoute(role, "tasks"),
      })))
    }
    if (allowedCategories.has("消息")) {
      result.push(...conversations.map((conversation) => ({
        id: conversation.id,
        category: "消息",
        title: conversation.title,
        summary: `${conversation.messages.length} 条消息 · ${conversation.participantNames.join("、")}`,
        updatedAt: conversation.messages.at(-1)?.sentAt ?? "暂无时间",
        route: sectionRoute(role, "messages"),
      })))
    }
    if (allowedCategories.has("安全")) {
      result.push(...safetyCases.map((item) => ({
        id: item.id,
        category: "安全",
        title: item.title,
        summary: `${item.studentAlias} · ${item.status} · ${item.priority}`,
        updatedAt: item.updatedAt,
        route: { role: "admin", page: "safety" } as AppRoute,
      })))
    }
    if (allowedCategories.has("审计")) {
      result.push(...auditEvents.map((event) => ({
        id: event.id,
        category: "审计",
        title: event.action,
        summary: `${event.actor} · ${event.purpose}`,
        updatedAt: event.occurredAt,
        route: { role: "admin", page: "audit" } as AppRoute,
      })))
    }
    return result.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }, [allowedCategories, auditEvents, conversations, lessons, plans, quizzes, role, safetyCases, students, tasks])

  const visibleRecords = records.filter((record) => {
    const normalizedQuery = query.trim().toLowerCase()
    return (
      (category === "全部记录" || record.category === category) &&
      (!normalizedQuery || `${record.title} ${record.summary}`.toLowerCase().includes(normalizedQuery))
    )
  })

  return (
    <div className="role-page role-page-flow">
      <header className="role-page-header">
        <div>
          <div className="role-page-kicker flex items-center gap-2">
            <History aria-hidden="true" size={18} />
            统一回看，不重复管理
          </div>
          <h1 className="role-page-title">历史记录</h1>
          <p className="role-page-description">
            这里是只读索引。查找过去的课堂、任务与消息后，回到对应功能继续处理，避免同一条数据在多个页面被重复修改或删除。
          </p>
        </div>
        <StatusChip tone="info">{visibleRecords.length} 条匹配记录</StatusChip>
      </header>

      <GlassSurface className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px]" weight="light">
        <label className="relative block">
          <span className="sr-only">查找历史记录</span>
          <Search aria-hidden="true" className="absolute left-3 top-3.5 text-[#718076]" size={18} />
          <input aria-label="查找历史记录" className="min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-[#789b7d]/20" onChange={(event) => setQuery(event.target.value)} placeholder="查找标题、对象或记录内容" value={query} />
        </label>
        <label className="text-sm font-bold text-[#536458]">
          <span className="sr-only">记录类型</span>
          <select aria-label="历史记录类型" className="min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3" onChange={(event) => setCategory(event.target.value)} value={category}>
            {categoryLabels.filter((item) => item === "全部记录" || allowedCategories.has(item)).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </GlassSurface>

      {visibleRecords.length === 0 ? (
        <EmptyState description="请调整关键词或记录类型筛选。" title="没有匹配的历史记录" />
      ) : (
        <section aria-label="历史记录列表" className="grid gap-3">
          {visibleRecords.map((record) => (
            <GlassSurface className="grid gap-4 p-5 md:grid-cols-[100px_minmax(0,1fr)_auto] md:items-center" key={`${record.category}-${record.id}`} weight="light">
              <StatusChip tone={record.category === "审计" ? "neutral" : "info"}>{record.category}</StatusChip>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-[#1c2a21]">{record.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#657469]">{record.summary}</p>
                <time className="mt-2 flex items-center gap-1 text-xs font-bold text-[#7a887d]" dateTime={record.updatedAt}>
                  <Clock3 aria-hidden="true" size={13} /> {formatDate(record.updatedAt)}
                </time>
              </div>
              <button aria-label={`打开${record.title}来源`} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cbdaca] bg-white/75 px-4 text-sm font-black text-[#35563d] hover:bg-white" onClick={() => onNavigate(record.route)} type="button">
                打开来源 <ArrowUpRight aria-hidden="true" size={16} />
              </button>
            </GlassSurface>
          ))}
        </section>
      )}
    </div>
  )
}
