import { beforeEach, describe, expect, it } from "vitest"
import {
  defaultTeacherSettings,
  getGradeFromClassName,
  getTeacherSettings,
  resetTeacherSettings,
  saveTeacherSettings,
  teacherSettingsForAi,
} from "./teacherSettings"

beforeEach(() => {
  localStorage.clear()
  resetTeacherSettings()
})

describe("teacher settings store", () => {
  it("derives the grade used by classroom records from a selected class", () => {
    expect(getGradeFromClassName("六年级（3）班")).toBe("六年级")
    expect(getGradeFromClassName("一年级（1）班")).toBe("一年级")
  })

  it("persists settings and exposes only relevant AI preferences", () => {
    const saved = {
      ...defaultTeacherSettings,
      teacherName: "王老师",
      currentClass: "五年级（1）班",
      chapter: "小数乘法",
      aiDetail: "详细",
      includeEvidence: false,
    }

    saveTeacherSettings(saved)

    expect(getTeacherSettings()).toEqual(saved)
    expect(teacherSettingsForAi()).toMatchObject({
      teacherName: "王老师",
      currentClass: "五年级（1）班",
      chapter: "小数乘法",
      detail: "详细",
      includeEvidence: false,
    })
    expect(teacherSettingsForAi()).not.toHaveProperty("recordingRetention")
  })
})
