import { lazy } from "react"
import type { AppRoute } from "../../app/routes"
const StudentHomePage = lazy(() => import("./home/StudentHomePage"))
const StudentReviewPage = lazy(() => import("./review/StudentReviewPage"))
const TutoringPage = lazy(() => import("./tutoring/TutoringPage"))
const LearningPage = lazy(() => import("./learning/LearningPage"))
const MistakesPage = lazy(() => import("./mistakes/MistakesPage"))
const StudentTasksPage = lazy(() => import("./tasks/StudentTasksPage"))
const TaskInquiryPage = lazy(() => import("./tasks/TaskInquiryPage"))
const StudentInquiryHubPage = lazy(() => import("./tasks/StudentInquiryHubPage"))
const StudentMessagesPage = lazy(() => import("./messages/StudentMessagesPage"))

type StudentRoute = Extract<AppRoute, { role: "student" }>

export default function StudentRoutes({
  route,
  onNavigate,
}: {
  route: StudentRoute
  onNavigate: (route: AppRoute) => void
}) {
  switch (route.page) {
    case "home": return <StudentHomePage onNavigate={onNavigate} />
    case "review": return <StudentReviewPage lessonId={route.lessonId} onNavigate={onNavigate} />
    case "tutoring": return <TutoringPage />
    case "learning": return <LearningPage />
    case "mistakes": return <MistakesPage />
    case "tasks": return <StudentTasksPage />
    case "ask": return <StudentInquiryHubPage />
    case "task-inquiry": return <TaskInquiryPage taskId={route.taskId} />
    case "messages": return <StudentMessagesPage />
  }
}
