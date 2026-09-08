import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { ParentMessagesPage } from "./ParentMessagesPage"

function renderMessages() {
  render(
    <PrototypeProvider>
      <ParentMessagesPage />
    </PrototypeProvider>,
  )
}

describe("ParentMessagesPage", () => {
  it("binds communication to Lin Xiaoyu and exposes only the Li teacher conversation", () => {
    renderMessages()

    expect(
      screen.getByRole("heading", { name: "联系李老师" }),
    ).toBeInTheDocument()
    expect(screen.getByText("林晓雨 · 五年级（2）班")).toBeInTheDocument()
    expect(screen.getByText("李老师", { selector: "h2" })).toBeInTheDocument()

    const log = screen.getByRole("log", { name: "与李老师的家校消息记录" })
    expect(log).toHaveTextContent("今晚适合陪孩子复习哪一部分")
    expect(log).toHaveTextContent("让孩子用自己的话讲一遍")

    expect(screen.queryByText("五年级（2）班学习群")).not.toBeInTheDocument()
    expect(
      screen.queryByText("林晓雨", { selector: "h2" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/只显示您与李老师围绕林晓雨学习陪伴的沟通/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/不会展示同学信息、完整学习对话或敏感反馈/),
    ).toBeInTheDocument()
  })

  it("sends a local prototype message to Li teacher and updates the conversation", async () => {
    const user = userEvent.setup()
    renderMessages()

    const textbox = screen.getByRole("textbox", { name: "给李老师留言" })
    const send = screen.getByRole("button", { name: "发送给李老师" })
    expect(send).toBeDisabled()

    await user.type(textbox, "谢谢老师，我们今晚会一起复述。")
    await user.click(send)

    const log = screen.getByRole("log", { name: "与李老师的家校消息记录" })
    expect(
      within(log).getByText("谢谢老师，我们今晚会一起复述。"),
    ).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("消息已保存到本地原型")
    expect(textbox).toHaveValue("")
    expect(send).toBeDisabled()
  })
})
