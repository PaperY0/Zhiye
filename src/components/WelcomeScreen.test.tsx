import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import WelcomeScreen from "./WelcomeScreen"

describe("WelcomeScreen", () => {
  it("presents 知野 as a bilingual brand and enters from the primary CTA", async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()

    render(<WelcomeScreen onEnter={onEnter} />)
    expect(screen.getByRole("link", { name: "知野 Zhì Yě" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "进入知野 · Enter Zhiye" }))

    expect(onEnter).toHaveBeenCalledOnce()
  })
})
