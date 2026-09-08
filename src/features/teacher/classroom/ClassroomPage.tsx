import { useMemo, useState } from "react"
import { CalendarDays, Clock3, Eye, EyeOff, Mic, RefreshCw } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Lesson, LessonStatus } from "../../../app/prototype/types"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"
import { RecordingPanel } from "./RecordingPanel"
import type { LessonAnalysisResult } from "../../../services/lessonAnalysis"

type LessonFilter =
  | "all"
  | "scheduled"
  | "in-progress"
  | "processing"
  | "failed"
  | "draft-ready"
  | "published"

type FilterOption = {
  value: LessonFilter

  label: string
}

type LessonStatusMeta = {
  label: string

  tone: StatusTone
}

const filters: FilterOption[] = [
  { value: "all", label: "全部" },
  { value: "scheduled", label: "待开始" },
  { value: "in-progress", label: "进行中" },
  { value: "processing", label: "处理中" },
  { value: "failed", label: "处理失败" },
  { value: "draft-ready", label: "AI 初稿" },
  { value: "published", label: "已发布" },
]

const statusMeta: Record<LessonStatus, LessonStatusMeta> = {
  scheduled: { label: "待开始", tone: "neutral" },
  recording: { label: "录音中", tone: "critical" },
  paused: { label: "已暂停", tone: "warning" },
  processing: { label: "处理中", tone: "info" },
  failed: { label: "处理失败", tone: "critical" },
  "draft-ready": { label: "AI 初稿", tone: "warning" },
  published: { label: "已发布", tone: "success" },
}

function LessonCard({
  lesson,
  onOpen,
}: {
  lesson: Lesson
  onOpen: (lessonId: string) => void
}) {
  const status = statusMeta[lesson.status]
  return (
    <GlassSurface
      className="grid gap-5 rounded-[28px] p-5 sm:grid-cols-[1fr_auto] sm:items-center"
      weight="card"
    >
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
          <span className="text-xs font-bold tracking-wide text-[#718075]">
            {lesson.subject} · {lesson.grade}
          </span>
        </div>
        <h2 className="text-xl font-black tracking-[-0.03em] text-[#17231b]">
          {lesson.title}
        </h2>
        <p className="mt-1 text-sm text-[#69776c]">
          {lesson.className} · {lesson.date}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#536459]">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={15} />
            {lesson.durationMinutes} 分钟
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw aria-hidden="true" size={15} />
            {lesson.syncStatus === "synced"
              ? "已同步"
              : lesson.syncStatus === "syncing"
                ? "同步中"
                : "仅本机"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {lesson.studentVisibility === "visible" ? (
              <Eye aria-hidden="true" size={15} />
            ) : (
              <EyeOff aria-hidden="true" size={15} />
            )}
            {lesson.studentVisibility === "visible" ? "学生可见" : "学生不可见"}
          </span>
        </div>
      </div>
      <button
        aria-label={`查看${lesson.title}`}
        className="rounded-full border border-white/90 bg-white/70 px-5 py-3 text-sm font-black text-[#24462f] shadow-sm transition hover:bg-white"
        onClick={() => onOpen(lesson.id)}
        type="button"
      >
        查看课堂
      </button>
    </GlassSurface>
  )
}

export interface ClassroomPageProps {
  onNavigate: (route: AppRoute) => void
}

export function ClassroomPage({ onNavigate }: ClassroomPageProps) {
  const {
    createLesson,
    lessons,
    updateLessonAnalysis,
    updateLessonStatus,
    updateLessonTitle,
  } = usePrototype()
  const [filter, setFilter] = useState<LessonFilter>("all")
  const [recordingOpen, setRecordingOpen] = useState(false)
  const [recordingLessonId, setRecordingLessonId] = useState<string | null>(null)

  const filteredLessons = useMemo(
    () =>
      filter === "all"
        ? lessons
        : lessons.filter((lesson) =>
            filter === "in-progress"
              ? lesson.status === "recording" || lesson.status === "paused"
              : lesson.status === filter,
          ),
    [filter, lessons],
  )

  const openLesson = (lessonId: string) =>
    onNavigate({ role: "teacher", page: "lesson-detail", lessonId })

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-6 p-4 sm:p-6 xl:p-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-black text-[#55705b]">
            <CalendarDays aria-hidden="true" size={17} />
            课堂记录与发布
          </p>
          <h1 className="text-3xl font-black tracking-[-0.045em] text-[#142018] sm:text-4xl">
            课堂
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68766c]">
            管理录音、查看 AI 初稿，并在教师确认后向学生发布复习卡。
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-black text-white shadow-[0_12px_25px_rgba(20,34,25,.18)]"
          onClick={() => {
            setRecordingLessonId(createLesson())
            setRecordingOpen(true)
          }}
          type="button"
        >
          <Mic aria-hidden="true" size={18} />
          开始新课堂录音
        </button>
      </header>

      <GlassSurface
        aria-label="课堂状态筛选"
        className="flex flex-wrap gap-2 rounded-[24px] p-2"
        role="group"
        weight="light"
      >
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.value}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              filter === item.value
                ? "bg-[#24462f] text-white shadow-sm"
                : "text-[#506157] hover:bg-white/60"
            }`}
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </GlassSurface>

      <section aria-label="课堂列表" className="grid gap-4">
        {filteredLessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} onOpen={openLesson} />
        ))}
        {filteredLessons.length === 0 ? (
          <GlassSurface
            className="rounded-[28px] p-10 text-center"
            weight="card"
          >
            <p className="text-xl font-black text-[#243a2a]">
              {lessons.length === 0 ? "还没有课堂" : "当前筛选下暂无课堂"}
            </p>
            <p className="mt-2 text-sm text-[#75847b]">
              {lessons.length === 0
                ? "先去录音，课堂结束后这里会出现课堂记录和复习卡。"
                : "试试切换筛选条件，或开始一节新的课堂录音。"}
            </p>
            {lessons.length === 0 ? (
              <button
                className="mt-5 rounded-full bg-[#173022] px-5 py-3 text-sm font-black text-white"
                onClick={() => {
                  setRecordingLessonId(createLesson())
                  setRecordingOpen(true)
                }}
                type="button"
              >
                开始新课堂录音
              </button>
            ) : null}
          </GlassSurface>
        ) : null}
      </section>

      <RecordingPanel
        lessonTitle={
          lessons.find((lesson) => lesson.id === recordingLessonId)?.title ??
          "新课堂录音"
        }
        onClose={() => setRecordingOpen(false)}
        onTitleChange={(title) => {
          if (recordingLessonId) updateLessonTitle(recordingLessonId, title)
        }}
        onStatusChange={(status) => {
          if (recordingLessonId) updateLessonStatus(recordingLessonId, status)
        }}
        onOpenDraft={() => {
          setRecordingOpen(false)
          if (recordingLessonId) openLesson(recordingLessonId)
        }}
        onAnalysisComplete={(result: LessonAnalysisResult, durationSeconds: number) => {
          if (!recordingLessonId) return
          updateLessonAnalysis(
            recordingLessonId,
            result.transcript,
            result.recap,
            result.recapTags,
            result.nextStep,
            durationSeconds / 60,
            result.teacherReport,
            result.progressSuggestion,
            result.evidence,
          )
        }}
        open={recordingOpen}
      />
    </div>
  )
}

export default ClassroomPage
