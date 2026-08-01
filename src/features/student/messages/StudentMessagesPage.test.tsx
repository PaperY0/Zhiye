import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { StudentMessagesPage } from "./StudentMessagesPage"

function renderPage() {
  render(
    <PrototypeProvider>
      <StudentMessagesPage />
    </PrototypeProvider>,
  )
}

describe("StudentMessagesPage", () => {
  it("only exposes the teacher and teacher-managed class group and sends ordinary feedback", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("heading", { name: "消息" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "打开李老师会话" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "打开五年级（2）班学习群会话" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("林晓雨家长")).not.toBeInTheDocument()
    expect(
      screen.getByText(/只可联系李老师和由老师管理的班级群/),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "普通反馈：我有一点没听懂" }),
    )
    expect(screen.getByRole("textbox", { name: "给李老师留言" })).toHaveValue(
      "我有一点没听懂",
    )
    await user.click(screen.getByRole("button", { name: "发送给李老师" }))

    const log = screen.getByRole("log", { name: "与李老师的消息记录" })
    expect(within(log).getByText("我有一点没听懂")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("普通反馈已发送")
  })

  it("keeps the separate help entry out of ordinary messages and shows safety guidance", async () => {
    const user = userEvent.setup()
    renderPage()

    const log = screen.getByRole("log", { name: "与李老师的消息记录" })
    const messageCount = within(log).getAllByRole("listitem").length

    await user.click(screen.getByRole("button", { name: "需要帮助" }))
    const dialog = screen.getByRole("dialog", { name: "现在需要帮助吗？" })

    expect(
      within(dialog).getByRole("heading", { name: "可以找谁" }),
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/家长或监护人、李老师/)).toBeInTheDocument()
    expect(
      within(dialog).getByRole("heading", { name: "如果有立即危险" }),
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/不会作为普通消息发送/)).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "我知道了，关闭" }),
    )

    expect(within(log).getAllByRole("listitem")).toHaveLength(messageCount)
    expect(screen.getByRole("status")).toHaveTextContent(
      "帮助信息只在本地显示，没有发送消息",
    )
  })
})
