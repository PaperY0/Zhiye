import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { MessagesPage } from "./MessagesPage"

function renderMessages() {
  render(
    <PrototypeProvider>
      <MessagesPage />
    </PrototypeProvider>,
  )
}

describe("MessagesPage", () => {
  it("selects a parent conversation and sends a normal message through shared state", async () => {
    const user = userEvent.setup()
    renderMessages()

    expect(screen.getByRole("heading", { name: "消息" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /打开林晓雨家长会话/ }))

    expect(
      screen.getByRole("heading", { name: "林晓雨家长" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("老师您好，今晚适合陪孩子复习哪一部分？"),
    ).toBeInTheDocument()

    await user.type(
      screen.getByRole("textbox", { name: "输入消息" }),
      "建议先复述分数基本性质，再完成一道自检题。",
    )
    await user.click(screen.getByRole("button", { name: "发送消息" }))

    expect(
      within(
        screen.getByRole("log", { name: "林晓雨家长的消息记录" }),
      ).getByText("建议先复述分数基本性质，再完成一道自检题。"),
    ).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "输入消息" })).toHaveValue("")
  })

  it("filters to class groups and can return to all conversations", async () => {
    const user = userEvent.setup()
    renderMessages()

    await user.click(screen.getByRole("button", { name: "班级群" }))
    expect(
      screen.getByRole("button", { name: /打开五年级（2）班学习群会话/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /打开林晓雨家长会话/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "全部" }))
    expect(
      screen.getByRole("button", { name: /打开林晓雨家长会话/ }),
    ).toBeInTheDocument()
  })

  it("shows and removes a local simulated attachment preview", async () => {
    const user = userEvent.setup()
    renderMessages()

    await user.click(screen.getByRole("button", { name: "添加模拟附件" }))
    expect(screen.getByText("课堂复习卡.pdf")).toBeInTheDocument()
    expect(screen.getByText("仅本地预览，不会上传")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "移除模拟附件" }))
    expect(screen.queryByText("课堂复习卡.pdf")).not.toBeInTheDocument()
  })

  it("intercepts a protection phrase instead of sending it normally", async () => {
    const user = userEvent.setup()
    renderMessages()

    const composer = screen.getByRole("textbox", { name: "输入消息" })
    const messageLog = screen.getByRole("log", { name: "林晓雨的消息记录" })

    await user.type(composer, "我不敢回家")
    await user.click(screen.getByRole("button", { name: "发送消息" }))

    const dialog = screen.getByRole("dialog", { name: "需要进一步确认" })
    expect(
      within(dialog).getByRole("button", { name: "转入保护流程演示" }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "返回修改" }),
    ).toBeInTheDocument()
    expect(within(messageLog).queryByText("我不敢回家")).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "返回修改" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(composer).toHaveValue("我不敢回家")

    await user.click(screen.getByRole("button", { name: "发送消息" }))
    await user.click(
      within(screen.getByRole("dialog", { name: "需要进一步确认" })).getByRole(
        "button",
        { name: "转入保护流程演示" },
      ),
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "已转入保护流程演示，未向任何外部系统发送",
    )
    expect(within(messageLog).queryByText("我不敢回家")).not.toBeInTheDocument()
    expect(composer).toHaveValue("")
  })
})
