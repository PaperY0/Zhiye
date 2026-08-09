import { useEffect, useRef, useState } from "react"
import { Mic, Pause, Play, Sparkles, Square } from "lucide-react"
import { Dialog } from "../../../components/shared/Dialog"
import { StatusChip } from "../../../components/shared/StatusChip"
import {
  analyzeLessonAudio,
  type LessonAnalysisResult,
} from "../../../services/lessonAnalysis"

export type RecordingState =
  | "idle"
  | "recording"
  | "paused"
  | "processing"
  | "draft-ready"
  | "failed"

const stateLabels: Record<RecordingState, string> = {
  idle: "等待开始",
  recording: "录音中",
  paused: "已暂停",
  processing: "正在整理课堂内容",
  "draft-ready": "AI 初稿已就绪",
  failed: "处理失败",
}

export interface RecordingPanelProps {
  open: boolean
  lessonTitle: string
  onClose: () => void
  onTitleChange: (title: string) => void
  onOpenDraft: () => void
  onAnalysisComplete?: (result: LessonAnalysisResult, durationSeconds: number) => void
  onStatusChange?: (status: Exclude<RecordingState, "idle"> | "scheduled") => void
}

export function RecordingPanel({
  open,
  lessonTitle,
  onClose,
  onTitleChange,
  onOpenDraft,
  onAnalysisComplete,
  onStatusChange,
}: RecordingPanelProps) {
  const [status, setStatus] = useState<RecordingState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef<number | null>(null)
  const analysisAbortRef = useRef<AbortController | null>(null)
  const canceledRef = useRef(false)
  const recordingAttemptRef = useRef(0)
  const permissionPendingRef = useRef(false)

  function stopStreamTracks(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop())
  }

  function stopTracks() {
    stopStreamTracks(streamRef.current)
    streamRef.current = null
  }

  function cancelRecording({ restoreLessonStatus = false } = {}) {
    const shouldRestoreLessonStatus =
      restoreLessonStatus &&
      (permissionPendingRef.current ||
        recorderRef.current !== null ||
        analysisAbortRef.current !== null ||
        status === "recording" ||
        status === "paused" ||
        status === "processing")
    canceledRef.current = true
    recordingAttemptRef.current += 1
    permissionPendingRef.current = false
    analysisAbortRef.current?.abort()
    analysisAbortRef.current = null
    if (recorderRef.current) {
      recorderRef.current.onstop = null
      recorderRef.current.ondataavailable = null
      recorderRef.current = null
    }
    stopTracks()
    chunksRef.current = []
    recordingStartedAtRef.current = null
    if (shouldRestoreLessonStatus) {
      setStatus("idle")
      onStatusChange?.("scheduled")
    }
  }

  useEffect(() => {
    if (open) {
      canceledRef.current = false
      setStatus("idle")
      setErrorMessage("")
    }
    return () => {
      cancelRecording()
    }
  }, [open])

  const changeStatus = (nextStatus: Exclude<RecordingState, "idle">) => {
    setStatus(nextStatus)
    onStatusChange?.(nextStatus)
  }

  async function submitAudio(audio: Blob, durationSeconds: number) {
    changeStatus("processing")
    const controller = new AbortController()
    analysisAbortRef.current = controller
    try {
      const result = await analyzeLessonAudio(audio, controller.signal)
      if (controller.signal.aborted || canceledRef.current) return
      onAnalysisComplete?.(result, durationSeconds)
      changeStatus("draft-ready")
    } catch (error) {
      if (controller.signal.aborted || canceledRef.current) return
      setErrorMessage(
        error instanceof Error ? error.message : "本地 AI 处理失败，请检查服务日志。",
      )
      changeStatus("failed")
    } finally {
      if (analysisAbortRef.current === controller) analysisAbortRef.current = null
    }
  }

  function stopRecording() {
    if (recorderRef.current) {
      recorderRef.current.stop()
      recorderRef.current = null
      return
    }

    setErrorMessage("当前浏览器没有可用的 MediaRecorder，无法录制真实课堂音频。请使用 Chrome 或 Edge。")
    changeStatus("failed")
  }

  async function startRecording() {
    canceledRef.current = false
    setErrorMessage("")
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) {
      setErrorMessage("当前浏览器不支持真实录音，请使用 Chrome 或 Edge 并允许麦克风权限。")
      changeStatus("failed")
      return
    }

    const attempt = ++recordingAttemptRef.current
    permissionPendingRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (canceledRef.current || attempt !== recordingAttemptRef.current) {
        stopStreamTracks(stream)
        return
      }
      permissionPendingRef.current = false
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      streamRef.current = stream
      recorderRef.current = recorder
      recordingStartedAtRef.current = Date.now()
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        if (canceledRef.current) return
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        })
        stopTracks()
        const startedAt = recordingStartedAtRef.current ?? Date.now()
        void submitAudio(blob, Math.max(0, (Date.now() - startedAt) / 1000))
      }
      recorder.start()
      changeStatus("recording")
    } catch (error) {
      if (canceledRef.current || attempt !== recordingAttemptRef.current) return
      permissionPendingRef.current = false
      setErrorMessage(
        error instanceof Error
          ? `无法访问麦克风：${error.message}`
          : "无法访问麦克风，请检查浏览器权限。",
      )
      changeStatus("failed")
    }
  }

  function pauseRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause()
      changeStatus("paused")
    }
  }

  function resumeRecording() {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume()
      changeStatus("recording")
    }
  }

  const tone =
    status === "draft-ready"
      ? "success"
      : status === "failed"
        ? "critical"
        : status === "processing"
          ? "info"
          : status === "recording"
            ? "critical"
            : status === "paused"
              ? "warning"
              : "neutral"

  return (
    <Dialog
      open={open}
      title="新课堂录音"
      description="浏览器会录下当前课堂音频，并发送到本机 FunASR 与 DeepSeek 处理。"
      onClose={() => {
        cancelRecording({ restoreLessonStatus: true })
        onClose()
      }}
    >
      <div className="grid gap-6 py-2">
        <div className="rounded-[24px] border border-white/80 bg-white/55 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#e6efe2] text-[#315b3c]">
            {status === "processing" || status === "draft-ready" ? (
              <Sparkles aria-hidden="true" size={28} />
            ) : (
              <Mic aria-hidden="true" size={28} />
            )}
          </div>
          <StatusChip tone={tone}>{stateLabels[status]}</StatusChip>
          <p className="mt-3 text-sm leading-6 text-[#657468]">
            {status === "recording"
              ? "课堂录音正在进行，可随时暂停或结束。"
              : status === "paused"
                ? "录音已暂停，继续后将接着记录。"
                : status === "processing"
                  ? "正在调用本地 FunASR 转写，再交给 DeepSeek 生成复盘。"
                  : status === "draft-ready"
                    ? "课堂资料已经整理完成，请教师审核后再发布。"
                    : status === "failed"
                      ? errorMessage
                      : "开始后会请求浏览器麦克风权限。"}
          </p>
        </div>

        <label className="grid gap-2 text-sm font-black text-[#2a4432]">
          课堂标题
          <input
            className="rounded-2xl border border-white/90 bg-white/70 px-4 py-3 outline-none focus:ring-4 focus:ring-[#789b7d]/20"
            onChange={(event) => onTitleChange(event.target.value)}
            value={lessonTitle}
          />
        </label>

        <div className="flex flex-wrap justify-center gap-3">
          {status === "idle" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
              onClick={() => void startRecording()}
              type="button"
            >
              <Mic aria-hidden="true" size={18} />
              开始录音
            </button>
          ) : null}
          {status === "recording" ? (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#cbd8c8] bg-white/75 px-5 py-3 font-bold text-[#294833]"
                onClick={pauseRecording}
                type="button"
              >
                <Pause aria-hidden="true" size={18} />
                暂停录音
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
                onClick={stopRecording}
                type="button"
              >
                <Square aria-hidden="true" size={16} />
                结束并生成 AI 初稿
              </button>
            </>
          ) : null}
          {status === "paused" ? (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#cbd8c8] bg-white/75 px-5 py-3 font-bold text-[#294833]"
                onClick={resumeRecording}
                type="button"
              >
                <Play aria-hidden="true" size={18} />
                继续录音
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
                onClick={stopRecording}
                type="button"
              >
                <Square aria-hidden="true" size={16} />
                结束并生成 AI 初稿
              </button>
            </>
          ) : null}
          {status === "draft-ready" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
              onClick={onOpenDraft}
              type="button"
            >
              <Sparkles aria-hidden="true" size={18} />
              查看 AI 初稿
            </button>
          ) : null}
          {status === "failed" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
              onClick={() => {
                setStatus("idle")
                onStatusChange?.("scheduled")
              }}
              type="button"
            >
              重试录音
            </button>
          ) : null}
        </div>
      </div>
    </Dialog>
  )
}

export default RecordingPanel
