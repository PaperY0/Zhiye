import { ArrowRight, CheckSquare2, MessageCircle } from "lucide-react"
import type { AppRoute } from "../../app/routes"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"

export default function WorkspaceActivityRail({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const prototype = usePrototypeOptional()
  if (!prototype) return null

  const pendingReviews = prototype.tasks.reduce((count, task) => count + task.completions.filter((item) => item.status === "submitted").length, 0)
  const unreadMessages = prototype.conversations.reduce((count, item) => count + item.unreadCount, 0)
  const latestSignal = [...prototype.signals].filter((signal) => signal.affectedCount > 0).sort((left, right) => right.observedAt.localeCompare(left.observedAt))[0]
  const queue = [
    pendingReviews > 0 ? { label: "批改随堂练习", detail: `${pendingReviews} 份待批改`, icon: CheckSquare2, route: { role: "teacher", page: "tasks" } as AppRoute } : null,
    unreadMessages > 0 ? { label: "回复新消息", detail: `${unreadMessages} 条未读`, icon: MessageCircle, route: { role: "teacher", page: "messages" } as AppRoute } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <aside aria-label="待办与班级动态" className="app-split-rail workspace-activity-rail">
      <section className="workspace-side-surface workspace-queue-surface">
        <div className="workspace-side-heading-row flex items-center justify-between gap-3"><h2 className="text-base font-black">待处理</h2><span className="workspace-side-count">{queue.length}</span></div>
        {queue.length > 0 ? <div className="workspace-queue-scroll mt-3 divide-y divide-[#34583d]/10">{queue.map(({ label, detail, icon: Icon, route }) => (
          <button className="workspace-queue-item" key={label} onClick={() => onNavigate(route)} type="button"><span className="workspace-queue-icon"><Icon aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 text-left"><strong className="block text-sm">{label}</strong><span className="mt-1 block text-xs text-[#758279]">{detail}</span></span><ArrowRight aria-hidden="true" className="h-4 w-4 text-[#87938b]" /></button>
        ))}</div> : <p className="mt-4 text-sm leading-6 text-[#718078]">今天没有需要立即处理的任务。</p>}
      </section>
      {latestSignal ? <button aria-label="查看班级动态" className="workspace-side-surface workspace-pulse-surface text-left" onClick={() => onNavigate({ role: "teacher", page: "insights" })} type="button">
        <div className="workspace-side-heading-row flex items-center justify-between gap-3"><h2 className="text-base font-black">班级动态</h2><span className="workspace-signal-chip">需关注</span></div>
        <strong className="mt-5 block text-lg text-[#294a32]">{latestSignal.knowledgePoint}</strong>
        <p className="mt-2 text-sm leading-6 text-[#65766b]">{latestSignal.affectedCount} 位学生在“{latestSignal.step}”处需要更多支持。</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#42634a]">查看证据与趋势<ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
      </button> : null}
    </aside>
  )
}
