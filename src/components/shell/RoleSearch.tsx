import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import type { AppRoute, Role } from "../../app/routes"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"
import { Dialog } from "../shared/Dialog"

type SearchItem = {
  id: string
  title: string
  detail: string
  route: AppRoute
  roles: Role[]
}

export function RoleSearch({
  role,
  onNavigate,
  compact = false,
  iconOnly = false,
}: {
  role: Role
  onNavigate: (route: AppRoute) => void
  compact?: boolean
  iconOnly?: boolean
}) {
  const data = usePrototypeOptional()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const items = useMemo<SearchItem[]>(() => [
    ...(data?.lessons ?? []).map((lesson) => ({
      id: `lesson-${lesson.id}`,
      title: lesson.title,
      detail: `课堂 · ${lesson.className} · ${lesson.subject}`,
      route: role === "teacher"
        ? { role: "teacher", page: "lesson-detail", lessonId: lesson.id } as AppRoute
        : { role: "student", page: "review", lessonId: lesson.id } as AppRoute,
      roles: ["teacher", "student"] as Role[],
    })),
    ...(data?.students ?? []).map((student) => ({
      id: `student-${student.id}`,
      title: student.name,
      detail: `学生档案 · ${student.className}`,
      route: { role: "teacher", page: "student-detail", studentId: student.id } as AppRoute,
      roles: ["teacher"] as Role[],
    })),
    ...(data?.learningTopics ?? []).map((topic) => ({
      id: `topic-${topic.id}`,
      title: topic.title,
      detail: `知识点 · ${topic.subject}`,
      route: { role: "student", page: "learning" } as AppRoute,
      roles: ["student"] as Role[],
    })),
    ...(data?.tasks ?? []).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      detail: `任务 · ${task.audience.label}`,
      route: { role: role === "teacher" ? "teacher" : "student", page: "tasks" } as AppRoute,
      roles: ["teacher", "student"] as Role[],
    })),
    ...(data?.conversations ?? []).map((conversation) => ({
      id: `conversation-${conversation.id}`,
      title: conversation.title,
      detail: `消息 · ${conversation.participantNames.join("、")}`,
      route: { role: role === "parent" ? "parent" : role === "student" ? "student" : "teacher", page: "messages" } as AppRoute,
      roles: ["teacher", "student", "parent"] as Role[],
    })),
    ...(data?.safetyCases ?? []).map((item) => ({
      id: `safety-${item.id}`,
      title: item.title,
      detail: `保护性反馈 · ${item.status}`,
      route: { role: "admin", page: "safety" } as AppRoute,
      roles: ["admin"] as Role[],
    })),
    ...(data?.auditEvents ?? []).map((event) => ({
      id: `audit-${event.id}`,
      title: event.action,
      detail: `审计 · ${event.actor}`,
      route: { role: "admin", page: "audit" } as AppRoute,
      roles: ["admin"] as Role[],
    })),
  ], [data, role])
  const visibleItems = items.filter((item) => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN")
    return item.roles.includes(role) && (!normalized || `${item.title} ${item.detail}`.toLocaleLowerCase("zh-CN").includes(normalized))
  }).slice(0, 12)

  return (
    <>
      <button
        aria-label={iconOnly ? "搜索当前空间" : undefined}
        className={iconOnly
          ? "grid size-11 place-items-center rounded-full border border-white/85 bg-white/88 text-[#45624d] shadow-[0_12px_30px_rgba(36,62,43,.15)] backdrop-blur-xl"
          : compact
          ? "flex min-h-12 w-full items-center gap-3 rounded-[16px] bg-white/70 px-4 text-left text-sm font-black text-[#526158]"
          : "flex min-h-11 w-full items-center gap-3 rounded-[16px] border border-white/80 bg-white/55 px-3 text-left text-sm font-bold text-[#627468] hover:bg-white/75"}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Search aria-hidden="true" size={18} />
        {iconOnly ? <span className="sr-only">搜索当前空间</span> : "搜索当前空间"}
      </button>
      <Dialog description="搜索当前角色可以访问的课堂、人员、任务、消息与记录。" onClose={() => setOpen(false)} open={open} title="搜索">
        <div className="grid gap-3">
          <label className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-3.5 text-[#718076]" size={18} />
            <input autoFocus aria-label="全局搜索" className="min-h-11 w-full rounded-2xl border border-[#d9e4d7] bg-white/85 pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-[#789b7d]/20" onChange={(event) => setQuery(event.target.value)} placeholder="输入名称、内容或对象" type="search" value={query} />
          </label>
          <ul aria-label="全局搜索结果" className="grid max-h-[52dvh] gap-2 overflow-y-auto">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <button className="w-full rounded-2xl bg-white/70 px-4 py-3 text-left hover:bg-white" onClick={() => { setOpen(false); setQuery(""); onNavigate(item.route) }} type="button">
                  <strong className="block text-sm text-[#203127]">{item.title}</strong>
                  <span className="mt-1 block text-xs text-[#738078]">{item.detail}</span>
                </button>
              </li>
            ))}
          </ul>
          {visibleItems.length === 0 ? <p className="py-6 text-center text-sm text-[#738078]">没有匹配结果</p> : null}
        </div>
      </Dialog>
    </>
  )
}
