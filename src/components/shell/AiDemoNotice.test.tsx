import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AiDemoNotice } from "./AiDemoNotice"
import { cancelAiInvite, currentAiToken } from "../../services/aiAccess"

beforeEach(() => {
  sessionStorage.clear()
  vi.stubEnv("VITE_AI_INVITE_REQUIRED", "true")
})

afterEach(() => {
  cancelAiInvite()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("public AI invite", () => {
  it("shows validation errors and unlocks the current tab", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: "邀请码不正确" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "signed-session", expiresAt: Math.floor(Date.now() / 1000) + 3600 }) })
    vi.stubGlobal("fetch", fetchMock)
    render(<AiDemoNotice />)

    await user.click(screen.getByRole("button", { name: "输入邀请码" }))
    await user.type(screen.getByLabelText("邀请码"), "wrong")
    await user.click(screen.getByRole("button", { name: "解锁 AI" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("邀请码不正确")

    await user.clear(screen.getByLabelText("邀请码"))
    await user.type(screen.getByLabelText("邀请码"), "valid-invite-code")
    await user.click(screen.getByRole("button", { name: "解锁 AI" }))
    expect(await screen.findByText(/AI 已解锁/)).toBeInTheDocument()
    expect(currentAiToken()).toBe("signed-session")
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/auth/invite"), expect.objectContaining({ method: "POST" }))
  })
})
