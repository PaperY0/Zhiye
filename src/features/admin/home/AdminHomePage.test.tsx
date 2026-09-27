import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { AdminHomePage } from "./AdminHomePage"

function renderHome() {
  const onNavigate = vi.fn<(route: AppRoute) => void>()
  render(
    <PrototypeProvider>
      <AdminHomePage onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

describe("AdminHomePage", () => {
  it("shows school operations, response contacts, and the simulated-data boundary", () => {
    renderHome()

    expect(
      screen.getByRole("heading", { name: "学校管理概览" }),
    ).toBeInTheDocument()
    expect(screen.getByText("知野实验学校")).toBeInTheDocument()
    expect(screen.getAllByText("1", { selector: "strong" })).toHaveLength(2)
    expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "保护性反馈联系人" }),
    ).toHaveTextContent("王老师 · 德育负责人")
    expect(
      screen.getByText(/所有学校、班级、教师与安全队列数据均为演示数据/),
    ).toBeInTheDocument()
  })

  it("opens the protection queue and school settings", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderHome()

    expect(
      screen.getByRole("region", { name: "保护性反馈队列" }),
    ).toHaveTextContent("2 项待人工核实")

    await user.click(screen.getByRole("button", { name: "打开保护性反馈队列" }))
    expect(onNavigate).toHaveBeenCalledWith({ role: "admin", page: "safety" })

    await user.click(screen.getByRole("button", { name: "管理学校设置" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "admin",
      page: "settings",
    })
  })
})
