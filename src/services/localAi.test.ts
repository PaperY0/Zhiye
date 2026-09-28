import { describe, expect, it, vi } from "vitest"
import { generateDraft } from "./localAi"

describe("local AI client", () => {
  it("does not fabricate a draft when local AI is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

    await expect(
      generateDraft("lesson-plan", { chapter: "单位换算" }),
    ).rejects.toThrow("本地 AI 服务未启动")
  })

  it("shows a readable message for structured validation errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: [{ loc: ["body", "context", "context"], msg: "String should have at least 1 character" }] }),
    }))

    await expect(generateDraft("lesson-plan", { chapter: "圆形的面积" }))
      .rejects.toThrow("输入内容未通过校验，请检查必填项和输入长度后重试。")
  })
})
