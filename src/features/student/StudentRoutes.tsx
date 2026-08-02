import type { AppRoute } from "../../app/routes"
import StudentHomePage from "./home/StudentHomePage"
import StudentReviewPage from "./review/StudentReviewPage"
import TutoringPage from "./tutoring/TutoringPage"
import LearningPage from "./learning/LearningPage"
import MistakesPage from "./mistakes/MistakesPage"
import StudentTasksPage from "./tasks/StudentTasksPage"
import StudentMessagesPage from "./messages/StudentMessagesPage"

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
  }
}
