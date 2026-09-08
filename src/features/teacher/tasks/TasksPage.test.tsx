import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { TasksPage } from "./TasksPage"

function renderTasks() {
  render(
    <PrototypeProvider>
      <TasksPage />
    </PrototypeProvider>,
  )
}

describe("TasksPage", () => {
  it("filters 草稿、进行中、待查看和已完成 tasks and opens completion details", async () => {
    const user = userEvent.setup()
    renderTasks()

    expect(screen.getByRole("heading", { name: "任务" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /草稿.*1/ })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /进行中.*1/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /待查看.*1/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /已完成.*1/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /待查看.*1/ }))
    expect(screen.getByText("分数基本性质自检")).toBeInTheDocument()
    expect(screen.queryByText("小数乘法预习")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "查看分数基本性质自检" }),
    )
    const drawer = screen.getByRole("dialog", { name: "分数基本性质自检" })
    expect(within(drawer).getByText("10 / 12")).toBeInTheDocument()
    expect(within(drawer).getByText("83%")).toBeInTheDocument()
    expect(within(drawer).getByText("待教师查看 10 人")).toBeInTheDocument()
    expect(within(drawer).getByText("进行中 2 人")).toBeInTheDocument()
    expect(within(drawer).getAllByText(/林晓雨|陈浩/).length).toBeGreaterThan(0)
  })

  it("creates 单位换算巩固练习 as a draft and publishes it", async () => {
    const user = userEvent.setup()
    renderTasks()

    await user.click(screen.getByRole("button", { name: "新建任务" }))
    const dialog = screen.getByRole("dialog", { name: "新建任务" })

    await user.selectOptions(
      within(dialog).getByLabelText("任务类型"),
      "practice",
    )
    await user.clear(within(dialog).getByLabelText("任务标题"))
    await user.type(
      within(dialog).getByLabelText("任务标题"),
      "单位换算巩固练习",
    )
    await user.type(
      within(dialog).getByLabelText("任务内容"),
      "完成 5 道单位换算题，并写出每一步为什么乘或除。",
    )
    await user.selectOptions(within(dialog).getByLabelText("发布对象"), "class")
    await user.clear(within(dialog).getByLabelText("截止时间"))
    await user.type(
      within(dialog).getByLabelText("截止时间"),
      "2026-07-27T20:00",
    )
    await user.selectOptions(
      within(dialog).getByLabelText("提醒设置"),
      "截止前 2 小时",
    )
    await user.click(within(dialog).getByRole("button", { name: "保存草稿" }))

    expect(
      screen.queryByRole("dialog", { name: "新建任务" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("任务草稿已保存")
    expect(screen.getByText("单位换算巩固练习")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "查看单位换算巩固练习" }),
    )
    const drawer = screen.getByRole("dialog", { name: "单位换算巩固练习" })
    expect(
      within(drawer).getByText(
        "完成 5 道单位换算题，并写出每一步为什么乘或除。",
      ),
    ).toBeInTheDocument()
    await user.click(within(drawer).getByRole("button", { name: "发布任务" }))

    expect(
      screen.queryByRole("dialog", { name: "单位换算巩固练习" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("任务已发布")

    await user.click(screen.getByRole("button", { name: /进行中.*2/ }))
    expect(screen.getAllByText("单位换算巩固练习")).toHaveLength(2)
  })

  it("sends a reminder from an active task and announces it with ToastRegion", async () => {
    const user = userEvent.setup()
    renderTasks()

    await user.click(screen.getByRole("button", { name: /进行中.*1/ }))
    await user.click(
      screen.getByRole("button", { name: "查看单位换算巩固练习" }),
    )
    const drawer = screen.getByRole("dialog", { name: "单位换算巩固练习" })
    await user.click(
      within(drawer).getByRole("button", { name: "提醒未完成学生" }),
    )

    const notifications = screen.getByRole("region", { name: "任务操作通知" })
    expect(within(notifications).getByRole("status")).toHaveTextContent(
      "已提醒 2 名未完成学生",
    )
    expect(
      within(notifications).getByText("单位换算巩固练习"),
    ).toBeInTheDocument()
  })
})
