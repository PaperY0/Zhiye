import type { AppRoute } from "../../app/routes"
import ClassroomPage from "./classroom/ClassroomPage"
import LessonDetailPage from "./classroom/LessonDetailPage"
import InsightsPage from "./insights/InsightsPage"
import PlanningPage from "./planning/PlanningPage"
import StudentDetailPage from "./students/StudentDetailPage"
import StudentsPage from "./students/StudentsPage"
import TasksPage from "./tasks/TasksPage"
import MessagesPage from "./messages/MessagesPage"
import TeacherSettingsPage from "./settings/TeacherSettingsPage"
import TeacherWorkspacePage from "./workspace/TeacherWorkspacePage"

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
    case "workspace":
      return <TeacherWorkspacePage onNavigate={onNavigate} />
  }
}
