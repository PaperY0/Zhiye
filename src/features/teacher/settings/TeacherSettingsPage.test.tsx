import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { getTeacherSettings } from "./teacherSettings"
import { TeacherSettingsPage } from "./TeacherSettingsPage"

function setup() { return render(<PrototypeProvider><TeacherSettingsPage /></PrototypeProvider>) }

describe("TeacherSettingsPage", () => {
  beforeEach(() => localStorage.clear())

  it("shows only settings that feed the teacher workflow", () => {
    setup()
    expect(screen.getByRole("heading", { name: "身份与授课班级" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "教材与进度" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "AI 草稿偏好" })).toBeInTheDocument()
    expect(screen.queryByText("数据留存")).not.toBeInTheDocument()
  })

  it("persists teacher name, chapter and AI preference", async () => {
    const user = userEvent.setup()
    const view = setup()
    await user.clear(screen.getByRole("textbox", { name: "教师姓名" }))
    await user.type(screen.getByRole("textbox", { name: "教师姓名" }), "张老师")
    await user.clear(screen.getByRole("textbox", { name: "当前章节" }))
    await user.type(screen.getByRole("textbox", { name: "当前章节" }), "小数乘法")
    await user.selectOptions(screen.getByRole("combobox", { name: "内容详细程度" }), "详细")
    await user.click(screen.getByRole("button", { name: "保存设置" }))
    expect(getTeacherSettings()).toMatchObject({ teacherName: "张老师", chapter: "小数乘法", aiDetail: "详细" })
    view.unmount()
    setup()
    expect(screen.getByRole("textbox", { name: "教师姓名" })).toHaveValue("张老师")
  })

  it("requires confirmation before resetting local data", async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole("button", { name: "重置演示数据" }))
    const dialog = screen.getByRole("dialog", { name: "重置所有演示数据" })
    await user.click(within(dialog).getByRole("button", { name: "确认重置" }))
    expect(getTeacherSettings().teacherName).toBe("李老师")
  })
})
