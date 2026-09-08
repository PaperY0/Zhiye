import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AuditEvent } from "../../../app/prototype/types"
import { AuditPage } from "./AuditPage"

const localEvents: AuditEvent[] = [
  {
    id: "audit-local-resolve-01",
    actor: "王老师 · 德育负责人",
    action: "记录核实结果并结案",
    objectType: "safety-case",
    objectId: "safety-case-01",
    purpose: "完成保护性反馈流程",
    occurredAt: "2026-07-25T16:20:00+08:00",
  },
]

function renderAudit() {
  render(
    <PrototypeProvider>
      <AuditPage localEvents={localEvents} />
    </PrototypeProvider>,
  )
}

describe("AuditPage", () => {
  it("shows fixture and page-local audit events without sensitive case content", () => {
    renderAudit()

    expect(
      screen.getByRole("heading", { name: "审计记录" }),
    ).toBeInTheDocument()
    const eventList = screen.getByRole("region", { name: "审计事件列表" })
    expect(
      within(eventList).getAllByText("记录核实结果并结案").length,
    ).toBeGreaterThan(0)
    expect(within(eventList).getByText("查看数据留存设置")).toBeInTheDocument()
    expect(within(eventList).getByText("safety-case-01")).toBeInTheDocument()
    expect(screen.getAllByText(/页面本地新增事件/).length).toBeGreaterThan(0)
    expect(
      screen.queryByText("学生在私信中表达“不敢回家”"),
    ).not.toBeInTheDocument()
  })

  it("filters by actor, action, and exact date", async () => {
    const user = userEvent.setup()
    renderAudit()

    await user.selectOptions(
      screen.getByLabelText("操作人"),
      "王老师 · 德育负责人",
    )
    let eventList = screen.getByRole("region", { name: "审计事件列表" })
    expect(within(eventList).getByText("查看风险提示")).toBeInTheDocument()
    expect(
      within(eventList).getByText("记录核实结果并结案"),
    ).toBeInTheDocument()
    expect(
      within(eventList).queryByText("查看数据留存设置"),
    ).not.toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText("操作类型"),
      "记录核实结果并结案",
    )
    eventList = screen.getByRole("region", { name: "审计事件列表" })
    expect(
      within(eventList).queryByText("查看风险提示"),
    ).not.toBeInTheDocument()
    expect(
      within(eventList).getByText("记录核实结果并结案"),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("发生日期"), "2026-07-24")
    expect(screen.getByText("没有匹配的审计记录")).toBeInTheDocument()

    await user.clear(screen.getByLabelText("发生日期"))
    await user.type(screen.getByLabelText("发生日期"), "2026-07-25")
    eventList = screen.getByRole("region", { name: "审计事件列表" })
    expect(
      within(eventList).getByText("记录核实结果并结案"),
    ).toBeInTheDocument()
  })
})
