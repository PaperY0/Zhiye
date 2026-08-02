import type { PropsWithChildren } from "react"
import type { AppRoute } from "../../app/routes"
import { getRouteTitle, ROLE_METADATA, type RoleRoute } from "./navigation"
import { RoleMobileNav } from "./RoleMobileNav"
import { RoleSidebar } from "./RoleSidebar"
import { RoleSwitcher } from "./RoleSwitcher"

interface RoleShellProps extends PropsWithChildren {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
}

export function RoleShell({ route, onNavigate, children }: RoleShellProps) {
  const metadata = ROLE_METADATA[route.role]
  const title = getRouteTitle(route)

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_right,rgba(212,229,235,0.76),transparent_34%),linear-gradient(135deg,#f3f6f0_0%,#eef5f1_50%,#f7f4e9_100%)] text-[#142319]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-[#14271a] px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        跳到主要内容
      </a>

      <div className="flex min-h-dvh">
        <RoleSidebar route={route} onNavigate={onNavigate} />

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/50 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black tracking-[0.14em] text-[#6e8173]">
                  {metadata.productLabel}
                </p>
                <h1 className="truncate text-lg font-black tracking-tight text-[#17271c] sm:text-xl">
                  {title}
                </h1>
              </div>
              <RoleSwitcher role={route.role} onNavigate={onNavigate} />
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
            {children}
          </main>
        </div>
      </div>

      <RoleMobileNav route={route} onNavigate={onNavigate} />
    </div>
  )
}
