import { beforeEach, describe, expect, it, vi } from "vitest"
import { analyzeLessonAudio, isCompleteLessonAnalysis } from "./lessonAnalysis"
import {
  defaultTeacherSettings,
  resetTeacherSettings,
  saveTeacherSettings,
} from "../features/teacher/settings/teacherSettings"

beforeEach(() => {
  localStorage.clear()
  resetTeacherSettings()
})

describe("lesson analysis integrity", () => {
  it("rejects whitespace-only text and incomplete transcript segments", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "单位换算课堂复盘",
        transcript: [{ id: " ", speaker: "李老师", startSeconds: 0, endSeconds: 10, body: "单位换算" }],
        recap: " ",
        recapTags: ["单位换算"],
        nextStep: "补讲",
        teacherReport: "报告",
        progressSuggestion: "建议",
        evidence: ["依据"],
      }),
    }))

    await expect(analyzeLessonAudio(new Blob(["audio"]))).rejects.toThrow(
      "本地 AI 服务返回的数据不完整",
    )
  })

  it("accepts only a complete model-backed analysis", () => {
    expect(isCompleteLessonAnalysis({
      title: "单位换算课堂复盘",
      transcript: [{ id: "live-01", speaker: "李老师", startSeconds: 0, endSeconds: 10, body: "单位换算" }],
      recap: "先判断单位变化方向。",
      recapTags: ["单位换算"],
      nextStep: "完成随堂自检",
      teacherReport: "学生在乘除方向上需要更多示范。",
      progressSuggestion: "下节课先复盘单位阶梯。",
      evidence: ["课堂中有两次关于乘除方向的提问。"],
    })).toBe(true)
  })

  it("sends the saved teacher preferences with classroom audio", async () => {
    saveTeacherSettings({
      ...defaultTeacherSettings,
      currentClass: "五年级（1）班",
      chapter: "小数乘法",
      aiDetail: "详细",
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "小数乘法课堂复盘",
        transcript: [{ id: "live-01", speaker: "李老师", startSeconds: 0, endSeconds: 10, body: "小数乘法" }],
        recap: "先估算再计算。",
        recapTags: ["小数乘法"],
        nextStep: "完成练习",
        teacherReport: "课堂报告",
        progressSuggestion: "继续练习",
        evidence: ["课堂依据"],
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await analyzeLessonAudio(new Blob(["audio"]))

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = request.body as FormData
    expect(JSON.parse(String(body.get("teacher_settings")))).toMatchObject({
      currentClass: "五年级（1）班",
      chapter: "小数乘法",
      detail: "详细",
    })
  })
})
