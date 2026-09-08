import type { Student, Task, TaskStatus } from "../../../app/prototype/types"
import { Drawer } from "../../../components/shared/Drawer"
import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"

interface TaskDetailDrawerProps {
  open: boolean
  task: Task | null
  students: Student[]
  onClose: () => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onReminder: (task: Task, unfinishedCount: number) => void
}

const completionLabels: Record<Task["completions"][number]["status"], string> =
  {
    "not-started": "未开始",
    "in-progress": "进行中",
    submitted: "待查看",
    reviewed: "已查看",
  }

const completionTones: Record<Task["completions"][number]["status"], StatusTone> =
  {
    "not-started": "neutral",
    "in-progress": "info",
    submitted: "warning",
    reviewed: "success",
  }

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100)
}

export function TaskDetailDrawer({
  open,
  task,
  students,
  onClose,
  onStatusChange,
  onReminder,
}: TaskDetailDrawerProps) {
  if (!task) {
    return (
      <Drawer onClose={onClose} open={false} title="任务详情">
        <div />
      </Drawer>
    )
  }

  const total = task.completions.length
  const submitted = task.completions.filter((completion) =>
    ["submitted", "reviewed"].includes(completion.status),
  ).length
  const pendingReview = task.completions.filter(
    (completion) => completion.status === "submitted",
  ).length
  const inProgress = task.completions.filter(
    (completion) => completion.status === "in-progress",
  ).length
  const notStarted = task.completions.filter(
    (completion) => completion.status === "not-started",
  ).length
  const unfinished = inProgress + notStarted
  const studentNames = new Map(
    students.map((student) => [student.id, student.name]),
  )

  return (
    <Drawer onClose={onClose} open={open} title={task.title}>
      <div className="grid gap-6 text-[#17251b]">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusChip
              tone={
                task.status === "completed"
                  ? "success"
                  : task.status === "review"
                    ? "warning"
                    : task.status === "active"
                      ? "info"
                      : "neutral"
              }
            >
              {task.status === "draft"
                ? "草稿"
                : task.status === "active"
                  ? "进行中"
                  : task.status === "review"
                    ? "待查看"
                    : "已完成"}
            </StatusChip>
            <StatusChip tone="neutral">{task.audience.label}</StatusChip>
          </div>
          <p className="mt-4 leading-7 text-[#627469]">{task.content}</p>
          <dl className="mt-5 grid gap-3 rounded-[22px] bg-white/55 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold text-[#718076]">截止时间</dt>
              <dd className="mt-1 font-black">
                {new Intl.DateTimeFormat("zh-CN", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Shanghai",
                }).format(new Date(task.dueAt))}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[#718076]">提醒方式</dt>
              <dd className="mt-1 font-black">{task.reminder}</dd>
            </div>
          </dl>
        </div>

        <section aria-labelledby="task-completion-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.15em] text-[#718076]">
                COMPLETION
              </p>
              <h3
                className="mt-1 text-xl font-black"
                id="task-completion-heading"
              >
                完成情况
              </h3>
            </div>
            <div className="text-right">
              <strong className="block text-2xl font-black">
                {submitted} / {total}
              </strong>
              <span className="text-sm font-bold text-[#66806b]">
                {percentage(submitted, total)}%
              </span>
            </div>
          </div>

          {total > 0 ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-[#fff6df] p-3 font-bold text-[#755c28]">
                  待教师查看 {pendingReview} 人
                </div>
                <div className="rounded-2xl bg-[#edf4ed] p-3 font-bold text-[#506d57]">
                  进行中 {inProgress} 人
                </div>
                <div className="rounded-2xl bg-white/60 p-3 font-bold text-[#617168]">
                  未开始 {notStarted} 人
                </div>
                <div className="rounded-2xl bg-[#e7f2e9] p-3 font-bold text-[#476950]">
                  已提交 {submitted} 人
                </div>
              </div>
              <ul className="mt-4 grid gap-2">
                {task.completions.map((completion) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/45 px-4 py-3"
                    key={completion.studentId}
                  >
                    <span className="font-bold">
                      {studentNames.get(completion.studentId) ?? "学生"}
                    </span>
                    <div className="flex items-center gap-2">
                      {typeof completion.score === "number" ? (
                        <span className="text-sm font-black text-[#52675a]">
                          {completion.score} 分
                        </span>
                      ) : null}
                      <StatusChip tone={completionTones[completion.status]}>
                        {completionLabels[completion.status]}
                      </StatusChip>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-white/55 p-4 text-sm text-[#718076]">
              草稿尚未发布，暂无学生完成记录。
            </p>
          )}
        </section>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-[#dbe4dc] bg-[#f5f8f2]/90 pt-4 backdrop-blur-xl">
          {task.status === "draft" ? (
            <button
              className="rounded-full bg-[#183021] px-5 py-3 text-sm font-black text-white shadow-md"
              onClick={() => onStatusChange(task, "active")}
              type="button"
            >
              发布任务
            </button>
          ) : null}
          {task.status === "active" && unfinished > 0 ? (
            <button
              className="rounded-full bg-[#183021] px-5 py-3 text-sm font-black text-white shadow-md"
              onClick={() => onReminder(task, unfinished)}
              type="button"
            >
              提醒未完成学生
            </button>
          ) : null}
          {task.status === "review" ? (
            <button
              className="rounded-full bg-[#183021] px-5 py-3 text-sm font-black text-white shadow-md"
              onClick={() => onStatusChange(task, "completed")}
              type="button"
            >
              完成查看
            </button>
          ) : null}
        </div>
      </div>
    </Drawer>
  )
}

export default TaskDetailDrawer
