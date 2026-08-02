import type { AppRoute, Role } from "../../app/routes"
import { ROLE_HOME_ROUTES, ROLE_METADATA } from "./navigation"

interface RoleSwitcherProps {
  role: Role
  onNavigate: (route: AppRoute) => void
  className?: string
}

const ROLE_OPTIONS = ["teacher", "student", "parent", "admin"] as const

export function RoleSwitcher({ role, onNavigate, className = "" }: RoleSwitcherProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-2 text-sm font-bold text-[#34543c] shadow-[0_8px_24px_rgba(45,72,52,0.08)] backdrop-blur-xl ${className}`}
    >
      <span className="sr-only">切换体验角色</span>
      <select
        aria-label="切换体验角色"
        className="min-w-0 cursor-pointer appearance-none bg-transparent pr-4 text-sm font-bold text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[#54775d] focus-visible:ring-offset-2"
        value={role}
        onChange={(event) => {
          const nextRole = event.target.value as Role
          onNavigate(ROLE_HOME_ROUTES[nextRole])
        }}
      >
        {ROLE_OPTIONS.map((optionRole) => (
          <option key={optionRole} value={optionRole}>
            {ROLE_METADATA[optionRole].label}端
          </option>
        ))}
      </select>
    </label>
  )
}
