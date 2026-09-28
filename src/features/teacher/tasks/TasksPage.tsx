import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Plus, Send, Users } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Quiz, Task, TaskStatus } from "../../../app/prototype/types"
import { taskSubmissionCounts } from "../../../app/prototype/taskStatus"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"
import {
  ToastRegion,
  type ToastMessage,
} from "../../../components/shared/ToastRegion"
import { CreateTaskDialog } from "./CreateTaskDialog"
import { TaskDetailDrawer } from "./TaskDetailDrawer"
import { schoolClasses } from "../settings/teacherSettings"

const statusOptions: Array<{
  value: TaskStatus
  label: string
  tone: StatusTone
}> = [
  { value: "draft", label: "草稿", tone: "neutral" },
  { value: "active", label: "进行中", tone: "info" },
  { value: "review", label: "待查看", tone: "warning" },
  { value: "completed", label: "已完成", tone: "success" },
]

const taskTypeLabels: Record<Task["type"], string> = {
  review: "复习",
  practice: "练习",
  quiz: "三题自检",
  reading: "课堂热身",
}

function formatDueAt(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date)
}

function taskMatchesClass(task: Task, className: string, students: ReturnType<typeof usePrototype>["students"]) {
  if (className === "all") return true
  return task.audience.kind === "class"
    ? task.audience.label === className
    : task.audience.studentIds.some((id) => students.some((student) => student.id === id && student.className === className))
}

export function TasksPage() {
  const { tasks, students, lessons, plans, quizzes, conversations, addTask, addQuiz, updateTaskStatus, updateTaskCompletion, sendMessage } = usePrototype()
  const [initialPlanId, setInitialPlanId] = useState<string | null>(null)
  const [initialLessonId, setInitialLessonId] = useState<string | null>(null)
  const [initialStudentId, setInitialStudentId] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(() =>
    tasks.some((task) => task.status === "review") ? "review"
      : tasks.some((task) => task.status === "active") ? "active"
        : tasks.some((task) => task.status === "draft") ? "draft" : "completed",
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const source = window.sessionStorage.getItem("zhiye-task-source-plan")
    const lessonSource = window.sessionStorage.getItem("zhiye-task-source-lesson")
    const studentSource = window.sessionStorage.getItem("zhiye-task-source-student")
    const classFilter = window.sessionStorage.getItem("zhiye-task-class-filter")
    const taskToOpen = window.sessionStorage.getItem("zhiye-task-open-id")
    window.sessionStorage.removeItem("zhiye-task-source-plan")
    window.sessionStorage.removeItem("zhiye-task-source-lesson")
    window.sessionStorage.removeItem("zhiye-task-source-student")
    window.sessionStorage.removeItem("zhiye-task-class-filter")
    window.sessionStorage.removeItem("zhiye-task-open-id")
    if (classFilter && (classFilter === "all" || schoolClasses.some((item) => item === classFilter))) setSelectedClass(classFilter)
    const targetTask = tasks.find((task) => task.id === taskToOpen)
    if (targetTask) { setSelectedTaskId(targetTask.id); setSelectedStatus(targetTask.status) }
    if (lessonSource && lessons.some((lesson) => lesson.id === lessonSource)) { setInitialLessonId(lessonSource); setCreateOpen(true) }
    else if (source && plans.some((plan) => plan.id === source)) { setInitialPlanId(source); setCreateOpen(true) }
    else if (studentSource && students.some((student) => student.id === studentSource)) { setInitialStudentId(studentSource); setCreateOpen(true) }
  }, [])

  const counts = useMemo(
    () =>
      statusOptions.reduce<Record<TaskStatus, number>>(
        (result, option) => {
          result[option.value] = tasks.filter(
            (task) => task.status === option.value && taskMatchesClass(task, selectedClass, students),
          ).length
          return result
        },
        { draft: 0, active: 0, review: 0, completed: 0 },
      ),
    [selectedClass, students, tasks],
  )

  const visibleTasks = tasks.filter((task) => task.status === selectedStatus && taskMatchesClass(task, selectedClass, students))
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  useEffect(() => {
    if (selectedTask && selectedTask.status !== selectedStatus) setSelectedStatus(selectedTask.status)
  }, [selectedTask?.status, selectedTaskId])

  function showToast(message: Omit<ToastMessage, "id">) {
    setToasts([
      {
        ...message,
        id: `task-toast-${Date.now()}`,
      },
    ])
  }

  function handleCreate(task: Task, quiz?: Quiz) {
    if (quiz) addQuiz(quiz)
    addTask(task)
    setInitialPlanId(null)
    setInitialLessonId(null)
    setInitialStudentId(null)
    setSelectedStatus("draft")
    setCreateOpen(false)
    setSelectedTaskId(task.id)
    showToast({
      title: "任务草稿已保存",
      description: "已打开教师预览，确认学习目标与安排后再发布。",
      tone: "success",
    })
  }

  function handleStatusChange(task: Task, status: TaskStatus) {
    updateTaskStatus(task.id, status)
    if (status === "active" && task.audience.kind === "students") {
      task.audience.studentIds.forEach((studentId) => {
        const chat = conversations.find((conversation) => conversation.kind === "student" && conversation.boundStudentId === studentId)
        if (chat) sendMessage(chat.id, `已布置任务“${task.title}”。请到任务页查看并完成。`)
      })
    }
    setSelectedTaskId(null)
    setSelectedStatus(status)
    showToast({
      title: status === "active" ? "任务已发布" : "任务状态已更新",
      description:
        status === "active" ? "学生将在任务列表中看到该任务。" : task.title,
      tone: "success",
    })
  }

  function handleReminder(task: Task, unfinishedCount: number) {
    const pending = task.completions.filter((item) => item.status === "not-started" || item.status === "in-progress")
    const directChats = conversations.filter((item) => item.kind === "student" && pending.some((completion) => completion.studentId === item.boundStudentId))
    directChats.forEach((chat) => sendMessage(chat.id, task.dueAt ? `提醒：${task.title} 将于 ${formatDueAt(task.dueAt)} 截止。如有困难，可以在这里告诉老师。` : `提醒：请完成“${task.title}”。如有困难，可以在这里告诉老师。`))
    showToast({
      title: directChats.length ? `已通过消息提醒 ${directChats.length} 名学生` : "暂无可发送的学生会话",
      description: directChats.length < unfinishedCount ? `其余 ${unfinishedCount - directChats.length} 名学生尚无单独会话，请在消息页联系。` : task.title,
      tone: "info",
    })
  }

  return (
    <section className="min-h-full p-4 text-[#17251b] sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-[#66806b]">
            TEACHER TASKS
          </p>
          <h1 className="role-page-title">
            任务
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-[#718076]">
            创建学习任务；学生提交后自动进入待查看，全部查看后归入已完成。
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-[#183021] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#183021]/15 transition hover:-translate-y-0.5"
          onClick={() => { setInitialPlanId(null); setInitialLessonId(null); setInitialStudentId(null); setCreateOpen(true) }}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
          新建任务
        </button>
      </header>

      <nav aria-label="任务班级" className="mb-4 flex flex-wrap gap-2">
        {["all", ...schoolClasses].map((className) => <button aria-pressed={selectedClass === className} className={selectedClass === className ? "role-action-primary" : "role-action-secondary"} key={className} onClick={() => setSelectedClass(className)} type="button">{className === "all" ? "全部班级" : className}</button>)}
      </nav>

      <nav
        aria-label="任务状态"
        className="mb-6 grid grid-cols-2 gap-2 rounded-[24px] border border-white/80 bg-white/45 p-2 shadow-sm backdrop-blur-xl sm:grid-cols-4"
      >
        {statusOptions.map((option) => (
          <button
            aria-pressed={selectedStatus === option.value}
            className={`flex items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-black transition ${
              selectedStatus === option.value
                ? "bg-[#183021] text-white shadow-md"
                : "text-[#52675a] hover:bg-white/65"
            }`}
            key={option.value}
            onClick={() => setSelectedStatus(option.value)}
            type="button"
          >
            <span>{option.label}</span>
            <span
              className={`grid min-w-7 place-items-center rounded-full px-2 py-1 text-xs ${
                selectedStatus === option.value
                  ? "bg-white/16 text-white"
                  : "bg-[#e7eee5] text-[#45604c]"
              }`}
            >
              {counts[option.value]}
            </span>
          </button>
        ))}
      </nav>

      {visibleTasks.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibleTasks.map((task) => {
            const status = statusOptions.find(
              (option) => option.value === task.status,
            )!
            const completion = taskSubmissionCounts(task, selectedClass, students)
            return (
              <GlassSurface
                className="flex min-h-64 flex-col rounded-[28px] p-5 sm:p-6"
                key={task.id}
                weight="card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <StatusChip tone={status.tone}>{status.label}</StatusChip>
                  <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-bold text-[#58705f]">
                    {taskTypeLabels[task.type]}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black tracking-[-0.025em]">
                  {task.title}
                </h2>
                <p className="mt-2 line-clamp-2 leading-6 text-[#68796e]">
                  {task.content}
                </p>
                <dl className="mt-5 grid gap-2 text-sm text-[#586b5f]">
                  <div className="flex items-center gap-2">
                    <Users aria-hidden="true" size={16} />
                    <dt className="sr-only">发布对象</dt>
                    <dd>{task.audience.label}</dd>
                  </div>
                  {task.dueAt && <div className="flex items-center gap-2">
                    <CalendarClock aria-hidden="true" size={16} />
                    <dt className="sr-only">截止时间</dt>
                    <dd>截止 {formatDueAt(task.dueAt)}</dd>
                  </div>}
                </dl>
                <div className="mt-auto pt-6">
                  {completion.pendingReview > 0 && <p className="mb-3 w-fit rounded-full bg-[#fff3d8] px-3 py-1.5 text-xs font-bold text-[#775b20]">待查看 {completion.pendingReview} 份提交</p>}
                  {completion.total > 0 ? (
                    <div className="mb-4">
                      <div className="mb-2 flex justify-between text-xs font-bold text-[#627469]">
                        <span>已提交 {completion.submitted} 人</span>
                        <span>共 {completion.total} 人</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#dfe8df]">
                        <div
                          aria-label={`完成进度 ${completion.submitted} / ${completion.total}`}
                          className="h-full rounded-full bg-[#668b6d]"
                          role="progressbar"
                          aria-valuemax={completion.total}
                          aria-valuemin={0}
                          aria-valuenow={completion.submitted}
                          style={{
                            width: `${Math.round((completion.submitted / completion.total) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#cad8cc] bg-white/65 px-4 py-3 text-sm font-black text-[#294430] transition hover:bg-white"
                    onClick={() => setSelectedTaskId(task.id)}
                    type="button"
                  >
                    查看{task.title}
                    <Send aria-hidden="true" size={15} />
                  </button>
                </div>
              </GlassSurface>
            )
          })}
        </div>
      ) : (
        <GlassSurface
          className="grid min-h-64 place-items-center rounded-[28px] p-8 text-center"
          weight="light"
        >
          <div>
            <h2 className="text-lg font-black">这个状态下还没有任务</h2>
            <p className="mt-2 text-sm text-[#718076]">
              {selectedStatus === "draft" ? "新建任务后先保存为草稿，再检查并发布。" : selectedStatus === "active" ? "学生提交后，任务会自动移到“待查看”。" : selectedStatus === "review" ? "学生提交后会出现在这里；逐份查看即可完成批阅。" : "所有学生的提交都查看后，任务会自动归入这里。"}
            </p>
            {selectedStatus === "active" && counts.review > 0 && <button className="mt-4 rounded-full bg-[#183021] px-4 py-2 text-sm font-bold text-white" onClick={() => setSelectedStatus("review")} type="button">查看待处理的提交</button>}
          </div>
        </GlassSurface>
      )}

      <CreateTaskDialog
        open={createOpen}
        students={students}
        lessons={lessons}
        plans={plans}
        quizzes={quizzes}
        initialPlanId={initialPlanId}
        initialLessonId={initialLessonId}
        initialStudentId={initialStudentId}
        taskCount={tasks.length}
        onClose={() => { setCreateOpen(false); setInitialPlanId(null); setInitialLessonId(null); setInitialStudentId(null) }}
        onCreate={handleCreate}
      />
      <TaskDetailDrawer
        open={selectedTask !== null}
        students={students}
        quizzes={quizzes}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onReminder={handleReminder}
        onStatusChange={handleStatusChange}
        onReviewCompletion={(task, studentId, score) => { updateTaskCompletion(task.id, studentId, "reviewed", typeof score === "number" && Number.isFinite(score) ? { score } : undefined); showToast({ title: "已记录教师查看结果", description: task.title, tone: "success" }) }}
      />
      <ToastRegion
        label="任务操作通知"
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
        toasts={toasts}
      />
    </section>
  )
}

export default TasksPage
