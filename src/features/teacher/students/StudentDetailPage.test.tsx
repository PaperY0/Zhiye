import "@testing-library/jest-dom/vitest"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import { StudentDetailPage } from "./StudentDetailPage"

vi.mock("../../../services/localAi", () => ({
  generateDraft: vi.fn(),
}))

function renderDetail() {
  return render(
    <PrototypeProvider>
      <StudentDetailPage studentId="student-lin-xiaoyu" />
    </PrototypeProvider>,
  )
}

describe("StudentDetailPage AI drafts", () => {
  it("publishes a parent summary only after the teacher adopts the generated draft", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        topics: ["单位换算"],
        encouragement: "愿意解释自己的想法。",
        teacher_message: "完成单位换算自检。",
      },
    })
    renderDetail()

    await user.click(screen.getByRole("button", { name: "生成本周摘要草稿" }))
    expect(await screen.findByText("AI 草稿 · 待教师审核")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "采纳并发布" }))
    expect(screen.getByRole("status")).toHaveTextContent("家长摘要已由教师确认发布")
  })

  it("shows retry and keeps approved content intact when generation fails", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockRejectedValue(new Error("本地 AI 服务未启动，请运行 start-local-ai.ps1"))
    renderDetail()

    await user.click(screen.getByRole("button", { name: "生成本周摘要草稿" }))

    expect(await screen.findByText("本地 AI 服务未启动，请运行 start-local-ai.ps1")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "重试生成摘要" })).toBeInTheDocument()
    expect(screen.queryByText("AI 草稿 · 待教师审核")).not.toBeInTheDocument()
  })

  it("retries the failed observation request without switching to parent generation", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockRejectedValue(new Error("本地 AI 服务未启动，请运行 start-local-ai.ps1"))
    renderDetail()

    await user.click(screen.getByRole("button", { name: "生成观察草稿" }))

    expect(await screen.findByRole("button", { name: "重试生成观察" })).toBeInTheDocument()
  })

  it("keeps generated observations as teacher-reviewed evidence rather than a student label", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        evidence: ["随堂练习第 3 题停顿时间增加"],
        observation: "单位换算的方向判断仍需结合后续练习观察。",
        suggested_support: "下次练习时先让学生说出单位变化方向。",
      },
    })
    renderDetail()

    await user.click(screen.getByRole("button", { name: "生成观察草稿" }))

    expect(await screen.findByText("单位换算的方向判断仍需结合后续练习观察。")).toBeInTheDocument()
    expect(screen.getByText("AI 草稿 · 待教师审核")).toBeInTheDocument()
    expect(screen.getByText("依据：随堂练习第 3 题停顿时间增加")).toBeInTheDocument()
    expect(generateDraft).toHaveBeenCalledWith(
      "student-inference",
      expect.objectContaining({
        facts: expect.any(Array),
        mistakes: expect.any(Array),
      }),
    )
  })
})
