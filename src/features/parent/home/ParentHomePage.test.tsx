import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { parentSummaryFixture, taskFixtures } from "../../../app/prototype/fixtures"
import type { AppRoute } from "../../../app/routes"
import { StudentDetailPage } from "../../teacher/students/StudentDetailPage"
import { generateDraft } from "../../../services/localAi"
import { ParentHomePage } from "./ParentHomePage"

vi.mock("../../../services/localAi", () => ({ generateDraft: vi.fn() }))

function renderHome(extra?: React.ReactNode) {
  const onNavigate = vi.fn<(route: AppRoute) => void>()
  render(<PrototypeProvider>{extra}<ParentHomePage onNavigate={onNavigate} /></PrototypeProvider>)
  return { onNavigate }
}

function UpdateLearning() {
  const { addTask, updateTaskCompletion, addTaskInquiry, addMistake, sendMessage } = usePrototype()
  return <button onClick={() => {
    addTask({ ...taskFixtures[1], id: "task-parent-live", title: "最新的三题自检", type: "quiz", sourceQuizId: "quiz-fractions-check", completions: [], inquiries: [], createdAt: "2026-09-28T08:00:00+08:00" })
    updateTaskCompletion("task-active-01", "student-lin-xiaoyu", "submitted", { score: 8 })
    addTaskInquiry("task-active-01", { id: "inquiry-parent-live", studentId: "student-lin-xiaoyu", subject: "数学", question: "私密提问内容", answer: "私密 AI 解答", focus: "单位换算", status: "answered", createdAt: "2026-09-28T08:15:00+08:00" })
    addMistake("student-lin-xiaoyu", { id: "mistake-parent-live", subject: "数学", knowledgePoint: "单位换算", prompt: "私密错题内容", cause: "混淆进率", explanation: "私密解析", mastery: "new", source: "task", createdAt: "2026-09-28T08:20:00+08:00" })
    sendMessage("conversation-parent-li", "请家长关注最近的单位换算复习。")
  }} type="button">写入新进展</button>
}

describe("ParentHomePage", () => {
  it("shows the bound student's live tasks and keeps the approved summary as a dated record", () => {
    renderHome()
    expect(screen.getByRole("heading", { name: "林晓雨的学习近况" })).toBeInTheDocument()
    expect(screen.getByText(/五年级（2）班 · 任务和学习记录更新后/)).toBeInTheDocument()
    const live = screen.getByRole("region", { name: "当前学习动态" })
    expect(live).toHaveTextContent("待完成任务")
    expect(live).toHaveTextContent("已提交任务")
    expect(screen.getByRole("region", { name: "孩子的任务" })).toHaveTextContent("单位换算巩固练习")
    expect(screen.queryByText("小数乘法预习")).not.toBeInTheDocument()
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).toHaveTextContent("7 月 20 日—7 月 26 日")
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).toHaveTextContent(parentSummaryFixture.teacherMessage)
    expect(screen.queryByText(/模拟音频|播放语音家书/)).not.toBeInTheDocument()
  })

  it("updates tasks, scores, inquiries, review topics, and teacher messages without exposing raw work", async () => {
    const user = userEvent.setup()
    renderHome(<UpdateLearning />)
    await user.click(screen.getByRole("button", { name: "写入新进展" }))
    const tasks = screen.getByRole("region", { name: "孩子的任务" })
    expect(within(tasks).getByText("最新的三题自检")).toBeInTheDocument()
    expect(tasks).toHaveTextContent("已记录成绩 8 分")
    expect(screen.getByRole("region", { name: "学习支持" })).toHaveTextContent("最近关注：单位换算")
    expect(screen.getByRole("region", { name: "复习方向" })).toHaveTextContent("最近的复习主题：单位换算")
    expect(screen.getByRole("region", { name: "联系老师" })).toHaveTextContent("请家长关注最近的单位换算复习。")
    expect(screen.getByRole("region", { name: "最近学习记录" })).toHaveTextContent("任务疑问已获得解答")
    expect(screen.queryByText(/私密提问内容|私密 AI 解答|私密错题内容|私密解析/)).not.toBeInTheDocument()
    expect(screen.queryByText("周子墨")).not.toBeInTheDocument()
  })

  it("opens the bound parent-teacher conversation", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderHome()
    await user.click(within(screen.getByRole("region", { name: "联系老师" })).getByRole("button", { name: "查看家校消息" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "parent", page: "messages" })
  })

  it("keeps a teacher draft private and generates it from current task evidence", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({ content: { topics: ["单位换算"], encouragement: "愿意解释自己的想法。", teacher_message: "完成单位换算自检。" } })
    renderHome(<StudentDetailPage studentId="student-lin-xiaoyu" />)
    await user.click(screen.getByRole("button", { name: "生成本周摘要草稿" }))
    expect(await screen.findByText("AI 草稿 · 待教师审核")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).toHaveTextContent(parentSummaryFixture.teacherMessage)
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).not.toHaveTextContent("完成单位换算自检。")
    expect(generateDraft).toHaveBeenCalledWith("parent-summary", { facts: expect.arrayContaining([expect.stringContaining("任务“单位换算巩固练习”")]) })
    expect(JSON.stringify(vi.mocked(generateDraft).mock.calls[0][1])).not.toContain("本周主动提问 4 次")
  })

  it("shows live learning when the teacher summary has not been confirmed", () => {
    localStorage.setItem("zhiye-prototype-state-v1", JSON.stringify({ parentSummary: { ...parentSummaryFixture, confirmedAt: "" } }))
    const onNavigate = vi.fn<(route: AppRoute) => void>()
    render(<PrototypeProvider persist><ParentHomePage onNavigate={onNavigate} /></PrototypeProvider>)
    expect(screen.getByRole("region", { name: "孩子的任务" })).toHaveTextContent("单位换算巩固练习")
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).toHaveTextContent("等待教师确认")
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).not.toHaveTextContent(parentSummaryFixture.teacherMessage)
    localStorage.clear()
  })

  it("retains the approved summary when a new generation fails", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockRejectedValue(new Error("本地 AI 服务未启动，请运行 start-local-ai.ps1"))
    renderHome(<StudentDetailPage studentId="student-lin-xiaoyu" />)
    await user.click(screen.getByRole("button", { name: "生成本周摘要草稿" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("本地 AI 服务未启动")
    expect(screen.getByRole("region", { name: "已确认的学习摘要" })).toHaveTextContent(parentSummaryFixture.teacherMessage)
  })
})
