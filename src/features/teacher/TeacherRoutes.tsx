import { lazy } from "react"
import type { AppRoute } from "../../app/routes"
const ClassroomPage = lazy(() => import("./classroom/ClassroomPage"))
const LessonDetailPage = lazy(() => import("./classroom/LessonDetailPage"))
const InsightsPage = lazy(() => import("./insights/InsightsPage"))
const PlanningPage = lazy(() => import("./planning/PlanningPage"))
const StudentDetailPage = lazy(() => import("./students/StudentDetailPage"))
const StudentsPage = lazy(() => import("./students/StudentsPage"))
const TasksPage = lazy(() => import("./tasks/TasksPage"))
const MessagesPage = lazy(() => import("./messages/MessagesPage"))
const TeacherSettingsPage = lazy(() => import("./settings/TeacherSettingsPage"))
const HistoryPage = lazy(() => import("../shared/HistoryPage"))
const TeacherWorkspacePage = lazy(() => import("./workspace/TeacherWorkspacePage"))

type TeacherRoute = Extract<AppRoute, { role: "teacher" }>

export default function TeacherRoutes({
  route,
  onNavigate,
}: {
  route: TeacherRoute
  onNavigate: (route: AppRoute) => void
}) {
  switch (route.page) {
    case "classroom":
      return <ClassroomPage onNavigate={onNavigate} />
    case "lesson-detail":
      return <LessonDetailPage lessonId={route.lessonId} />
    case "insights":
      return <InsightsPage />
    case "planning":
      return <PlanningPage />
    case "students":
      return <StudentsPage onNavigate={onNavigate} />
    case "student-detail":
      return <StudentDetailPage studentId={route.studentId} />
    case "tasks":
      return <TasksPage />
    case "messages":
      return <MessagesPage />
    case "settings":
      return <TeacherSettingsPage />
    case "history":
      return <HistoryPage role="teacher" onNavigate={onNavigate} />
    case "workspace":
      return <TeacherWorkspacePage onNavigate={onNavigate} />
  }
}
