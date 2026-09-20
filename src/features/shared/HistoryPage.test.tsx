import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../app/prototype/PrototypeContext"
import HistoryPage from "./HistoryPage"

function renderHistory(onNavigate = vi.fn()) {
  render(
    <PrototypeProvider persist={false}>
      <HistoryPage role="teacher" onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return onNavigate
}

describe("HistoryPage", () => {
  it("searches the archive and opens the owning feature", async () => {
    const user = userEvent.setup()
    const onNavigate = renderHistory()

    expect(screen.getByRole("heading", { name: "历史记录" })).toBeInTheDocument()
    const search = screen.getByRole("textbox", { name: "查找历史记录" })
    await user.type(search, "分数")

    expect(screen.getByText("分数的基本性质")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "打开分数的基本性质来源" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "teacher",
      page: "lesson-detail",
      lessonId: "lesson-fractions",
    })
  })

  it("is a read-only archive without duplicate edit or delete actions", () => {
    renderHistory()
    expect(screen.getByText("统一回看，不重复管理")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /修改/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /删除/ })).not.toBeInTheDocument()
  })
})
