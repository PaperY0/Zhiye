import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { taskFixtures } from "../../../app/prototype/fixtures"
import type { AppRoute } from "../../../app/routes"
import { StudentHomePage } from "./StudentHomePage"

function renderHome() {
  const onNavigate = vi.fn<(route: AppRoute) => void>()
  render(
    <PrototypeProvider>
      <StudentHomePage onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

describe("StudentHomePage", () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
  it("shows only the published recap and the student's real next actions", () => {
    renderHome()

    expect(screen.getByRole("heading", { name: /林晓雨/ })).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "继续学习" }),
    ).toHaveTextContent("单位换算中的乘除步骤")
    expect(
      screen.getByRole("button", { name: "开始复习" }),
    ).toBeInTheDocument()
    expect(screen.getByText("最新任务").closest("div")).toHaveTextContent("单位换算巩固练习")
    expect(screen.getByText("1 项待办")).toBeInTheDocument()
    expect(screen.getByText("最近错题").closest("div")).toHaveTextContent("分数的基本性质")
    expect(screen.getByRole("button", { name: "查看消息" })).toBeInTheDocument()
    expect(screen.queryByText("任务完成率")).not.toBeInTheDocument()
    expect(screen.queryByText("今天的小目标")).not.toBeInTheDocument()
    expect(screen.queryByText(/排名|第\s*\d+\s*名/)).not.toBeInTheDocument()
  })

  it("opens the recap, tasks, mistakes, and teacher conversation", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderHome()

    await user.click(
      screen.getByRole("button", { name: "开始复习" }),
    )
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "review",
      lessonId: "lesson-units",
    })

    await user.click(screen.getByRole("button", { name: "打开这项任务" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "tasks" })
    expect(sessionStorage.getItem("zhiye-student-task-open-id")).toBe("task-active-01")
    await user.click(screen.getByRole("button", { name: "打开错题本" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "mistakes",
    })
    await user.click(screen.getByRole("button", { name: "查看消息" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "messages" })
  })

  it("updates the latest task, score, mistake, and inquiry from live student records", async () => {
    function Updates() {
      const { addTask, updateTaskCompletion, addMistake, addTaskInquiry, sendMessage } = usePrototype()
      return <>
        <button onClick={() => addTask({ ...taskFixtures[0], id: "fresh-task", title: "今天的新自检", createdAt: "2026-09-28T18:00:00+08:00", status: "active", audience: { kind: "students", label: "林晓雨", studentIds: ["student-lin-xiaoyu"] }, completions: [{ studentId: "student-lin-xiaoyu", status: "not-started" }] })} type="button">发布新任务</button>
        <button onClick={() => updateTaskCompletion("fresh-task", "student-lin-xiaoyu", "submitted", { score: 20, answers: { q1: "正确" } })} type="button">提交新任务</button>
        <button onClick={() => addMistake("student-lin-xiaoyu", { id: "fresh-mistake", subject: "数学", knowledgePoint: "新自检中的面积题", prompt: "半径翻倍面积如何变", cause: "误选翻倍", explanation: "面积变四倍", mastery: "new", source: "quiz", taskId: "fresh-task", createdAt: "2026-09-28T18:05:00+08:00" })} type="button">记录新错题</button>
        <button onClick={() => sendMessage("conversation-student-xiaoyu", "请看今天的新自检")} type="button">老师发送新消息</button>
        <button onClick={() => addTaskInquiry("fresh-task", { id: "fresh-inquiry", studentId: "student-lin-xiaoyu", subject: "数学", question: "为什么面积变四倍？", status: "answered", createdAt: "2026-09-28T18:06:00+08:00" })} type="button">记录新询问</button>
      </>
    }
    const onNavigate = vi.fn<(route: AppRoute) => void>()
    const user = userEvent.setup()
    render(<PrototypeProvider><StudentHomePage onNavigate={onNavigate} /><Updates /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "发布新任务" }))
    expect(screen.getByText("最新任务").closest("div")).toHaveTextContent("今天的新自检")
    expect(screen.getByText("2 项待办")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "提交新任务" }))
    expect(screen.getByText("最新任务").closest("div")).toHaveTextContent("已记录成绩 20 分")
    await user.click(screen.getByRole("button", { name: "记录新错题" }))
    expect(screen.getByText("最近错题").closest("div")).toHaveTextContent("新自检中的面积题")
    await user.click(screen.getByRole("button", { name: "老师发送新消息" }))
    expect(screen.getByText("学习交流").closest("div")).toHaveTextContent("请看今天的新自检")
    await user.click(screen.getByRole("button", { name: "记录新询问" }))
    expect(screen.getByText("学习交流").closest("div")).toHaveTextContent("为什么面积变四倍？")
    await user.click(screen.getByRole("button", { name: "继续询问" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "task-inquiry", taskId: "fresh-task" })
  })

  it("labels only a scored self-check as an automatic score", async () => {
    function PublishQuiz() {
      const { addTask, updateTaskCompletion } = usePrototype()
      return <>
        <button onClick={() => addTask({ ...taskFixtures[2], id: "quiz-live", status: "active", title: "新三题自检", createdAt: "2026-09-29T08:00:00+08:00", completions: [] })} type="button">发布自检</button>
        <button onClick={() => updateTaskCompletion("quiz-live", "student-lin-xiaoyu", "submitted", { score: 5 })} type="button">完成自检</button>
      </>
    }
    const user = userEvent.setup()
    render(<PrototypeProvider><StudentHomePage onNavigate={vi.fn()} /><PublishQuiz /></PrototypeProvider>)
    await user.click(screen.getByRole("button", { name: "发布自检" }))
    await user.click(screen.getByRole("button", { name: "完成自检" }))
    expect(screen.getByText("最新任务").closest("div")).toHaveTextContent("自动得分 5 分")
  })
})
