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

      unmount()
    }
  })

  it("marks the current teacher destination in desktop and mobile navigation", () => {
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
    expect(
      within(mobileNavigation).getByRole("button", { name: "班级洞察" }),
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(desktopNavigation).getByRole("button", { name: "工作台" }),
    ).not.toHaveAttribute("aria-current")
  })

  it("requests the selected role home from the role switcher", async () => {
    const user = userEvent.setup()
    const onNavigate = renderShell()

    await user.selectOptions(
      screen.getByRole("combobox", { name: "切换体验角色" }),
      "student",
    )

    expect(onNavigate).toHaveBeenCalledWith({
      role: "student",
      page: "home",
    })
  })

  it("provides accessible shell landmarks and navigates from the sidebar", async () => {
    const user = userEvent.setup()
    const onNavigate = renderShell()

    expect(screen.getByRole("link", { name: "跳到主要内容" })).toHaveAttribute(
      "href",
      "#main-content",
    )
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content")
    expect(screen.getByRole("heading", { name: "班级洞察" })).toBeInTheDocument()
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

  it("provides a visible previous-page action for every role page", async () => {
    const user = userEvent.setup()
    const onNavigate = renderShell({ role: "teacher", page: "lesson-detail", lessonId: "lesson-fractions" })

    await user.click(screen.getByRole("button", { name: "返回上一页" }))

    expect(onNavigate).toHaveBeenCalledWith({ role: "teacher", page: "classroom" })
  })

  it("exposes the complete navigation model for every role", () => {
    const expectedLabels: Record<"teacher" | "student" | "parent" | "admin", string[]> = {
      teacher: [
        "工作台",
        "课堂",
        "班级洞察",
        "备课与测验",
        "学生档案",
        "任务",
        "消息",
        "设置",
        "历史记录",
      ],
      student: ["首页", "拍照答疑", "知识点学习", "错题本", "任务", "消息", "历史记录"],
      parent: ["学习摘要", "联系老师", "历史记录"],
      admin: ["管理概览", "保护性反馈", "审计记录", "学校设置", "历史记录"],
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