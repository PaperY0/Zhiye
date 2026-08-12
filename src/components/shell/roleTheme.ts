import type { Role } from "../../app/routes"
import parentBackground from "../../assets/role-backgrounds/parent.png"
import staffBackground from "../../assets/role-backgrounds/staff.png"
import studentBackground from "../../assets/role-backgrounds/student.png"

export interface RoleTheme {
  backgroundImage: string
  showPinyin: boolean
  className: string
}

export const ROLE_THEME: Record<Role, RoleTheme> = {
  teacher: {
    backgroundImage: staffBackground,
    showPinyin: false,
    className: "role-shell-theme-staff",
  },
  student: {
    backgroundImage: studentBackground,
    showPinyin: true,
    className: "role-shell-theme-student",
  },
  parent: {
    backgroundImage: parentBackground,
    showPinyin: true,
    className: "role-shell-theme-parent",
  },
  admin: {
    backgroundImage: staffBackground,
    showPinyin: false,
    className: "role-shell-theme-admin",
  },
}
