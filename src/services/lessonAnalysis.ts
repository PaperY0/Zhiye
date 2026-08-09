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

  if (
    !Array.isArray(payload.transcript) ||
    !payload.recap ||
    !Array.isArray(payload.recapTags) ||
    !payload.nextStep ||
    !payload.teacherReport ||
    !payload.progressSuggestion ||
    !Array.isArray(payload.evidence) ||
    !payload.recapTags.every((tag) => typeof tag === "string") ||
    !payload.evidence.every((item) => typeof item === "string")
  ) {
    throw new Error("本地 AI 服务返回的数据不完整")
  }
  return payload
}
