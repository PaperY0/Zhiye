import { useEffect, useState } from "react"
import { Mic, Pause, Play, Sparkles, Square } from "lucide-react"
import { Dialog } from "../../../components/shared/Dialog"
import { StatusChip } from "../../../components/shared/StatusChip"

export type RecordingState = "idle" | "recording" | "paused" | "processing" | "draft-ready"

const stateLabels: Record<RecordingState, string> = {
  idle: "等待开始",
  recording: "录音中",
  paused: "已暂停",
  processing: "正在整理课堂内容",
  "draft-ready": "AI 初稿已就绪",
}

export interface RecordingPanelProps {
  open: boolean
  onClose: () => void
  onOpenDraft: () => void
}

export function RecordingPanel({
  open,
  onClose,
  onOpenDraft,
}: RecordingPanelProps) {
  const [status, setStatus] = useState<RecordingState>("idle")

  useEffect(() => {
    if (!open || status !== "processing") return
    const timer = window.setTimeout(() => setStatus("draft-ready"), 800)
    return () => window.clearTimeout(timer)
  }, [open, status])

  useEffect(() => {
    if (open) setStatus("idle")
  }, [open])

  const tone =
    status === "draft-ready"
      ? "success"
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
      description="本原型仅在本地模拟录音和 AI 整理，不会采集真实音频。"
      onClose={onClose}
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
                  ? "正在生成课堂转写、复习卡和教师报告。"
                  : status === "draft-ready"
                    ? "课堂资料已经整理完成，请教师审核后再发布。"
                    : "开始后可以演示完整的课堂录音工作流。"}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {status === "idle" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
              onClick={() => setStatus("recording")}
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
                onClick={() => setStatus("paused")}
                type="button"
              >
                <Pause aria-hidden="true" size={18} />
                暂停录音
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
                onClick={() => setStatus("processing")}
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
                onClick={() => setStatus("recording")}
                type="button"
              >
                <Play aria-hidden="true" size={18} />
                继续录音
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#142219] px-5 py-3 font-bold text-white"
                onClick={() => setStatus("processing")}
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
        </div>
      </div>
    </Dialog>
  )
}

export default RecordingPanel
