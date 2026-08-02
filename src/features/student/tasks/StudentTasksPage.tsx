import { useMemo, useState } from "react"
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Play,
  X,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Task } from "../../../app/prototype/types"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

const STUDENT_ID = "student-lin-xiaoyu"

type StudentTaskState = "not-started" | "in-progress" | "completed"
type TaskFilter = "all" | "pending" | "completed"

const taskTypeLabels: Record<Task["type"], string> = {
  review: "复习",
  practice: "练习",
  quiz: "自检",
  reading: "阅读",
}

function initialStudentState(task: Task): StudentTaskState {
  if (task.status === "completed") return "completed"
  if (task.status === "review") return "completed"
  return "not-started"
}

function formatDueAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function stateLabel(state: StudentTaskState) {
  if (state === "in-progress") return "正在完成"
  if (state === "completed") return "已完成"
  return "待完成"
}

function stateTone(state: StudentTaskState) {
  if (state === "completed") return "success" as const
  if (state === "in-progress") return "info" as const
  return "warning" as const
}

export function StudentTasksPage() {
  const { tasks, updateTaskCompletion } = usePrototype()
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "draft" &&
          (task.audience.kind === "class" ||
            task.audience.studentIds.includes(STUDENT_ID)),
      ),
    [tasks],
  )
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [progress, setProgress] = useState<Record<string, StudentTaskState>>(
    () =>
      Object.fromEntries(
        visibleTasks.map((task) => [task.id, initialStudentState(task)]),
      ),
  )

  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId)
  const filteredTasks = visibleTasks.filter((task) => {
    const state = progress[task.id] ?? initialStudentState(task)
    if (filter === "pending") return state !== "completed"
    if (filter === "completed") return state === "completed"
    return true
  })
  const pendingCount = visibleTasks.filter(
    (task) => (progress[task.id] ?? initialStudentState(task)) !== "completed",
  ).length
  const completedCount = visibleTasks.length - pendingCount

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#5f765f]">
            李老师发布给你的学习安排
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#142319]">
            我的任务
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65736a]">
            按自己的节奏完成，状态会同步到当前原型中的任务记录。
          </p>
        </div>
        <div className="flex gap-2" aria-label="任务概览">
          <StatusChip tone="warning">待完成 {pendingCount}</StatusChip>
          <StatusChip tone="success">已完成 {completedCount}</StatusChip>
        </div>
      </header>

      <div className="flex flex-wrap gap-2" aria-label="按任务进度筛选">
        {([
          ["all", `全部 ${visibleTasks.length}`],
          ["pending", `待完成 ${pendingCount}`],
          ["completed", `已完成 ${completedCount}`],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={filter === value}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === value
                ? "bg-[#183023] text-white shadow-md"
                : "border border-white/80 bg-white/55 text-[#3c5142] hover:bg-white/80"
            }`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTasks.map((task) => {
          const state = progress[task.id] ?? initialStudentState(task)
          return (
            <GlassSurface className="flex min-h-64 flex-col p-5" key={task.id}>
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#58705d]">
                  <BookOpenCheck aria-hidden="true" size={17} />
                  {taskTypeLabels[task.type]}
                </span>
                <StatusChip
                  aria-label={`${task.title}状态`}
                  role="status"
                  tone={stateTone(state)}
                >
                  {stateLabel(state)}
                </StatusChip>
              </div>
              <h2 className="mt-5 text-xl font-black text-[#17251b]">
                {task.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#65736a]">
                {task.content}
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#76847b]">
                <CalendarClock aria-hidden="true" size={16} />
                截止 {formatDueAt(task.dueAt)}
              </div>
              <button
                aria-label={`打开${task.title}`}
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#183023] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#183023]/15 transition hover:-translate-y-0.5"
                onClick={() => setSelectedTaskId(task.id)}
                type="button"
              >
                {state === "completed" ? "查看任务" : "继续任务"}
                <Play aria-hidden="true" size={16} fill="currentColor" />
              </button>
            </GlassSurface>
          )
        })}
      </div>

      {filteredTasks.length === 0 ? (
        <GlassSurface className="p-10 text-center" weight="light">
          <CheckCircle2
            className="mx-auto text-[#6f9277]"
            aria-hidden="true"
            size={36}
          />
          <h2 className="mt-3 text-lg font-black text-[#1b2b20]">
            这个分类里还没有任务
          </h2>
          <p className="mt-2 text-sm text-[#6b786f]">可以切换其他进度查看。</p>
        </GlassSurface>
      ) : null}

      {selectedTask ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#0e1c14]/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTaskId(null)
          }}
        >
          <section
            aria-labelledby="student-task-detail-title"
            aria-modal="true"
            className="prototype-glass prototype-glass--sheet relative w-full max-w-xl overflow-hidden rounded-[28px] p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <button
              aria-label={`关闭${selectedTask.title}`}
              className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-white/80 bg-white/60 text-[#34483a]"
              onClick={() => setSelectedTaskId(null)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
            <p className="text-sm font-bold text-[#66806b]">李老师布置</p>
            <h2
              className="mt-2 max-w-[85%] text-2xl font-black text-[#142319]"
              id="student-task-detail-title"
            >
              {selectedTask.title}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusChip
                tone={stateTone(
                  progress[selectedTask.id] ??
                    initialStudentState(selectedTask),
                )}
              >
                {stateLabel(
                  progress[selectedTask.id] ??
                    initialStudentState(selectedTask),
                )}
              </StatusChip>
              <StatusChip>{taskTypeLabels[selectedTask.type]}</StatusChip>
            </div>
            <div className="mt-6 rounded-3xl border border-white/80 bg-white/50 p-5">
              <p className="text-sm font-bold text-[#5e7363]">任务内容</p>
              <p className="mt-2 text-base font-semibold leading-7 text-[#26362b]">
                {selectedTask.content}
              </p>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-[#eef3e9]/75 p-4">
                <dt className="text-[#718077]">截止时间</dt>
                <dd className="mt-1 font-bold text-[#26362b]">
                  {formatDueAt(selectedTask.dueAt)}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#eef3e9]/75 p-4">
                <dt className="text-[#718077]">提醒</dt>
                <dd className="mt-1 font-bold text-[#26362b]">
                  {selectedTask.reminder}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {(progress[selectedTask.id] ??
                initialStudentState(selectedTask)) === "not-started" ? (
                <button
                  className="min-h-12 rounded-2xl bg-[#183023] px-5 font-black text-white"
                  onClick={() =>
                    (() => {
                      updateTaskCompletion(
                        selectedTask.id,
                        STUDENT_ID,
                        "in-progress",
                      )
                      setProgress((current) => ({
                        ...current,
                        [selectedTask.id]: "in-progress",
                      }))
                      setNotice("任务已开始，进度已同步")
                    })()
                  }
                  type="button"
                >
                  开始任务
                </button>
              ) : null}
              {(progress[selectedTask.id] ??
                initialStudentState(selectedTask)) === "in-progress" ? (
                <button
                  className="min-h-12 rounded-2xl bg-[#183023] px-5 font-black text-white"
                  onClick={() =>
                    (() => {
                      updateTaskCompletion(
                        selectedTask.id,
                        STUDENT_ID,
                        "submitted",
                      )
                      setProgress((current) => ({
                        ...current,
                        [selectedTask.id]: "completed",
                      }))
                      setNotice("任务已提交，等待老师查看")
                    })()
                  }
                  type="button"
                >
                  标记为已完成
                </button>
              ) : null}
              {(progress[selectedTask.id] ??
                initialStudentState(selectedTask)) === "completed" ? (
                <p className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#e2efe1] px-5 font-black text-[#315b3b]">
                  <CheckCircle2 aria-hidden="true" size={19} />
                  已完成，等待老师查看
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
      {notice ? (
        <p
          aria-live="polite"
          className="rounded-2xl bg-[#e7f1e5] px-4 py-3 text-sm font-black text-[#36563d]"
          role="status"
        >
          {notice}
        </p>
      ) : null}
    </section>
  )
}

export default StudentTasksPage
