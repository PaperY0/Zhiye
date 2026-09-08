import { BarChart3, Home, MessageCircle, Mic, Users } from "lucide-react"
import type { AppRoute } from "../../app/routes"

const items: Array<{ label: string; icon: typeof Home; active?: boolean; route: AppRoute }> = [
  { label: "工作台", icon: Home, active: true, route: { role: "teacher", page: "workspace" } },
  { label: "课堂", icon: Mic, route: { role: "teacher", page: "classroom" } },
  { label: "洞察", icon: BarChart3, route: { role: "teacher", page: "insights" } },
  { label: "学生", icon: Users, route: { role: "teacher", page: "students" } },
  { label: "消息", icon: MessageCircle, route: { role: "teacher", page: "messages" } },
]

export default function WorkspaceMobileNav({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <nav aria-label="移动端教师导航" className="workspace-mobile-nav">
      {items.map(({ label, icon: Icon, active, route }) => (
        <button
          aria-current={active ? "page" : undefined}
          aria-label={label}
          className={active ? "workspace-mobile-nav-item workspace-mobile-nav-item-active" : "workspace-mobile-nav-item"}
          key={label}
          onClick={() => onNavigate(route)}
          type="button"
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
