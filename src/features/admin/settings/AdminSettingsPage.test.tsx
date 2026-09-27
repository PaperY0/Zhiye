import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { AdminSettingsPage } from "./AdminSettingsPage"
import { readSavedAdminSettings } from "./adminSettings"

function setup() { return render(<PrototypeProvider><AdminSettingsPage /></PrototypeProvider>) }

describe("AdminSettingsPage", () => {
  beforeEach(() => localStorage.clear())

  it("persists school and response contacts used by management", async () => {
    const user = userEvent.setup()
    const view = setup()
    await user.clear(screen.getByRole("textbox", { name: "学校名称" }))
    await user.type(screen.getByRole("textbox", { name: "学校名称" }), "东湖学校")
    await user.clear(screen.getByRole("textbox", { name: "主要响应联系人" }))
    await user.type(screen.getByRole("textbox", { name: "主要响应联系人" }), "张老师")
    await user.click(screen.getByRole("button", { name: "保存设置" }))
    expect(readSavedAdminSettings()).toMatchObject({ schoolName: "东湖学校", primaryContact: "张老师" })
    view.unmount()
    setup()
    expect(screen.getByRole("textbox", { name: "学校名称" })).toHaveValue("东湖学校")
  })

  it("confirms reset and removes saved management settings", async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole("button", { name: "重置演示数据" }))
    await user.click(within(screen.getByRole("dialog", { name: "重置所有演示数据" })).getByRole("button", { name: "确认重置" }))
    expect(readSavedAdminSettings().schoolName).toBe("知野实验学校")
  })
})
