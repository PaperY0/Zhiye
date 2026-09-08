import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { Student, Task } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"

interface CreateTaskDialogProps {
  open: boolean
  students: Student[]
  taskCount: number
  onClose: () => void
  onCreate: (task: Task) => void
}

type AudienceKind = Task["audience"]["kind"]

const defaultDueAt = "2026-07-27T20:00"

export function CreateTaskDialog({
  open,
  students,
  taskCount,
  onClose,
  onCreate,
}: CreateTaskDialogProps) {
  const [type, setType] = useState<Task["type"]>("practice")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [audienceKind, setAudienceKind] = useState<AudienceKind>("class")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [dueAt, setDueAt] = useState(defaultDueAt)
  const [reminder, setReminder] = useState("截止前 2 小时")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setType("practice")
    setTitle("")
    setContent("")
    setAudienceKind("class")
    setSelectedStudentIds([])
    setDueAt(defaultDueAt)
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
    const normalizedContent = content.trim()

    if (!normalizedTitle || !normalizedContent || !dueAt) {
      setError("请填写任务标题、内容和截止时间。")
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
      id: `task-local-${taskCount + 1}`,
      title: normalizedTitle,
      type,
      content: normalizedContent,
      audience: {
        kind: audienceKind,
        label:
          audienceKind === "class"
            ? "五年级（2）班"
            : selectedStudentNames.join("、"),
        studentIds: audienceKind === "class" ? [] : selectedStudentIds,
      },
      dueAt: `${dueAt}:00+08:00`,
      reminder,
      status: "draft",
      completions: audienceStudentIds.map((studentId) => ({
        studentId,
        status: "not-started",
      })),
      createdAt: "2026-07-25T17:30:00+08:00",
    })
  }

  return (
    <Dialog
      description="设置内容、发布对象、截止时间和提醒方式；保存后可再次检查。"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="rounded-full border border-[#c9d6cb] bg-white/70 px-5 py-2.5 text-sm font-black text-[#52675a]"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="rounded-full bg-[#183021] px-5 py-2.5 text-sm font-black text-white shadow-md"
            form="create-teacher-task"
            type="submit"
          >
            保存草稿
          </button>
        </div>
      }
      onClose={onClose}
      open={open}
      title="新建任务"
    >
      <form
        className="grid gap-5"
        id="create-teacher-task"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2 text-sm font-bold text-[#465c4d]">
          任务类型
          <select
            className="rounded-2xl border border-[#cbd8cd] bg-white/75 px-4 py-3 text-[#17251b] outline-none focus:border-[#6f9275]"
            value={type}
            onChange={(event) => setType(event.target.value as Task["type"])}
          >
            <option value="practice">巩固练习</option>
            <option value="review">复习卡</option>
            <option value="quiz">测验</option>
            <option value="reading">预习阅读</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#465c4d]">
          任务标题
          <input
            className="rounded-2xl border border-[#cbd8cd] bg-white/75 px-4 py-3 text-[#17251b] outline-none focus:border-[#6f9275]"
            placeholder="例如：单位换算巩固练习"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#465c4d]">
          任务内容
          <textarea
            className="min-h-28 resize-y rounded-2xl border border-[#cbd8cd] bg-white/75 px-4 py-3 text-[#17251b] outline-none focus:border-[#6f9275]"
            placeholder="写明学生需要完成的内容和提交方式"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[#465c4d]">
            发布对象
            <select
              className="rounded-2xl border border-[#cbd8cd] bg-white/75 px-4 py-3 text-[#17251b] outline-none focus:border-[#6f9275]"
              value={audienceKind}
              onChange={(event) =>
                setAudienceKind(event.target.value as AudienceKind)
              }
            >
              <option value="class">五年级（2）班</option>
              <option value="students">指定学生</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#465c4d]">
            截止时间
            <input
              className="rounded-2xl border border-[#cbd8cd] bg-white/75 px-4 py-3 text-[#17251b] outline-none focus:border-[#6f9275]"
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold text-[#465c4d]">
          提醒设置
          <select
            className="rounded-2xl border border-[#cbd8cd] bg-white/75 px-4 py-3 text-[#17251b] outline-none focus:border-[#6f9275]"
            value={reminder}
            onChange={(event) => setReminder(event.target.value)}
          >
            <option>截止前 1 天</option>
            <option>截止前 2 小时</option>
            <option>截止前 30 分钟</option>
            <option>不提醒</option>
          </select>
        </label>

        {audienceKind === "students" ? (
          <fieldset className="rounded-[22px] border border-[#d5dfd6] bg-white/45 p-4">
            <legend className="px-2 text-sm font-black text-[#465c4d]">
              选择学生
            </legend>
            <div className="mt-2 grid max-h-48 gap-2 overflow-auto sm:grid-cols-2">
              {students.map((student) => (
                <label
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/70"
                  key={student.id}
                >
                  <input
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    type="checkbox"
                  />
                  {student.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {error ? (
          <p
            className="rounded-2xl bg-[#fff1e5] px-4 py-3 text-sm font-bold text-[#93542d]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}

export default CreateTaskDialog
