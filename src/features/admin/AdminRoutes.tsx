import type { AppRoute } from "../../app/routes"
import AdminHomePage from "./home/AdminHomePage"
import SafetyPage from "./safety/SafetyPage"
import AuditPage from "./audit/AuditPage"
import AdminSettingsPage from "./settings/AdminSettingsPage"
import HistoryPage from "../shared/HistoryPage"

type AdminRoute = Extract<AppRoute, { role: "admin" }>

export default function AdminRoutes({ route, onNavigate }: { route: AdminRoute; onNavigate: (route: AppRoute) => void }) {
  switch (route.page) {
    case "home": return <AdminHomePage onNavigate={onNavigate} />
    case "safety": return <SafetyPage />
    case "audit": return <AuditPage />
    case "settings": return <AdminSettingsPage />
    case "history": return <HistoryPage role="admin" />
  }
}
