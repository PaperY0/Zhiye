export type AdminSettings = {
  schoolName: string
  teacherCount: number
  invitationCode: string
  bindingCode: string
  primaryContact: string
  backupContact: string
  escalationContact: string
  retentionDays: "7" | "14" | "30"
  aiContentDays: "30" | "90" | "180"
  auditDays: "180" | "365" | "730"
}

export const initialAdminSettings: AdminSettings = {
  schoolName: "知野实验学校",
  teacherCount: 18,
  invitationCode: "ZY-SCHOOL-2026",
  bindingCode: "520826",
  primaryContact: "王老师 · 德育负责人",
  backupContact: "陈老师 · 年级负责人",
  escalationContact: "周主任 · 校务负责人",
  retentionDays: "7",
  aiContentDays: "90",
  auditDays: "365",
}

export const adminSettingsStorageKey = "zhiye-admin-settings-v1"

export function readSavedAdminSettings(): AdminSettings {
  try {
    const saved = window.localStorage.getItem(adminSettingsStorageKey)
    return saved
      ? { ...initialAdminSettings, ...(JSON.parse(saved) as Partial<AdminSettings>) }
      : initialAdminSettings
  } catch {
    return initialAdminSettings
  }
}
