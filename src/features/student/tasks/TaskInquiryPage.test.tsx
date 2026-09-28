import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { TaskDetailDrawer } from "../../teacher/tasks/TaskDetailDrawer"
import { MistakesPage } from "../mistakes/MistakesPage"
import { TaskInquiryPage } from "./TaskInquiryPage"
import { StudentInquiryHubPage } from "./StudentInquiryHubPage"
import { generateDraft } from "../../../services/localAi"

vi.mock("../../../services/localAi", () => ({
  generateDraft: vi.fn(async () => ({ content: {
    answer: "先找出两个单位之间的关系，再决定乘还是除。",
    focus: "单位换算方向",
    reviewTip: "回看任务中的单位换算步骤，并解释理由。",
  } })),
}))

function TeacherView() {
  const { tasks, students, quizzes } = usePrototype()
  return <TaskDetailDrawer open task={tasks.find((task) => task.id === "task-active-01") ?? null} students={students} quizzes={quizzes} onClose={() => undefined} onReminder={() => undefined} onStatusChange={() => undefined} />
}

describe("task inquiry", () => {
  it("offers a permanent inquiry entry that selects an assigned task", () => {
    render(<PrototypeProvider><StudentInquiryHubPage /></PrototypeProvider>)
    const task = screen.getByRole("heading", { name: "单位换算巩固练习" }).closest("li")
    expect(task).not.toBeNull()
    expect(within(task!).getByRole("link", { name: "询问这项任务" })).toHaveAttribute("href", "#/student/ask/task-active-01")
    expect(screen.queryByRole("heading", { name: "找不到这项任务" })).not.toBeInTheDocument()
  })
  it("shares a real student question, AI answer, notebook entry, and teacher chart", async () => {
    const user = userEvent.setup()
    render(<PrototypeProvider><TaskInquiryPage taskId="task-active-01" /><TeacherView /><MistakesPage /></PrototypeProvider>)
    const question = "为什么这里要先换成相同单位？"
    await user.type(screen.getByRole("textbox", { name: "我的疑问" }), question)
    await user.click(screen.getByRole("button", { name: "询问 AI" }))
    expect(await screen.findByText("疑问点已整理进错题本")).toBeInTheDocument()
    const teacher = screen.getByRole("dialog", { name: "单位换算巩固练习" })
    expect(within(teacher).getByRole("heading", { name: "任务询问" })).toBeInTheDocument()
    expect(within(teacher).getByRole("img", { name: /林晓雨 1 次/ })).toBeInTheDocument()
    expect(within(teacher).getByText(question)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `查看错题：${question}` })).toBeInTheDocument()
  })

  it("does not expose an unrelated task", () => {
    render(<PrototypeProvider><TaskInquiryPage taskId="task-draft-01" /></PrototypeProvider>)
    expect(screen.getByRole("heading", { name: "找不到这项任务" })).toBeInTheDocument()
  })

  it("sends all three linked questions and teacher answers to AI from a one-tap question", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockClear()
    render(<PrototypeProvider><TaskInquiryPage taskId="task-review-01" /></PrototypeProvider>)
    expect(screen.getByText("这项任务的三道题")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "解答第 2 题" }))
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("task-inquiry", expect.objectContaining({
      question: expect.stringContaining("第 2 题"),
      taskContent: expect.stringContaining("第 3 题：请用自己的话解释为什么分数值不变。"),
    }))
    const content = (vi.mocked(generateDraft).mock.calls.at(-1)?.[1] as { taskContent: string }).taskContent
    expect(content).toContain("第 1 题：3/5 的分子和分母同时乘 2，得到哪个分数？")
    expect(content).toContain("标准答案：6/10")
    expect(content).toContain("标准答案：不可以")
  })
})
