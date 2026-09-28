import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  MessageCircleQuestion,
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
  mobilePrimary?: boolean
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
    description: "学习近况与教师沟通",
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
    { label: "工作台", icon: LayoutDashboard, route: { role: "teacher", page: "workspace" }, mobilePrimary: true },
    { label: "备课", icon: NotebookPen, route: { role: "teacher", page: "planning" }, mobilePrimary: true },
    { label: "课堂", icon: BookOpenCheck, route: { role: "teacher", page: "classroom" }, mobilePrimary: true },
    { label: "任务", icon: ListChecks, route: { role: "teacher", page: "tasks" }, mobilePrimary: true },
    { label: "班级洞察", shortLabel: "洞察", icon: BarChart3, route: { role: "teacher", page: "insights" } },
    { label: "学生档案", shortLabel: "学生", icon: Users, route: { role: "teacher", page: "students" } },
    { label: "消息", icon: MessageCircle, route: { role: "teacher", page: "messages" } },
    { label: "设置", icon: Settings, route: { role: "teacher", page: "settings" } },
  ],
  student: [
    { label: "首页", icon: Home, route: { role: "student", page: "home" }, mobilePrimary: true },
    { label: "任务", icon: ListChecks, route: { role: "student", page: "tasks" }, mobilePrimary: true },
    { label: "询问", icon: MessageCircleQuestion, route: { role: "student", page: "ask" }, mobilePrimary: true },
    { label: "错题本", icon: ClipboardCheck, route: { role: "student", page: "mistakes" }, mobilePrimary: true },
    { label: "消息", icon: MessageCircle, route: { role: "student", page: "messages" }, mobilePrimary: true },
  ],
  parent: [
    { label: "学习近况", shortLabel: "近况", icon: GraduationCap, route: { role: "parent", page: "home" }, mobilePrimary: true },
    { label: "联系老师", shortLabel: "消息", icon: MessagesSquare, route: { role: "parent", page: "messages" }, mobilePrimary: true },
  ],
  admin: [
    { label: "管理概览", shortLabel: "概览", icon: School, route: { role: "admin", page: "home" }, mobilePrimary: true },
    { label: "保护性反馈", shortLabel: "反馈", icon: ShieldAlert, route: { role: "admin", page: "safety" }, mobilePrimary: true },
    { label: "审计记录", shortLabel: "审计", icon: FileClock, route: { role: "admin", page: "audit" }, mobilePrimary: true },
    { label: "学校设置", shortLabel: "设置", icon: Settings, route: { role: "admin", page: "settings" }, mobilePrimary: true },
  ],
}

const DETAIL_PARENT_PAGES: Partial<Record<RoleRoute["page"], RoleRoute["page"]>> = {
  "lesson-detail": "classroom",
  "student-detail": "students",
  review: "home",
  "task-inquiry": "ask",
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
