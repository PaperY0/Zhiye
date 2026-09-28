import { useSyncExternalStore } from "react"

export type TeacherSettings = {
  teacherName: string
  teacherTitle: string
  currentClass: string
  textbook: string
  chapter: string
  additionalScope: string
  aiDetail: string
  includeEvidence: boolean
  includeLifeExamples: boolean
  requireReviewBeforePublish: boolean
  speechLanguage: string
  readAloudVoice: string
  lessonReadyNotification: boolean
  taskDueNotification: boolean
  parentMessageNotification: boolean
  safetyNotification: boolean
  recordingRetention: string
  generatedContentRetention: string
  parentTeacherMessages: boolean
  studentLearningEvidence: boolean
  hideStudentRankings: boolean
}

export const schoolClasses = ["五年级（1）班", "五年级（2）班"] as const

export const primaryClassGroups = [{ grade: "五年级", classes: [...schoolClasses] }]

export function isSchoolClass(value: string): value is typeof schoolClasses[number] {
  return schoolClasses.includes(value as typeof schoolClasses[number])
}

export function getGradeFromClassName(className: string) {
  return className.match(/^(.+?年级)/)?.[1] ?? "未设置年级"
}

export const defaultTeacherSettings: TeacherSettings = {
  teacherName: "李老师",
  teacherTitle: "五年级数学教师",
  currentClass: "五年级（2）班",
  textbook: "人教版",
  chapter: "分数的意义和性质",
  additionalScope: "重点覆盖约分、通分与分数基本性质。",
  aiDetail: "平衡",
  includeEvidence: true,
  includeLifeExamples: true,
  requireReviewBeforePublish: true,
  speechLanguage: "普通话",
  readAloudVoice: "温和女声",
  lessonReadyNotification: true,
  taskDueNotification: true,
  parentMessageNotification: true,
  safetyNotification: true,
  recordingRetention: "7 天",
  generatedContentRetention: "本学期",
  parentTeacherMessages: true,
  studentLearningEvidence: true,
  hideStudentRankings: true,
}

export const teacherSettingsStorageKey = "zhiye-teacher-settings-v1"
const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedSettings = defaultTeacherSettings

function readSettings(): TeacherSettings {
  const raw = window.localStorage.getItem(teacherSettingsStorageKey)
  if (raw === cachedRaw) return cachedSettings
  cachedRaw = raw
  try {
    const settings = raw
      ? { ...defaultTeacherSettings, ...(JSON.parse(raw) as Partial<TeacherSettings>) }
      : defaultTeacherSettings
    cachedSettings = isSchoolClass(settings.currentClass)
      ? settings
      : { ...settings, currentClass: defaultTeacherSettings.currentClass }
  } catch {
    cachedSettings = defaultTeacherSettings
  }
  return cachedSettings
}

function emitChange() {
  cachedRaw = undefined
  listeners.forEach((listener) => listener())
}

export function getTeacherSettings() {
  return readSettings()
}

export function saveTeacherSettings(settings: TeacherSettings) {
  window.localStorage.setItem(teacherSettingsStorageKey, JSON.stringify({
    ...settings,
    currentClass: isSchoolClass(settings.currentClass) ? settings.currentClass : defaultTeacherSettings.currentClass,
  }))
  emitChange()
}

export function resetTeacherSettings() {
  window.localStorage.removeItem(teacherSettingsStorageKey)
  emitChange()
}

export function useTeacherSettings() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      const handleStorage = (event: StorageEvent) => {
        if (event.key === teacherSettingsStorageKey) emitChange()
      }
      window.addEventListener("storage", handleStorage)
      return () => {
        listeners.delete(listener)
        window.removeEventListener("storage", handleStorage)
      }
    },
    getTeacherSettings,
    () => defaultTeacherSettings,
  )
}

export function teacherSettingsForAi(settings = getTeacherSettings()) {
  return {
    teacherName: settings.teacherName,
    teacherTitle: settings.teacherTitle,
    currentClass: settings.currentClass,
    textbook: settings.textbook,
    chapter: settings.chapter,
    additionalScope: settings.additionalScope,
    detail: settings.aiDetail,
    includeEvidence: settings.includeEvidence,
    includeLifeExamples: settings.includeLifeExamples,
    requireReviewBeforePublish: settings.requireReviewBeforePublish,
    speechLanguage: settings.speechLanguage,
  }
}
