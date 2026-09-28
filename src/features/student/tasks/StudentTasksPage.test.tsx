import { useState } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { quizFixtures, taskFixtures } from "../../../app/prototype/fixtures"
import { StudentTasksPage } from "./StudentTasksPage"
import { MistakesPage } from "../mistakes/MistakesPage"
import { TaskDetailDrawer } from "../../teacher/tasks/TaskDetailDrawer"

function renderPage() {
  render(
    <PrototypeProvider>
      <StudentTasksPage />
    </PrototypeProvider>,
  )
}

describe("StudentTasksPage", () => {
  it("opens the latest task selected from the student home card", () => {
    sessionStorage.setItem("zhiye-student-task-open-id", "task-active-01")
    renderPage()
    expect(screen.getByRole("dialog", { name: "单位换算巩固练习" })).toBeInTheDocument()
    expect(sessionStorage.getItem("zhiye-student-task-open-id")).toBeNull()
  })
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

  it("keeps long task instructions scrollable while the action stays in the footer", async () => {
    function Seed() {
      const { addTask } = usePrototype()
      return <button onClick={() => addTask({
        ...taskFixtures[0], id: "long-student-task", title: "小数乘法说明",
        status: "active", completions: [{ studentId: "student-lin-xiaoyu", status: "not-started" }],
        content: "第一步：画出 0.4×0.3 的方格图。第二步：写出竖式并解释结果。",
        successCriteria: "1. 能解释 0.4×0.3。 2. 能核对结果。",
      })} type="button">准备长任务</button>
    }
    const user = userEvent.setup()
    render(<PrototypeProvider><Seed /><StudentTasksPage /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "准备长任务" }))
    await user.click(screen.getByRole("button", { name: "打开小数乘法说明" }))

    const dialog = screen.getByRole("dialog", { name: "小数乘法说明" })
    const body = dialog.querySelector(".prototype-dialog-body")
    const footer = dialog.querySelector(".prototype-dialog-footer")
    expect(body).toHaveTextContent("0.4×0.3")
    expect(within(body as HTMLElement).getByText(/^第二步/)).toBeInTheDocument()
    expect(within(body as HTMLElement).getByText(/^2\. 能核对/)).toBeInTheDocument()
    expect(footer).toContainElement(within(dialog).getByRole("button", { name: "开始任务" }))
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
    expect(within(dialog).getByRole("status")).toHaveTextContent("请先完成所有测验题目")
    for (const [index, question] of quizFixtures[0].questions.entries()) {
      if (question.type === "short-answer") await user.type(within(dialog).getByRole("textbox", { name: `第${index + 1}题答案` }), "分子分母同乘不变")
      else await user.click(within(dialog).getByRole("radio", { name: Array.isArray(question.answer) ? question.answer[0] : question.answer }))
    }
    await user.click(within(dialog).getByRole("button", { name: "标记为已完成" }))
    expect(within(dialog).getByText("测验反馈")).toBeInTheDocument()
    expect(within(dialog).getByText(/自动得分/)).toBeInTheDocument()
  })

  it("lets students tap judgment answers and see whether each answer was correct", async () => {
    function TeacherView() {
      const [open, setOpen] = useState(false)
      const { tasks, students, quizzes } = usePrototype()
      return <><button onClick={() => setOpen(true)} type="button">查看教师成绩</button><TaskDetailDrawer open={open} task={tasks.find((task) => task.id === "judgment-task") ?? null} students={students} quizzes={quizzes} onClose={() => setOpen(false)} onReminder={() => {}} onStatusChange={() => {}} /></>
    }
    function Seed() {
      const { addQuiz, addTask } = usePrototype()
      return <button onClick={() => {
        addQuiz({ ...quizFixtures[0], id: "judgment-quiz", questions: [
          { id: "judge-1", prompt: "圆面积公式是 πr²。", type: "true-false", options: ["正确", "错误"], answer: "正确", explanation: "面积公式为 πr²", score: 10 },
          { id: "judge-2", prompt: "半径翻倍，面积也翻倍。", type: "true-false", options: ["正确", "错误"], answer: "错误", explanation: "面积变为四倍", score: 10 },
        ] })
        addTask({ ...taskFixtures[0], id: "judgment-task", title: "判断练习", sourceQuizId: "judgment-quiz", type: "quiz", status: "active", submissionMode: "online", completions: [{ studentId: "student-lin-xiaoyu", status: "not-started" }] })
      }} type="button">准备判断练习</button>
    }
    const user = userEvent.setup()
    render(<PrototypeProvider><Seed /><StudentTasksPage /><MistakesPage /><TeacherView /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "准备判断练习" }))
    await user.click(screen.getByRole("button", { name: "打开判断练习" }))
    const dialog = screen.getByRole("dialog", { name: "判断练习" })
    await user.click(within(dialog).getByRole("button", { name: "开始任务" }))
    const choices = within(dialog).getAllByRole("radio", { name: "正确" })
    await user.click(choices[0])
    await user.click(choices[1])
    await user.click(within(dialog).getByRole("button", { name: "标记为已完成" }))
    expect(within(dialog).getByText("回答正确")).toBeInTheDocument()
    expect(within(dialog).getByText("回答错误 · 已加入错题本")).toBeInTheDocument()
    expect(within(dialog).getByText(/自动得分：10 \/ 20 分/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /查看错题：半径翻倍，面积也翻倍。/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "查看教师成绩" }))
    const teacherDialog = screen.getAllByRole("dialog", { name: "判断练习" }).at(-1)!
    expect(within(teacherDialog).getByText("10 / 20 分")).toBeInTheDocument()
  })
})
