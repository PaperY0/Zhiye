import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { StudentMessagesPage } from "../../student/messages/StudentMessagesPage"
import { ParentMessagesPage } from "../../parent/messages/ParentMessagesPage"
import { MessagesPage } from "./MessagesPage"

function renderMessages() {
  render(
    <PrototypeProvider>
      <MessagesPage />
    </PrototypeProvider>,
  )
}

describe("MessagesPage", () => {
  it("shows a teacher message to the linked guardian in the parent conversation", async () => {
    const user = userEvent.setup()
    render(<PrototypeProvider><MessagesPage /><ParentMessagesPage /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "联系家长" }))
    expect(screen.getByRole("heading", { name: "林晓雨家长" })).toBeInTheDocument()
    await user.type(screen.getByRole("textbox", { name: "输入消息" }), "今晚请和孩子复习分数基本性质。")
    await user.click(screen.getByRole("button", { name: "发送消息" }))
    const parentLog = screen.getByRole("log", { name: "与李老师的家校消息记录" })
    expect(within(parentLog).getByText("今晚请和孩子复习分数基本性质。")).toBeInTheDocument()
  })

  it("passes the selected student to task creation", async () => {
    const user = userEvent.setup()
    renderMessages()
    await user.click(screen.getByRole("button", { name: "给学生布置任务" }))
    expect(window.location.hash).toBe("#/teacher/tasks")
    expect(window.sessionStorage.getItem("zhiye-task-source-student")).toBe("student-lin-xiaoyu")
  })

  it("prefills a new conversation when opened from a student profile", () => {
    window.sessionStorage.setItem("zhiye-message-student-id", "student-guo-haoran")
    renderMessages()
    const dialog = screen.getByRole("dialog", { name: "新建会话" })
    expect(within(dialog).getByRole("combobox", { name: "选择学生联系人" })).toHaveValue("student-guo-haoran")
    expect(window.sessionStorage.getItem("zhiye-message-student-id")).toBeNull()
  })

  it("creates a student conversation from the student roster with a linked student ID", async () => {
    const user = userEvent.setup()
    function LinkedConversation() {
      const { conversations } = usePrototype()
      const linked = conversations.find((item) => item.kind === "student" && item.boundStudentId === "student-guo-haoran")
      return <output data-testid="linked-conversation">{linked ? `${linked.participantIds.join(",")}|${linked.participantNames.join(",")}` : ""}</output>
    }
    render(<PrototypeProvider><MessagesPage /><LinkedConversation /></PrototypeProvider>)

    await user.click(screen.getByRole("button", { name: "新建会话" }))
    const dialog = screen.getByRole("dialog", { name: "新建会话" })
    expect(within(dialog).queryByRole("textbox", { name: "会话参与者" })).not.toBeInTheDocument()
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "选择学生联系人" }), "student-guo-haoran")
    await user.click(within(dialog).getByRole("button", { name: "创建会话" }))

    expect(screen.getByRole("heading", { name: "郭浩然" })).toBeInTheDocument()
    expect(screen.getByTestId("linked-conversation")).toHaveTextContent("teacher-li,student-guo-haoran|李老师,郭浩然")
  })

  it("opens the existing student conversation instead of creating a duplicate", async () => {
    const user = userEvent.setup()
    renderMessages()
    await user.click(screen.getByRole("button", { name: "新建会话" }))
    const dialog = screen.getByRole("dialog", { name: "新建会话" })
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "选择学生联系人" }), "student-lin-xiaoyu")
    await user.click(within(dialog).getByRole("button", { name: "创建会话" }))
    expect(screen.getAllByRole("button", { name: "打开林晓雨会话" })).toHaveLength(1)
    expect(screen.getByRole("heading", { name: "林晓雨" })).toBeInTheDocument()
  })

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

  it("sends with Enter, keeps Shift+Enter as a line break, and preserves the teacher author", async () => {
    const user = userEvent.setup()
    renderMessages()

    const composer = screen.getByRole("textbox", { name: "输入消息" })
    await user.type(composer, "第一行{shift>}{enter}{/shift}第二行")
    expect(composer).toHaveValue("第一行\n第二行")

    await user.keyboard("{Enter}")

    const log = screen.getByRole("log", { name: "林晓雨的消息记录" })
    const sentMessage = within(log).getByText(/第一行\s+第二行/)
    expect(sentMessage.closest("article")).toHaveTextContent("李老师")
    expect(composer).toHaveValue("")
  })

  it("shows a student message under the student's name in the teacher conversation", async () => {
    const user = userEvent.setup()
    render(
      <PrototypeProvider>
        <StudentMessagesPage />
        <MessagesPage />
      </PrototypeProvider>,
    )

    const studentComposer = screen.getByRole("textbox", { name: "给李老师留言" })
    await user.type(studentComposer, "老师你好，这是学生发出的消息{enter}")

    const teacherLog = screen.getByRole("log", { name: "林晓雨的消息记录" })
    const message = within(teacherLog).getByText("老师你好，这是学生发出的消息")
    expect(message.closest("article")).toHaveTextContent("林晓雨")
    expect(message.closest("article")).not.toHaveTextContent("李老师")
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
