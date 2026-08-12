import type { AppRoute } from "../../app/routes"
import { PinyinText } from "../pinyin/PinyinText"
import {
  isNavigationItemCurrent,
  ROLE_METADATA,
  ROLE_NAVIGATION,
  type RoleRoute,
} from "./navigation"
import { ROLE_THEME } from "./roleTheme"

interface RoleMobileNavProps {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
}

export function RoleMobileNav({ route, onNavigate }: RoleMobileNavProps) {
  const metadata = ROLE_METADATA[route.role]
  const showPinyin = ROLE_THEME[route.role].showPinyin

  return (
    <nav
      aria-label={`${metadata.label}端移动导航`}
      className="fixed inset-x-3 bottom-3 z-40 flex max-w-[calc(100vw-1.5rem)] gap-1 overflow-x-auto rounded-[24px] border border-white/80 bg-white/80 p-2 shadow-[0_18px_48px_rgba(36,62,43,0.18)] backdrop-blur-2xl lg:hidden"
    >
      {ROLE_NAVIGATION[route.role].map((item) => {
        const Icon = item.icon
        const isCurrent = isNavigationItemCurrent(item, route)
        return (
          <button
            key={`${item.route.role}-${item.route.page}`}
            type="button"
            aria-label={item.label}
            aria-current={isCurrent ? "page" : undefined}
            className={`flex min-w-[66px] flex-1 flex-col items-center justify-center gap-1 rounded-[17px] px-2 py-2 text-[11px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d] ${
              isCurrent
                ? "bg-[#dce9d7] text-[#294d33]"
                : "text-[#748078] hover:bg-white/70 hover:text-[#35543e]"
            }`}
            onClick={() => onNavigate(item.route)}
          >
            <Icon aria-hidden="true" size={18} strokeWidth={2.1} />
            <PinyinText
              className="whitespace-nowrap"
              text={item.shortLabel ?? item.label}
              showPinyin={showPinyin}
            />
          </button>
        )
      })}
    </nav>
  )
}
