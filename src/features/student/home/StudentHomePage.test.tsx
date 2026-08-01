import { render, screen, within } from "@testing-library/react"
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
  it("shows the student's recap, tutoring, tasks, mistakes, and personal progress without rankings", () => {
    renderHome()

    expect(screen.getByRole("heading", { name: /林晓雨/ })).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "今日复习卡" }),
    ).toHaveTextContent("单位换算中的乘除步骤")
    expect(
      screen.getByRole("button", { name: /拍照问一道题/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "我的待办" })).toHaveTextContent(
      "分数基本性质自检",
    )
    expect(screen.getByRole("region", { name: "我的错题" })).toHaveTextContent(
      "分数的基本性质",
    )
    expect(screen.getByRole("region", { name: "我的进度" })).toHaveTextContent(
      "任务完成率",
    )
    expect(screen.getByText("72%", { selector: "strong" })).toBeInTheDocument()
    expect(screen.queryByText(/排名|第\s*\d+\s*名/)).not.toBeInTheDocument()
  })

  it("opens the recap and the other student learning entries", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderHome()

    await user.click(
      screen.getByRole("button", { name: "打开单位换算中的乘除步骤复习卡" }),
    )
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "review",
      lessonId: "lesson-units",
    })

    await user.click(screen.getByRole("button", { name: /拍照问一道题/ }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "tutoring",
    })

    const todo = screen.getByRole("region", { name: "我的待办" })
    await user.click(within(todo).getByRole("button", { name: "查看全部任务" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "tasks" })

    const mistakes = screen.getByRole("region", { name: "我的错题" })
    await user.click(
      within(mistakes).getByRole("button", { name: "打开错题本" }),
    )
    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "mistakes",
    })
  })
})
