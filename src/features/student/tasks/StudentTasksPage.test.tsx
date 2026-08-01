import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { StudentTasksPage } from "./StudentTasksPage"

function renderPage() {
  render(
    <PrototypeProvider>
      <StudentTasksPage />
    </PrototypeProvider>,
  )
}

describe("StudentTasksPage", () => {
  it("opens a teacher task and completes it in local prototype state", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      screen.getByRole("heading", { name: "我的任务" }),
    ).toBeInTheDocument()
    expect(screen.getByText("单位换算巩固练习")).toBeInTheDocument()
    expect(screen.queryByText("小数乘法预习")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "打开单位换算巩固练习" }),
    )

    const dialog = screen.getByRole("dialog", { name: "单位换算巩固练习" })
    expect(
      within(dialog).getByText("完成 5 道单位换算题并说明乘除理由"),
    ).toBeInTheDocument()
    expect(within(dialog).getByText("李老师布置")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "开始任务" }))
    expect(within(dialog).getByText("正在完成")).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "标记为已完成" }),
    )
    expect(within(dialog).getByText("已完成，等待老师查看")).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "关闭单位换算巩固练习" }),
    )
    expect(
      screen.getByRole("status", { name: "单位换算巩固练习状态" }),
    ).toHaveTextContent("已完成")
  })

  it("filters visible teacher tasks by progress", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole("button", { name: /待完成/ }))
    expect(screen.getByText("单位换算巩固练习")).toBeInTheDocument()
    expect(screen.queryByText("约分与通分复习")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /已完成/ }))
    expect(screen.getByText("约分与通分复习")).toBeInTheDocument()
    expect(screen.queryByText("单位换算巩固练习")).not.toBeInTheDocument()
  })
})
