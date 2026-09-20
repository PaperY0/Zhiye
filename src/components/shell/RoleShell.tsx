import type { CSSProperties, PropsWithChildren } from "react"
import type { AppRoute } from "../../app/routes"
import { type RoleRoute } from "./navigation"
import { RoleMobileNav } from "./RoleMobileNav"
import { RoleSidebar } from "./RoleSidebar"
import { ROLE_THEME } from "./roleTheme"
import { StudentCompanionAssistant } from "../../features/student/companion/StudentCompanionAssistant"
import { RoleSearch } from "./RoleSearch"

interface RoleShellProps extends PropsWithChildren {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
}

export function RoleShell({ route, onNavigate, children }: RoleShellProps) {
  const theme = ROLE_THEME[route.role]

  return (
    <div
      data-testid="role-shell"
      data-role={route.role}
      data-show-pinyin={theme.showPinyin}
      className={`role-shell role-shell-${route.role} ${theme.className} relative isolate h-dvh overflow-hidden bg-cover bg-center bg-fixed bg-no-repeat text-[#142319]`}
      style={{
        "--role-background-image": `url(${theme.backgroundImage})`,
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.58) 0%, rgba(249,253,250,0.42) 50%, rgba(255,253,244,0.52) 100%), var(--role-background-image)",
      } as CSSProperties}
    >
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-[#14271a] px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        跳到主要内容
      </a>

      <div className="relative z-10 flex h-full min-h-0">
        <RoleSidebar route={route} onNavigate={onNavigate} />

        <div className="role-shell-main h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-24 lg:pb-0">
          <main id="main-content" tabIndex={-1} className="min-h-full min-w-0 focus:outline-none lg:h-full">
            {children}
          </main>
        </div>
      </div>

      <RoleMobileNav route={route} onNavigate={onNavigate} />
      <div className="fixed right-4 top-4 z-30 lg:hidden">
        <RoleSearch iconOnly role={route.role} onNavigate={onNavigate} />
      </div>
      {route.role === "student" ? <StudentCompanionAssistant currentPage={route.page} onNavigate={onNavigate} /> : null}
    </div>
  )
}
