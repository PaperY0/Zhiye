import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "./App"

describe("知野体验入口", () => {
  it("opens the classroom workspace from the welcome CTA", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "进入知野 · Enter Zhiye" }))

    expect(
      screen.getByRole("heading", { name: "分数的基本性质" }),
    ).toBeInTheDocument()
  })
})
