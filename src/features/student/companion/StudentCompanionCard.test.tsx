import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import StudentCompanionCard from "./StudentCompanionCard"

describe("StudentCompanionCard", () => {
  it("shows companion guidance and navigates to tutoring", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<StudentCompanionCard onNavigate={onNavigate} />)

    expect(screen.getByRole("region", { name: "学习陪伴" })).toBeInTheDocument()
    expect(screen.getByText("小野陪你学习")).toBeInTheDocument()
    expect(screen.getAllByTestId("pinyin-line").length).toBeGreaterThan(0)

    await user.click(screen.getByRole("button", { name: /需要提示吗/ }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "student", page: "tutoring" })
  })
})
