import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { taskFixtures } from "../../../app/prototype/fixtures"
import { InsightsPage } from "./InsightsPage"

function LiveTaskProbe() {
  const { addTask, updateTaskCompletion, addTaskInquiry } = usePrototype()
  return <>
    <button onClick={() => addTask({ ...taskFixtures[0], id: "insight-live-task", title: "实时联动任务", sourceQuizId: "quiz-fractions-check", status: "active", audience: { kind: "students", label: "林晓雨", studentIds: ["student-lin-xiaoyu"] }, completions: [{ studentId: "student-lin-xiaoyu", status: "not-started" }] })} type="button">新增联动任务</button>
    <button onClick={() => updateTaskCompletion("insight-live-task", "student-lin-xiaoyu", "submitted", { score: 5, answers: { "question-fractions-01": "6/10", "question-fractions-02": "可以", "question-fractions-03": "解释" } })} type="button">模拟学生提交</button>
    <button onClick={() => updateTaskCompletion("insight-live-task", "student-lin-xiaoyu", "reviewed")} type="button">模拟教师查看</button>
    <button onClick={() => addTaskInquiry("insight-live-task", { id: "live-inquiry", studentId: "student-lin-xiaoyu", subject: "数学", question: "为什么先统一单位？", status: "asking", createdAt: new Date().toISOString() })} type="button">模拟学生询问</button>
  </>
}

function renderPage(withProbe = false) {
  return render(<PrototypeProvider><InsightsPage />{withProbe && <LiveTaskProbe />}</PrototypeProvider>)
}

describe("InsightsPage", () => {
  beforeEach(() => localStorage.clear())

  it("shows a task-count pie and removes the redundant panels", () => {
    renderPage()
    expect(screen.getByRole("heading", { name: "班级洞察" })).toBeInTheDocument()
    const pie = screen.getByRole("img", { name: /五年级（2）班共 4 项任务/ })
    expect(pie).toHaveTextContent("4项任务")
    expect(screen.getByRole("heading", { name: "每项任务的学习反馈" })).toBeInTheDocument()
    for (const heading of ["班级概览", "需要跟进的学习步骤", "任务回流", "按班级查看"]) {
      expect(screen.queryByRole("heading", { name: heading })).not.toBeInTheDocument()
    }
    expect(screen.queryByText("3 / 60 份")).not.toBeInTheDocument()
  })

  it("updates the task total, status and inquiry chart from live state", async () => {
    const user = userEvent.setup()
    renderPage(true)
    await user.click(screen.getByRole("button", { name: "新增联动任务" }))
    expect(screen.getByRole("img", { name: /五年级（2）班共 5 项任务：.*进行中 2 项/ })).toBeInTheDocument()
    const task = screen.getByRole("button", { name: /查看任务 实时联动任务，已提交 0\/1，0 次询问/ })
    expect(task).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "模拟学生提交" }))
    expect(screen.getByRole("img", { name: "实时联动任务提交进度 1/1" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "实时联动任务正确率 50%，答对 1/2 题" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /五年级（2）班共 5 项任务：.*待查看 2 项/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "模拟教师查看" }))
    expect(screen.getByRole("img", { name: /五年级（2）班共 5 项任务：.*已完成 2 项/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "模拟学生询问" }))
    expect(screen.getByRole("button", { name: /查看任务 实时联动任务，已提交 1\/1，1 次询问/ })).toHaveTextContent("为什么先统一单位？")
  })

  it("switches pie and task list to the selected class", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole("button", { name: "全局预览" }))
    expect(screen.getByRole("img", { name: /全部授课班级共 4 项任务/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "更换班级" }))
    await user.click(screen.getByRole("option", { name: "五年级（1）班" }))
    expect(screen.getByRole("img", { name: "五年级（1）班暂无任务" })).toBeInTheDocument()
    expect(screen.getByText("当前范围还没有已发布任务。")).toBeInTheDocument()
  })

  it("opens the selected task with the class filter", async () => {
    const user = userEvent.setup()
    renderPage()
    const task = screen.getByRole("button", { name: /查看任务 单位换算巩固练习/ })
    expect(within(task).getByText("单位换算巩固练习")).toBeInTheDocument()
    await user.click(task)
    expect(window.location.hash).toBe("#/teacher/tasks")
    expect(window.sessionStorage.getItem("zhiye-task-class-filter")).toBe("五年级（2）班")
    expect(window.sessionStorage.getItem("zhiye-task-open-id")).toBe("task-active-01")
  })
})
