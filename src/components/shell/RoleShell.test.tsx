import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { AppRoute } from "../../app/routes"
import { RoleShell } from "./RoleShell"

function renderShell(
  route: AppRoute = { role: "teacher", page: "insights" },
  onNavigate = vi.fn(),
) {
  render(
    <RoleShell route={route} onNavigate={onNavigate}>
      <p>页面内容</p>
    </RoleShell>,
  )

  return onNavigate
}

describe("RoleShell", () => {
  it("exposes role theme attributes for every role shell", () => {
    const expectations: Array<{
      route: AppRoute
      role: "teacher" | "student" | "parent" | "admin"
      showPinyin: "true" | "false"
    }> = [
      {
        route: { role: "student", page: "home" },
        role: "student",
        showPinyin: "true",
      },
      {
        route: { role: "parent", page: "home" },
        role: "parent",
        showPinyin: "true",
      },
      {
        route: { role: "teacher", page: "workspace" },
        role: "teacher",
        showPinyin: "false",
      },
      {
        route: { role: "admin", page: "home" },
        role: "admin",
        showPinyin: "false",
      },
    ]

    for (const expectation of expectations) {
      const { unmount } = render(
        <RoleShell route={expectation.route} onNavigate={vi.fn()}>
          <p>{expectation.role}</p>
        </RoleShell>,
      )

      expect(screen.getByTestId("role-shell")).toHaveAttribute(
        "data-role",
        expectation.role,
      )
      expect(screen.getByTestId("role-shell")).toHaveAttribute(
        "data-show-pinyin",
        expectation.showPinyin,
      )
      expect(
        screen.getByTestId("role-shell").getAttribute("style"),
      ).toContain("--role-background-image")

      unmount()
    }
  })

  it("keeps secondary destinations in the mobile more menu and marks the current section", async () => {
    const user = userEvent.setup()
    renderShell()

    const desktopNavigation = screen.getByRole("navigation", {
      name: "教师端主导航",
    })
    const mobileNavigation = screen.getByRole("navigation", {
      name: "教师端移动导航",
    })

    expect(
      within(desktopNavigation).getByRole("button", { name: "班级洞察" }),
    ).toHaveAttribute("aria-current", "page")
    const moreButton = within(mobileNavigation).getByRole("button", { name: "更多功能" })
    expect(moreButton).toHaveAttribute("aria-current", "page")
    expect(within(mobileNavigation).queryByRole("button", { name: "班级洞察" })).not.toBeInTheDocument()
    await user.click(moreButton)
    const moreDialog = screen.getByRole("dialog", { name: "更多功能" })
    expect(moreDialog).toBeInTheDocument()
    expect(within(moreDialog).getByRole("button", { name: "班级洞察" })).toHaveAttribute("aria-current", "page")
    expect(
      within(desktopNavigation).getByRole("button", { name: "工作台" }),
    ).not.toHaveAttribute("aria-current")
  })

  it("shows no more than five stable destinations in the mobile navigation", () => {
    renderShell({ role: "teacher", page: "workspace" })
    const mobileNavigation = screen.getByRole("navigation", { name: "教师端移动导航" })
    expect(within(mobileNavigation).getAllByRole("button")).toHaveLength(5)
  })

  it("shows pinyin only for student and parent shared shell labels", () => {
    const expectations: Array<{
      route: AppRoute
      navigationName: string
      currentLabel: string
      roleLabel: string
      expectPinyin: boolean
    }> = [
      {
        route: { role: "student", page: "home" },
        navigationName: "学生端主导航",
        currentLabel: "首页",
        roleLabel: "学生端",
        expectPinyin: true,
      },
      {
        route: { role: "parent", page: "home" },
        navigationName: "家长端主导航",
        currentLabel: "学习摘要",
        roleLabel: "家长端",
        expectPinyin: true,
      },
      {
        route: { role: "teacher", page: "workspace" },
        navigationName: "教师端主导航",
        currentLabel: "工作台",
        roleLabel: "教师端",
        expectPinyin: false,
      },
      {
        route: { role: "admin", page: "home" },
        navigationName: "管理端主导航",
        currentLabel: "管理概览",
        roleLabel: "管理端",
        expectPinyin: false,
      },
    ]

    for (const expectation of expectations) {
      const { unmount } = render(
        <RoleShell route={expectation.route} onNavigate={vi.fn()}>
          <p>{expectation.currentLabel}</p>
        </RoleShell>,
      )

      const desktopNavigation = screen.getByRole("navigation", {
        name: expectation.navigationName,
      })
      const mobileNavigation = screen.getByRole("navigation", {
        name: expectation.navigationName.replace("主导航", "移动导航"),
      })
      const sidebar = desktopNavigation.closest("aside") as HTMLElement
      const desktopButton = within(desktopNavigation).getByRole("button", {
        name: expectation.currentLabel,
      })
      const mobileButton = within(mobileNavigation).getByRole("button", {
        name: expectation.currentLabel,
      })
      const sidebarRoleLabel = within(sidebar).getAllByText(expectation.roleLabel)[0]

      if (expectation.expectPinyin) {
        expect(within(desktopButton).getByTestId("pinyin-line")).toBeInTheDocument()
        expect(within(mobileButton).getByTestId("pinyin-line")).toBeInTheDocument()
        expect(within(sidebarRoleLabel.parentElement as HTMLElement).getByTestId("pinyin-line")).toBeInTheDocument()
      } else {
        expect(within(desktopButton).queryByTestId("pinyin-line")).not.toBeInTheDocument()
        expect(within(mobileButton).queryByTestId("pinyin-line")).not.toBeInTheDocument()
        expect(within(sidebarRoleLabel.parentElement as HTMLElement).queryByTestId("pinyin-line")).not.toBeInTheDocument()
      }

      unmount()
    }
  })

  it("provides accessible shell landmarks and navigates from the sidebar", async () => {
    const user = userEvent.setup()
    const onNavigate = renderShell()

    expect(screen.getByRole("link", { name: "跳到主要内容" })).toHaveAttribute(
      "href",
      "#main-content",
    )
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content")
    expect(screen.getByText("页面内容")).toBeInTheDocument()

    await user.click(
      within(
        screen.getByRole("navigation", { name: "教师端主导航" }),
      ).getByRole("button", { name: "课堂" }),
    )

    expect(onNavigate).toHaveBeenCalledWith({
      role: "teacher",
      page: "classroom",
    })
  })

  it("keeps desktop navigation fixed while the content pane owns scrolling", () => {
    renderShell()

    const shell = screen.getByTestId("role-shell")
    const main = screen.getByRole("main").parentElement
    const sidebar = screen.getByRole("navigation", { name: "教师端主导航" })
      .closest("aside")

    expect(shell).toHaveClass("h-dvh", "overflow-hidden")
    expect(main).toHaveClass("h-full", "overflow-y-auto", "overscroll-contain")
    expect(sidebar).toHaveClass("lg:sticky", "lg:top-3")
  })

  it("exposes the complete navigation model for every role", () => {
    const expectedLabels: Record<"teacher" | "student" | "parent" | "admin", string[]> = {
      teacher: [
        "工作台",
        "备课",
        "课堂",
        "任务",
        "班级洞察",
        "学生档案",
        "消息",
        "设置",
      ],
      student: ["首页", "任务", "错题本", "消息"],
      parent: ["学习摘要", "联系老师"],
      admin: ["管理概览", "保护性反馈", "审计记录", "学校设置"],
    }
    const homeRoutes: Record<keyof typeof expectedLabels, AppRoute> = {
      teacher: { role: "teacher", page: "workspace" },
      student: { role: "student", page: "home" },
      parent: { role: "parent", page: "home" },
      admin: { role: "admin", page: "home" },
    }

    for (const role of Object.keys(expectedLabels) as Array<keyof typeof expectedLabels>) {
      const { unmount } = render(
        <RoleShell route={homeRoutes[role]} onNavigate={vi.fn()}>
          <p>{role}</p>
        </RoleShell>,
      )
      const navigation = screen.getByRole("navigation", {
        name: `${role === "teacher" ? "教师" : role === "student" ? "学生" : role === "parent" ? "家长" : "管理"}端主导航`,
      })

      for (const label of expectedLabels[role]) {
        expect(
          within(navigation).getByRole("button", { name: label }),
        ).toBeInTheDocument()
      }
      unmount()
    }
  })
})
