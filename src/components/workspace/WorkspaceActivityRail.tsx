import { BookOpen, CheckSquare2, MessageCircle, Sparkles } from "lucide-react"
import type { AppRoute } from "../../app/routes"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"

const queue = [
  { label: "确认课堂复盘", detail: "现在最值得处理", icon: Sparkles, route: { role: "teacher", page: "lesson-detail", lessonId: "lesson-fractions" } as AppRoute },
  { label: "批改随堂练习", detail: "32 份待查看", icon: CheckSquare2, route: { role: "teacher", page: "tasks" } as AppRoute },
  { label: "回复家长消息", detail: "2 条新消息", icon: MessageCircle, route: { role: "teacher", page: "messages" } as AppRoute },
  { label: "准备明天课堂", detail: "建议已经生成", icon: BookOpen, route: { role: "teacher", page: "planning" } as AppRoute },
]

export default function WorkspaceActivityRail({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const prototype = usePrototypeOptional()
  if (prototype && (prototype.lessons.length === 0 || prototype.students.length === 0)) {
    return (
      <aside aria-label="空数据引导" className="workspace-activity-rail h-full">
        <section className="workspace-side-surface workspace-side-surface-centered workspace-apple-glass-surface flex-1 justify-center">
          <h2 className="text-sm font-black">开始使用知野</h2>
          <p className="mt-3 text-sm leading-6 text-[#65766b]">
            {prototype.lessons.length === 0
              ? "录下一节课堂，系统才有内容可整理。"
              : "导入学生名单，课堂复习卡才能准确送达。"}
          </p>
        </section>
      </aside>
    )
  }
  const affectedStudentCount = prototype?.signals[0]?.affectedCount ?? 12
  return (
    <aside aria-label="今日行动与班级脉搏" className="workspace-activity-rail h-full">
      <section className="workspace-side-surface workspace-side-surface-centered workspace-apple-glass-surface flex-1">
        <div className="workspace-side-heading-row flex items-center justify-between">
          <h2 className="text-sm font-black">今日队列</h2>
          <span className="text-xs text-[#758279]">4 项</span>
        </div>
        <div className="mt-3 divide-y divide-[#34583d]/10">
          {queue.map(({ label, detail, icon: Icon, route }) => (
            <button className="workspace-queue-item" key={label} onClick={() => onNavigate(route)} type="button">
              <span className="workspace-queue-icon">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-left">
                <strong className="block truncate text-sm">{label}</strong>
                <span className="mt-1 block truncate text-xs text-[#7c8980]">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <button
        aria-label="打开班级脉搏"
        className="workspace-side-surface workspace-side-surface-centered workspace-apple-glass-surface workspace-pulse-surface"
        onClick={() => onNavigate({ role: "teacher", page: "insights" })}
        type="button"
      >
        <div className="workspace-side-heading-row flex items-center justify-between">
          <h2 className="text-sm font-black">班级脉搏</h2>
          <span className="text-xs text-[#758279]">刚刚更新</span>
        </div>
        <div aria-label="单位换算与计算步骤困难分布" className="workspace-pulse-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <span
              className={
                index === 5
                  ? "workspace-pulse-cell workspace-pulse-cell-warm"
                  : index === 6
                    ? "workspace-pulse-cell workspace-pulse-cell-active"
                    : "workspace-pulse-cell"
              }
              key={index}
            />
          ))}
        </div>
        <p className="text-sm leading-6 text-[#65766b]">
          <strong className="text-[#445f49]">{affectedStudentCount} 位学生</strong>
          在“<span>单位换算 × 计算</span>”处停下来。
        </p>
      </button>
    </aside>
  )
}

