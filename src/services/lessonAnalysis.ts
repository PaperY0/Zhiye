import type { TranscriptSegment } from "../app/prototype/types"
import { requestJson } from "./localAi"

export type LessonAnalysisResult = {
  transcript: TranscriptSegment[]
  recap: string
  recapTags: string[]
  nextStep: string
  teacherReport: string
  progressSuggestion: string
  evidence: string[]
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isCompleteTranscriptSegment(value: unknown): value is TranscriptSegment {
  if (!value || typeof value !== "object") return false
  const segment = value as Record<string, unknown>
  return (
    isNonBlankString(segment.id) &&
    isNonBlankString(segment.speaker) &&
    isNonBlankString(segment.body) &&
    typeof segment.startSeconds === "number" &&
    Number.isFinite(segment.startSeconds) &&
    typeof segment.endSeconds === "number" &&
    Number.isFinite(segment.endSeconds) &&
    segment.endSeconds >= segment.startSeconds
  )
}

export function isCompleteLessonAnalysis(
  value: unknown,
): value is LessonAnalysisResult {
  if (!value || typeof value !== "object") return false
  const analysis = value as Record<string, unknown>
  return (
    Array.isArray(analysis.transcript) &&
    analysis.transcript.length > 0 &&
    analysis.transcript.every(isCompleteTranscriptSegment) &&
    isNonBlankString(analysis.recap) &&
    Array.isArray(analysis.recapTags) &&
    analysis.recapTags.length > 0 &&
    analysis.recapTags.every(isNonBlankString) &&
    isNonBlankString(analysis.nextStep) &&
    isNonBlankString(analysis.teacherReport) &&
    isNonBlankString(analysis.progressSuggestion) &&
    Array.isArray(analysis.evidence) &&
    analysis.evidence.length > 0 &&
    analysis.evidence.every(isNonBlankString)
  )
}

const localAiUrl =
  import.meta.env.VITE_LOCAL_AI_URL ?? "http://127.0.0.1:8787/analyze"

export async function analyzeLessonAudio(
  audio: Blob,
  signal?: AbortSignal,
): Promise<LessonAnalysisResult> {
  const body = new FormData()
  body.append("audio", audio, "lesson-recording.webm")

  const payload = await requestJson<LessonAnalysisResult>(localAiUrl, {
    body,
    method: "POST",
    signal,
  })

  if (!isCompleteLessonAnalysis(payload)) {
    throw new Error("本地 AI 服务返回的数据不完整")
  }
  return payload
}
