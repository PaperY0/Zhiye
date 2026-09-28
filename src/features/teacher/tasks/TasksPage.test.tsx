import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { taskFixtures } from "../../../app/prototype/fixtures"
import { StudentTasksPage } from "../../student/tasks/StudentTasksPage"
import { StudentMessagesPage } from "../../student/messages/StudentMessagesPage"
import { TasksPage } from "./TasksPage"

function renderTasks() {
  render(
    <PrototypeProvider>
      <TasksPage />
    </PrototypeProvider>,
  )
}

describe("TasksPage", () => {
  it("opens the class and task selected from insights", () => {
    window.sessionStorage.setItem("zhiye-task-class-filter", "五年级（2）班")
    window.sessionStorage.setItem("zhiye-task-open-id", "task-active-01")
    renderTasks()
    expect(within(screen.getByRole("navigation", { name: "任务班级" })).getByRole("button", { name: "五年级（2）班" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("dialog", { name: "单位换算巩固练习" })).toBeInTheDocument()
  })

  it("publishes a task for a student from messages and synchronizes the task announcement", async () => {
    const user = userEvent.setup()
    window.sessionStorage.setItem("zhiye-task-source-student", "student-lin-xiaoyu")
    render(<PrototypeProvider><TasksPage /><StudentTasksPage /><StudentMessagesPage /></PrototypeProvider>)
    const dialog = screen.getByRole("dialog", { name: "新建任务" })
    expect(within(dialog).getByRole("radio", { name: /林晓雨/ })).toBeChecked()
    await user.type(within(dialog).getByRole("textbox", { name: "任务标题" }), "晓雨的换算练习")
    await user.type(within(dialog).getByRole("textbox", { name: "学习目标" }), "掌握换算方向")
    await user.type(within(dialog).getByRole("textbox", { name: "达成标准" }), "独立完成三题")
    await user.type(within(dialog).getByRole("textbox", { name: "任务内容" }), "完成三道单位换算题")
    await user.click(within(dialog).getByRole("button", { name: "保存并预览" }))
    const preview = screen.getByRole("dialog", { name: "晓雨的换算练习" })
    await user.click(within(preview).getByRole("button", { name: "发布任务" }))
    expect(screen.getByRole("button", { name: "打开晓雨的换算练习" })).toBeInTheDocument()
    expect(within(screen.getByRole("log", { name: "与李老师的消息记录" })).getByText("已布置任务“晓雨的换算练习”。请到任务页查看并完成。")).toBeInTheDocument()
  })

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
    expect(within(drawer).getByRole("region", { name: "三道测试题预览" })).toBeInTheDocument()
    expect(within(drawer).getByText("4 / 5")).toBeInTheDocument()
    expect(within(drawer).getByText("80%")).toBeInTheDocument()
    expect(within(drawer).getByText("待教师查看 4 人")).toBeInTheDocument()
    expect(within(drawer).getByText("进行中 1 人")).toBeInTheDocument()
    expect(within(drawer).getAllByText(/林晓雨|陈浩/).length).toBeGreaterThan(0)
  })

  it("creates 单位换算巩固练习 as a draft and publishes it", async () => {
    const user = userEvent.setup()
    renderTasks()

    await user.click(screen.getByRole("button", { name: "新建任务" }))
    const dialog = screen.getByRole("dialog", { name: "新建任务" })

    await user.selectOptions(within(dialog).getByRole("combobox", { name: "任务形式" }), "practice")
    await user.clear(within(dialog).getByLabelText("任务标题"))
    await user.type(
      within(dialog).getByLabelText("任务标题"),
      "单位换算巩固练习",
    )
    await user.type(
      within(dialog).getByLabelText("学习目标"),
      "能够判断单位换算时应该乘还是除",
    )
    await user.type(
      within(dialog).getByLabelText("达成标准"),
      "正确完成 5 道题并解释每一步依据",
    )
    await user.type(
      within(dialog).getByLabelText("任务内容"),
      "完成 5 道单位换算题，并写出每一步为什么乘或除。",
    )
    expect(within(dialog).getByRole("radio", { name: /五年级（2）班/ })).toBeChecked()
    expect(within(dialog).queryByLabelText("截止时间")).not.toBeInTheDocument()
    await user.click(
      within(dialog).getByRole("button", { name: "保存并预览" }),
    )

    expect(
      screen.queryByRole("dialog", { name: "新建任务" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("任务草稿已保存")
    const drawer = screen.getByRole("dialog", { name: "单位换算巩固练习" })
    expect(within(drawer).queryByText("截止时间")).not.toBeInTheDocument()
    expect(
      within(drawer).getByText("能够判断单位换算时应该乘还是除"),
    ).toBeInTheDocument()
    expect(
      within(drawer).getByText("正确完成 5 道题并解释每一步依据"),
    ).toBeInTheDocument()
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
    expect(within(notifications).getByRole("status")).toHaveTextContent(/已通过消息提醒|暂无可发送的学生会话/)
  })

  it("moves a task from active to review on student submission and to completed after teacher review", async () => {
    function Seed() {
      const { addTask } = usePrototype()
      return <button onClick={() => addTask({ ...taskFixtures[0], id: "linked-task", title: "联动练习", status: "active", submissionMode: "text", audience: { kind: "students", label: "林晓雨", studentIds: ["student-lin-xiaoyu"] }, completions: [{ studentId: "student-lin-xiaoyu", status: "not-started" }] })} type="button">准备联动任务</button>
    }
    const user = userEvent.setup()
    render(<PrototypeProvider><Seed /><TasksPage /><StudentTasksPage /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "准备联动任务" }))
    const taskNav = screen.getByRole("navigation", { name: "任务状态" })
    expect(within(taskNav).getByRole("button", { name: /进行中.*2/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "打开联动练习" }))
    const studentDialog = screen.getByRole("dialog", { name: "联动练习" })
    await user.click(within(studentDialog).getByRole("button", { name: "开始任务" }))
    await user.type(within(studentDialog).getByRole("textbox", { name: "我的回答" }), "完成并解释步骤")
    await user.click(within(studentDialog).getByRole("button", { name: "标记为已完成" }))
    expect(within(taskNav).getByRole("button", { name: /待查看.*2/ })).toBeInTheDocument()
    expect(within(taskNav).getByRole("button", { name: /进行中.*1/ })).toBeInTheDocument()

    await user.click(within(taskNav).getByRole("button", { name: /待查看.*2/ }))
    await user.click(screen.getByRole("button", { name: "查看联动练习" }))
    const teacherDialog = screen.getAllByRole("dialog", { name: "联动练习" }).find((dialog) => within(dialog).queryByText("完成情况"))!
    expect(within(teacherDialog).getByText("待教师查看 1 人")).toBeInTheDocument()
    await user.click(within(teacherDialog).getByRole("button", { name: "完成查看" }))
    expect(within(taskNav).getByRole("button", { name: /已完成.*2/ })).toBeInTheDocument()
    expect(within(studentDialog).getByText("老师已查看")).toBeInTheDocument()
  })
})
