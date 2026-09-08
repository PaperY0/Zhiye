import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckSquare2,
  Home,
  MessageCircle,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { AppRoute } from "../../app/routes"

type WorkspaceSidebarProps = {
  collapsed: boolean
  onBackToWelcome: () => void
  onToggleCollapsed: () => void
  onNavigate: (route: AppRoute) => void
}

type NavItem = {
  label: string
  icon: LucideIcon
  badge?: string
  active?: boolean
  route: AppRoute
}

const teachingItems: NavItem[] = [
  { label: "工作台", icon: Home, badge: "4", active: true, route: { role: "teacher", page: "workspace" } },
  { label: "课堂", icon: Mic, badge: "1", route: { role: "teacher", page: "classroom" } },
  { label: "班级洞察", icon: BarChart3, route: { role: "teacher", page: "insights" } },
  { label: "备课与测验", icon: BookOpen, route: { role: "teacher", page: "planning" } },
]

const classItems: NavItem[] = [
  { label: "学生档案", icon: Users, route: { role: "teacher", page: "students" } },
  { label: "任务", icon: CheckSquare2, badge: "3", route: { role: "teacher", page: "tasks" } },
  { label: "消息", icon: MessageCircle, badge: "2", route: { role: "teacher", page: "messages" } },
]

function SidebarItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate: (route: AppRoute) => void
}) {
  const Icon = item.icon
  return (
    <button
      aria-current={item.active ? "page" : undefined}
      aria-label={item.label}
      className={`workspace-nav-item ${item.active ? "workspace-nav-item-active" : ""}`}
      onClick={() => onNavigate(item.route)}
      type="button"
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
      <span className={collapsed ? "sr-only" : "workspace-nav-label"}>{item.label}</span>
      {item.badge ? (
        <span
          aria-label={`${item.badge} 项待处理`}
          className={collapsed ? "workspace-nav-dot" : "workspace-nav-badge"}
        >
          {collapsed ? "" : item.badge}
        </span>
      ) : null}
    </button>
  )
}

export default function WorkspaceSidebar({
  collapsed,
  onBackToWelcome,
  onToggleCollapsed,
  onNavigate,
}: WorkspaceSidebarProps) {
  return (
    <aside className={`workspace-sidebar ${collapsed ? "workspace-sidebar-collapsed" : ""}`}>
      <button
        aria-label="返回知野首页"
        className="workspace-brand-action"
        onClick={onBackToWelcome}
        type="button"
      >
        <span className="workspace-brand-mark">知</span>
        <span className={collapsed ? "sr-only" : "min-w-0 text-left"}>
          <strong className="block text-lg font-black tracking-[-0.08em]">知野</strong>
          <span className="block truncate text-[9px] tracking-[0.12em] text-[#7d8a80]">
            ZHIYE CLASSROOM
          </span>
        </span>
        <ArrowLeft
          aria-hidden="true"
          className={collapsed ? "sr-only" : "ml-auto h-4 w-4 shrink-0 text-[#718076]"}
        />
      </button>

      <nav aria-label="教师功能导航" className="mt-3 flex min-h-0 flex-1 flex-col">
        <p className={collapsed ? "sr-only" : "workspace-nav-group-label"}>教学工作</p>
        {teachingItems.map((item) => (
          <SidebarItem collapsed={collapsed} item={item} key={item.label} onNavigate={onNavigate} />
        ))}
        <p className={collapsed ? "sr-only" : "workspace-nav-group-label mt-4"}>班级管理</p>
        {classItems.map((item) => (
          <SidebarItem collapsed={collapsed} item={item} key={item.label} onNavigate={onNavigate} />
        ))}

        <div className="mt-auto border-t border-[#34583d]/10 pt-3">
          <SidebarItem
            collapsed={collapsed}
            item={{ label: "设置", icon: Settings, route: { role: "teacher", page: "settings" } }}
            onNavigate={onNavigate}
          />
          <div className="workspace-teacher-profile">
            <span className="workspace-teacher-avatar">李</span>
            <span className={collapsed ? "sr-only" : "min-w-0"}>
              <strong className="block truncate text-sm">李老师</strong>
              <span className="block truncate text-[11px] text-[#7f8b83]">五年级数学</span>
            </span>
          </div>
        </div>
      </nav>

      <button
        aria-expanded={!collapsed}
        aria-label={collapsed ? "展开功能导航" : "折叠功能导航"}
        className="workspace-sidebar-toggle"
        onClick={onToggleCollapsed}
        type="button"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
    </aside>
  )
}
