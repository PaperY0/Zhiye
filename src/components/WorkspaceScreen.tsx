import type { AppRoute } from "../app/routes"
import { usePrototypeOptional } from "../app/prototype/PrototypeContext"
import CurrentLessonStage from "./workspace/CurrentLessonStage"
import WorkspaceActivityRail from "./workspace/WorkspaceActivityRail"
import WorkspaceContextBar from "./workspace/WorkspaceContextBar"

type WorkspaceScreenProps = {
  onNavigate?: (route: AppRoute) => void
}

export default function WorkspaceScreen({
  onNavigate = () => undefined,
}: WorkspaceScreenProps) {
  const prototype = usePrototypeOptional()
  const isEmptyData = Boolean(
    prototype && (prototype.lessons.length === 0 || prototype.students.length === 0),
  )

  return (
    <section
      className="workspace-natural-shell min-h-full text-[#172019]"
      data-testid="teacher-workspace"
    >
      <div className="workspace-page-frame mx-auto flex min-h-full max-w-[1500px] min-w-0 flex-col p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-10">
          <WorkspaceContextBar onNavigate={onNavigate} />
          <div
            className={`workspace-content-row mt-5 ${
              isEmptyData ? "grid xl:grid-cols-1" : "app-split-layout app-split-layout-fill"
            }`}
            data-testid="workspace-content-row"
          >
            <div className="app-split-primary">
              <CurrentLessonStage onNavigate={onNavigate} />
            </div>
            {!isEmptyData ? <WorkspaceActivityRail onNavigate={onNavigate} /> : null}
          </div>
      </div>
    </section>
  )
}
