import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { quizFixtures, taskFixtures } from "../../../app/prototype/fixtures"
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
    expect(screen.getByText("任务已开始，进度已同步")).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "标记为已完成" }),
    )
    expect(within(dialog).getByText("已完成，等待老师查看")).toBeInTheDocument()
    expect(screen.getByText("任务已提交，等待老师查看")).toBeInTheDocument()

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

  it("requires answers for a linked quiz and shows feedback after submission", async () => {
    function Seed() {
      const { addTask } = usePrototype()
      return <button onClick={() => addTask({ ...taskFixtures[0], id: "test-linked-quiz", title: "分数小测", sourceQuizId: quizFixtures[0].id, type: "quiz", status: "active", submissionMode: "online", completions: [{ studentId: "student-lin-xiaoyu", status: "not-started" }] })} type="button">准备测验任务</button>
    }
    const user = userEvent.setup()
    render(<PrototypeProvider><Seed /><StudentTasksPage /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "准备测验任务" }))
    await user.click(screen.getByRole("button", { name: "打开分数小测" }))
    const dialog = screen.getByRole("dialog", { name: "分数小测" })
    await user.click(within(dialog).getByRole("button", { name: "开始任务" }))
    await user.click(within(dialog).getByRole("button", { name: "标记为已完成" }))
    expect(screen.getByText("请先完成所有测验题目")).toBeInTheDocument()
    for (const [index, question] of quizFixtures[0].questions.entries()) {
      if (question.type === "short-answer") await user.type(within(dialog).getByRole("textbox", { name: `第${index + 1}题答案` }), "分子分母同乘不变")
      else await user.click(within(dialog).getByRole("radio", { name: Array.isArray(question.answer) ? question.answer[0] : question.answer }))
    }
    await user.click(within(dialog).getByRole("button", { name: "标记为已完成" }))
    expect(within(dialog).getByText("测验反馈")).toBeInTheDocument()
    expect(within(dialog).getByText(/客观题得分/)).toBeInTheDocument()
  })
})
