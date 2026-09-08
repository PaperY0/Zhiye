import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import WelcomeScreen from "./WelcomeScreen"

describe("WelcomeScreen", () => {
  it("presents 知野 as a bilingual brand and enters from the primary CTA", async () => {
    const onEnterRole = vi.fn()
    const user = userEvent.setup()

    render(<WelcomeScreen onEnterRole={onEnterRole} />)
    expect(screen.getByRole("link", { name: "知野 Zhì Yě" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "让每一间课堂长出自己的 回响" }),
    ).toHaveClass("font-handwriting")

    await user.click(screen.getByRole("button", { name: "进入知野 · Enter Zhiye" }))

    expect(screen.getByRole("dialog", { name: "选择体验角色" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "以教师身份进入" }))
    expect(onEnterRole).toHaveBeenCalledWith("teacher")
  })
})
