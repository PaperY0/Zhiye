import { Check, Search } from "lucide-react"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"

export default function WorkspaceContextBar() {
  const prototype = usePrototypeOptional()
  const hasData =
    prototype === null || Boolean(prototype.lessons.length || prototype.students.length)
  return (
    <header className="workspace-context-bar">
      <div className="min-w-0">
        <strong className="block truncate text-sm">
          {hasData ? "五年级（2）班" : "还没有课堂或学生"}
        </strong>
        <span className="block truncate text-[11px] text-[#718076] sm:inline sm:pl-2">
          {hasData ? "数学 · 7 月 21 日" : "请从下一步开始"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="workspace-search hidden md:flex">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
          <input
            aria-label="搜索课堂、学生或知识点"
            placeholder="搜索课堂、学生或知识点"
            type="search"
          />
        </label>
        {hasData ? (
          <span className="workspace-sync-status">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            已同步
          </span>
        ) : null}
      </div>
    </header>
  )
}
