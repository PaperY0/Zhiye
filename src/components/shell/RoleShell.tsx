import { useState, type CSSProperties, type PropsWithChildren } from "react"
import type { AppRoute } from "../../app/routes"
import { type RoleRoute } from "./navigation"
import { RoleMobileNav } from "./RoleMobileNav"
import { RoleSidebar } from "./RoleSidebar"
import { ROLE_THEME } from "./roleTheme"
import { StudentCompanionAssistant } from "../../features/student/companion/StudentCompanionAssistant"
import { RoleSearch } from "./RoleSearch"
import { AiDemoNotice } from "./AiDemoNotice"

interface RoleShellProps extends PropsWithChildren {
  route: RoleRoute
  onNavigate: (route: AppRoute) => void
}

export function RoleShell({ route, onNavigate, children }: RoleShellProps) {
  const theme = ROLE_THEME[route.role]
  const showPublicDemoNotice = import.meta.env.PROD && !["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname)
  const [studentPinyin, setStudentPinyin] = useState(() => {
    try { return window.localStorage.getItem("zhiye-student-pinyin") !== "off" }
    catch { return true }
  })
  const showPinyin = route.role === "student" ? studentPinyin : theme.showPinyin

  function toggleStudentPinyin() {
    setStudentPinyin((current) => {
      try { window.localStorage.setItem("zhiye-student-pinyin", current ? "off" : "on") }
      catch { /* The preference still works for this session. */ }
      return !current
    })
  }

  return (
    <div
      data-testid="role-shell"
      data-role={route.role}
      data-show-pinyin={showPinyin}
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
        <RoleSidebar route={route} onNavigate={onNavigate} showPinyin={showPinyin} onTogglePinyin={toggleStudentPinyin} />

        <div className="role-shell-main h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-24 lg:pb-0">
          {showPublicDemoNotice ? <AiDemoNotice /> : null}
          <main id="main-content" tabIndex={-1} className="min-h-full min-w-0 focus:outline-none lg:h-full">
            {children}
          </main>
        </div>
      </div>

      <RoleMobileNav route={route} onNavigate={onNavigate} showPinyin={showPinyin} />
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2 lg:hidden">
        {route.role === "student" ? (
          <button aria-label={showPinyin ? "关闭拼音辅助" : "开启拼音辅助"} aria-pressed={showPinyin} className="min-h-11 rounded-full border border-[#c7dac9] bg-white/90 px-3 text-xs font-black text-[#3e6347] shadow-sm" onClick={toggleStudentPinyin} type="button">拼音 {showPinyin ? "开" : "关"}</button>
        ) : null}
        <RoleSearch iconOnly role={route.role} onNavigate={onNavigate} />
      </div>
      {route.role === "student" ? <StudentCompanionAssistant currentPage={route.page} onNavigate={onNavigate} /> : null}
    </div>
  )
}
