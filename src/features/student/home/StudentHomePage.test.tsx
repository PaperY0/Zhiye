import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
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
  it("shows only the published recap and the student's real next actions", () => {
    renderHome()

    expect(screen.getByRole("heading", { name: /林晓雨/ })).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "继续学习" }),
    ).toHaveTextContent("单位换算中的乘除步骤")
    expect(
      screen.getByRole("button", { name: "开始复习" }),
    ).toBeInTheDocument()
    expect(screen.getByText("下一项任务").closest("div")).toHaveTextContent("今天的任务已完成")
    expect(screen.getByText("0 项待办")).toBeInTheDocument()
    expect(screen.getByText("最近错题").closest("div")).toHaveTextContent("分数的基本性质")
    expect(screen.getByRole("button", { name: "联系老师" })).toBeInTheDocument()
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

    await user.click(screen.getByRole("button", { name: "查看任务" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "tasks" })
    await user.click(screen.getByRole("button", { name: "打开错题本" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "mistakes",
    })
    await user.click(screen.getByRole("button", { name: "联系老师" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "messages" })
  })
})
