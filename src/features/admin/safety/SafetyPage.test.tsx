import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AuditEvent } from "../../../app/prototype/types"
import { SafetyPage } from "./SafetyPage"

function renderSafety(onAuditEvent = vi.fn<(event: AuditEvent) => void>()) {
  render(
    <PrototypeProvider>
      <SafetyPage onAuditEvent={onAuditEvent} />
    </PrototypeProvider>,
  )
  return onAuditEvent
}

describe("SafetyPage", () => {
  it("filters new cases and requires an access warning acknowledgement", async () => {
    const user = userEvent.setup()
    renderSafety()

    expect(
      screen.getByRole("heading", { name: "保护性反馈" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/风险提示仅用于人工核实/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("处理状态"), "new")
    expect(screen.getByText("需要人工核实的学生表达")).toBeInTheDocument()
    expect(screen.queryByText("连续缺席后的关怀核实")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "查看需要人工核实的学生表达" }),
    )
    const drawer = screen.getByRole("dialog", {
      name: "需要人工核实的学生表达",
    })
    expect(within(drawer).getByText("访问前提示")).toBeInTheDocument()
    expect(within(drawer).getByText(/不代表诊断或事实结论/)).toBeInTheDocument()
    expect(within(drawer).queryByText("最少必要上下文")).not.toBeInTheDocument()

    await user.click(
      within(drawer).getByRole("button", {
        name: "我已了解，查看最少必要信息",
      }),
    )
    expect(within(drawer).getByText("最少必要上下文")).toBeInTheDocument()
    expect(within(drawer).getByText(/不作诊断或结论/)).toBeInTheDocument()
  })

  it("assigns, adds a factual note, transfers, and resolves with confirmation", async () => {
    const user = userEvent.setup()
    const onAuditEvent = renderSafety()

    await user.click(
      screen.getByRole("button", { name: "查看需要人工核实的学生表达" }),
    )
    let drawer = screen.getByRole("dialog", {
      name: "需要人工核实的学生表达",
    })
    await user.click(
      within(drawer).getByRole("button", {
        name: "我已了解，查看最少必要信息",
      }),
    )

    await user.click(
      within(drawer).getByRole("button", { name: "分配给王老师 · 德育负责人" }),
    )
    expect(within(drawer).getByText("王老师 · 德育负责人")).toBeInTheDocument()

    await user.type(
      within(drawer).getByLabelText("人工核实备注"),
      "已联系班主任，仅记录待核实事实。",
    )
    await user.click(within(drawer).getByRole("button", { name: "添加备注" }))
    expect(
      within(drawer).getByText("已联系班主任，仅记录待核实事实。"),
    ).toBeInTheDocument()

    await user.selectOptions(
      within(drawer).getByLabelText("转交对象"),
      "陈老师 · 年级负责人",
    )
    await user.click(within(drawer).getByRole("button", { name: "确认转交" }))
    expect(
      within(drawer).getByText("已转交给陈老师 · 年级负责人"),
    ).toBeInTheDocument()

    await user.click(
      within(drawer).getByRole("button", { name: "标记为已解决" }),
    )
    const confirm = screen.getByRole("dialog", { name: "确认解决保护性反馈" })
    expect(within(confirm).getByText(/必须基于人工核实/)).toBeInTheDocument()
    await user.click(
      within(confirm).getByRole("button", { name: "确认已人工核实并解决" }),
    )

    drawer = screen.getByRole("dialog", {
      name: "需要人工核实的学生表达",
    })
    expect(within(drawer).getAllByText("已解决").length).toBeGreaterThan(0)
    expect(onAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: "王老师 · 德育负责人",
        action: "记录核实结果并结案",
        objectId: "safety-case-01",
      }),
    )
    expect(screen.getByText(/本页已新增 5 条审计记录/)).toBeInTheDocument()
  })
})
