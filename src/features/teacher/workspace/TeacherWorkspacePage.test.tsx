import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { RoleShell } from "../../../components/shell/RoleShell"
import TeacherWorkspacePage from "./TeacherWorkspacePage"

it("connects workspace navigation cards to teacher routes", async () => {
  const user = userEvent.setup()
  const onNavigate = vi.fn()
  render(
    <RoleShell
      route={{ role: "teacher", page: "workspace" }}
      onNavigate={onNavigate}
    >
      <TeacherWorkspacePage onNavigate={onNavigate} />
    </RoleShell>,
  )

  await user.click(
    within(screen.getByRole("navigation", { name: "教师端主导航" })).getByRole(
      "button",
      { name: "课堂" },
    ),
  )
  expect(onNavigate).toHaveBeenLastCalledWith({ role: "teacher", page: "classroom" })

  await user.click(screen.getByRole("button", { name: "确认并发布" }))
  expect(onNavigate).toHaveBeenLastCalledWith({
    role: "teacher",
    page: "lesson-detail",
    lessonId: "lesson-fractions",
  })

  await user.click(screen.getByRole("button", { name: "打开班级脉搏" }))
  expect(onNavigate).toHaveBeenLastCalledWith({ role: "teacher", page: "insights" })
})
