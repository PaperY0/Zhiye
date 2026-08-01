import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { StudentReviewPage } from "./StudentReviewPage"

function renderReview(lessonId = "lesson-fractions") {
  const onNavigate = vi.fn<(route: AppRoute) => void>()
  render(
    <PrototypeProvider>
      <StudentReviewPage lessonId={lessonId} onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

describe("StudentReviewPage", () => {
  it("shows a complete student recap with key point, reminder, example, self-check, and practice", () => {
    renderReview()

    expect(
      screen.getByRole("heading", { name: "分数的基本性质" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "关键知识" })).toHaveTextContent(
      "分子和分母同时乘或除以相同的数",
    )
    expect(screen.getByRole("region", { name: "易错提醒" })).toHaveTextContent(
      "不为零",
    )
    expect(
      screen.getByRole("region", { name: "生活中的例子" }),
    ).toHaveTextContent("果汁")
    expect(screen.getByRole("region", { name: "自检问题" })).toHaveTextContent(
      "3/5",
    )
    expect(screen.getByRole("region", { name: "再练一道" })).toHaveTextContent(
      "4/7",
    )
  })

  it("runs simulated read-aloud and records a self-assessment", async () => {
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole("button", { name: "朗读复习卡" }))
    expect(screen.getByRole("status")).toHaveTextContent("正在模拟朗读")
    expect(screen.getByRole("button", { name: "停止朗读" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "停止朗读" }))
    expect(screen.getByRole("status")).toHaveTextContent("模拟朗读已停止")

    await user.click(screen.getByRole("button", { name: "我能讲出来" }))
    expect(screen.getByRole("button", { name: "我能讲出来" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByText("已记录：我能讲出来")).toBeInTheDocument()
  })

  it("checks an answer and opens knowledge learning for the current topic", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderReview()

    await user.click(screen.getByRole("button", { name: "6/10" }))
    expect(
      screen.getByText("答对了，你同时改变了分子和分母。"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "学习分数的基本性质" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "learning",
    })
  })

  it("shows a recoverable empty state for an unknown lesson", () => {
    const { onNavigate } = renderReview("missing-lesson")

    expect(
      screen.getByRole("heading", { name: "还没有找到这张复习卡" }),
    ).toBeInTheDocument()
    screen.getByRole("button", { name: "返回学生首页" }).click()
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "home" })
  })
})
