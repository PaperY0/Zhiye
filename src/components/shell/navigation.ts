import {
  BarChart3,
  BookOpenCheck,
  Camera,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  Home,
  History,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  MessageCircle,
  MessagesSquare,
  NotebookPen,
  School,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { AppRoute, Role } from "../../app/routes"

export type RoleRoute = Exclude<AppRoute, { page: "welcome" }>

export interface RoleNavigationItem {
  label: string
  shortLabel?: string
  icon: LucideIcon
  route: RoleRoute
}

export interface RoleMetadata {
  label: string
  productLabel: string
  description: string
}

export const ROLE_METADATA: Record<Role, RoleMetadata> = {
  teacher: {
    label: "教师",
    productLabel: "知野教学工作台",
    description: "课堂、班级与教学任务",
  },
  student: {
    label: "学生",
    productLabel: "知野学习空间",
    description: "复习、答疑与学习任务",
  },
  parent: {
    label: "家长",
    productLabel: "知野家校空间",
    description: "学习摘要与教师沟通",
  },
  admin: {
    label: "管理",
    productLabel: "知野管理中心",
    description: "学校、安全与审计管理",
  },
}

export const ROLE_HOME_ROUTES: Record<Role, RoleRoute> = {
  teacher: { role: "teacher", page: "workspace" },
  student: { role: "student", page: "home" },
  parent: { role: "parent", page: "home" },
  admin: { role: "admin", page: "home" },
}

export const ROLE_NAVIGATION: Record<Role, readonly RoleNavigationItem[]> = {
  teacher: [
    { label: "工作台", icon: LayoutDashboard, route: { role: "teacher", page: "workspace" } },
    { label: "课堂", icon: BookOpenCheck, route: { role: "teacher", page: "classroom" } },
    { label: "班级洞察", shortLabel: "洞察", icon: BarChart3, route: { role: "teacher", page: "insights" } },
    { label: "备课与测验", shortLabel: "备课", icon: NotebookPen, route: { role: "teacher", page: "planning" } },
    { label: "学生档案", shortLabel: "学生", icon: Users, route: { role: "teacher", page: "students" } },
    { label: "任务", icon: ListChecks, route: { role: "teacher", page: "tasks" } },
    { label: "消息", icon: MessageCircle, route: { role: "teacher", page: "messages" } },
    { label: "设置", icon: Settings, route: { role: "teacher", page: "settings" } },
    { label: "历史记录", icon: History, route: { role: "teacher", page: "history" } },
  ],
  student: [
    { label: "首页", icon: Home, route: { role: "student", page: "home" } },
    { label: "拍照答疑", shortLabel: "答疑", icon: Camera, route: { role: "student", page: "tutoring" } },
    { label: "知识点学习", shortLabel: "学习", icon: Lightbulb, route: { role: "student", page: "learning" } },
    { label: "错题本", icon: ClipboardCheck, route: { role: "student", page: "mistakes" } },
    { label: "任务", icon: ListChecks, route: { role: "student", page: "tasks" } },
    { label: "消息", icon: MessageCircle, route: { role: "student", page: "messages" } },
    { label: "历史记录", icon: History, route: { role: "student", page: "history" } },
  ],
  parent: [
    { label: "学习摘要", shortLabel: "摘要", icon: GraduationCap, route: { role: "parent", page: "home" } },
    { label: "联系老师", shortLabel: "消息", icon: MessagesSquare, route: { role: "parent", page: "messages" } },
    { label: "历史记录", icon: History, route: { role: "parent", page: "history" } },
  ],
  admin: [
    { label: "管理概览", shortLabel: "概览", icon: School, route: { role: "admin", page: "home" } },
    { label: "保护性反馈", shortLabel: "反馈", icon: ShieldAlert, route: { role: "admin", page: "safety" } },
    { label: "审计记录", shortLabel: "审计", icon: FileClock, route: { role: "admin", page: "audit" } },
    { label: "学校设置", shortLabel: "设置", icon: Settings, route: { role: "admin", page: "settings" } },
    { label: "历史记录", icon: History, route: { role: "admin", page: "history" } },
  ],
}

const DETAIL_PARENT_PAGES: Partial<Record<RoleRoute["page"], RoleRoute["page"]>> = {
  "lesson-detail": "classroom",
  "student-detail": "students",
  review: "home",
}

export function isNavigationItemCurrent(
  item: RoleNavigationItem,
  currentRoute: RoleRoute,
) {
  if (item.route.role !== currentRoute.role) return false
  const currentPage = DETAIL_PARENT_PAGES[currentRoute.page] ?? currentRoute.page
  return item.route.page === currentPage
}

export function getRouteTitle(route: RoleRoute) {
  const currentItem = ROLE_NAVIGATION[route.role].find((item) =>
    isNavigationItemCurrent(item, route),
  )
  return currentItem?.label ?? ROLE_METADATA[route.role].productLabel
}

export const ROLE_MARK_ICONS: Record<Role, LucideIcon> = {
  teacher: Sparkles,
  student: UserRound,
  parent: Home,
  admin: ShieldAlert,
}
