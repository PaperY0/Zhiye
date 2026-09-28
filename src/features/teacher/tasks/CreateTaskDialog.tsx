import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  Users,
} from "lucide-react"
import type { Lesson, PlanDraft, Quiz, QuizQuestion, Student, Task } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { getTeacherSettings, schoolClasses } from "../settings/teacherSettings"
import { generateDraft } from "../../../services/localAi"
import { toQuiz } from "../planning/generators"
import { QuestionEditor } from "../planning/QuizBuilder"

interface CreateTaskDialogProps {
  open: boolean
  students: Student[]
  lessons?: Lesson[]
  taskCount: number
  plans?: PlanDraft[]
  quizzes?: Quiz[]
  initialPlanId?: string | null
  initialLessonId?: string | null
  initialQuizId?: string | null
  initialStudentId?: string | null
  onClose: () => void
  onCreate: (task: Task, quiz?: Quiz) => void
}

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
    value: "reading",
    label: "课堂热身",
    description: "课前用一个问题唤起已有经验",
    icon: <Sparkles aria-hidden="true" size={19} />,
  },
  {
    value: "quiz",
    label: "三题自检",
    description: "根据课堂内容完成三道测试题",
    icon: <CheckCircle2 aria-hidden="true" size={19} />,
  },
]

const inputClassName =
  "min-h-12 min-w-0 w-full rounded-2xl border border-[#cfdbd0] bg-white/80 px-4 py-3 text-sm font-semibold text-[#17251b] shadow-[inset_0_1px_0_rgba(255,255,255,.95)] outline-none transition placeholder:text-[#87948b] focus:border-[#6f9275] focus:ring-4 focus:ring-[#6f9275]/15"
const labelClassName = "grid min-w-0 gap-2 text-sm font-black text-[#344d3d]"

function blankQuiz(title: string, lessonId?: string, subject: Quiz["subject"] = "数学"): Quiz {
  return {
    id: crypto.randomUUID(), title: title || "三题自检", subject, lessonId,
    status: "ready", createdAt: new Date().toISOString(),
    questions: Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(), prompt: "", type: "single-choice" as const,
      options: ["", "", "", ""], answer: "", explanation: "", score: 10,
    })),
  }
}

function validQuestion(question: QuizQuestion) {
  const options = question.options.map((item) => item.trim()).filter(Boolean)
  const answers = Array.isArray(question.answer) ? question.answer : question.type === "multiple-choice" ? question.answer.split("、") : [question.answer]
  return Boolean(question.prompt.trim() && question.explanation.trim() && question.score > 0 &&
    answers.length && answers.every((answer) => answer.trim()) &&
    (question.type === "short-answer" ||
      (options.length >= 2 && new Set(options).size === options.length && answers.every((answer) => options.includes(answer.trim())))))
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
  lessons = [],
  taskCount,
  plans = [],
  quizzes = [],
  initialPlanId,
  initialLessonId,
  initialQuizId,
  initialStudentId,
  onClose,
  onCreate,
}: CreateTaskDialogProps) {
  const [type, setType] = useState<Task["type"]>("practice")
  const [title, setTitle] = useState("")
  const [objective, setObjective] = useState("")
  const [successCriteria, setSuccessCriteria] = useState("")
  const [content, setContent] = useState("")
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>("text")
  const [selectedClass, setSelectedClass] = useState(getTeacherSettings().currentClass)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const reminder = "不提醒"
  const [error, setError] = useState("")
  const [sourcePlanId, setSourcePlanId] = useState("")
  const [sourceLessonId, setSourceLessonId] = useState("")
  const [quizDraft, setQuizDraft] = useState<Quiz | null>(null)
  const [generating, setGenerating] = useState(false)
  const generationToken = useRef(0)
  const currentClass = getTeacherSettings().currentClass
  const availableClasses = schoolClasses

  useEffect(() => {
    if (!open) { generationToken.current += 1; return }
    const source = plans.find((item) => item.id === initialPlanId)
    const lesson = lessons.find((item) => item.id === initialLessonId)
    const quiz = quizzes.find((item) => item.id === initialQuizId)
    setType(lesson || quiz ? "quiz" : source ? "reading" : "practice")
    setSourcePlanId(source?.id ?? "")
    setSourceLessonId(lesson?.id ?? "")
    const targetStudent = students.find((student) => student.id === initialStudentId)
    setSelectedClass(lesson?.className ?? targetStudent?.className ?? currentClass)
    setSelectedStudentId(targetStudent?.id ?? null)
    setTitle(lesson ? `${lesson.title} · 课堂三题自检` : quiz?.title ?? (source ? `${source.chapter} · 课堂热身` : ""))
    setObjective(lesson ? `检查学生对“${lesson.title}”的理解` : quiz ? `完成${quiz.title}，检查当前知识的掌握情况` : source?.objective ?? "")
    setSuccessCriteria(lesson || quiz ? "完成三道题，并根据解析订正" : source?.assessment ?? "")
    setContent(lesson || quiz ? "完成三道课堂自检题，并说明解题依据。" : source?.context || source?.outline[0] || "")
    setSubmissionMode(lesson || quiz ? "online" : "text")
    setQuizDraft(quiz ? { ...structuredClone(quiz), id: crypto.randomUUID(), questions: quiz.questions.map((question) => ({ ...structuredClone(question), id: crypto.randomUUID() })) } : lesson ? blankQuiz(`${lesson.title}课堂自检`, lesson.id, lesson.subject) : null)
    setError("")
    if (lesson) void generateQuiz(lesson)
  }, [open, initialPlanId, initialLessonId, initialQuizId, initialStudentId])

  function choosePlan(id: string) {
    generationToken.current += 1
    setGenerating(false)
    setError("")
    const source = plans.find((item) => item.id === id)
    setSourcePlanId(id)
    setSourceLessonId("")
    if (!source) {
      setQuizDraft((current) => current ? { ...current, lessonId: undefined, sourcePlanId: undefined } : null)
      return
    }
    setQuizDraft(null)
    setSelectedClass(currentClass)
    setType("reading")
    setTitle(`${source.chapter} · 课堂热身`)
    setObjective(source.objective)
    setSuccessCriteria(source.assessment ?? "")
    setContent(source.context || source.outline[0] || "")
    setSubmissionMode("text")
  }

  function chooseQuiz(id: string) {
    generationToken.current += 1
    setGenerating(false)
    setError("")
    const quiz = quizzes.find((item) => item.id === id)
    if (!quiz) return
    setSourcePlanId("")
    setSourceLessonId(quiz.lessonId ?? "")
    setSelectedClass(lessons.find((lesson) => lesson.id === quiz.lessonId)?.className ?? currentClass)
    setType("quiz")
    setTitle(quiz.title)
    setObjective(`完成${quiz.title}，检查当前知识的掌握情况`)
    setSuccessCriteria(`完成 ${quiz.questions.length} 道题，并查看解析订正错误`)
    setContent("完成三道题，并核对解题依据。")
    setSubmissionMode("online")
    setQuizDraft({ ...structuredClone(quiz), id: crypto.randomUUID(), questions: quiz.questions.map((question) => ({ ...structuredClone(question), id: crypto.randomUUID() })) })
  }

  function chooseLesson(id: string) {
    generationToken.current += 1
    setGenerating(false)
    setError("")
    const lesson = lessons.find((item) => item.id === id)
    setSourceLessonId(id)
    setSourcePlanId("")
    if (!lesson) {
      setQuizDraft((current) => current ? { ...current, lessonId: undefined, sourcePlanId: undefined } : null)
      return
    }
    setSelectedClass(lesson.className)
    setType("quiz")
    setTitle(`${lesson.title} · 课堂三题自检`)
    setObjective(`检查学生对“${lesson.title}”的理解`)
    setSuccessCriteria("完成三道题，并根据解析订正")
    setContent("完成三道课堂自检题，并说明解题依据。")
    setSubmissionMode("online")
    setQuizDraft(blankQuiz(`${lesson.title}课堂自检`, lesson.id, lesson.subject))
    void generateQuiz(lesson)
  }

  async function generateQuiz(sourceLesson?: Lesson) {
    const lesson = sourceLesson ?? lessons.find((item) => item.id === sourceLessonId)
    const plan = lesson ? undefined : plans.find((item) => item.id === sourcePlanId)
    const topic = lesson?.title ?? plan?.chapter ?? title.trim()
    if (!topic) { setError("请先填写任务标题或选择课堂，再生成三道题。") ; return }
    const requestId = ++generationToken.current
    setGenerating(true)
    setError("")
    try {
      const classroomContent = lesson ? [
        ...lesson.transcript.map((segment) => segment.body), lesson.recap,
        lesson.teacherReport ?? "", lesson.progressSuggestion ?? "",
      ].filter(Boolean).join("；").slice(0, 5000) : ""
      const focus = lesson
        ? `仅依据以下课堂内容设计三道不同考查角度的题：${classroomContent || lesson.title}`
        : plan ? `教学目标：${plan.objective}；教学流程：${plan.outline.join("；")}；课堂检验：${plan.assessment ?? ""}`
          : objective || "检查概念、应用与解释"
      const response = await generateDraft("quiz", { title: `${topic}课堂自检`, topic, difficulty: "递进", focus }) as { content?: unknown }
      const generated = toQuiz(response.content)
      if (requestId !== generationToken.current) return
      setQuizDraft({ ...generated, subject: lesson?.subject ?? plan?.subject ?? "数学", lessonId: lesson?.id, sourcePlanId: plan?.id, status: "ready", questions: generated.questions.map((question) => ({ ...question, explanation: question.explanation || `参考答案：${Array.isArray(question.answer) ? question.answer.join("、") : question.answer}` })) })
      setType("quiz")
      setSubmissionMode("online")
    } catch (cause) {
      if (requestId === generationToken.current) setError(cause instanceof Error ? cause.message : "三题生成失败，请重试或手动编写")
    } finally {
      if (requestId === generationToken.current) setGenerating(false)
    }
  }

  async function fillWithAi() {
    if (!title.trim() || !objective.trim()) { setError("先填写标题和学习目标，再让 AI 补全任务。") ; return }
    const requestId = ++generationToken.current
    setGenerating(true)
    setError("")
    try {
      const source = plans.find((item) => item.id === sourcePlanId)
      const result = await generateDraft("task-draft", {
        title, objective, taskType: type,
        sourcePlan: source ? `${source.chapter}；${source.outline.join("；")}；${source.extension}` : "教师直接创建任务",
        learningEvidence: getTeacherSettings().includeEvidence ? source?.evidence ?? [] : [],
      }) as { content?: { title?: string; objective?: string; successCriteria?: string; content?: string } }
      const draft = result.content
      if (!draft?.title || !draft.objective || !draft.successCriteria || !draft.content) throw new Error("AI 返回的任务草稿不完整")
      if (requestId !== generationToken.current) return
      setTitle(draft.title); setObjective(draft.objective); setSuccessCriteria(draft.successCriteria); setContent(draft.content)
    } catch (cause) {
      if (requestId === generationToken.current) setError(cause instanceof Error ? cause.message : "生成失败，请重试")
    } finally {
      if (requestId === generationToken.current) setGenerating(false)
    }
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
      !normalizedContent
    ) {
      setError("请补全任务标题、学习目标、达成标准和任务说明。")
      return
    }
    if (!selectedClass && !selectedStudentId) {
      setError("请选择发布班级。")
      return
    }
    let quiz: Quiz | undefined
    if (type === "quiz") {
      if (!quizDraft || quizDraft.questions.length !== 3 || quizDraft.questions.some((question) => !validQuestion(question))) {
        setError("请完善三道题的题干、选项、答案和解析后保存。")
        return
      }
      quiz = { ...quizDraft, title: `${normalizedTitle} · 三题自检`, status: "ready", questions: quizDraft.questions.map((question) => ({ ...question, options: question.options.map((option) => option.trim()).filter(Boolean) })) }
    }
    const targetStudent = students.find((student) => student.id === selectedStudentId)
    const audienceStudentIds = targetStudent ? [targetStudent.id] : students.filter((student) => student.className === selectedClass).map((student) => student.id)

    onCreate({
      id: `task-local-${Date.now()}-${taskCount + 1}`,
      title: normalizedTitle,
      type,
      sourcePlanId: sourcePlanId || undefined,
      sourceLessonId: sourceLessonId || undefined,
      sourceQuizId: quiz?.id,
      objective: normalizedObjective,
      successCriteria: normalizedCriteria,
      content: normalizedContent,
      submissionMode: type === "quiz" ? "online" : submissionMode,
      audience: {
        kind: targetStudent ? "students" : "class",
        label: targetStudent ? targetStudent.name : selectedClass,
        studentIds: targetStudent ? [targetStudent.id] : [],
      },
      reminder,
      status: "draft",
      completions: audienceStudentIds.map((studentId) => ({
        studentId,
        status: "not-started",
      })),
      createdAt: new Date().toISOString(),
    }, quiz)
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
              disabled={generating}
              form="create-teacher-task"
              type="submit"
            >
              {generating ? "正在生成…" : "保存并预览"}
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
        className="mx-auto grid w-full max-w-3xl min-w-0 gap-5"
        id="create-teacher-task"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5">
          <section className="min-w-0 rounded-2xl border border-[#dce7da] bg-white p-4 sm:p-5"><h3 className="font-black">从课堂或教案开始</h3><p className="mt-1 text-sm text-[#718076]">课堂生成三题自检；教案带入课堂热身。也可直接填写。</p><div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2"><label className={labelClassName}>关联课堂<select aria-label="关联课堂" className={inputClassName} value={sourceLessonId} onChange={(event) => chooseLesson(event.target.value)}><option value="">不关联课堂</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} · {lesson.className}</option>)}</select></label><label className={labelClassName}>关联教案<select aria-label="关联教案" className={inputClassName} value={sourcePlanId} onChange={(event) => choosePlan(event.target.value)}><option value="">不关联教案</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label></div>{quizzes.length > 0 && <details className="mt-3 min-w-0 rounded-xl border border-[#e0e8df] p-3"><summary className="cursor-pointer text-sm font-bold">使用已有三题题组</summary><label className={`${labelClassName} mt-3`}>已有题组<select aria-label="已有题组" className={inputClassName} defaultValue="" onChange={(event) => chooseQuiz(event.target.value)}><option value="">请选择题组</option>{quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select></label></details>}</section>
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
             <label className={labelClassName}>任务形式<select aria-label="任务形式" className={inputClassName} value={type} onChange={(event) => { generationToken.current += 1; setGenerating(false); const next = event.target.value as Task["type"]; setType(next); setSubmissionMode(next === "quiz" ? "online" : "text"); if (next === "quiz" && !quizDraft) setQuizDraft(blankQuiz(title, sourceLessonId || undefined, lessons.find((lesson) => lesson.id === sourceLessonId)?.subject ?? "数学")) }}>{taskTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
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
             {type !== "quiz" && <label className={`${labelClassName} mt-4`}>学生提交方式<select aria-label="学生提交方式" className={inputClassName} value={submissionMode} onChange={(event) => setSubmissionMode(event.target.value as SubmissionMode)}><option value="text">文字回答</option><option value="photo">拍照提交</option><option value="no-submit">无需提交（线下完成）</option></select></label>}
             {type !== "quiz" && <button className="mt-4 min-h-11 rounded-xl border border-[#aec7b0] px-4 text-sm font-bold text-[#315a3a] disabled:opacity-50" disabled={generating} onClick={() => void fillWithAi()} type="button">{generating ? "AI 正在起草…" : "用 AI 补全任务草稿"}</button>}
          </section>

          {type === "quiz" && <section className="min-w-0 rounded-[26px] border border-white/85 bg-white/58 p-4 shadow-[0_16px_38px_rgba(49,78,58,.06)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><SectionHeading description="三题会随任务保存，发布前可逐题校对。" step="3" title="课堂三题自检" /><button className="min-h-11 rounded-xl border border-[#aec7b0] px-4 text-sm font-bold text-[#315a3a] disabled:opacity-50" disabled={generating} onClick={() => void generateQuiz()} type="button">{generating ? "正在生成三题…" : "重新生成三题"}</button></div>
            {error && <p className="mb-4 rounded-xl border border-[#e8c7a7] bg-[#fff4e8] px-4 py-3 text-sm font-bold text-[#8a542f]" role="alert">{error}</p>}
            <div className="grid min-w-0 gap-4">{quizDraft?.questions.map((question, index) => <QuestionEditor key={question.id} index={index} question={question} onChange={(next) => { generationToken.current += 1; setGenerating(false); setQuizDraft((current) => current ? { ...current, questions: current.questions.map((item, itemIndex) => itemIndex === index ? next : item) } : current) }} />)}</div>
          </section>}

          <section className="min-w-0 rounded-[26px] border border-white/85 bg-white/58 p-4 shadow-[0_16px_38px_rgba(49,78,58,.06)] sm:p-5">
            <SectionHeading description={initialStudentId ? "可只布置给当前学生，或改为授课班级。保存后先预览，再决定是否发布。" : "选择你授课的班级。保存后先预览，再决定是否发布。"} step={type === "quiz" ? "4" : "3"} title="发布对象" />
            <fieldset><legend className="sr-only">发布对象</legend><div className="grid gap-2 sm:grid-cols-2">{initialStudentId && students.find((student) => student.id === initialStudentId) ? <ChoiceCard checked={selectedStudentId === initialStudentId} description="仅该学生可见" icon={<Users aria-hidden="true" size={18} />} label={students.find((student) => student.id === initialStudentId)!.name} name="发布对象" onChange={() => setSelectedStudentId(initialStudentId)} value={initialStudentId} /> : null}{availableClasses.map((className) => <ChoiceCard key={className} checked={!selectedStudentId && selectedClass === className} description="该班全体学生" icon={<Users aria-hidden="true" size={18} />} label={className} name="发布对象" onChange={() => { setSelectedStudentId(null); setSelectedClass(className) }} value={className} />)}</div></fieldset>
          </section>

          {error && type !== "quiz" ? (
            <p
              className="rounded-2xl border border-[#e8c7a7] bg-[#fff4e8] px-4 py-3 text-sm font-bold text-[#8a542f]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

      </form>
    </Dialog>
  )
}

export default CreateTaskDialog
