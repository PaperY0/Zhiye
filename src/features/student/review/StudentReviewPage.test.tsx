import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { StudentReviewPage } from "./StudentReviewPage"

function renderReview(lessonId = "lesson-units") {
  const onNavigate = vi.fn<(route: AppRoute) => void>()
  render(
    <PrototypeProvider>
      <StudentReviewPage lessonId={lessonId} onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

describe("StudentReviewPage", () => {
  it("shows only the teacher-published recap and real next-step controls", () => {
    renderReview()

    expect(
      screen.getByRole("heading", { name: "单位换算中的乘除步骤" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "课堂关键知识" })).toHaveTextContent(
      "先判断单位变大还是变小",
    )
    expect(screen.getByRole("region", { name: "复习反馈" })).toBeInTheDocument()
    expect(screen.queryByText("生活中的例子")).not.toBeInTheDocument()
    expect(screen.queryByText("自检问题")).not.toBeInTheDocument()
  })

  it("records a self-assessment", async () => {
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole("button", { name: "我已理解" }))
    expect(screen.getByRole("button", { name: "我已理解" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByText("已记录：我已理解")).toBeInTheDocument()
  })

  it("opens the teacher conversation when the student needs help", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderReview()

    await user.click(screen.getByRole("button", { name: "我想问老师" }))
    await user.click(screen.getByRole("button", { name: "联系老师" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "messages",
    })
  })

  it("shows a recoverable empty state for an unknown lesson", () => {
    const { onNavigate } = renderReview("missing-lesson")

    expect(
      screen.getByRole("heading", { name: "这张复习卡暂不可查看" }),
    ).toBeInTheDocument()
    screen.getByRole("button", { name: "返回学生首页" }).click()
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "home" })
  })
})
