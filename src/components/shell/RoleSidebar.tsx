import type { AppRoute } from "../../app/routes"
import {
  isNavigationItemCurrent,
  ROLE_MARK_ICONS,
  ROLE_METADATA,
  ROLE_NAVIGATION,
  type RoleRoute,
} from "./navigation"

interface RoleSidebarProps {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
}

export function RoleSidebar({ route, onNavigate }: RoleSidebarProps) {
  const metadata = ROLE_METADATA[route.role]
  const MarkIcon = ROLE_MARK_ICONS[route.role]

  return (
    <aside className="hidden min-h-dvh w-[232px] shrink-0 border-r border-white/70 bg-white/55 px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-[16px] bg-[#14271a] text-white shadow-[0_10px_24px_rgba(20,39,26,0.18)]">
          <MarkIcon aria-hidden="true" size={21} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-[#142319]">知野</p>
          <p className="truncate text-[10px] font-bold tracking-[0.12em] text-[#7a8b7e]">
            {metadata.label}端
          </p>
        </div>
      </div>

      <p className="mb-2 mt-8 px-3 text-[11px] font-black tracking-[0.16em] text-[#93a096]">
        {metadata.productLabel}
      </p>
      <nav aria-label={`${metadata.label}端主导航`} className="space-y-1.5">
        {ROLE_NAVIGATION[route.role].map((item) => {
          const Icon = item.icon
          const isCurrent = isNavigationItemCurrent(item, route)
          return (
            <button
              key={`${item.route.role}-${item.route.page}`}
              type="button"
              aria-current={isCurrent ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d] focus-visible:ring-offset-2 ${
                isCurrent
                  ? "bg-[#dce9d7] text-[#284d32] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  : "text-[#617066] hover:bg-white/70 hover:text-[#274631]"
              }`}
              onClick={() => onNavigate(item.route)}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-[20px] border border-white/75 bg-white/55 p-3 text-xs leading-5 text-[#748078] shadow-[0_10px_30px_rgba(50,76,57,0.06)]">
        <p className="font-black text-[#35543e]">本地交互原型</p>
        <p>{metadata.description}</p>
      </div>
    </aside>
  )
}
