import { lazy } from "react"
import type { AppRoute } from "../../app/routes"
const StudentHomePage = lazy(() => import("./home/StudentHomePage"))
const StudentReviewPage = lazy(() => import("./review/StudentReviewPage"))
const TutoringPage = lazy(() => import("./tutoring/TutoringPage"))
const LearningPage = lazy(() => import("./learning/LearningPage"))
const MistakesPage = lazy(() => import("./mistakes/MistakesPage"))
const StudentTasksPage = lazy(() => import("./tasks/StudentTasksPage"))
const StudentMessagesPage = lazy(() => import("./messages/StudentMessagesPage"))
const HistoryPage = lazy(() => import("../shared/HistoryPage"))

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
    case "messages": return <StudentMessagesPage />
    case "history": return <HistoryPage role="student" onNavigate={onNavigate} />
  }
}
