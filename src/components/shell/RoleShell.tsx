import type { CSSProperties, PropsWithChildren } from "react"
import { ArrowLeft } from "lucide-react"
import type { AppRoute } from "../../app/routes"
import { getRouteTitle, ROLE_HOME_ROUTES, ROLE_METADATA, type RoleRoute } from "./navigation"
import { RoleMobileNav } from "./RoleMobileNav"
import { RoleSidebar } from "./RoleSidebar"
import { RoleSwitcher } from "./RoleSwitcher"
import { ROLE_THEME } from "./roleTheme"

interface RoleShellProps extends PropsWithChildren {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
}

function fallbackRoute(route: RoleRoute): RoleRoute {
  if (route.role === "teacher" && route.page === "lesson-detail") {
    return { role: "teacher", page: "classroom" }
  }
  if (route.role === "teacher" && route.page === "student-detail") {
    return { role: "teacher", page: "students" }
  }
  if (route.role === "student" && route.page === "review") {
    return { role: "student", page: "home" }
  }
  return ROLE_HOME_ROUTES[route.role]
}

function returnToPreviousPage(route: RoleRoute, onNavigate: (route: AppRoute) => void) {
  if (typeof window === "undefined" || window.history.length <= 1) {
    onNavigate(fallbackRoute(route))
    return
  }

  const currentHash = window.location.hash
  let returned = false
  const handleHashChange = () => {
    returned = true
    window.removeEventListener("hashchange", handleHashChange)
  }

  window.addEventListener("hashchange", handleHashChange)
  window.history.back()
  window.setTimeout(() => {
    window.removeEventListener("hashchange", handleHashChange)
    if (!returned && window.location.hash === currentHash) {
      onNavigate(fallbackRoute(route))
    }
  }, 200)
}

export function RoleShell({ route, onNavigate, children }: RoleShellProps) {
  const metadata = ROLE_METADATA[route.role]
  const theme = ROLE_THEME[route.role]
  const title = getRouteTitle(route)

  return (
    <div
      data-testid="role-shell"
      data-role={route.role}
      data-show-pinyin={theme.showPinyin}
      className={`role-shell role-shell-${route.role} ${theme.className} relative isolate min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(212,229,235,0.76),transparent_34%),linear-gradient(135deg,#f3f6f0_0%,#eef5f1_50%,#f7f4e9_100%)] text-[#142319]`}
      style={{ "--role-background-image": `url(${theme.backgroundImage})` } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(243,246,240,0.82) 0%, rgba(238,245,241,0.56) 50%, rgba(247,244,233,0.68) 100%), var(--role-background-image)",
        }}
      />
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-[#14271a] px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        跳到主要内容
      </a>

      <div className="relative z-10 flex min-h-dvh">
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
              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label="返回上一页"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e1d4] bg-white/65 px-3 py-2 text-sm font-bold text-[#48624d] shadow-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d]"
                  onClick={() => returnToPreviousPage(route, onNavigate)}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" size={16} />
                  <span className="hidden sm:inline">返回上一页</span>
                </button>
                <RoleSwitcher role={route.role} onNavigate={onNavigate} />
              </div>
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
