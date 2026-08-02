import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { TeacherSettingsPage } from "./TeacherSettingsPage"

function renderSettings() {
  return render(
    <PrototypeProvider>
      <TeacherSettingsPage />
    </PrototypeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe("TeacherSettingsPage", () => {
  it("presents every teacher setting area and explains prototype-only local state", () => {
    renderSettings()

    expect(
      screen.getByRole("heading", { name: "教师设置" }),
    ).toBeInTheDocument()

    for (const sectionName of [
      "教师资料与班级",
      "教材与教学范围",
      "AI 生成偏好",
      "语言与方言",
      "通知",
      "数据留存",
      "隐私与角色切换",
    ]) {
      expect(
        screen.getByRole("region", { name: sectionName }),
      ).toBeInTheDocument()
    }

    expect(screen.getByText(/设置会保存在当前浏览器/)).toBeInTheDocument()
    expect(screen.getByText(/不会上传或改变真实学校数据/)).toBeInTheDocument()
    expect(
      screen.getByText(/角色切换只用于体验不同端的原型页面/),
    ).toBeInTheDocument()
  })

  it("edits textbook scope, AI detail, dialect, notifications, retention and privacy choices", async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.clear(screen.getByRole("textbox", { name: "教师姓名" }))
    await user.type(screen.getByRole("textbox", { name: "教师姓名" }), "李敏")
    await user.selectOptions(
      screen.getByRole("combobox", { name: "当前班级" }),
      "五年级（1）班",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "数学教材版本" }),
      "北师大版",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "当前教学章节" }),
      "分数加减法",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "AI 内容详细程度" }),
      "详细",
    )
    await user.click(screen.getByRole("checkbox", { name: "生成时附课堂证据" }))
    await user.selectOptions(
      screen.getByRole("combobox", { name: "语音识别语言" }),
      "普通话与四川话",
    )
    await user.click(screen.getByRole("checkbox", { name: "任务到期提醒" }))
    await user.selectOptions(
      screen.getByRole("combobox", { name: "课堂录音留存时间" }),
      "30 天",
    )
    await user.click(
      screen.getByRole("checkbox", { name: "允许家长查看教师留言" }),
    )

    expect(screen.getByRole("textbox", { name: "教师姓名" })).toHaveValue(
      "李敏",
    )
    expect(screen.getByRole("combobox", { name: "当前班级" })).toHaveValue(
      "五年级（1）班",
    )
    expect(screen.getByRole("combobox", { name: "数学教材版本" })).toHaveValue(
      "北师大版",
    )
    expect(screen.getByRole("combobox", { name: "当前教学章节" })).toHaveValue(
      "分数加减法",
    )
    expect(
      screen.getByRole("combobox", { name: "AI 内容详细程度" }),
    ).toHaveValue("详细")
    expect(
      screen.getByRole("checkbox", { name: "生成时附课堂证据" }),
    ).not.toBeChecked()
    expect(screen.getByRole("combobox", { name: "语音识别语言" })).toHaveValue(
      "普通话与四川话",
    )
    expect(
      screen.getByRole("checkbox", { name: "任务到期提醒" }),
    ).not.toBeChecked()
    expect(
      screen.getByRole("combobox", { name: "课堂录音留存时间" }),
    ).toHaveValue("30 天")
    expect(
      screen.getByRole("checkbox", { name: "允许家长查看教师留言" }),
    ).not.toBeChecked()
  })

  it("saves the current local draft and shows a dismissible confirmation toast", async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.clear(screen.getByRole("textbox", { name: "教师姓名" }))
    await user.type(screen.getByRole("textbox", { name: "教师姓名" }), "李敏")
    await user.click(screen.getByRole("button", { name: "保存设置" }))

    const notifications = screen.getByRole("region", { name: "设置通知" })
    expect(within(notifications).getByRole("status")).toHaveTextContent(
      "设置已保存到当前原型",
    )
    expect(within(notifications).getByRole("status")).toHaveTextContent(
      "刷新页面后仍会保留",
    )

    await user.click(
      within(notifications).getByRole("button", {
        name: "关闭通知：设置已保存到当前原型",
      }),
    )
    expect(within(notifications).queryByRole("status")).not.toBeInTheDocument()
  })

  it("restores saved teacher settings after remounting", async () => {
    const user = userEvent.setup()
    const first = renderSettings()

    await user.clear(screen.getByRole("textbox", { name: "教师姓名" }))
    await user.type(screen.getByRole("textbox", { name: "教师姓名" }), "李敏")
    await user.click(screen.getByRole("button", { name: "保存设置" }))
    first?.unmount?.()

    renderSettings()
    expect(screen.getByRole("textbox", { name: "教师姓名" })).toHaveValue("李敏")
  })
})
