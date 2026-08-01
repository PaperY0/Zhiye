import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import App from "../App"

describe("AppRouter", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#/welcome")
  })

  it("enters each role through the welcome experience", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "进入知野 · Enter Zhiye" }))
    expect(screen.getByRole("dialog", { name: "选择体验角色" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "以教师身份进入" }))
    expect(window.location.hash).toBe("#/teacher/workspace")
    expect(screen.getByTestId("teacher-workspace")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "教师端主导航" }),
    ).toBeInTheDocument()
  })

  it("renders a role shell for routed prototype pages", () => {
    window.history.replaceState(null, "", "#/student/tutoring")
    render(<App />)

    expect(screen.getByRole("navigation", { name: "学生端主导航" })).toBeInTheDocument()
    const main = screen.getByRole("main")
    expect(within(main).getByRole("heading", { name: "拍照答疑" })).toBeInTheDocument()
    expect(within(main).getByText("选择题目图片")).toBeInTheDocument()
  })


  it("renders implemented teacher pages through the shared role shell", () => {
    window.history.replaceState(null, "", "#/teacher/insights")
    render(<App />)

    expect(screen.getByRole("navigation", { name: "教师端主导航" })).toBeInTheDocument()
    const main = screen.getByRole("main")
    expect(within(main).getByRole("heading", { name: "班级洞察" })).toBeInTheDocument()
    expect(within(main).getByText("单位换算 × 计算")).toBeInTheDocument()
  })


  it("renders designed content for every declared product route", () => {
    const routes = [
      "#/welcome",
      "#/teacher/workspace",
      "#/teacher/classroom",
      "#/teacher/classroom/lesson-fractions",
      "#/teacher/insights",
      "#/teacher/planning",
      "#/teacher/students",
      "#/teacher/students/student-lin-xiaoyu",
      "#/teacher/tasks",
      "#/teacher/messages",
      "#/teacher/settings",
      "#/student/home",
      "#/student/review/lesson-fractions",
      "#/student/tutoring",
      "#/student/learning",
      "#/student/mistakes",
      "#/student/tasks",
      "#/student/messages",
      "#/parent/home",
      "#/parent/messages",
      "#/admin/home",
      "#/admin/safety",
      "#/admin/audit",
      "#/admin/settings",
      ]

    for (const hash of routes) {
      window.history.replaceState(null, "", hash)
      const view = render(<App />)
      const contentRoot = hash === "#/welcome"
        ? view.container.querySelector("main")
        : view.container.querySelector("main#main-content")
      expect(contentRoot).not.toBeNull()
      expect(within(contentRoot).getAllByRole("heading").length).toBeGreaterThan(0)
      expect(within(contentRoot).queryByText("页面结构已接入")).not.toBeInTheDocument()
      expect(within(contentRoot).queryByText(/该页面将在.+阶段完成完整交互/)).not.toBeInTheDocument()
      view.unmount()
    }
  })

  it("falls back to welcome for unknown hashes", () => {
    window.history.replaceState(null, "", "#/unknown/page")
    render(<App />)
    expect(screen.getByRole("heading", { name: "让每一间课堂长出自己的 回响" })).toBeInTheDocument()
  })
})
