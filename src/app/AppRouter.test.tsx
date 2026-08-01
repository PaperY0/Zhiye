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

  it("keeps every routed role inside the shared shell with the correct active item", () => {
    const cases = [
      ["#/teacher/workspace", "教师端主导航", "工作台"],
      ["#/teacher/classroom", "教师端主导航", "课堂"],
      ["#/teacher/classroom/lesson-fractions", "教师端主导航", "课堂"],
      ["#/teacher/insights", "教师端主导航", "班级洞察"],
      ["#/teacher/planning", "教师端主导航", "备课与测验"],
      ["#/teacher/students", "教师端主导航", "学生档案"],
      ["#/teacher/students/student-lin-xiaoyu", "教师端主导航", "学生档案"],
      ["#/teacher/tasks", "教师端主导航", "任务"],
      ["#/teacher/messages", "教师端主导航", "消息"],
      ["#/teacher/settings", "教师端主导航", "设置"],
      ["#/student/home", "学生端主导航", "首页"],
      ["#/student/review/lesson-fractions", "学生端主导航", "首页"],
      ["#/student/tutoring", "学生端主导航", "拍照答疑"],
      ["#/student/learning", "学生端主导航", "知识点学习"],
      ["#/student/mistakes", "学生端主导航", "错题本"],
      ["#/student/tasks", "学生端主导航", "任务"],
      ["#/student/messages", "学生端主导航", "消息"],
      ["#/parent/home", "家长端主导航", "学习摘要"],
      ["#/parent/messages", "家长端主导航", "联系老师"],
      ["#/admin/home", "管理端主导航", "管理概览"],
      ["#/admin/safety", "管理端主导航", "保护性反馈"],
      ["#/admin/audit", "管理端主导航", "审计记录"],
      ["#/admin/settings", "管理端主导航", "学校设置"],
    ] as const

    for (const [hash, navigationName, activeLabel] of cases) {
      window.history.replaceState(null, "", hash)
      const view = render(<App />)
      const navigation = within(view.container).getByRole("navigation", {
        name: navigationName,
      })
      expect(
        within(navigation).getByRole("button", { name: activeLabel }),
      ).toHaveAttribute("aria-current", "page")
      expect(view.container.querySelector("main#main-content")).toBeInTheDocument()
      view.unmount()
    }
  })

  it("falls back to welcome for unknown hashes", () => {
    window.history.replaceState(null, "", "#/unknown/page")
    render(<App />)
    expect(screen.getByRole("heading", { name: "让每一间课堂长出自己的 回响" })).toBeInTheDocument()
  })
})
