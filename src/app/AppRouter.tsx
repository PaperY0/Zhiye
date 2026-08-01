import WelcomeRoute from "../features/welcome/WelcomeRoute"
import TeacherRoutes from "../features/teacher/TeacherRoutes"
import StudentRoutes from "../features/student/StudentRoutes"
import ParentRoutes from "../features/parent/ParentRoutes"
import AdminRoutes from "../features/admin/AdminRoutes"
import { RoleShell } from "../components/shell/RoleShell"
import { navigate } from "./routes"
import { useHashRoute } from "./useHashRoute"

export default function AppRouter() {
  const route = useHashRoute()
  if (route.page === "welcome") return <WelcomeRoute />

  return (
    <RoleShell route={route} onNavigate={navigate}>
      {route.role === "teacher" ? (
        <TeacherRoutes route={route} onNavigate={navigate} />
      ) : route.role === "student" ? (
        <StudentRoutes route={route} onNavigate={navigate} />
      ) : route.role === "parent" ? (
        <ParentRoutes route={route} onNavigate={navigate} />
      ) : (
        <AdminRoutes route={route} onNavigate={navigate} />
      )}
    </RoleShell>
  )
}
