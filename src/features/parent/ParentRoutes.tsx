import { lazy } from "react"
import type { AppRoute } from "../../app/routes"
const ParentHomePage = lazy(() => import("./home/ParentHomePage"))
const ParentMessagesPage = lazy(() => import("./messages/ParentMessagesPage"))
const HistoryPage = lazy(() => import("../shared/HistoryPage"))

type ParentRoute = Extract<AppRoute, { role: "parent" }>

export default function ParentRoutes({ route, onNavigate }: { route: ParentRoute; onNavigate: (route: AppRoute) => void }) {
  switch (route.page) {
    case "home": return <ParentHomePage onNavigate={onNavigate} />
    case "messages": return <ParentMessagesPage />
    case "history": return <HistoryPage role="parent" onNavigate={onNavigate} />
  }
}
