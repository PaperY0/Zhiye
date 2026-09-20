import { ArrowRight, CircleAlert, Clock3, Mic, Sparkles, Waves } from "lucide-react"
import type { AppRoute } from "../../app/routes"
import { usePrototypeOptional } from "../../app/prototype/PrototypeContext"
import type { Lesson } from "../../app/prototype/types"

const activeStatusPriority: Lesson["status"][] = ["failed", "recording", "paused", "processing"]

function newestLesson(lessons: Lesson[]) {
  return [...lessons].sort((left, right) => right.date.localeCompare(left.date))[0]
}

function findNextLesson(lessons: Lesson[]) {
  const reviewDraft = newestLesson(
    lessons.filter((lesson) => lesson.status === "draft-ready" && lesson.recap.trim()),
  )
  if (reviewDraft) return reviewDraft

  for (const status of activeStatusPriority) {
    const lesson = newestLesson(lessons.filter((item) => item.status === status))
    if (lesson) return lesson
  }

  return newestLesson(lessons.filter((lesson) => lesson.status === "scheduled"))
}

function nextStepCopy(lesson: Lesson | undefined) {
  switch (lesson?.status) {
    case "failed":
      return { title: "重新处理课堂录音", description: "上次整理没有完成。原录音仍保留，可以返回课堂页面重试。", action: "去课堂重试", icon: CircleAlert }
    case "recording":
    case "paused":
      return { title: "继续课堂录音", description: lesson.status === "paused" ? "这节课堂录音已暂停，可以返回课堂继续。" : "课堂正在录音，返回课堂可查看当前状态。", action: "返回课堂", icon: Mic }
    case "processing":
      return { title: "等待课堂整理完成", description: "录音正在本机转写并生成初稿。完成后会出现在这里等待确认。", action: "查看整理进度", icon: Clock3 }
    case "scheduled":
      return { title: "开始下一节课堂", description: "录音结束后，知野会整理课堂内容；只有真实生成的初稿才会进入审核。", action: "开始课堂录音", icon: Mic }
    default:
      return { title: "开始下一节课堂", description: "当前没有待审核的复习卡。开始录音后，新的课堂进度会显示在这里。", action: "开始课堂录音", icon: Mic }
  }
}

export default function CurrentLessonStage({ onNavigate = () => undefined }: { onNavigate?: (route: AppRoute) => void }) {
  const prototype = usePrototypeOptional()
  const lessons = prototype?.lessons ?? []
  const students = prototype?.students ?? []

  if (prototype && students.length === 0) {
    return (
      <section aria-labelledby="current-lesson-title" className="workspace-task-stage flex flex-col" data-testid="current-lesson-stage">
        <p className="workspace-stage-kicker">下一步</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.055em] sm:text-4xl" id="current-lesson-title">先导入学生名单</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#68776e]">有了真实班级名单后，复习卡才能准确发布给对应学生。</p>
        <button className="workspace-primary-action mt-7 w-fit" onClick={() => onNavigate({ role: "teacher", page: "students" })} type="button">去导入学生<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
      </section>
    )
  }

  const lesson = findNextLesson(lessons)
  const isReviewDraft = lesson?.status === "draft-ready" && Boolean(lesson.recap.trim())

  if (!isReviewDraft) {
    const copy = nextStepCopy(lesson)
    const Icon = copy.icon
    return (
      <section aria-labelledby="current-lesson-title" className="workspace-task-stage flex flex-col" data-testid="current-lesson-stage">
        <p className="workspace-stage-kicker"><Sparkles aria-hidden="true" className="h-4 w-4" />现在要做</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.055em] sm:text-4xl" id="current-lesson-title">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68776e]">{copy.description}</p>
        <div className="workspace-next-step-card mt-8">
          <span className="workspace-next-step-icon"><Icon aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-[0.11em] text-[#718078]">{lesson ? "当前课堂" : "课堂入口"}</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#1d3023]">{lesson?.title || "录制并整理一节课堂"}</h2>
            {lesson ? <p className="mt-1 text-sm text-[#718078]">{lesson.className} · {lesson.progress.chapter}</p> : null}
          </div>
          <button className="workspace-primary-action" onClick={() => onNavigate({ role: "teacher", page: "classroom" })} type="button">{copy.action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </section>
    )
  }

  const recipientCount = students.filter((student) => student.className === lesson.className).length
  return (
    <section aria-labelledby="current-lesson-title" className="workspace-task-stage flex flex-col" data-testid="current-lesson-stage">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-stage-kicker"><Sparkles aria-hidden="true" className="h-4 w-4" />现在要做</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] sm:text-4xl" id="current-lesson-title">审核课堂复盘</h1>
          <h2 className="mt-4 text-xl font-black tracking-[-0.03em]">{lesson.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776e]">{lesson.durationMinutes} 分钟课堂已整理完成。确认后，{recipientCount} 名学生将看到这张复习卡。</p>
        </div>
        <span className="workspace-status-chip">待确认</span>
      </div>
      <section className="workspace-recap-sheet mt-7 flex flex-col" data-testid="current-lesson-review-card">
        <div className="workspace-recap-content flex flex-col" data-testid="current-lesson-review-content">
          <div className="flex flex-wrap items-center gap-3"><p className="text-xs font-black tracking-[0.11em] text-[#687b6c]">给学生的复习卡</p><span className="workspace-ai-chip">AI 初稿 · 可编辑</span></div>
          <p className="workspace-recap-copy mt-4 max-w-3xl text-lg font-semibold leading-8">{lesson.recap}</p>
          {lesson.recapTags.length > 0 ? <div className="workspace-recap-tags mt-5 flex flex-wrap gap-2">{lesson.recapTags.map((tag) => <span className="workspace-topic-tag" key={tag}>{tag}</span>)}</div> : null}
        </div>
        <div className="workspace-recap-actions mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#34583d]/10 pt-5">
          <button className="workspace-tertiary-action" onClick={() => onNavigate({ role: "teacher", page: "lesson-detail", lessonId: lesson.id })} type="button"><Waves aria-hidden="true" className="h-4 w-4" />查看课堂依据</button>
          <button className="workspace-primary-action" onClick={() => onNavigate({ role: "teacher", page: "lesson-detail", lessonId: lesson.id })} type="button">审核并发布<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </section>
    </section>
  )
}
