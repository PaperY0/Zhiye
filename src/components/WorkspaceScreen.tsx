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
      className="workspace-natural-shell min-h-[calc(100dvh-73px)] text-[#172019]"
      data-testid="teacher-workspace"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-[1600px] min-w-0 flex-col p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
          <WorkspaceContextBar />
          <div
            className={`workspace-content-row-fill mt-4 grid items-stretch gap-4 ${
              isEmptyData ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_260px]"
            }`}
            data-testid="workspace-content-row"
          >
            <CurrentLessonStage onNavigate={onNavigate} />
            {!isEmptyData ? <WorkspaceActivityRail onNavigate={onNavigate} /> : null}
          </div>
      </div>
    </section>
  )
}
