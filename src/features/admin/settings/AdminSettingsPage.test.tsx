import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { AdminSettingsPage } from "./AdminSettingsPage"

beforeEach(() => {
  localStorage.clear()
})

function renderSettings() {
  return render(
    <PrototypeProvider>
      <AdminSettingsPage />
    </PrototypeProvider>,
  )
}

describe("AdminSettingsPage", () => {
  it("edits response contacts and keeps every control explicitly local to the prototype", async () => {
    const user = userEvent.setup()
    renderSettings()

    expect(
      screen.getByRole("heading", { name: "学校与数据设置" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/所有操作仅用于当前本地原型/)).toBeInTheDocument()

    const primaryContact = screen.getByRole("textbox", {
      name: "主要响应联系人",
    })
    const backupContact = screen.getByRole("textbox", {
      name: "备用响应联系人",
    })

    expect(primaryContact).toHaveValue("王老师 · 德育负责人")
    expect(backupContact).toHaveValue("陈老师 · 年级负责人")

    await user.clear(primaryContact)
    await user.type(primaryContact, "周老师 · 校务负责人")
    expect(primaryContact).toHaveValue("周老师 · 校务负责人")
  })

  it("generates a deterministic invitation code and simulates a class binding", async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole("button", { name: "生成模拟邀请码" }))
    expect(screen.getByText("ZY-2026-0725-01")).toBeInTheDocument()
    expect(screen.getByText(/邀请码仅在当前页面显示/)).toBeInTheDocument()

    await user.type(
      screen.getByRole("textbox", { name: "输入绑定码" }),
      "520826",
    )
    await user.click(screen.getByRole("button", { name: "模拟绑定班级" }))
    expect(screen.getByRole("status")).toHaveTextContent(
      "已在本地原型中绑定五年级（2）班",
    )
  })

  it("confirms changing retention from 7 to 14 days and shows a dismissible toast", async () => {
    const user = userEvent.setup()
    renderSettings()

    const retention = screen.getByRole("combobox", {
      name: "课堂原始音频留存时间",
    })
    expect(retention).toHaveValue("7")

    await user.selectOptions(retention, "14")
    await user.click(screen.getByRole("button", { name: "保存管理设置" }))

    const dialog = screen.getByRole("dialog", { name: "确认更新管理设置" })
    expect(dialog).toHaveTextContent("课堂原始音频将从 7 天调整为 14 天")
    expect(dialog).toHaveTextContent("不会更改真实学校系统")

    await user.click(within(dialog).getByRole("button", { name: "确认保存" }))

    const notifications = screen.getByRole("region", { name: "管理设置通知" })
    expect(within(notifications).getByRole("status")).toHaveTextContent(
      "管理设置已保存到当前原型",
    )
    expect(within(notifications).getByRole("status")).toHaveTextContent(
      "课堂原始音频留存时间：14 天",
    )

    await user.click(
      within(notifications).getByRole("button", {
        name: "关闭通知：管理设置已保存到当前原型",
      }),
    )
    expect(within(notifications).queryByRole("status")).not.toBeInTheDocument()
  })

  it("restores saved retention settings after remounting", async () => {
    const user = userEvent.setup()
    const first = renderSettings()
    await user.selectOptions(
      screen.getByRole("combobox", { name: "课堂原始音频留存时间" }),
      "30",
    )
    await user.click(screen.getByRole("button", { name: "保存管理设置" }))
    await user.click(
      within(screen.getByRole("dialog", { name: "确认更新管理设置" })).getByRole(
        "button",
        { name: "确认保存" },
      ),
    )
    first.unmount()

    renderSettings()
    expect(
      screen.getByRole("combobox", { name: "课堂原始音频留存时间" }),
    ).toHaveValue("30")
  })
})
