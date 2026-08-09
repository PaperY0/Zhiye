export type GenerationKind =
  | "lesson-plan"
  | "quiz"
  | "remedial-plan"
  | "learning-reply"
  | "retell-follow-up"
  | "parent-summary"
  | "student-inference"
  | "tutoring"

export type QuestionImageRecognition = {
  recognizedText: string
  ocrConfidence: number
  needsConfirmation: boolean
  retryMessage?: string
}

const baseUrl = import.meta.env.VITE_LOCAL_AI_BASE_URL ?? "http://127.0.0.1:8787"

export async function requestJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("本地 AI 服务未启动，请运行 start-local-ai.ps1")
    }
    throw error
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { detail?: string })
    | null
  if (!response.ok) {
    throw new Error(payload?.detail ?? `本地 AI 服务返回 ${response.status}`)
  }
  if (!payload) {
    throw new Error("本地 AI 服务返回的数据不完整")
  }
  return payload
}

export function generateDraft(
  kind: GenerationKind,
  context: Record<string, unknown>,
) {
  return requestJson<unknown>(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, context }),
  })
}

export function recognizeQuestionImage(file: File) {
  const body = new FormData()
  body.append("image", file)
  return requestJson<QuestionImageRecognition>(`${baseUrl}/solve-image`, {
    method: "POST",
    body,
  })
}
