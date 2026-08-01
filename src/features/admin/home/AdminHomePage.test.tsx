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
  it("shows school operations, access codes, retention, and the simulated-data boundary", () => {
    renderHome()

    expect(
      screen.getByRole("heading", { name: "学校管理概览" }),
    ).toBeInTheDocument()
    expect(screen.getByText("知野实验学校")).toBeInTheDocument()
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument()
    expect(screen.getByText("6", { selector: "strong" })).toBeInTheDocument()
    expect(screen.getByText("18", { selector: "strong" })).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "邀请码与绑定码" }),
    ).toHaveTextContent("ZY-SCHOOL-2026")
    expect(
      screen.getByRole("region", { name: "邀请码与绑定码" }),
    ).toHaveTextContent("520826")
    expect(
      screen.getByRole("region", { name: "数据留存摘要" }),
    ).toHaveTextContent("课堂原始音频")
    expect(
      screen.getByRole("region", { name: "数据留存摘要" }),
    ).toHaveTextContent("7 天")
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
