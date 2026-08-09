import { describe, expect, it, vi } from "vitest"
import { generateDraft } from "./localAi"

describe("local AI client", () => {
  it("does not fabricate a draft when local AI is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

    await expect(
      generateDraft("lesson-plan", { chapter: "单位换算" }),
    ).rejects.toThrow("本地 AI 服务未启动")
  })
})
