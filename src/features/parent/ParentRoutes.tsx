import type { AppRoute } from "../../app/routes"
import ParentHomePage from "./home/ParentHomePage"
import ParentMessagesPage from "./messages/ParentMessagesPage"

type ParentRoute = Extract<AppRoute, { role: "parent" }>

export default function ParentRoutes({ route, onNavigate }: { route: ParentRoute; onNavigate: (route: AppRoute) => void }) {
  switch (route.page) {
    case "home": return <ParentHomePage onNavigate={onNavigate} />
    case "messages": return <ParentMessagesPage />
  }
}
