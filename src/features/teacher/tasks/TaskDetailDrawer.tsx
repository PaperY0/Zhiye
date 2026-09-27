import { useState } from "react"
import type { Quiz, Student, Task, TaskStatus } from "../../../app/prototype/types"
import { Drawer } from "../../../components/shared/Drawer"
import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"

interface TaskDetailDrawerProps {
  open: boolean
  task: Task | null
  students: Student[]
  quizzes?: Quiz[]
  onClose: () => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onReminder: (task: Task, unfinishedCount: number) => void
  onReviewCompletion?: (task: Task, studentId: string, score?: number) => void
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

const submissionLabels: Record<NonNullable<Task["submissionMode"]>, string> = {
  online: "在线作答",
  photo: "拍照提交",
  text: "文字说明",
  "no-submit": "无需提交",
}

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100)
}

export function TaskDetailDrawer({
  open,
  task,
  students,
  quizzes = [],
  onClose,
  onStatusChange,
  onReminder,
  onReviewCompletion,
}: TaskDetailDrawerProps) {
  const [scores, setScores] = useState<Record<string, string>>({})
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
  const quiz = quizzes.find((item) => item.id === task.sourceQuizId)

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
          {task.objective ? (
            <div className="mt-5 rounded-[22px] border border-[#dce6db] bg-[#edf4ea] p-4">
              <p className="text-xs font-black tracking-[0.12em] text-[#68806d]">学习目标</p>
              <p className="mt-2 font-bold leading-7 text-[#263b2d]">{task.objective}</p>
            </div>
          ) : null}
          <div className="mt-4">
            <p className="text-xs font-black tracking-[0.12em] text-[#718076]">任务说明</p>
            <p className="mt-2 leading-7 text-[#627469]">{task.content}</p>
          </div>
          {task.successCriteria ? (
            <div className="mt-4 rounded-[22px] border border-[#e5ddbd] bg-[#fff9e7] p-4">
              <p className="text-xs font-black tracking-[0.12em] text-[#7b6b3f]">达成标准</p>
              <p className="mt-2 font-bold leading-7 text-[#544b31]">{task.successCriteria}</p>
            </div>
          ) : null}
          {quiz && <section className="mt-4 rounded-[22px] border border-[#dce6db] bg-white/70 p-4" aria-label="三道测试题预览"><h3 className="font-black">三道测试题</h3><ol className="mt-3 grid gap-3">{quiz.questions.map((question, index) => <li className="rounded-xl bg-[#f2f6f0] p-3 text-sm" key={question.id}><p className="font-bold">{index + 1}. {question.prompt}</p>{question.options.length > 0 && <p className="mt-2 text-[#627469]">{question.options.join(" · ")}</p>}<p className="mt-2 text-[#395742]">参考答案：{Array.isArray(question.answer) ? question.answer.join("、") : question.answer}</p>{question.explanation && <p className="mt-1 text-[#627469]">{question.explanation}</p>}</li>)}</ol></section>}
          <dl className="mt-5 grid gap-3 rounded-[22px] bg-white/55 p-4 text-sm sm:grid-cols-2">
            {task.dueAt && <div>
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
            </div>}
            {task.submissionMode ? (
              <div>
                <dt className="font-bold text-[#718076]">学习证据</dt>
                <dd className="mt-1 font-black">{submissionLabels[task.submissionMode]}</dd>
              </div>
            ) : null}
            {task.estimatedMinutes ? (
              <div>
                <dt className="font-bold text-[#718076]">预计用时</dt>
                <dd className="mt-1 font-black">约 {task.estimatedMinutes} 分钟</dd>
              </div>
            ) : null}
          </dl>
          {task.supportNote ? (
            <div className="mt-4 rounded-[22px] bg-[#eef3f6] p-4 text-sm">
              <p className="font-black text-[#536875]">差异化支持</p>
              <p className="mt-1 leading-6 text-[#667680]">{task.supportNote}</p>
            </div>
          ) : null}
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
                    className="rounded-2xl border border-white/80 bg-white/45 px-4 py-3"
                    key={completion.studentId}
                  >
                    <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 font-bold">
                      {studentNames.get(completion.studentId) ?? "学生"}
                      {completion.responseText && <span className="mt-1 block whitespace-pre-wrap text-xs font-normal text-[#627469]">{completion.responseText}</span>}
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
                    </div>
                    {quiz && completion.answers && <details className="mt-2 text-xs"><summary className="cursor-pointer font-bold text-[#416449]">查看测验作答与参考答案</summary><ol className="mt-2 grid gap-2">{quiz.questions.map((question) => <li key={question.id}><strong>{question.prompt}</strong><p>学生：{completion.answers?.[question.id] ?? "未作答"}</p><p>参考：{Array.isArray(question.answer) ? question.answer.join("、") : question.answer}</p><p>{question.explanation}</p></li>)}</ol></details>}
                    {completion.status === "submitted" && onReviewCompletion && <div className="mt-3 flex flex-wrap items-end gap-2"><label className="text-xs font-bold">总分<input aria-label={`评分${studentNames.get(completion.studentId) ?? "学生"}`} className="ml-2 w-20 rounded-lg border border-[#c9d6cb] px-2 py-1" min="0" type="number" value={scores[completion.studentId] ?? String(completion.score ?? "")} onChange={(event) => setScores((current) => ({ ...current, [completion.studentId]: event.target.value }))} /></label><button className="rounded-full bg-[#183021] px-3 py-1.5 text-xs font-bold text-white" onClick={() => onReviewCompletion(task, completion.studentId, scores[completion.studentId] === undefined ? completion.score : Number(scores[completion.studentId]))} type="button">完成查看</button></div>}
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
