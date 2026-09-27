import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { RoleShell } from "../../../components/shell/RoleShell"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import TeacherWorkspacePage from "./TeacherWorkspacePage"

it("connects workspace navigation cards to teacher routes", async () => {
  const user = userEvent.setup()
  const onNavigate = vi.fn()
  render(
    <PrototypeProvider persist={false}>
      <RoleShell
        route={{ role: "teacher", page: "workspace" }}
        onNavigate={onNavigate}
      >
        <TeacherWorkspacePage onNavigate={onNavigate} />
      </RoleShell>
    </PrototypeProvider>,
  )

  await user.click(
    within(screen.getByRole("navigation", { name: "教师端主导航" })).getByRole(
      "button",
      { name: "课堂" },
    ),
  )
  expect(onNavigate).toHaveBeenLastCalledWith({ role: "teacher", page: "classroom" })

  await user.click(screen.getByRole("button", { name: "查看并发布" }))
  expect(onNavigate).toHaveBeenLastCalledWith({
    role: "teacher",
    page: "lesson-detail",
    lessonId: "lesson-fractions",
  })

  await user.click(screen.getByRole("button", { name: "查看班级动态" }))
  expect(onNavigate).toHaveBeenLastCalledWith({ role: "teacher", page: "insights" })

  const sidebar = document.querySelector(".role-sidebar")
  expect(sidebar).not.toBeNull()
  await user.click(within(sidebar as HTMLElement).getByRole("button", { name: "搜索当前空间" }))
  const search = screen.getByRole("dialog", { name: "搜索" })
  await user.type(within(search).getByRole("searchbox", { name: "全局搜索" }), "分数")
  await user.click(within(search).getByRole("button", { name: /分数的基本性质/ }))
  expect(onNavigate).toHaveBeenLastCalledWith({ role: "teacher", page: "lesson-detail", lessonId: "lesson-fractions" })
})
