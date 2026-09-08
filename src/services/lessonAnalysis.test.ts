import { describe, expect, it, vi } from "vitest"
import { analyzeLessonAudio, isCompleteLessonAnalysis } from "./lessonAnalysis"

describe("lesson analysis integrity", () => {
  it("rejects whitespace-only text and incomplete transcript segments", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      transcript: [{ id: "live-01", speaker: "李老师", startSeconds: 0, endSeconds: 10, body: "单位换算" }],
      recap: "先判断单位变化方向。",
      recapTags: ["单位换算"],
      nextStep: "完成随堂自检",
      teacherReport: "学生在乘除方向上需要更多示范。",
      progressSuggestion: "下节课先复盘单位阶梯。",
      evidence: ["课堂中有两次关于乘除方向的提问。"],
    })).toBe(true)
  })
})
