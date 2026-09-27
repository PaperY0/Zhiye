import { useEffect, useState } from "react"
import { BookOpenCheck, CheckCircle2, Eye, EyeOff, ListChecks, Save, Send } from "lucide-react"
import { navigate } from "../../../app/routes"
import {
  hasCompleteLessonAnalysis,
  hasCompleteAiDraft,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import type { TranscriptSegment } from "../../../app/prototype/types"
import { EmptyState } from "../../../components/shared/EmptyState"
import { Dialog } from "../../../components/shared/Dialog"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type LessonTab = "transcript" | "recap" | "report" | "progress"
type SaveResult = { title: string; description: string } | null

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
  const [notice, setNotice] = useState("")
  const [saveResult, setSaveResult] = useState<SaveResult>(null)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [progress, setProgress] = useState(
    lesson?.progress.completedPercent ?? 0,
  )
  const [nextStep, setNextStep] = useState(lesson?.progress.nextStep ?? "")
  const [chapter, setChapter] = useState(lesson?.progress.chapter ?? "")

  useEffect(() => {
    setRecapDraft(lesson?.recap ?? "")
    setProgress(lesson?.progress.completedPercent ?? 0)
    setNextStep(lesson?.progress.nextStep ?? "")
    setChapter(lesson?.progress.chapter ?? "")
  }, [lesson?.recap, lesson?.progress.completedPercent, lesson?.progress.nextStep, lesson?.progress.chapter, lessonId])

  useEffect(() => {
    setTab("transcript")
    setNotice("")
    setSaveResult(null)
    setPublishConfirmOpen(false)
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
  const contentChapter = hasAnalysis ? (lesson.recapTags[0]?.trim() || lesson.title.trim()) : ""

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
          <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b8cdb9] bg-white/80 px-5 py-3 text-sm font-black text-[#284731]" onClick={() => { window.sessionStorage.setItem("zhiye-task-source-lesson", lesson.id); navigate({ role: "teacher", page: "tasks" }) }} type="button"><ListChecks aria-hidden="true" size={18} />根据课堂生成三题任务</button>
          {lesson.status !== "published" && canPublish ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-black text-white shadow-[0_12px_25px_rgba(20,34,25,.18)]"
              onClick={() => {
                setTab("recap")
                setNotice("请检查复习卡内容，确认无误后发布。")
              }}
              type="button"
            >
              <BookOpenCheck aria-hidden="true" size={18} />
              审核学生复习卡
            </button>
          ) : lesson.status !== "published" ? (
            <p className="text-sm font-bold text-[#69776d]">
              请先完成本次 AI 课堂分析，再确认发布。
            </p>
          ) : null}
          </div>
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
              onClick={(event) => {
                setTab(item.value)
                event.currentTarget.scrollIntoView?.({ block: "nearest", inline: "center" })
              }}
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
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-[#24462f]/15 bg-white px-5 py-3 font-black text-[#24462f]"
                  onClick={() => {
                    updateLessonRecap(lesson.id, recapDraft)
                    setSaveResult({
                      title: "复习卡已保存",
                      description: "修改已保存到这节课堂。复习卡仍是教师草稿，发布前学生不可见。",
                    })
                  }}
                  type="button"
                >
                  <Save aria-hidden="true" size={17} />
                  保存复习卡
                </button>
                {lesson.status !== "published" && canPublish ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-black text-white shadow-[0_10px_22px_rgba(20,34,25,.16)]"
                    onClick={() => setPublishConfirmOpen(true)}
                    type="button"
                  >
                    <Send aria-hidden="true" size={17} />
                    确认并发布
                  </button>
                ) : null}
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
                  <h2 className="text-xl font-black text-[#1e3024]">AI 对本节课的评价</h2>
                  <p className="mt-3 leading-7 text-[#536258]">{lesson.teacherReport}</p>
                </article>
                <section aria-label="下一节课改进建议" className="rounded-[24px] border border-[#d4dfd2] bg-[#f5f8f2]/80 p-5">
                  <h2 className="font-black text-[#294530]">AI 对下一节课的改进建议</h2>
                  <p className="mt-3 leading-7 text-[#526157]">{lesson.progressSuggestion}</p>
                  <p className="mt-3 text-sm text-[#607365]">仅供教师参考；请结合实际课堂情况选择是否采纳，并在课程进度中填写最终安排。</p>
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
            <div className="mx-auto grid max-w-3xl gap-6">
              <div className="rounded-[24px] border border-[#d4dfd2] bg-white p-5">
                <h2 className="text-xl font-black text-[#17231b]">教师确认的课程进度</h2>
                <p className="mt-2 text-sm leading-6 text-[#69776d]">先核对这节课实际讲到的章节或主题，再记录完成进度和下一步安排。</p>
              </div>
              {hasAnalysis && <details className="rounded-2xl border border-[#d4dfd2] bg-[#f5f8f2] p-4"><summary className="cursor-pointer font-bold text-[#294530]">查看 AI 的进度建议（可选）</summary><p className="mt-3 leading-7 text-[#526157]">{lesson.progressSuggestion}</p><button className="mt-3 rounded-xl border border-[#9ab59b] px-3 py-2 text-sm font-bold" onClick={() => setNextStep(lesson.progressSuggestion ?? "")} type="button">采纳到下一步安排</button></details>}
              {contentChapter && contentChapter !== chapter.trim() && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d4dfd2] bg-[#f5f8f2] p-4 text-sm"><div><p className="font-bold text-[#294530]">本节课堂内容：{contentChapter}</p><p className="mt-1 text-[#69776d]">转写生成的主题仅供参考，请核对后保存。</p></div><button className="min-h-10 rounded-full border border-[#9ab59b] bg-white px-4 font-bold text-[#294530]" onClick={() => setChapter(contentChapter)} type="button">填入当前章节</button></div>}
              <label className="grid gap-2 font-black text-[#2b4633]">当前章节<input className="min-w-0 rounded-2xl border border-[#d4dfd2] bg-white px-4 py-3 font-medium" onChange={(event) => setChapter(event.target.value)} placeholder="根据本节课填写章节或主题" value={chapter} /></label>
              <label className="grid gap-2 font-black text-[#2b4633]">
                课程完成进度
                <input
                  className="rounded-2xl border border-white/90 bg-white/70 px-4 py-3"
                  max={100}
                  min={0}
                  onChange={(event) => setProgress(Math.min(100, Math.max(0, Number(event.target.value))))}
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
                <textarea
                  className="min-h-24 resize-y rounded-2xl border border-[#d4dfd2] bg-white px-4 py-3 font-medium leading-6"
                  onChange={(event) => setNextStep(event.target.value)}
                  placeholder="例如：先复盘学生尚未掌握的步骤，再安排下一课"
                  value={nextStep}
                />
              </label>
              <div className="flex justify-center">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[#24462f] px-5 py-3 font-black text-white"
                  onClick={() => {
                    updateLessonProgress(lesson.id, progress, nextStep, chapter)
                    setSaveResult({
                      title: "课程进度已保存",
                      description: `已将 ${Math.min(100, Math.max(0, progress))}% 的进度和下一步教学内容保存到课堂记录。`,
                    })
                  }}
                  type="button"
                >
                  <Save aria-hidden="true" size={17} />
                  保存课程进度
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </GlassSurface>

      <Dialog
        description={`发布后，${lesson.className}的学生将立即看到这张复习卡。课堂转写与教师报告不会公开。`}
        footer={
          <>
            <button
              className="classroom-dialog-cancel"
              onClick={() => setPublishConfirmOpen(false)}
              type="button"
            >
              继续检查
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#24462f] px-5 text-sm font-black text-white"
              onClick={() => {
                updateLessonRecap(lesson.id, recapDraft)
                publishLesson(lesson.id, recapDraft)
                setPublishConfirmOpen(false)
                setNotice("复习卡已发布，学生现在可以查看。")
              }}
              type="button"
            >
              <Send aria-hidden="true" size={16} />
              确认发布
            </button>
          </>
        }
        onClose={() => setPublishConfirmOpen(false)}
        open={publishConfirmOpen}
        title={`发布“${lesson.title}”复习卡？`}
      >
        <div className="rounded-2xl bg-[#eef5ec] px-4 py-3 text-sm font-bold leading-6 text-[#3c5b43]">
          发布内容：{recapDraft}
        </div>
      </Dialog>

      <Dialog
        description={saveResult?.description}
        footer={
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#24462f] px-6 text-sm font-black text-white"
            onClick={() => setSaveResult(null)}
            type="button"
          >
            完成
          </button>
        }
        onClose={() => setSaveResult(null)}
        open={saveResult !== null}
        title={saveResult?.title ?? "保存完成"}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-[#eef5ec] px-4 py-4 text-sm font-bold text-[#3c5b43]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#4d7756]">
            <CheckCircle2 aria-hidden="true" size={21} />
          </span>
          保存成功，你可以继续编辑或返回课堂列表。
        </div>
      </Dialog>

    </div>
  )
}

export default LessonDetailPage
