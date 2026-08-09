import { useEffect, useState } from "react"
import {
  BookOpenCheck,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Save,
} from "lucide-react"
import {
  hasCompleteLessonAnalysis,
  hasCompleteAiDraft,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import type { TranscriptSegment } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { EmptyState } from "../../../components/shared/EmptyState"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type LessonTab = "transcript" | "recap" | "report" | "progress"

type LessonTabOption = {
  value: LessonTab

  label: string
}

const tabs: LessonTabOption[] = [
  { value: "transcript", label: "课堂转写" },
  { value: "recap", label: "学生复习卡" },
  { value: "report", label: "教师课堂报告" },
  { value: "progress", label: "课程进度" },
]

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

function TranscriptView({ transcript }: { transcript: TranscriptSegment[] }) {
  if (transcript.length === 0) {
    return (
      <EmptyState
        description="结束课堂录音后，转写内容会显示在这里。"
        title="暂无课堂转写"
      />
    )
  }

  return (
    <div className="grid gap-3">
      {transcript.map((segment) => (
        <article
          className="rounded-[22px] border border-white/75 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]"
          key={segment.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-[#22372a]">{segment.speaker}</strong>
            <span className="text-xs font-bold tabular-nums text-[#748278]">
              {formatTime(segment.startSeconds)}–
              {formatTime(segment.endSeconds)}
            </span>
          </div>
          <p className="mt-3 leading-7 text-[#435448]">{segment.body}</p>
        </article>
      ))}
    </div>
  )
}

export interface LessonDetailPageProps {
  lessonId: string
}

export function LessonDetailPage({ lessonId }: LessonDetailPageProps) {
  const {
    lessons,
    publishLesson,
    updateLessonRecap,
    updateLessonProgress,
  } = usePrototype()
  const lesson = lessons.find((item) => item.id === lessonId)
  const [tab, setTab] = useState<LessonTab>("transcript")
  const [recapDraft, setRecapDraft] = useState(lesson?.recap ?? "")
  const [publishOpen, setPublishOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [progress, setProgress] = useState(
    lesson?.progress.completedPercent ?? 0,
  )
  const [nextStep, setNextStep] = useState(lesson?.progress.nextStep ?? "")

  useEffect(() => {
    setRecapDraft(lesson?.recap ?? "")
    setProgress(lesson?.progress.completedPercent ?? 0)
    setNextStep(lesson?.progress.nextStep ?? "")
  }, [lesson?.recap, lesson?.progress.completedPercent, lesson?.progress.nextStep, lessonId])

  useEffect(() => {
    setTab("transcript")
    setNotice("")
  }, [lessonId])

  if (!lesson) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <GlassSurface className="rounded-[30px] p-8" weight="card">
          <EmptyState
            description="这节课堂可能已被移除，或链接中的课堂编号不正确。"
            title="没有找到这节课堂"
          />
        </GlassSurface>
      </div>
    )
  }

  const hasAnalysis = hasCompleteLessonAnalysis(lesson)
  const canPublish = hasCompleteAiDraft(lesson)

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-5 p-4 sm:p-6 xl:p-8">
      <GlassSurface className="rounded-[30px] p-5 sm:p-7" weight="light">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusChip
                tone={lesson.status === "published" ? "success" : "warning"}
              >
                {lesson.status === "published" ? "已发布" : "待教师确认"}
              </StatusChip>
              <StatusChip
                tone={
                  lesson.studentVisibility === "visible" ? "success" : "neutral"
                }
              >
                {lesson.studentVisibility === "visible" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Eye aria-hidden="true" size={14} />
                    学生可见
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <EyeOff aria-hidden="true" size={14} />
                    学生不可见
                  </span>
                )}
              </StatusChip>
            </div>
            <p className="text-sm font-black text-[#607365]">
              {lesson.className} · {lesson.subject} · {lesson.date}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#152119] sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#68776c]">
              {lesson.durationMinutes} 分钟课堂 · {lesson.progress.chapter}
            </p>
          </div>
          {lesson.status !== "published" && canPublish ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-black text-white shadow-[0_12px_25px_rgba(20,34,25,.18)]"
              onClick={() => setPublishOpen(true)}
              type="button"
            >
              <BookOpenCheck aria-hidden="true" size={18} />
              确认并发布
            </button>
          ) : lesson.status !== "published" ? (
            <p className="text-sm font-bold text-[#69776d]">
              请先完成本次 AI 课堂分析，再确认发布。
            </p>
          ) : null}
        </div>
      </GlassSurface>

      {notice ? (
        <div
          aria-live="polite"
          className="rounded-full border border-[#c9dcc9] bg-[#edf6ea] px-4 py-2 text-center text-sm font-black text-[#315c3d]"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <GlassSurface className="overflow-hidden rounded-[30px]" weight="card">
        <div
          aria-label="课堂详情"
          className="flex gap-2 overflow-x-auto border-b border-[#27442e]/10 p-3"
          role="tablist"
        >
          {tabs.map((item) => (
            <button
              aria-controls={`lesson-panel-${item.value}`}
              aria-selected={tab === item.value}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-black transition ${
                tab === item.value
                  ? "bg-[#24462f] text-white"
                  : "text-[#526259] hover:bg-white/65"
              }`}
              id={`lesson-tab-${item.value}`}
              key={item.value}
              onClick={() => setTab(item.value)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <section
          aria-labelledby={`lesson-tab-${tab}`}
          className="min-h-[430px] p-4 sm:p-6"
          id={`lesson-panel-${tab}`}
          role="tabpanel"
        >
          {tab === "transcript" ? (
            hasAnalysis ? <TranscriptView transcript={lesson.transcript} /> : <EmptyState
              description="本次课堂成功生成完整分析后，转写会显示在这里。"
              title="暂无课堂转写初稿"
            />
          ) : null}

          {tab === "recap" ? (
            hasAnalysis ? <div className="mx-auto grid max-w-4xl gap-5">
              <div className="text-center">
                <StatusChip tone="info">AI 草稿 · 教师可编辑</StatusChip>
                <h2 className="mt-4 text-2xl font-black text-[#17231b]">
                  给学生的复习卡
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6a786e]">
                  发布前请核对事实、表述和适用条件。
                </p>
              </div>
              <label className="grid gap-2 font-black text-[#2a4432]">
                复习卡内容
                <textarea
                  className="min-h-44 resize-y rounded-[24px] border border-white/90 bg-white/70 p-5 text-center text-base font-semibold leading-8 text-[#23352a] outline-none focus:ring-4 focus:ring-[#789b7d]/20"
                  onChange={(event) => setRecapDraft(event.target.value)}
                  value={recapDraft}
                />
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {lesson.recapTags.map((tag) => (
                  <span
                    className="rounded-full bg-[#edf1e9] px-3 py-2 text-sm font-bold text-[#536359]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[#24462f] px-5 py-3 font-black text-white"
                  onClick={() => {
                    updateLessonRecap(lesson.id, recapDraft)
                    setNotice("复习卡已保存")
                  }}
                  type="button"
                >
                  <Save aria-hidden="true" size={17} />
                  保存复习卡
                </button>
              </div>
            </div> : <EmptyState
              description="本次课堂成功生成完整分析后，学生复习卡会显示在这里。"
              title="暂无学生复习卡初稿"
            />
          ) : null}

          {tab === "report" ? (
            hasAnalysis ? (
              <div className="grid gap-4">
                <StatusChip tone="info">AI 初稿 · 教师需核对</StatusChip>
                <article className="rounded-[24px] border border-white/85 bg-white/60 p-5">
                  <h2 className="text-xl font-black text-[#1e3024]">教师课堂报告</h2>
                  <p className="mt-3 leading-7 text-[#536258]">{lesson.teacherReport}</p>
                </article>
                <section aria-label="AI 报告依据" className="rounded-[24px] border border-[#d4dfd2] bg-[#f5f8f2]/80 p-5">
                  <h2 className="font-black text-[#294530]">课堂依据 · AI 初稿</h2>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#526157]">
                    {lesson.evidence?.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              </div>
            ) : (
              <EmptyState
                description="本次课堂成功生成完整分析后，教师报告与依据会显示在这里。"
                title="暂无教师报告初稿"
              />
            )
          ) : null}

          {tab === "progress" ? (
            hasAnalysis ? <div className="mx-auto grid max-w-3xl gap-6">
              <div className="rounded-[24px] border border-[#d4dfd2] bg-[#f5f8f2]/80 p-5">
                <StatusChip tone="info">AI 初稿 · 进度建议</StatusChip>
                <p className="mt-3 leading-7 text-[#526157]">{lesson.progressSuggestion}</p>
              </div>
              <div className="text-center">
                <Flag
                  aria-hidden="true"
                  className="mx-auto text-[#66846c]"
                  size={28}
                />
                <h2 className="mt-3 text-2xl font-black text-[#17231b]">
                  {lesson.progress.chapter}
                </h2>
                <p className="mt-2 text-sm text-[#69776d]">
                  调整内容只用于当前高保真原型的页面演示。
                </p>
              </div>
              <label className="grid gap-2 font-black text-[#2b4633]">
                课程完成进度
                <input
                  className="rounded-2xl border border-white/90 bg-white/70 px-4 py-3"
                  max={100}
                  min={0}
                  onChange={(event) => setProgress(Number(event.target.value))}
                  type="number"
                  value={progress}
                />
              </label>
              <div
                aria-label={`当前进度 ${progress}%`}
                className="h-3 overflow-hidden rounded-full bg-[#dfe8dc]"
                role="progressbar"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-[#668d6c] transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <label className="grid gap-2 font-black text-[#2b4633]">
                下一步教学内容
                <input
                  className="rounded-2xl border border-white/90 bg-white/70 px-4 py-3"
                  onChange={(event) => setNextStep(event.target.value)}
                  value={nextStep}
                />
              </label>
              <div className="flex justify-center">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[#24462f] px-5 py-3 font-black text-white"
                  onClick={() => {
                    updateLessonProgress(lesson.id, progress, nextStep)
                    setNotice("课程进度保存成功 · 已同步到课堂记录")
                  }}
                  type="button"
                >
                  <Save aria-hidden="true" size={17} />
                  保存课程进度
                </button>
              </div>
            </div> : <EmptyState
              description="本次课堂成功生成完整分析后，课程进度建议会显示在这里。"
              title="暂无课程进度初稿"
            />
          ) : null}
        </section>
      </GlassSurface>

      <Dialog
        description="发布后学生将可以看到复习卡。课堂转写和教师报告仍只对教师可见。"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="rounded-full bg-[#eceee9] px-4 py-2.5 font-black text-[#5d685f]"
              onClick={() => setPublishOpen(false)}
              type="button"
            >
              继续检查
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-2.5 font-black text-white"
              onClick={() => {
                publishLesson(lesson.id)
                setPublishOpen(false)
                setNotice("课堂资料已发布")
              }}
              type="button"
            >
              <BookOpenCheck aria-hidden="true" size={17} />
              确认发布给学生
            </button>
          </div>
        }
        onClose={() => setPublishOpen(false)}
        open={publishOpen}
        title="发布课堂复习资料"
      >
        <div className="rounded-[22px] border border-[#d6e2d2] bg-[#f5f8f2] p-5">
          <div className="flex items-start gap-3">
            <FileText
              aria-hidden="true"
              className="mt-0.5 text-[#66846b]"
              size={21}
            />
            <p className="leading-7 text-[#46564b]">
              请确认复习卡已完成事实核对，且不包含仅供教师参考的 AI 推断。
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default LessonDetailPage
