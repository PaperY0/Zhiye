export const progressImportKey = "zhiye-plan-source-progress"

export type ProgressImport = {
  lessonId: string
  lessonTitle: string
  nextStep: string
  chapter: string
  className: string
  subject: string
}

export function consumeProgressImport(): ProgressImport | null {
  const raw = window.sessionStorage.getItem(progressImportKey)
  window.sessionStorage.removeItem(progressImportKey)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<ProgressImport>
    if (!value.lessonId || !value.lessonTitle || !value.nextStep?.trim() || !value.className) return null
    return {
      lessonId: value.lessonId,
      lessonTitle: value.lessonTitle,
      nextStep: value.nextStep.trim(),
      chapter: value.chapter ?? "",
      className: value.className,
      subject: value.subject ?? "数学",
    }
  } catch {
    return null
  }
}
