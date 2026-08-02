import { render, screen, within } from "@testing-library/react"

import userEvent from "@testing-library/user-event"

import { describe, expect, it } from "vitest"

import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"

import { MistakesPage } from "./MistakesPage"

function renderMistakes() {
  render(
    <PrototypeProvider>
      <MistakesPage />
    </PrototypeProvider>,
  )
}

describe("MistakesPage", () => {
  it("filters the current student's mistakes by subject, knowledge, date, and mastery", async () => {
    const user = userEvent.setup()

    renderMistakes()

    expect(screen.getByRole("heading", { name: "错题本" })).toBeInTheDocument()

    expect(
      screen.getByText("分子乘 2 时，分母应该怎样变化？"),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("学科"), "语文")

    expect(screen.getByText("没有符合条件的错题")).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("学科"), "数学")

    await user.selectOptions(
      screen.getByLabelText("知识点"),

      "分数的基本性质",
    )

    await user.selectOptions(screen.getByLabelText("加入时间"), "7-days")

    await user.selectOptions(screen.getByLabelText("掌握程度"), "learning")

    expect(
      screen.getByText("分子乘 2 时，分母应该怎样变化？"),
    ).toBeInTheDocument()

    expect(screen.getAllByText("继续练习").length).toBeGreaterThan(0)
  })

  it("opens the saved fraction mistake and keeps local mastery and notes updates", async () => {
    const user = userEvent.setup()

    renderMistakes()

    await user.click(
      screen.getByRole("button", {
        name: "查看错题：分子乘 2 时，分母应该怎样变化？",
      }),
    )

    const drawer = screen.getByRole("dialog", { name: "分数的基本性质" })

    expect(within(drawer).getByText("原题预览")).toBeInTheDocument()

    expect(within(drawer).getByText("只关注分子变化")).toBeInTheDocument()

    expect(
      within(drawer).getByText("为了保持分数值不变，分母也要乘 2。"),
    ).toBeInTheDocument()

    await user.selectOptions(within(drawer).getByLabelText("掌握状态"), "basic")

    await user.type(
      within(drawer).getByRole("textbox", { name: "复习笔记" }),

      "先检查分子和分母是否同时变化。",
    )

    await user.click(
      within(drawer).getByRole("button", { name: "保存学习记录" }),
    )

    expect(within(drawer).getByRole("status")).toHaveTextContent(
      "已保存为基本掌握",
    )

    await user.click(within(drawer).getByRole("button", { name: "关闭抽屉" }))

    expect(screen.getAllByText("基本掌握").length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole("button", {
        name: "查看错题：分子乘 2 时，分母应该怎样变化？",
      }),
    )

    expect(screen.getByRole("textbox", { name: "复习笔记" })).toHaveValue(
      "先检查分子和分母是否同时变化。",
    )
  })

  it("sets a simulated review reminder and reports when it will appear", async () => {
    const user = userEvent.setup()

    renderMistakes()

    await user.click(
      screen.getByRole("button", {
        name: "查看错题：分子乘 2 时，分母应该怎样变化？",
      }),
    )

    const drawer = screen.getByRole("dialog", { name: "分数的基本性质" })

    await user.selectOptions(
      within(drawer).getByLabelText("复习提醒"),

      "3-days",
    )

    await user.click(
      within(drawer).getByRole("button", { name: "设置复习提醒" }),
    )

    expect(within(drawer).getByRole("status")).toHaveTextContent(
      "已设置 7 月 28 日 19:00 的模拟提醒",
    )

    expect(within(drawer).getByText(/只保存在当前页面/)).toBeInTheDocument()
  })
})
