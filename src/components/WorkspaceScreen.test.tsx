import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import WorkspaceScreen from "./WorkspaceScreen"

describe("WorkspaceScreen", () => {
  it("returns to the welcome experience from the workspace header", async () => {
    const onBackToWelcome = vi.fn()
    const user = userEvent.setup()

    render(<WorkspaceScreen onBackToWelcome={onBackToWelcome} />)
    await user.click(screen.getByRole("button", { name: "返回知野首页" }))

    expect(onBackToWelcome).toHaveBeenCalledOnce()
  })
})
