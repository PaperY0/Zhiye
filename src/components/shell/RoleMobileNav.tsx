import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import type { AppRoute } from "../../app/routes"
import { PinyinText } from "../pinyin/PinyinText"
import { Dialog } from "../shared/Dialog"
import {
  isNavigationItemCurrent,
  ROLE_METADATA,
  ROLE_NAVIGATION,
  type RoleRoute,
} from "./navigation"
import { ROLE_THEME } from "./roleTheme"
import { useOptionalPrototype } from "../../app/prototype/PrototypeContext"
import { unreadForRole } from "../../app/prototype/conversationOrder"

interface RoleMobileNavProps {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
  showPinyin?: boolean
}

export function RoleMobileNav({ route, onNavigate, showPinyin: showPinyinOverride }: RoleMobileNavProps) {
  const metadata = ROLE_METADATA[route.role]
  const showPinyin = showPinyinOverride ?? ROLE_THEME[route.role].showPinyin
  const [moreOpen, setMoreOpen] = useState(false)
  const conversations = useOptionalPrototype()?.conversations ?? []
  const unreadMessages = route.role === "teacher" || route.role === "student" || route.role === "parent"
    ? conversations.reduce((total, conversation) => total + unreadForRole(conversation, route.role as "teacher" | "student" | "parent"), 0)
    : 0
  const items = ROLE_NAVIGATION[route.role]
  const primaryItems = items.filter((item) => item.mobilePrimary)
  const secondaryItems = items.filter((item) => !item.mobilePrimary)
  const secondaryIsCurrent = secondaryItems.some((item) =>
    isNavigationItemCurrent(item, route),
  )

  function navigateTo(nextRoute: AppRoute) {
    setMoreOpen(false)
    onNavigate(nextRoute)
  }

  return (
    <nav
      aria-label={`${metadata.label}端移动导航`}
      className="fixed inset-x-3 bottom-3 z-40 grid max-w-[calc(100vw-1.5rem)] grid-flow-col auto-cols-fr gap-1 rounded-[24px] border border-white/80 bg-white/88 p-2 shadow-[0_18px_48px_rgba(36,62,43,0.18)] backdrop-blur-2xl lg:hidden"
    >
      {primaryItems.map((item) => {
        const Icon = item.icon
        const isCurrent = isNavigationItemCurrent(item, route)
        return (
          <button
            key={`${item.route.role}-${item.route.page}`}
            type="button"
            aria-label={item.label}
            aria-current={isCurrent ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] px-1 py-2 text-[11px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d] ${
              isCurrent
                ? "bg-[#e4f1e3] text-[#46684e]"
                : "text-[#829188] hover:bg-white/70 hover:text-[#52745a]"
            }`}
            onClick={() => navigateTo(item.route)}
          >
            <span className="relative">
              <Icon aria-hidden="true" size={18} strokeWidth={2.1} />
              {item.route.page === "messages" && unreadMessages > 0 ? (
                <span aria-label={`${unreadMessages}条未读消息`} className="absolute -right-2 -top-2 size-4 rounded-full bg-[#426e4b] text-[10px] leading-4 text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
              ) : null}
            </span>
            <PinyinText
              className="whitespace-nowrap"
              text={item.shortLabel ?? item.label}
              showPinyin={showPinyin}
            />
          </button>
        )
      })}
      {secondaryItems.length > 0 ? (
        <button
          aria-current={secondaryIsCurrent ? "page" : undefined}
          aria-haspopup="dialog"
          aria-label="更多功能"
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] px-1 py-2 text-[11px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d] ${
            secondaryIsCurrent
              ? "bg-[#e4f1e3] text-[#46684e]"
              : "text-[#829188] hover:bg-white/70 hover:text-[#52745a]"
          }`}
          onClick={() => setMoreOpen(true)}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={18} strokeWidth={2.1} />
          <PinyinText text="更多" showPinyin={showPinyin} />
        </button>
      ) : null}
      <Dialog
        description={`${metadata.description}中的低频入口集中在这里。`}
        onClose={() => setMoreOpen(false)}
        open={moreOpen}
        title="更多功能"
      >
        <div className="grid gap-2">
          {secondaryItems.map((item) => {
            const Icon = item.icon
            const isCurrent = isNavigationItemCurrent(item, route)
            return (
              <button
                aria-current={isCurrent ? "page" : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-[16px] px-4 text-left text-sm font-black ${
                  isCurrent
                    ? "bg-[#e4f1e3] text-[#46684e]"
                    : "bg-white/70 text-[#526158] hover:bg-white"
                }`}
                key={`${item.route.role}-${item.route.page}`}
                onClick={() => navigateTo(item.route)}
                type="button"
              >
                <Icon aria-hidden="true" size={19} strokeWidth={2} />
                <PinyinText text={item.label} showPinyin={showPinyin} />
                {item.route.page === "messages" && unreadMessages > 0 ? (
                  <span className="ml-auto rounded-full bg-[#426e4b] px-2 py-0.5 text-xs font-black text-white">{unreadMessages} 条新消息</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </Dialog>
    </nav>
  )
}
