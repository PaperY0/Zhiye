import { Check, Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { AppRoute } from "../../app/routes"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"
import { useTeacherSettings } from "../../features/teacher/settings/teacherSettings"

type SearchResult = {
  id: string
  title: string
  detail: string
  route: AppRoute
}

export default function WorkspaceContextBar({
  onNavigate = () => undefined,
}: {
  onNavigate?: (route: AppRoute) => void
}) {
  const prototype = usePrototypeOptional()
  const teacherSettings = useTeacherSettings()
  const [query, setQuery] = useState("")
  const hasData =
    prototype === null || Boolean(prototype.lessons.length || prototype.students.length)
  const latestLesson = prototype
    ? [...prototype.lessons].sort((left, right) => right.date.localeCompare(left.date))[0]
    : undefined
  const latestDate = latestLesson?.date.split("-")
  const contextDetail = latestLesson && latestDate?.length === 3
    ? `${latestLesson.subject} · 最近课堂 ${Number(latestDate[1])} 月 ${Number(latestDate[2])} 日`
    : "还没有课堂记录"
  const syncLabel = prototype?.lessons.some((lesson) => lesson.syncStatus === "syncing")
    ? "同步中"
    : prototype?.lessons.some((lesson) => lesson.syncStatus === "local")
      ? "本机保存"
      : prototype?.lessons.length
        ? "已同步"
        : null
  const results = useMemo<SearchResult[]>(() => {
    if (!prototype || !query.trim()) return []
    const normalized = query.trim().toLowerCase()
    const candidates: SearchResult[] = [
      ...prototype.lessons.map((lesson) => ({
        id: `lesson-${lesson.id}`,
        title: lesson.title,
        detail: `课堂 · ${lesson.className} · ${lesson.subject}`,
        route: { role: "teacher", page: "lesson-detail", lessonId: lesson.id } as const,
      })),
      ...prototype.students.map((student) => ({
        id: `student-${student.id}`,
        title: student.name,
        detail: `学生 · ${student.className} · ${student.currentFocus.join("、")}`,
        route: { role: "teacher", page: "student-detail", studentId: student.id } as const,
      })),
      ...prototype.signals.map((signal) => ({
        id: `signal-${signal.id}`,
        title: signal.knowledgePoint,
        detail: `知识点 · ${signal.affectedCount} 名学生需要关注`,
        route: { role: "teacher", page: "insights" } as const,
      })),
    ]
    return candidates
      .filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(normalized))
      .slice(0, 6)
  }, [prototype, query])

  function selectResult(result: SearchResult) {
    setQuery("")
    onNavigate(result.route)
  }

  return (
    <header className="workspace-context-bar">
      <div className="min-w-0">
        <strong className="block truncate text-sm">
          {hasData ? teacherSettings.currentClass : "还没有课堂或学生"}
        </strong>
        <span className="block truncate text-[11px] text-[#718076] sm:inline sm:pl-2">
          {hasData ? contextDetail : "请从下一步开始"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <label className="workspace-search flex">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
            <input
              aria-label="搜索课堂、学生或知识点"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索课堂、学生或知识点"
              type="search"
              value={query}
            />
          </label>
          {query.trim() ? (
            <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[min(420px,70vw)] rounded-[20px] border border-white/90 bg-white/95 p-2 shadow-[0_18px_50px_rgba(35,62,42,0.18)] backdrop-blur-xl">
              {results.length > 0 ? (
                <ul aria-label="工作台搜索结果" className="grid gap-1">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        aria-label={`打开${result.title}`}
                        className="w-full rounded-[14px] px-3 py-2.5 text-left hover:bg-[#eef5ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d]"
                        onClick={() => selectResult(result)}
                        type="button"
                      >
                        <strong className="block text-sm text-[#203127]">{result.title}</strong>
                        <span className="mt-0.5 block text-xs text-[#738078]">{result.detail}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-4 text-center text-sm text-[#738078]">没有找到匹配内容</p>
              )}
            </div>
          ) : null}
        </div>
        {syncLabel ? (
          <span className="workspace-sync-status">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            {syncLabel}
          </span>
        ) : null}
      </div>
    </header>
  )
}
