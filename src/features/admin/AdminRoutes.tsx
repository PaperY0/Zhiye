import { lazy } from "react"
import type { AppRoute } from "../../app/routes"
const AdminHomePage = lazy(() => import("./home/AdminHomePage"))
const SafetyPage = lazy(() => import("./safety/SafetyPage"))
const AuditPage = lazy(() => import("./audit/AuditPage"))
const AdminSettingsPage = lazy(() => import("./settings/AdminSettingsPage"))
const HistoryPage = lazy(() => import("../shared/HistoryPage"))

type AdminRoute = Extract<AppRoute, { role: "admin" }>

export default function AdminRoutes({ route, onNavigate }: { route: AdminRoute; onNavigate: (route: AppRoute) => void }) {
  switch (route.page) {
    case "home": return <AdminHomePage onNavigate={onNavigate} />
    case "safety": return <SafetyPage />
    case "audit": return <AuditPage />
    case "settings": return <AdminSettingsPage />
    case "history": return <HistoryPage role="admin" onNavigate={onNavigate} />
  }
}
