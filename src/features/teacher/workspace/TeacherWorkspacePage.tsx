import type { AppRoute } from "../../../app/routes"
import WorkspaceScreen from "../../../components/WorkspaceScreen"

export default function TeacherWorkspacePage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <WorkspaceScreen
      onNavigate={onNavigate}
    />
  )
}
