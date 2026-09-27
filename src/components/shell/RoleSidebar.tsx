import type { AppRoute } from "../../app/routes"
import { PinyinText } from "../pinyin/PinyinText"
import {
  isNavigationItemCurrent,
  ROLE_MARK_ICONS,
  ROLE_METADATA,
  ROLE_NAVIGATION,
  type RoleRoute,
} from "./navigation"
import { ROLE_THEME } from "./roleTheme"
import { RoleSwitcher } from "./RoleSwitcher"
import { RoleSearch } from "./RoleSearch"
import { useTeacherSettings } from "../../features/teacher/settings/teacherSettings"
import { useOptionalPrototype } from "../../app/prototype/PrototypeContext"
import { unreadForRole } from "../../app/prototype/conversationOrder"

interface RoleSidebarProps {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
  showPinyin?: boolean
  onTogglePinyin?: () => void
}

export function RoleSidebar({ route, onNavigate, showPinyin: showPinyinOverride, onTogglePinyin }: RoleSidebarProps) {
  const metadata = ROLE_METADATA[route.role]
  const MarkIcon = ROLE_MARK_ICONS[route.role]
  const showPinyin = showPinyinOverride ?? ROLE_THEME[route.role].showPinyin
  const items = ROLE_NAVIGATION[route.role]
  const primaryItems = items.filter((item) => item.mobilePrimary)
  const secondaryItems = items.filter((item) => !item.mobilePrimary)
  const teacherSettings = useTeacherSettings()
  const conversations = useOptionalPrototype()?.conversations ?? []
  const unreadMessages = route.role === "teacher" || route.role === "student" || route.role === "parent"
    ? conversations.reduce((total, conversation) => total + unreadForRole(conversation, route.role as "teacher" | "student" | "parent"), 0)
    : 0

  function renderItems(groupItems: typeof items) {
    return groupItems.map((item) => {
      const Icon = item.icon
      const isCurrent = isNavigationItemCurrent(item, route)
      return (
        <button
          key={`${item.route.role}-${item.route.page}`}
          type="button"
          aria-label={item.label}
          aria-current={isCurrent ? "page" : undefined}
          className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d] focus-visible:ring-offset-2 ${
            isCurrent
              ? "bg-[#e4f1e3] text-[#46684e] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              : "text-[#718276] hover:bg-white/70 hover:text-[#52745a]"
          }`}
          onClick={() => onNavigate(item.route)}
        >
          <Icon aria-hidden="true" size={19} strokeWidth={2} />
          <PinyinText text={item.label} showPinyin={showPinyin} />
          {(item.route.page === "messages" && unreadMessages > 0) ? (
            <span aria-label={`${unreadMessages}条未读消息`} className="ml-auto grid min-w-6 place-items-center rounded-full bg-[#426e4b] px-1.5 py-0.5 text-[11px] font-black text-white">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          ) : null}
        </button>
      )
    })
  }

  return (
    <aside className="role-sidebar hidden h-[calc(100dvh-24px)] w-[216px] shrink-0 self-start overflow-y-auto rounded-[20px] border border-[#dce6db] bg-[#f9fbf8] px-3 py-4 lg:sticky lg:top-3 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-[16px] bg-[#dfeee1] text-[#52745a] shadow-[0_10px_24px_rgba(72,110,79,0.12)]">
          <MarkIcon aria-hidden="true" size={21} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-[#142319]">知野</p>
          <p className="truncate text-[10px] font-bold tracking-[0.12em] text-[#7a8b7e]">
            <PinyinText text={`${metadata.label}端`} showPinyin={showPinyin} />
          </p>
        </div>
      </div>

      <p className="mb-2 mt-8 px-3 text-[11px] font-black tracking-[0.16em] text-[#93a096]">
        <PinyinText text={metadata.productLabel} showPinyin={showPinyin} />
      </p>
      <div className="mb-3">
        <RoleSearch role={route.role} onNavigate={onNavigate} />
      </div>
      <nav aria-label={`${metadata.label}端主导航`} className="shrink-0 space-y-1.5">
        <p className="px-3 pb-1 text-[10px] font-black tracking-[0.16em] text-[#9aa69d]">主要工作</p>
        {renderItems(primaryItems)}
        {secondaryItems.length > 0 ? (
          <>
            <p className="px-3 pb-1 pt-3 text-[10px] font-black tracking-[0.16em] text-[#9aa69d]">管理与记录</p>
            {renderItems(secondaryItems)}
          </>
        ) : null}
      </nav>

      <RoleSwitcher className="mt-4 w-full justify-center" role={route.role} onNavigate={onNavigate} />
      {route.role === "student" ? (
        <button aria-label={showPinyin ? "关闭拼音辅助" : "开启拼音辅助"} aria-pressed={showPinyin} className="mt-3 min-h-11 rounded-2xl border border-[#c7dac9] bg-white/75 px-3 text-sm font-black text-[#3e6347]" onClick={onTogglePinyin} type="button">拼音辅助 · {showPinyin ? "已开启" : "已关闭"}</button>
      ) : null}

      <div className={`${route.role === "student" ? "hidden" : ""} mt-auto rounded-[20px] border border-white/75 bg-white/55 p-3 text-xs leading-5 text-[#748078] shadow-[0_10px_30px_rgba(50,76,57,0.06)]`}>
        <p className="font-black text-[#35543e]">
          {route.role === "teacher" ? teacherSettings.teacherName : "本地交互原型"}
        </p>
        <p>
          {route.role === "teacher"
            ? `${teacherSettings.teacherTitle} · ${teacherSettings.currentClass}`
            : metadata.description}
        </p>
      </div>
    </aside>
  )
}
