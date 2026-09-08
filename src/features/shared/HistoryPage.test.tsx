import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../app/prototype/PrototypeContext"
import HistoryPage from "./HistoryPage"

function renderHistory() {
  return render(
    <PrototypeProvider persist={false}>
      <HistoryPage role="teacher" />
    </PrototypeProvider>,
  )
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true))
  })

  it("searches, views, and edits a record", async () => {
    const user = userEvent.setup()
    renderHistory()

    expect(screen.getByRole("heading", { name: "历史记录" })).toBeInTheDocument()
    const search = screen.getByRole("textbox", { name: "查找历史记录" })
    await user.type(search, "分数")

    const lessonCard = screen.getByText("分数的基本性质").closest("article") ?? screen.getByText("分数的基本性质").parentElement
    expect(lessonCard).toBeTruthy()
    await user.click(screen.getByRole("button", { name: "修改分数的基本性质" }))
    const dialog = screen.getByRole("dialog", { name: /查看历史记录/ })
    const titleInput = within(dialog).getByRole("textbox", { name: "记录标题" })
    await user.clear(titleInput)
    await user.type(titleInput, "分数复盘历史")
    await user.click(within(dialog).getByRole("button", { name: "保存修改" }))

    expect(screen.getByText("分数复盘历史")).toBeInTheDocument()
  })

  it("deletes an editable record after confirmation", async () => {
    const user = userEvent.setup()
    renderHistory()
    const deleteButtons = screen.getAllByRole("button", { name: /删除/ })
    const initialCount = deleteButtons.length

    await user.click(deleteButtons[0])

    expect(screen.getAllByRole("button", { name: /删除/ })).toHaveLength(initialCount - 1)
  })
})
