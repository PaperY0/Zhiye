import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  Bell,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  MessageSquareText,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react"
import type { Student, Task } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { getTeacherSettings } from "../settings/teacherSettings"

interface CreateTaskDialogProps {
  open: boolean
  students: Student[]
  taskCount: number
  onClose: () => void
  onCreate: (task: Task) => void
}

type AudienceKind = Task["audience"]["kind"]
type SubmissionMode = NonNullable<Task["submissionMode"]>

const taskTypes: Array<{
  value: Task["type"]
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    value: "practice",
    label: "巩固练习",
    description: "用少量练习稳定刚学会的方法",
    icon: <ClipboardCheck aria-hidden="true" size={19} />,
  },
  {
    value: "review",
    label: "复习回顾",
    description: "提取关键知识并完成一次主动回忆",
    icon: <BookOpenCheck aria-hidden="true" size={19} />,
  },
  {
    value: "quiz",
    label: "学习自检",
    description: "用可观察结果判断是否真正掌握",
    icon: <CheckCircle2 aria-hidden="true" size={19} />,
  },
  {
    value: "reading",
    label: "课前准备",
    description: "带着明确问题阅读或观察材料",
    icon: <Sparkles aria-hidden="true" size={19} />,
  },
]

const submissionModes: Array<{
  value: SubmissionMode
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    value: "online",
    label: "在线作答",
    description: "适合选择题、自检题和简短回答",
    icon: <CheckCircle2 aria-hidden="true" size={18} />,
  },
  {
    value: "photo",
    label: "拍照提交",
    description: "适合演算过程、纸笔作品与实践记录",
    icon: <Camera aria-hidden="true" size={18} />,
  },
  {
    value: "text",
    label: "文字说明",
    description: "适合解释思路、反思和阅读回应",
    icon: <MessageSquareText aria-hidden="true" size={18} />,
  },
  {
    value: "no-submit",
    label: "无需提交",
    description: "只安排阅读、准备或线下完成",
    icon: <FileText aria-hidden="true" size={18} />,
  },
]

const reminderOptions = ["截止前 1 天", "截止前 2 小时", "不提醒"] as const
const durationOptions = [10, 15, 20, 30] as const

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-[#cfdbd0] bg-white/80 px-4 py-3 text-sm font-semibold text-[#17251b] shadow-[inset_0_1px_0_rgba(255,255,255,.95)] outline-none transition placeholder:text-[#87948b] focus:border-[#6f9275] focus:ring-4 focus:ring-[#6f9275]/15"
const labelClassName = "grid gap-2 text-sm font-black text-[#344d3d]"

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function getDefaultDueAt() {
  const due = new Date()
  due.setDate(due.getDate() + 2)
  due.setHours(20, 0, 0, 0)
  return toLocalInputValue(due)
}

function ChoiceCard({
  checked,
  description,
  icon,
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean
  description: string
  icon: ReactNode
  label: string
  name: string
  onChange(): void
  value: string
}) {
  return (
    <label
      className={`group flex min-h-24 cursor-pointer items-start gap-3 rounded-[20px] border p-4 text-left transition focus-within:ring-4 focus-within:ring-[#6f9275]/18 ${
        checked
          ? "border-[#7f9f84] bg-[#e7f0e4] shadow-[0_10px_24px_rgba(66,100,74,.10)]"
          : "border-[#dce5dc] bg-white/58 hover:border-[#b8cbb9] hover:bg-white/82"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
          checked ? "bg-[#56785e] text-white" : "bg-[#edf3eb] text-[#57705e]"
        }`}
      >
        {icon}
      </span>
      <span>
        <strong className="block text-sm font-black text-[#203427]">{label}</strong>
        <span className="mt-1 block text-xs leading-5 text-[#708077]">
          {description}
        </span>
      </span>
    </label>
  )
}

function SectionHeading({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#1e3928] text-xs font-black text-white">
        {step}
      </span>
      <div>
        <h3 className="font-black tracking-[-0.015em] text-[#1b3022]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#728178]">{description}</p>
      </div>
    </div>
  )
}

export function CreateTaskDialog({
  open,
  students,
  taskCount,
  onClose,
  onCreate,
}: CreateTaskDialogProps) {
  const [type, setType] = useState<Task["type"]>("practice")
  const [title, setTitle] = useState("")
  const [objective, setObjective] = useState("")
  const [successCriteria, setSuccessCriteria] = useState("")
  const [content, setContent] = useState("")
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>("online")
  const [estimatedMinutes, setEstimatedMinutes] = useState(15)
  const [supportNote, setSupportNote] = useState("")
  const [audienceKind, setAudienceKind] = useState<AudienceKind>("class")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [dueAt, setDueAt] = useState(getDefaultDueAt)
  const [reminder, setReminder] = useState<(typeof reminderOptions)[number]>(
    "截止前 2 小时",
  )
  const [error, setError] = useState("")
  const currentClass = getTeacherSettings().currentClass

  useEffect(() => {
    if (!open) return
    setType("practice")
    setTitle("")
    setObjective("")
    setSuccessCriteria("")
    setContent("")
    setSubmissionMode("online")
    setEstimatedMinutes(15)
    setSupportNote("")
    setAudienceKind("class")
    setSelectedStudentIds([])
    setDueAt(getDefaultDueAt())
    setReminder("截止前 2 小时")
    setError("")
  }, [open])

  const selectedStudentNames = useMemo(
    () =>
      students
        .filter((student) => selectedStudentIds.includes(student.id))
        .map((student) => student.name),
    [selectedStudentIds, students],
  )
  const selectedType = taskTypes.find((option) => option.value === type)!
  const selectedSubmission = submissionModes.find(
    (option) => option.value === submissionMode,
  )!

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedTitle = title.trim()
    const normalizedObjective = objective.trim()
    const normalizedCriteria = successCriteria.trim()
    const normalizedContent = content.trim()

    if (
      !normalizedTitle ||
      !normalizedObjective ||
      !normalizedCriteria ||
      !normalizedContent ||
      !dueAt
    ) {
      setError("请补全任务标题、学习目标、达成标准、任务说明和截止时间。")
      return
    }
    if (audienceKind === "students" && selectedStudentIds.length === 0) {
      setError("请至少选择一名学生。")
      return
    }

    const audienceStudentIds =
      audienceKind === "class"
        ? students.map((student) => student.id)
        : selectedStudentIds

    onCreate({
      id: `task-local-${Date.now()}-${taskCount + 1}`,
      title: normalizedTitle,
      type,
      objective: normalizedObjective,
      successCriteria: normalizedCriteria,
      content: normalizedContent,
      submissionMode,
      estimatedMinutes,
      supportNote: supportNote.trim() || undefined,
      audience: {
        kind: audienceKind,
        label:
          audienceKind === "class"
            ? currentClass
            : selectedStudentNames.join("、"),
        studentIds: audienceKind === "class" ? [] : selectedStudentIds,
      },
      dueAt: new Date(dueAt).toISOString(),
      reminder,
      status: "draft",
      completions: audienceStudentIds.map((studentId) => ({
        studentId,
        status: "not-started",
      })),
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <Dialog
      description="从学习目标出发，明确学生要完成什么，以及你将用什么证据判断学习发生。"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="hidden text-xs font-semibold text-[#718077] sm:block">
            保存后先进入教师预览，不会立即发给学生。
          </p>
          <div className="ml-auto flex gap-3">
            <button
              className="min-h-11 rounded-full border border-[#c9d6cb] bg-white/72 px-5 text-sm font-black text-[#52675a] transition hover:bg-white"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="min-h-11 rounded-full bg-[#183021] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(20,40,27,.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66886d]/30"
              form="create-teacher-task"
              type="submit"
            >
              保存并预览
            </button>
          </div>
        </div>
      }
      onClose={onClose}
      open={open}
      size="wide"
      title="新建任务"
    >
      <form
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"
        id="create-teacher-task"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5">
          <section className="rounded-[26px] border border-white/85 bg-white/58 p-5 shadow-[0_16px_38px_rgba(49,78,58,.06)]">
            <SectionHeading
              description="先写清任务完成后，学生应该能做什么。"
              step="1"
              title="确定学习结果"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClassName}>
                任务标题
                <input
                  aria-label="任务标题"
                  className={inputClassName}
                  placeholder="例如：用图解释分数的基本性质"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className={labelClassName}>
                学习目标
                <input
                  aria-label="学习目标"
                  className={inputClassName}
                  placeholder="学生能够……"
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                />
              </label>
              <label className={`${labelClassName} sm:col-span-2`}>
                达成标准
                <input
                  aria-label="达成标准"
                  className={inputClassName}
                  placeholder="例如：能正确完成 4 道题，并说清每一步依据"
                  value={successCriteria}
                  onChange={(event) => setSuccessCriteria(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-[26px] border border-white/85 bg-white/58 p-5 shadow-[0_16px_38px_rgba(49,78,58,.06)]">
            <SectionHeading
              description="选择最符合教学意图的任务形式，并明确学生如何留下学习证据。"
              step="2"
              title="设计学习活动"
            />
            <fieldset>
              <legend className="mb-2 text-sm font-black text-[#344d3d]">任务形式</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {taskTypes.map((option) => (
                  <ChoiceCard
                    checked={type === option.value}
                    description={option.description}
                    icon={option.icon}
                    key={option.value}
                    label={option.label}
                    name="任务类型"
                    onChange={() => setType(option.value)}
                    value={option.value}
                  />
                ))}
              </div>
            </fieldset>
            <label className={`${labelClassName} mt-4`}>
              给学生的任务说明
              <textarea
                aria-label="任务内容"
                className={`${inputClassName} min-h-28 resize-y leading-6`}
                placeholder="用学生能直接执行的语言，写明步骤、材料和提交要求。"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </label>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-black text-[#344d3d]">学习证据</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {submissionModes.map((option) => (
                  <ChoiceCard
                    checked={submissionMode === option.value}
                    description={option.description}
                    icon={option.icon}
                    key={option.value}
                    label={option.label}
                    name="提交方式"
                    onChange={() => setSubmissionMode(option.value)}
                    value={option.value}
                  />
                ))}
              </div>
            </fieldset>
          </section>

          <section className="rounded-[26px] border border-white/85 bg-white/58 p-5 shadow-[0_16px_38px_rgba(49,78,58,.06)]">
            <SectionHeading
              description="控制任务负担、对象和提醒，只保留真正影响完成体验的设置。"
              step="3"
              title="安排对象与节奏"
            />
            <fieldset>
              <legend className="mb-2 text-sm font-black text-[#344d3d]">发布对象</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceCard
                  checked={audienceKind === "class"}
                  description={`${currentClass}全班学生`}
                  icon={<Users aria-hidden="true" size={18} />}
                  label="全班"
                  name="发布对象"
                  onChange={() => setAudienceKind("class")}
                  value="class"
                />
                <ChoiceCard
                  checked={audienceKind === "students"}
                  description="用于分层支持、补做或个别挑战"
                  icon={<UserRound aria-hidden="true" size={18} />}
                  label="指定学生"
                  name="发布对象"
                  onChange={() => setAudienceKind("students")}
                  value="students"
                />
              </div>
            </fieldset>

            {audienceKind === "students" ? (
              <fieldset className="mt-4 rounded-[22px] border border-[#d5dfd6] bg-white/55 p-4">
                <legend className="px-2 text-sm font-black text-[#465c4d]">选择学生</legend>
                <div className="mt-2 grid max-h-48 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                  {students.map((student) => (
                    <label
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition hover:bg-white/80"
                      key={student.id}
                    >
                      <input
                        checked={selectedStudentIds.includes(student.id)}
                        className="size-4 accent-[#56785e]"
                        onChange={() => toggleStudent(student.id)}
                        type="checkbox"
                      />
                      {student.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={labelClassName}>
                截止时间
                <input
                  aria-label="截止时间"
                  className={inputClassName}
                  min={toLocalInputValue(new Date())}
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </label>
              <fieldset>
                <legend className="mb-2 text-sm font-black text-[#344d3d]">预计用时</legend>
                <div className="grid grid-cols-4 gap-2">
                  {durationOptions.map((minutes) => (
                    <label
                      className={`grid min-h-12 cursor-pointer place-items-center rounded-2xl border text-sm font-black transition focus-within:ring-4 focus-within:ring-[#6f9275]/18 ${
                        estimatedMinutes === minutes
                          ? "border-[#7f9f84] bg-[#e5eee2] text-[#274b31]"
                          : "border-[#d6e1d7] bg-white/65 text-[#63736a]"
                      }`}
                      key={minutes}
                    >
                      <input
                        checked={estimatedMinutes === minutes}
                        className="sr-only"
                        name="预计用时"
                        onChange={() => setEstimatedMinutes(minutes)}
                        type="radio"
                        value={minutes}
                      />
                      {minutes} 分
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-black text-[#344d3d]">提醒</legend>
              <div className="flex flex-wrap gap-2">
                {reminderOptions.map((option) => (
                  <label
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-black transition focus-within:ring-4 focus-within:ring-[#6f9275]/18 ${
                      reminder === option
                        ? "border-[#7f9f84] bg-[#e5eee2] text-[#274b31]"
                        : "border-[#d6e1d7] bg-white/65 text-[#63736a]"
                    }`}
                    key={option}
                  >
                    <input
                      checked={reminder === option}
                      className="sr-only"
                      name="提醒设置"
                      onChange={() => setReminder(option)}
                      type="radio"
                      value={option}
                    />
                    <Bell aria-hidden="true" size={15} />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={`${labelClassName} mt-4`}>
              差异化支持 <span className="font-semibold text-[#87938b]">（可选）</span>
              <textarea
                aria-label="差异化支持"
                className={`${inputClassName} min-h-20 resize-y leading-6`}
                placeholder="例如：允许使用步骤卡；提前完成的学生补充一种解法。"
                value={supportNote}
                onChange={(event) => setSupportNote(event.target.value)}
              />
            </label>
          </section>

          {error ? (
            <p
              className="rounded-2xl border border-[#e8c7a7] bg-[#fff4e8] px-4 py-3 text-sm font-bold text-[#8a542f]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <aside className="sticky top-0 hidden rounded-[26px] border border-[#d7e1d7] bg-[#f3f7f0]/88 p-5 shadow-[0_18px_42px_rgba(45,74,54,.08)] lg:block">
          <p className="text-xs font-black tracking-[0.15em] text-[#6a7d6f]">任务预览</p>
          <h3 className="mt-3 text-xl font-black tracking-[-0.025em] text-[#17271c]">
            {title.trim() || "未命名任务"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#66776c]">
            {objective.trim() || "填写学习目标后，学生会在这里看到这项任务的意义。"}
          </p>
          <div className="mt-5 grid gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-2xl bg-white/72 px-3 py-3 font-bold text-[#405747]">
              {selectedType.icon}
              {selectedType.label}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/72 px-3 py-3 font-bold text-[#405747]">
              {selectedSubmission.icon}
              {selectedSubmission.label}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/72 px-3 py-3 font-bold text-[#405747]">
              <Clock3 aria-hidden="true" size={18} />
              约 {estimatedMinutes} 分钟
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/72 px-3 py-3 font-bold text-[#405747]">
              {audienceKind === "class" ? (
                <Users aria-hidden="true" size={18} />
              ) : (
                <UserRound aria-hidden="true" size={18} />
              )}
              {audienceKind === "class"
                ? currentClass
                : selectedStudentNames.length > 0
                  ? `${selectedStudentNames.length} 名学生`
                  : "尚未选择学生"}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-[#d7e3d5] bg-white/62 p-4">
            <p className="text-xs font-black text-[#627468]">达成标准</p>
            <p className="mt-2 text-sm leading-6 text-[#405448]">
              {successCriteria.trim() || "填写一条可以被学生和教师共同判断的标准。"}
            </p>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#728077]">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
            草稿保存后可从教师视角检查，再决定是否发布。
          </p>
        </aside>
      </form>
    </Dialog>
  )
}

export default CreateTaskDialog
