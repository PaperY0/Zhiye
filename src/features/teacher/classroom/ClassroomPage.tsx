import { useMemo, useState } from "react"
import {
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  Mic,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Lesson, LessonStatus } from "../../../app/prototype/types"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { Dialog } from "../../../components/shared/Dialog"
import { ToastRegion, type ToastMessage } from "../../../components/shared/ToastRegion"
import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"
import { RecordingPanel } from "./RecordingPanel"
import type { LessonAnalysisResult } from "../../../services/lessonAnalysis"
import { useTeacherSettings } from "../settings/teacherSettings"

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
  onDelete,
}: {
  lesson: Lesson
  onOpen: (lessonId: string) => void
  onDelete: (lesson: Lesson) => void
}) {
  const status = statusMeta[lesson.status]
  return (
    <article className="classroom-lesson-row">
      <div className="classroom-lesson-content">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
          <span className="text-xs font-bold tracking-wide text-[#718075]">
            {lesson.subject} · {lesson.grade}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-black tracking-[-0.025em] text-[#17231b] sm:text-xl">
          {lesson.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-[#69776c]">
          {lesson.className} · {lesson.date}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#536459]">
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
      <div className="classroom-lesson-actions">
        <button
          aria-label={`删除${lesson.title}`}
          className="classroom-delete-button"
          onClick={() => onDelete(lesson)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
          <span>删除</span>
        </button>
        <button
          aria-label={`查看${lesson.title}`}
          className="classroom-open-button"
          onClick={() => onOpen(lesson.id)}
          type="button"
        >
          查看课堂
        </button>
      </div>
    </article>
  )
}

export interface ClassroomPageProps {
  onNavigate: (route: AppRoute) => void
}

export function ClassroomPage({ onNavigate }: ClassroomPageProps) {
  const teacherSettings = useTeacherSettings()
  const {
    createLesson,
    deleteLesson,
    restoreLesson,
    lessons,
    updateLessonAnalysis,
    updateLessonStatus,
    updateLessonTitle,
  } = usePrototype()
  const [filter, setFilter] = useState<LessonFilter>("all")
  const [recordingOpen, setRecordingOpen] = useState(false)
  const [recordingLessonId, setRecordingLessonId] = useState<string | null>(null)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((item) => [
          item.value,
          item.value === "all"
            ? lessons.length
            : lessons.filter((lesson) =>
                item.value === "in-progress"
                  ? lesson.status === "recording" || lesson.status === "paused"
                  : lesson.status === item.value,
              ).length,
        ]),
      ) as Record<LessonFilter, number>,
    [lessons],
  )

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
    <div className="classroom-page mx-auto grid w-full max-w-[1180px] gap-5 p-4 sm:p-6 xl:gap-6 xl:px-8 xl:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-extrabold text-[#55705b]">
            <CalendarDays aria-hidden="true" size={17} />
            课堂记录与发布
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em] text-[#142018] sm:text-[2.75rem]">
            课堂
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68766c] sm:text-[0.95rem]">
            管理录音、查看 AI 初稿，并在教师确认后向学生发布复习卡。
          </p>
        </div>
        <button
          className="classroom-record-button"
          onClick={() => {
            setRecordingLessonId(createLesson({
              className: teacherSettings.currentClass,
              chapter: teacherSettings.chapter,
            }))
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
        className="classroom-filter-bar"
        role="group"
        weight="light"
      >
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.value}
            className={`classroom-filter-button ${
              filter === item.value
                ? "classroom-filter-button--active"
                : ""
            }`}
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >
            <span>{item.label}</span>
            <span aria-hidden="true" className="classroom-filter-count">
              {filterCounts[item.value]}
            </span>
          </button>
        ))}
      </GlassSurface>

      <section aria-label="课堂列表" className="classroom-list-panel">
        {filteredLessons.length > 0 ? (
          <div className="classroom-list-heading">
            <div>
              <h2>课堂记录</h2>
              <p>{filter === "all" ? `共 ${filteredLessons.length} 节课堂` : `${filters.find((item) => item.value === filter)?.label} · ${filteredLessons.length} 节`}</p>
            </div>
          </div>
        ) : null}
        <div className="classroom-list-items">
          {filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onDelete={setLessonToDelete}
              onOpen={openLesson}
            />
          ))}
        </div>
        {filteredLessons.length === 0 ? (
          <div className="p-10 text-center sm:p-14">
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
                  setRecordingLessonId(createLesson({
                    className: teacherSettings.currentClass,
                    chapter: teacherSettings.chapter,
                  }))
                  setRecordingOpen(true)
                }}
                type="button"
              >
                开始新课堂录音
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <Dialog
        description={
          lessonToDelete?.status === "published"
            ? "这节课堂已向学生发布。删除后，学生将无法继续查看对应复习卡。"
            : "课堂记录及其 AI 初稿会被一并删除。"
        }
        footer={
          <>
            <button
              className="classroom-dialog-cancel"
              onClick={() => setLessonToDelete(null)}
              type="button"
            >
              取消
            </button>
            <button
              className="classroom-dialog-delete"
              onClick={() => {
                if (!lessonToDelete) return
                const deletedLesson = lessonToDelete
                deleteLesson(deletedLesson.id)
                setToasts([{
                  id: `lesson-deleted-${deletedLesson.id}`,
                  title: `已删除“${deletedLesson.title}”`,
                  description: "可在离开本页前撤销这次操作。",
                  tone: "warning",
                  actionLabel: "撤销删除",
                  onAction: () => {
                    restoreLesson(deletedLesson)
                    setToasts([])
                  },
                }])
                setLessonToDelete(null)
              }}
              type="button"
            >
              删除课堂
            </button>
          </>
        }
        onClose={() => setLessonToDelete(null)}
        open={lessonToDelete !== null}
        title={`删除“${lessonToDelete?.title ?? "课堂"}”？`}
      >
        <div className="classroom-delete-notice">
          <Trash2 aria-hidden="true" size={20} />
          <p>删除后可从页面通知中立即撤销。</p>
        </div>
      </Dialog>

      <ToastRegion
        label="课堂操作通知"
        onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
        toasts={toasts}
      />

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
            result.title,
          )
          if (teacherSettings.lessonReadyNotification) {
            setToasts([{
              id: `lesson-ready-${recordingLessonId}`,
              title: "课堂 AI 初稿已完成",
              description: `“${result.title}”已按当前教师设置生成。`,
              tone: "success",
            }])
          }
        }}
        open={recordingOpen}
      />
    </div>
  )
}

export default ClassroomPage
