import { Check } from "lucide-react"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"
import { useTeacherSettings } from "../../features/teacher/settings/teacherSettings"

export default function WorkspaceContextBar() {
  const prototype = usePrototypeOptional()
  const teacherSettings = useTeacherSettings()
  const hasData = prototype === null || Boolean(prototype.lessons.length || prototype.students.length)
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

  return (
    <header className="workspace-context-bar">
      <div className="min-w-0">
        <strong className="block truncate text-sm">{hasData ? teacherSettings.currentClass : "还没有课堂或学生"}</strong>
        <span className="block truncate text-[11px] text-[#718076] sm:inline sm:pl-2">
          {hasData ? contextDetail : "请从下一步开始"}
        </span>
      </div>
      {syncLabel ? (
        <span className="workspace-sync-status">
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
          {syncLabel}
        </span>
      ) : null}
    </header>
  )
}
