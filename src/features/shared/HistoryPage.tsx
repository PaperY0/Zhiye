import { useMemo, useState } from "react"
import { Clock3, FilePenLine, History, Search, Trash2 } from "lucide-react"
import type { Role } from "../../app/routes"
import { usePrototype } from "../../app/prototype/PrototypeContext"
import { Dialog } from "../../components/shared/Dialog"
import { EmptyState } from "../../components/shared/EmptyState"
import { GlassSurface } from "../../components/shared/GlassSurface"
import { StatusChip } from "../../components/shared/StatusChip"

type HistoryRecord = {
  id: string
  category: string
  title: string
  summary: string
  updatedAt: string
  editable: boolean
  deletable: boolean
  updateTitle?: (title: string) => void
  remove?: () => void
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

export default function HistoryPage({ role }: { role: Role }) {
  const {
    lessons,
    students,
    plans,
    quizzes,
    tasks,
    conversations,
    safetyCases,
    auditEvents,
    updateLessonTitle,
    deleteLesson,
    updatePlanTitle,
    deletePlan,
    updateQuizTitle,
    deleteQuiz,
    updateTaskTitle,
    deleteTask,
    updateConversationTitle,
    deleteConversation,
  } = usePrototype()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("全部记录")
  const [selected, setSelected] = useState<HistoryRecord | null>(null)
  const [draftTitle, setDraftTitle] = useState("")
  const allowedCategories = roleCategories(role)

  const records = useMemo<HistoryRecord[]>(() => {
    const result: HistoryRecord[] = []
    if (allowedCategories.has("课堂")) {
      result.push(...lessons.map((lesson) => ({
        id: lesson.id,
        category: "课堂",
        title: lesson.title,
        summary: `${lesson.className} · ${lesson.subject} · ${lesson.status === "published" ? "已发布" : "待确认"}`,
        updatedAt: lesson.date,
        editable: true,
        deletable: true,
        updateTitle: (title: string) => updateLessonTitle(lesson.id, title),
        remove: () => deleteLesson(lesson.id),
      })))
    }
    if (allowedCategories.has("学生")) {
      result.push(...students.map((student) => ({
        id: student.id,
        category: "学生",
        title: `${student.name}的学生档案`,
        summary: `${student.className} · ${student.timeline.length} 条学习记录 · ${student.mistakes.length} 道错题`,
        updatedAt: student.timeline.at(-1)?.occurredAt ?? "暂无时间",
        editable: false,
        deletable: false,
      })))
    }
    if (allowedCategories.has("备课")) {
      result.push(...plans.map((plan) => ({
        id: plan.id,
        category: "备课",
        title: plan.title,
        summary: `${plan.subject} · ${plan.chapter} · ${plan.status}`,
        updatedAt: plan.createdAt,
        editable: true,
        deletable: true,
        updateTitle: (title: string) => updatePlanTitle(plan.id, title),
        remove: () => deletePlan(plan.id),
      })))
    }
    if (allowedCategories.has("测验")) {
      result.push(...quizzes.map((quiz) => ({
        id: quiz.id,
        category: "测验",
        title: quiz.title,
        summary: `${quiz.questions.length} 题 · ${quiz.status}`,
        updatedAt: quiz.createdAt,
        editable: true,
        deletable: true,
        updateTitle: (title: string) => updateQuizTitle(quiz.id, title),
        remove: () => deleteQuiz(quiz.id),
      })))
    }
    if (allowedCategories.has("任务")) {
      result.push(...tasks.map((task) => ({
        id: task.id,
        category: "任务",
        title: task.title,
        summary: `${task.audience.label} · ${task.status} · ${task.completions.length} 条完成记录`,
        updatedAt: task.createdAt,
        editable: true,
        deletable: true,
        updateTitle: (title: string) => updateTaskTitle(task.id, title),
        remove: () => deleteTask(task.id),
      })))
    }
    if (allowedCategories.has("消息")) {
      result.push(...conversations.map((conversation) => ({
        id: conversation.id,
        category: "消息",
        title: conversation.title,
        summary: `${conversation.messages.length} 条消息 · ${conversation.participantNames.join("、")}`,
        updatedAt: conversation.messages.at(-1)?.sentAt ?? "暂无时间",
        editable: true,
        deletable: true,
        updateTitle: (title: string) => updateConversationTitle(conversation.id, title),
        remove: () => deleteConversation(conversation.id),
      })))
    }
    if (allowedCategories.has("安全")) {
      result.push(...safetyCases.map((item) => ({
        id: item.id,
        category: "安全",
        title: item.title,
        summary: `${item.studentAlias} · ${item.status} · ${item.priority}`,
        updatedAt: item.updatedAt,
        editable: false,
        deletable: false,
      })))
    }
    if (allowedCategories.has("审计")) {
      result.push(...auditEvents.map((event) => ({
        id: event.id,
        category: "审计",
        title: event.action,
        summary: `${event.actor} · ${event.purpose}`,
        updatedAt: event.occurredAt,
        editable: false,
        deletable: false,
      })))
    }
    return result.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }, [allowedCategories, auditEvents, conversations, deleteConversation, deleteLesson, deletePlan, deleteQuiz, deleteTask, lessons, plans, quizzes, safetyCases, students, tasks, updateConversationTitle, updateLessonTitle, updatePlanTitle, updateQuizTitle, updateTaskTitle])

  const visibleRecords = records.filter((record) => {
    const normalizedQuery = query.trim().toLowerCase()
    return (
      (category === "全部记录" || record.category === category) &&
      (!normalizedQuery || `${record.title} ${record.summary}`.toLowerCase().includes(normalizedQuery))
    )
  })

  function openRecord(record: HistoryRecord) {
    setSelected(record)
    setDraftTitle(record.title)
  }

  function saveTitle() {
    if (!selected?.updateTitle || !draftTitle.trim()) return
    selected.updateTitle(draftTitle)
    setSelected(null)
  }

  function removeRecord(record: HistoryRecord) {
    if (!record.remove) return
    if (window.confirm(`确认删除“${record.title}”吗？删除后该演示记录将不再出现在历史记录中。`)) {
      record.remove()
      if (selected?.id === record.id) setSelected(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#53705b]">
            <History aria-hidden="true" size={18} />
            所有记录集中管理
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#15231a] sm:text-4xl">
            历史记录
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#657469]">
            查找、查看和管理当前角色可访问的课堂、学习、消息与管理记录。审计记录和受保护记录只读，保留原始留痕。
          </p>
        </div>
        <StatusChip tone="info">{visibleRecords.length} 条匹配记录</StatusChip>
      </header>

      <GlassSurface className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px]" weight="light">
        <label className="relative block">
          <span className="sr-only">查找历史记录</span>
          <Search aria-hidden="true" className="absolute left-3 top-3.5 text-[#718076]" size={18} />
          <input
            aria-label="查找历史记录"
            className="min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-[#789b7d]/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="查找标题、对象或记录内容"
            value={query}
          />
        </label>
        <label className="text-sm font-bold text-[#536458]">
          <span className="sr-only">记录类型</span>
          <select
            aria-label="历史记录类型"
            className="min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
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
              <button className="min-w-0 text-left" onClick={() => openRecord(record)} type="button">
                <h2 className="truncate text-lg font-black text-[#1c2a21]">{record.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#657469]">{record.summary}</p>
                <time className="mt-2 flex items-center gap-1 text-xs font-bold text-[#7a887d]" dateTime={record.updatedAt}>
                  <Clock3 aria-hidden="true" size={13} /> {formatDate(record.updatedAt)}
                </time>
              </button>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button className="rounded-full border border-[#cbdaca] bg-white/75 px-3 py-2 text-sm font-black text-[#35563d]" onClick={() => openRecord(record)} type="button">
                  查看记录
                </button>
                {record.editable ? <button aria-label={`修改${record.title}`} className="rounded-full border border-[#cbdaca] bg-white/75 p-2 text-[#35563d]" onClick={() => openRecord(record)} type="button"><FilePenLine aria-hidden="true" size={17} /></button> : null}
                {record.deletable ? <button aria-label={`删除${record.title}`} className="rounded-full border border-[#ecd4d0] bg-[#fff8f6] p-2 text-[#9a4e43]" onClick={() => removeRecord(record)} type="button"><Trash2 aria-hidden="true" size={17} /></button> : null}
              </div>
            </GlassSurface>
          ))}
        </section>
      )}

      <Dialog
        description={selected ? `${selected.category} · ${selected.summary}` : undefined}
        footer={selected ? (
          <div className="flex flex-wrap justify-end gap-3">
            <button className="rounded-full bg-[#eceee9] px-4 py-2.5 font-black text-[#5d685f]" onClick={() => setSelected(null)} type="button">关闭</button>
            {selected.editable ? <button className="rounded-full bg-[#24462f] px-5 py-2.5 font-black text-white" onClick={saveTitle} type="button">保存修改</button> : null}
          </div>
        ) : null}
        onClose={() => setSelected(null)}
        open={Boolean(selected)}
        title={selected ? `查看历史记录 · ${selected.title}` : "查看历史记录"}
      >
        {selected ? (
          <div className="grid gap-4">
            <div className="rounded-[22px] border border-[#dbe6d8] bg-[#f5f8f2] p-4 text-sm leading-6 text-[#526157]">
              当前记录已纳入历史记录中心；后续修改会保留在本地演示数据中，审计类记录不可修改或删除。
            </div>
            {selected.editable ? (
              <label className="grid gap-2 font-black text-[#2a4432]">
                记录标题
                <input className="min-h-11 rounded-2xl border border-white/90 bg-white/75 px-4" onChange={(event) => setDraftTitle(event.target.value)} value={draftTitle} />
              </label>
            ) : <p className="font-black text-[#2a4432]">{selected.title}</p>}
            <div className="text-sm text-[#718076]">最后记录时间：{formatDate(selected.updatedAt)}</div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
