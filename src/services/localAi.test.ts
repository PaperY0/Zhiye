import { describe, expect, it, vi } from "vitest"
import { generateDraft, isUnavailableLoopbackAi } from "./localAi"
import { cancelAiInvite, exchangeAiInvite } from "./aiAccess"

describe("local AI client", () => {
  it("blocks a public site from calling a visitor's loopback service", () => {
    expect(isUnavailableLoopbackAi("http://127.0.0.1:8787/generate", "https://demo.example/#/student")).toBe(true)
    expect(isUnavailableLoopbackAi("http://localhost:8787/analyze", "https://demo.example/")).toBe(true)
    expect(isUnavailableLoopbackAi("http://127.0.0.1:8787/generate", "http://127.0.0.1:8443/")).toBe(false)
    expect(isUnavailableLoopbackAi("https://ai.example/generate", "https://demo.example/")).toBe(false)
  })

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

  it("waits for an invite before sending a hosted AI request", async () => {
    vi.stubEnv("VITE_AI_INVITE_REQUIRED", "true")
    sessionStorage.clear()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "signed-session", expiresAt: Math.floor(Date.now() / 1000) + 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: "完成" }) })
    vi.stubGlobal("fetch", fetchMock)

    const request = generateDraft("lesson-plan", { chapter: "单位换算" })
    expect(fetchMock).not.toHaveBeenCalled()
    await exchangeAiInvite("valid-invite-code")
    await expect(request).resolves.toMatchObject({ content: "完成" })
    const headers = new Headers(fetchMock.mock.calls[1][1].headers as HeadersInit)
    expect(headers.get("Authorization")).toBe("Bearer signed-session")
    cancelAiInvite()
    vi.unstubAllEnvs()
  })
})
