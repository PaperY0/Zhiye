import { useMemo, useState } from "react"
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Play,
  MessageCircleQuestion,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { isCorrectAnswer, isObjectiveQuestion, scoreQuiz } from "../../../app/prototype/quizScoring"
import type { Task } from "../../../app/prototype/types"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import { PinyinText } from "../../../components/pinyin/PinyinText"
import { Dialog } from "../../../components/shared/Dialog"

const STUDENT_ID = "student-lin-xiaoyu"

type StudentTaskState = "not-started" | "in-progress" | "completed"
type TaskFilter = "all" | "pending" | "completed"

const taskTypeLabels: Record<Task["type"], string> = {
  review: "复习",
  practice: "练习",
  quiz: "自检",
  reading: "课堂热身",
}

const submissionLabels: Record<NonNullable<Task["submissionMode"]>, string> = {
  online: "在线作答",
  photo: "拍照提交",
  text: "文字说明",
  "no-submit": "无需提交",
}

function initialStudentState(task: Task): StudentTaskState {
  const completion = task.completions.find(
    (item) => item.studentId === STUDENT_ID,
  )
  if (completion?.status === "submitted" || completion?.status === "reviewed") {
    return "completed"
  }
  if (completion?.status === "in-progress") return "in-progress"
  if (task.status === "completed") return "completed"
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

function instructionLines(value: string) {
  return value
    .replace(/\s*(?=第[一二三四五六七八九十]+步[：:]?)/g, "\n")
    .replace(/(?<![\d.])\s*(?=[1-9]\d*[.、．](?!\d))/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function StudentTasksPage() {
  const { tasks, quizzes, students, updateTaskCompletion, addMistake } = usePrototype()
  const studentClass = students.find((student) => student.id === STUDENT_ID)?.className
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [responses, setResponses] = useState<Record<string, string>>({})
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "draft" &&
          (task.audience.kind === "class" && task.audience.label === studentClass ||
            task.audience.studentIds.includes(STUDENT_ID)),
      ),
    [tasks, studentClass],
  )
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    const taskId = window.sessionStorage.getItem("zhiye-student-task-open-id")
    window.sessionStorage.removeItem("zhiye-student-task-open-id")
    return taskId
  })
  const [notice, setNotice] = useState("")
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId)
  const selectedState = selectedTask ? initialStudentState(selectedTask) : null
  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedTask?.sourceQuizId)
  const filteredTasks = visibleTasks.filter((task) => {
    const state = initialStudentState(task)
    if (filter === "pending") return state !== "completed"
    if (filter === "completed") return state === "completed"
    return true
  })
  const pendingCount = visibleTasks.filter(
    (task) => initialStudentState(task) !== "completed",
  ).length
  const completedCount = visibleTasks.length - pendingCount

  return (
    <section className="role-page role-page-flow">
      <header className="role-page-header">
        <div>
          <p className="role-page-kicker">
            李老师发布给你的学习安排
          </p>
          <h1 className="role-page-title">
            <PinyinText text="我的任务" />
          </h1>
          <p className="role-page-description">
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
                ? "border border-[#bed7c1] bg-[#dceedd] text-[#416449] shadow-md"
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
          const state = initialStudentState(task)
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
                {task.objective ?? task.content}
              </p>
              {task.dueAt && <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#76847b]">
                <CalendarClock aria-hidden="true" size={16} />
                截止 {formatDueAt(task.dueAt)}
              </div>}
              <button
                aria-label={`打开${task.title}`}
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#bed7c1] bg-[#dceedd] px-4 py-3 text-sm font-black text-[#416449] shadow-lg shadow-[#527a5a]/10 transition hover:-translate-y-0.5"
                onClick={() => { setNotice(""); setSelectedTaskId(task.id) }}
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
        <Dialog
          description="李老师布置"
          footer={
            <>
              {notice ? (
                <p aria-live="polite" className="w-full rounded-xl bg-[#e7f1e5] px-4 py-2 text-sm font-bold text-[#36563d]" role="status">
                  {selectedTask.completions.find((item) => item.studentId === STUDENT_ID)?.status === "reviewed" && notice.includes("等待老师") ? "老师已查看这份任务" : notice}
                </p>
              ) : null}
              {selectedState === "not-started" ? (
                <button
                  className="min-h-12 rounded-2xl border border-[#bed7c1] bg-[#dceedd] px-5 font-black text-[#416449]"
                  onClick={() => {
                    updateTaskCompletion(selectedTask.id, STUDENT_ID, "in-progress")
                    setNotice("任务已开始，进度已同步")
                  }}
                  type="button"
                >
                  开始任务
                </button>
              ) : null}
              {selectedState === "in-progress" ? (
                <button
                  className="min-h-12 rounded-2xl border border-[#bed7c1] bg-[#dceedd] px-5 font-black text-[#416449]"
                  onClick={() => {
                    if (selectedQuiz && selectedQuiz.questions.some((question) => !answers[question.id]?.trim())) { setNotice("请先完成所有测验题目"); return }
                    if (selectedTask.sourceQuizId && !selectedQuiz) { setNotice("测验题目暂不可用，请联系老师"); return }
                    if (!selectedQuiz && selectedTask.submissionMode === "text" && !responses[selectedTask.id]?.trim()) { setNotice("请先写下回答再提交"); return }
                    const result = selectedQuiz ? { answers, score: scoreQuiz(selectedQuiz, answers) } : selectedTask.submissionMode === "text" ? { responseText: responses[selectedTask.id].trim() } : undefined
                    updateTaskCompletion(selectedTask.id, STUDENT_ID, "submitted", result)
                    if (selectedQuiz) selectedQuiz.questions.filter((question) => isObjectiveQuestion(question) && !isCorrectAnswer(question, answers[question.id])).forEach((question) => addMistake(STUDENT_ID, {
                      id: `mistake-quiz-${selectedTask.id}-${question.id}`,
                      subject: selectedQuiz.subject,
                      knowledgePoint: selectedQuiz.title,
                      prompt: question.prompt,
                      cause: `我的回答：${answers[question.id] ?? "未作答"}`,
                      explanation: `正确答案：${Array.isArray(question.answer) ? question.answer.join("、") : question.answer}${question.explanation ? `\n${question.explanation}` : ""}`,
                      mastery: "new", source: "quiz", taskId: selectedTask.id,
                      createdAt: new Date().toISOString(),
                    }))
                    setNotice("任务已提交，等待老师查看")
                  }}
                  type="button"
                >
                  标记为已完成
                </button>
              ) : null}
              {selectedState === "completed" ? (
                <p className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#e2efe1] px-5 font-black text-[#315b3b]">
                  <CheckCircle2 aria-hidden="true" size={19} />
                  {selectedTask.completions.find((item) => item.studentId === STUDENT_ID)?.status === "reviewed" ? "老师已查看" : "已完成，等待老师查看"}
                </p>
              ) : null}
            </>
          }
          onClose={() => setSelectedTaskId(null)}
          open
          title={selectedTask.title}
        >
            <div className="flex flex-wrap gap-2">
              <StatusChip
                tone={stateTone(selectedState!)}
              >
                {stateLabel(selectedState!)}
              </StatusChip>
              <StatusChip>{taskTypeLabels[selectedTask.type]}</StatusChip>
            </div>
            <div className="mt-6 rounded-3xl border border-white/80 bg-white/50 p-5">
              {selectedTask.objective ? (
                <>
                  <p className="text-sm font-bold text-[#5e7363]">这次要学会</p>
                  <p className="mt-2 text-base font-black leading-7 text-[#26362b]">
                    {selectedTask.objective}
                  </p>
                  <div className="my-4 h-px bg-[#dce5db]" />
                </>
              ) : null}
              <p className="text-sm font-bold text-[#5e7363]">怎么完成</p>
              <div className="mt-2 space-y-3 text-base leading-7 text-[#26362b]">
                {instructionLines(selectedTask.content).map((line, index) => (
                  <p className="break-words" key={index}>{line}</p>
                ))}
              </div>
            </div>
            {selectedTask.successCriteria ? (
              <div className="mt-4 rounded-3xl border border-[#e5ddbd] bg-[#fff9e7]/85 p-5">
                <p className="text-sm font-bold text-[#79683b]">做到这些就算完成</p>
                <div className="mt-2 space-y-2 leading-7 text-[#51482f]">
                  {instructionLines(selectedTask.successCriteria).map((line, index) => (
                    <p className="break-words" key={index}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {selectedTask.dueAt && <div className="rounded-2xl bg-[#eef3e9]/75 p-4">
                <dt className="text-[#718077]">截止时间</dt>
                <dd className="mt-1 font-bold text-[#26362b]">
                  {formatDueAt(selectedTask.dueAt)}
                </dd>
              </div>}
              <div className="rounded-2xl bg-[#eef3e9]/75 p-4">
                <dt className="text-[#718077]">预计用时</dt>
                <dd className="mt-1 font-bold text-[#26362b]">
                  {selectedTask.estimatedMinutes
                    ? `约 ${selectedTask.estimatedMinutes} 分钟`
                    : "由老师安排"}
                </dd>
              </div>
              {selectedTask.submissionMode ? (
                <div className="rounded-2xl bg-[#eef3e9]/75 p-4 sm:col-span-2">
                  <dt className="text-[#718077]">提交方式</dt>
                  <dd className="mt-1 font-bold text-[#26362b]">
                    {submissionLabels[selectedTask.submissionMode]}
                  </dd>
                </div>
              ) : null}
            </dl>
            <a className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#b9cfbd] bg-white/75 px-4 py-3 text-sm font-black text-[#345841] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#345841]" href={`#/student/ask/${encodeURIComponent(selectedTask.id)}`}>
              <MessageCircleQuestion aria-hidden="true" size={19} />
              这项任务有疑问？去询问 AI
            </a>
            {selectedTask.supportNote ? (
              <div className="mt-4 rounded-2xl bg-[#edf3f6] p-4 text-sm">
                <p className="font-bold text-[#58707b]">老师给你的支持</p>
                <p className="mt-1 leading-6 text-[#61737c]">{selectedTask.supportNote}</p>
              </div>
            ) : null}

            {selectedQuiz && selectedState === "in-progress" ? <fieldset className="mt-5 max-h-[35dvh] overflow-auto rounded-2xl border border-[#dce7da] bg-white p-4"><legend className="px-2 font-black">测验题目</legend><div className="grid gap-5">{selectedQuiz.questions.map((question, index) => <div key={question.id}><p className="font-bold">{index + 1}. {question.prompt}</p>{question.type === "short-answer" ? <textarea aria-label={`第${index + 1}题答案`} className="mt-2 min-h-20 w-full rounded-xl border p-2" value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} /> : <div className={question.type === "true-false" ? "mt-3 grid grid-cols-2 gap-2" : "mt-3 grid gap-2"}>{(question.type === "true-false" ? ["正确", "错误"] : question.options).map((option) => { const selected = question.type === "multiple-choice" ? (answers[question.id] ?? "").split("、").includes(option) : answers[question.id] === option; return <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#dce7da] bg-[#fbfdfb] px-4 py-2 text-sm font-bold has-[:checked]:border-[#638b69] has-[:checked]:bg-[#e8f3e7] focus-within:ring-2 focus-within:ring-[#638b69]" key={option}><input checked={selected} className="accent-[#416b49]" name={question.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: question.type === "multiple-choice" ? (selected ? (current[question.id] ?? "").split("、").filter((item) => item !== option).join("、") : [...(current[question.id] ?? "").split("、").filter(Boolean), option].join("、")) : option }))} type={question.type === "multiple-choice" ? "checkbox" : "radio"} />{option}</label> })}</div>}</div>)}</div></fieldset> : null}
            {selectedQuiz && selectedState === "completed" ? <section className="mt-5 max-h-[35dvh] overflow-auto rounded-2xl border border-[#dce7da] bg-white p-4"><h3 className="font-black">测验反馈</h3><p className="mt-1 text-sm text-[#718076]">自动得分：{selectedTask.completions.find((item) => item.studentId === STUDENT_ID)?.score ?? 0} / {selectedQuiz.questions.filter(isObjectiveQuestion).reduce((total, question) => total + question.score, 0)} 分。{selectedQuiz.questions.some((question) => question.type === "short-answer") && selectedTask.completions.find((item) => item.studentId === STUDENT_ID)?.status !== "reviewed" ? "简答题等待教师查看。" : "可查看每题结果。"}</p><ol className="mt-3 grid gap-3">{selectedQuiz.questions.map((question, index) => { const response = selectedTask.completions.find((item) => item.studentId === STUDENT_ID)?.answers?.[question.id] ?? ""; const expected = Array.isArray(question.answer) ? question.answer : [question.answer]; const correct = isCorrectAnswer(question, response); return <li className="rounded-xl bg-[#f4f7f2] p-3 text-sm" key={question.id}><strong>{index + 1}. {question.prompt}</strong><p className="mt-1">你的回答：{response || "未作答"}</p><p className="mt-1 font-bold">{question.type === "short-answer" ? "等待教师批阅" : correct ? "回答正确" : "回答错误 · 已加入错题本"}</p><p className="mt-1">参考答案：{expected.join("、")}</p><p className="mt-1 text-[#5b7260]">{question.explanation}</p></li> })}</ol></section> : null}
            {!selectedQuiz && selectedTask.submissionMode === "text" && selectedState === "in-progress" ? <label className="mt-5 block text-sm font-bold">我的回答<textarea className="mt-2 min-h-28 w-full rounded-2xl border border-[#dce7da] bg-white p-3 font-normal" placeholder="写下思路或完成过程" value={responses[selectedTask.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [selectedTask.id]: event.target.value }))} /></label> : null}
            {!selectedQuiz && selectedTask.submissionMode === "text" && selectedState === "completed" ? <div className="mt-5 rounded-2xl bg-white p-4 text-sm"><strong>我的回答</strong><p className="mt-2 whitespace-pre-wrap">{selectedTask.completions.find((item) => item.studentId === STUDENT_ID)?.responseText ?? ""}</p></div> : null}

        </Dialog>
      ) : null}
      {notice && !selectedTask ? (
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
