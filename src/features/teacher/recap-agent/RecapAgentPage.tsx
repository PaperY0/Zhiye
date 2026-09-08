import { ArrowLeft, Bot, Play, ShieldCheck } from "lucide-react"
import { useState } from "react"
import type { AppRoute } from "../../../app/routes"
import { usePrototypeOptional } from "../../../app/prototype/PrototypeContext"
import type { Lesson, RecapJob } from "../../../app/prototype/types"
import { retryRecapJob } from "../../../services/localAi"
import RecapDeliverablesReview from "./RecapDeliverablesReview"
import RecapEvidenceDrawer from "./RecapEvidenceDrawer"
import RecapPlanTimeline from "./RecapPlanTimeline"

export function createDemoRecapJob(): RecapJob {
  const evidence = [
    { id: "evidence-01", quote: "分子和分母要同时乘同一个不为零的数。", startSeconds: 85, endSeconds: 112, source: "transcript" as const },
    { id: "evidence-02", quote: "如果只把分子乘二，分数是不是也一样？", startSeconds: 952, endSeconds: 978, source: "transcript" as const },
  ]
  return {
    id: "recap-job-demo-01",
    goal: "为明天准备 5 分钟补讲",
    status: "needs-review",
    steps: [
      { key: "transcribe", status: "succeeded", summary: "已完成课堂转写", evidenceIds: [] },
      { key: "extract-evidence", status: "succeeded", summary: "已提取 2 条课堂证据", evidenceIds: evidence.map((item) => item.id) },
      { key: "identify-gaps", status: "succeeded", summary: "已识别 1 条待教师确认的学习缺口", evidenceIds: evidence.map((item) => item.id) },
      { key: "generate-deliverables", status: "succeeded", summary: "已生成四项教师可审核成果", evidenceIds: evidence.map((item) => item.id) },
      { key: "teacher-review", status: "pending", summary: "等待教师审核后发布", evidenceIds: [] },
    ],
    evidence,
    inferences: [{ id: "inference-01", statement: "需要补讲操作条件，并用一道题确认学生能完整复述规则。", evidenceIds: evidence.map((item) => item.id) }],
    deliverables: {
      studentRecap: "本节课重点：分子和分母要同时乘同一个不为零的数。",
      teacherReport: "已根据 2 条课堂原话生成复盘草稿，等待教师审核。",
      remedialPlan: "用 5 分钟补讲上述规则，再用一道变式题确认学生能独立应用。",
      practiceQuestions: ["请用自己的话复述本节课规则，并说明其中的必要条件。", "如果只改变其中一个量，结果会发生什么？请举例说明。"],
      evidence,
      inferences: [{ id: "inference-01", statement: "需要补讲操作条件，并用一道题确认学生能完整复述规则。", evidenceIds: evidence.map((item) => item.id) }],
    },
  }
}

function createLessonRecapJob(lesson: Lesson): RecapJob {
  const evidence = (lesson.evidence ?? []).map((quote, index) => ({
    id: `lesson-evidence-${index + 1}`,
    quote,
    startSeconds: index * 120,
    endSeconds: index * 120 + 30,
    source: "transcript" as const,
  }))
  return {
    ...createDemoRecapJob(),
    id: `recap-job-${lesson.id}`,
    goal: lesson.progress.nextStep || "为下一节课准备精准补讲",
    deliverables: {
      ...createDemoRecapJob().deliverables!,
      studentRecap: lesson.recap,
      teacherReport: lesson.teacherReport ?? "教师报告待审核。",
      remedialPlan: lesson.progressSuggestion ?? "根据课堂证据安排 5 分钟补讲。",
      evidence,
      inferences: [],
    },
    evidence,
    inferences: [],
  }
}

export default function RecapAgentPage({
  onNavigate,
  initialJob,
}: {
  onNavigate: (route: AppRoute) => void
  initialJob?: RecapJob
}) {
  const prototype = usePrototypeOptional()
  const sharedLesson = prototype?.lessons.find((lesson) => lesson.id === "lesson-fractions") ?? prototype?.lessons[0]
  const [job, setJob] = useState<RecapJob>(initialJob ?? prototype?.recapJobs[0] ?? (sharedLesson ? createLessonRecapJob(sharedLesson) : createDemoRecapJob()))
  const [retryError, setRetryError] = useState<string | null>(null)
  const lessonPublished = sharedLesson?.status === "published"
  const isPublished = lessonPublished || job.steps.some((step) => step.key === "teacher-review" && step.status === "succeeded")
  const displayedJob: RecapJob = lessonPublished
    ? {
        ...job,
        steps: job.steps.map((step) => step.key === "teacher-review" ? { ...step, status: "succeeded", summary: "已完成发布" } : step) as RecapJob["steps"],
      }
    : job
  const failedStep = displayedJob.steps.find((step) => step.status === "failed")

  async function handleRetry(stepKey: RecapJob["steps"][number]["key"]) {
    setRetryError(null)
    try {
      const recovered = await retryRecapJob(job.id, stepKey)
      setJob(recovered)
      prototype?.upsertRecapJob(recovered)
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "重试失败，请查看具体工具错误")
    }
  }

  function handlePublish(draft: NonNullable<RecapJob["deliverables"]>) {
    const publishedJob = {
      ...job,
      deliverables: draft,
      steps: job.steps.map((step) =>
        step.key === "teacher-review"
          ? { ...step, status: "succeeded", summary: "已完成发布", evidenceIds: draft.evidence.map((item) => item.id) }
          : step,
      ) as RecapJob["steps"],
    }
    setJob(publishedJob)
    prototype?.upsertRecapJob(publishedJob)
    const lesson = prototype?.lessons.find((item) => item.id === "lesson-fractions") ?? prototype?.lessons[0]
    if (prototype && lesson) {
      prototype.publishLesson(lesson.id, draft.studentRecap)
    }
  }

  return (
    <section className="min-h-[calc(100dvh-24px)] bg-[#f1f6ef]/65 px-4 py-5 text-[#18321f] sm:px-6 lg:px-8" data-testid="recap-agent-page">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button type="button" onClick={() => onNavigate({ role: "teacher", page: "workspace" })} className="mb-3 inline-flex items-center gap-1.5 text-xs font-black text-[#6d8371] hover:text-[#315a3b]"><ArrowLeft aria-hidden="true" size={14} />返回工作台</button>
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-[15px] bg-[#dfeee1] text-[#557a5c]"><Bot aria-hidden="true" size={22} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#829487]">Teacher workflow / AI employee</p><h1 className="mt-1 text-[clamp(1.7rem,3vw,2.55rem)] font-black tracking-[-0.06em]">课堂复盘数字员工</h1></div></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3.5 py-2 text-xs font-black text-[#557359]"><ShieldCheck aria-hidden="true" size={15} />教师确认后才会发布给学生</div>
        </header>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#dce9d8] bg-white/70 px-5 py-4 shadow-[0_12px_28px_rgba(46,78,54,0.06)]">
          <div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#829487]">Teacher goal</p><p className="mt-1 text-base font-black text-[#24472c]">{displayedJob.goal}</p></div>
          <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${job.status === "failed" ? "bg-[#ffe7de] text-[#a7553d]" : "bg-[#e5f0e3] text-[#4d7053]"}`}>{job.status === "failed" ? "需要处理失败" : isPublished ? "已发布" : "等待教师审核"}</span><button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-[#172019] px-4 py-2.5 text-xs font-black text-white hover:bg-[#2a3c2d]"><Play aria-hidden="true" size={13} />运行复盘</button></div>
        </div>

        {retryError ? <div role="alert" className="mb-4 rounded-[15px] border border-[#dfb6a3] bg-[#fff5f0] px-4 py-3 text-sm font-bold text-[#9f553f]">{retryError}</div> : null}
        {failedStep ? <div className="mb-4 rounded-[15px] border border-[#dfb6a3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9f553f]">阻塞原因：{failedStep.error ?? failedStep.summary}</div> : null}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(360px,0.88fr)_minmax(0,1.12fr)]">
          <RecapPlanTimeline job={displayedJob} onRetry={handleRetry} />
          <div className="space-y-5"><RecapEvidenceDrawer evidence={displayedJob.evidence} inferences={displayedJob.inferences} />{displayedJob.deliverables ? <RecapDeliverablesReview goal={displayedJob.goal} title="分数的基本性质" deliverables={displayedJob.deliverables} published={isPublished} onPublish={handlePublish} /> : null}</div>
        </div>
      </div>
    </section>
  )
}
