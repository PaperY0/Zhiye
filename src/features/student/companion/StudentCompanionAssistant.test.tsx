import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { StudentCompanionAssistant } from "./StudentCompanionAssistant"
import { generateCompanionReply } from "../../../services/localAi"

vi.mock("../../../services/localAi", () => ({
  generateCompanionReply: vi.fn(),
}))

describe("StudentCompanionAssistant", () => {
  it("opens with pinyin and navigates from an AI answer", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    vi.mocked(generateCompanionReply).mockResolvedValue({
      reply: "去拍照答疑上传题目。",
      pinyin: "qù pāi zhào dá yí shàng chuán tí mù.",
      action: "go-tutoring",
      actionLabel: "去拍照答疑",
      actionPinyin: "qù pāi zhào dá yí",
    })

    render(<StudentCompanionAssistant currentPage="home" onNavigate={onNavigate} />)
    await user.click(screen.getByRole("button", { name: "打开小野学习陪伴" }))

    expect(screen.getByText("有什么不懂的或者不会的吗？")).toBeInTheDocument()
    expect(screen.getByText("yǒu shén me bù dǒng de huò zhě bú huì de ma?")).toBeInTheDocument()

    await user.type(screen.getByLabelText("请输入你的问题"), "拍照答疑的界面在哪")
    await user.click(screen.getByRole("button", { name: "发送问题" }))

    expect(await screen.findByText("去拍照答疑上传题目。")).toBeInTheDocument()
    expect(screen.getByText("qù pāi zhào dá yí shàng chuán tí mù.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /去拍照答疑/ }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "tutoring" })
  })
})
