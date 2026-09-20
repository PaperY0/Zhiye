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

const primaryGrades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"] as const

export const primaryClassGroups = primaryGrades.map((grade) => ({
  grade,
  classes: [1, 2, 3].map((classNumber) => `${grade}（${classNumber}）班`),
}))

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
    cachedSettings = raw
      ? { ...defaultTeacherSettings, ...(JSON.parse(raw) as Partial<TeacherSettings>) }
      : defaultTeacherSettings
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
  window.localStorage.setItem(teacherSettingsStorageKey, JSON.stringify(settings))
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
