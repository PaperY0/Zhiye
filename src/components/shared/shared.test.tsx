import { useState } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import Dialog from "./Dialog"
import Drawer from "./Drawer"
import EmptyState from "./EmptyState"
import FilterBar from "./FilterBar"
import GlassSurface from "./GlassSurface"
import StatusChip from "./StatusChip"
import ToastRegion from "./ToastRegion"

function DialogHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        新建任务
      </button>
      <Dialog
        open={open}
        title="创建任务"
        description="填写任务内容后发布。"
        onClose={() => setOpen(false)}
        footer={<button type="button">保存</button>}
      >
        <label>
          任务名称
          <input />
        </label>
      </Dialog>
    </>
  )
}

function DrawerHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        查看详情
      </button>
      <Drawer open={open} title="任务详情" onClose={() => setOpen(false)}>
        <p>32 位学生待查看</p>
      </Drawer>
    </>
  )
}

describe("shared prototype primitives", () => {
  it("renders weighted glass surfaces while forwarding div attributes", () => {
    render(
      <GlassSurface weight="sheet" aria-label="玻璃面板" className="custom">
        内容
      </GlassSurface>,
    )

    expect(screen.getByLabelText("玻璃面板")).toHaveClass(
      "prototype-glass",
      "prototype-glass--sheet",
      "custom",
    )
  })

  it("communicates status with visible text and a semantic tone hook", () => {
    render(<StatusChip tone="warning">待确认</StatusChip>)

    expect(screen.getByText("待确认")).toHaveAttribute("data-tone", "warning")
    expect(screen.getByText("待确认")).toHaveClass(
      "prototype-status-chip--warning",
    )
  })

  it("labels dialogs, closes on Escape, and restores focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    const trigger = screen.getByRole("button", { name: "新建任务" })
    await user.click(trigger)

    const dialog = screen.getByRole("dialog", { name: "创建任务" })
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(within(dialog).getByText("填写任务内容后发布。")).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "关闭创建任务" }),
    ).toHaveFocus()

    await user.keyboard("{Escape}")

    expect(
      screen.queryByRole("dialog", { name: "创建任务" }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("keeps focus inside a dialog and preserves input focus across rerenders", async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole("button", { name: "新建任务" }))
    const dialog = screen.getByRole("dialog", { name: "创建任务" })
    const input = within(dialog).getByRole("textbox", { name: "任务名称" })
    const close = within(dialog).getByRole("button", { name: "关闭创建任务" })
    const save = within(dialog).getByRole("button", { name: "保存" })

    expect(document.body).toHaveStyle({ overflow: "hidden" })
    await user.click(input)
    await user.type(input, "约分练习")
    expect(input).toHaveFocus()
    expect(input).toHaveValue("约分练习")

    save.focus()
    await user.tab()
    expect(close).toHaveFocus()
    close.focus()
    await user.tab({ shift: true })
    expect(save).toHaveFocus()
  })

  it("closes dialogs from the backdrop and restores body scrolling", async () => {
    const user = userEvent.setup()
    const { container } = render(<DialogHarness />)
    await user.click(screen.getByRole("button", { name: "新建任务" }))
    const overlay = document.querySelector(".prototype-dialog-overlay")
    expect(overlay).not.toBeNull()
    await user.click(overlay as Element)
    expect(screen.queryByRole("dialog", { name: "创建任务" })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe("")
    expect(container).toBeInTheDocument()
  })

  it("provides an accessible dialog close button", async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    const trigger = screen.getByRole("button", { name: "新建任务" })
    await user.click(trigger)
    await user.click(screen.getByRole("button", { name: "关闭创建任务" }))

    expect(
      screen.queryByRole("dialog", { name: "创建任务" }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("labels drawers, closes on Escape, and restores trigger focus", async () => {
    const user = userEvent.setup()
    render(<DrawerHarness />)

    const trigger = screen.getByRole("button", { name: "查看详情" })
    await user.click(trigger)

    const drawer = screen.getByRole("dialog", { name: "任务详情" })
    expect(drawer).toHaveAttribute("data-overlay", "drawer")
    expect(
      within(drawer).getByRole("button", { name: "关闭任务详情" }),
    ).toHaveFocus()

    await user.keyboard("{Escape}")

    expect(
      screen.queryByRole("dialog", { name: "任务详情" }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("renders filter controls in a labelled group", () => {
    render(
      <FilterBar aria-label="课堂筛选">
        <button type="button">全部</button>
      </FilterBar>,
    )

    expect(screen.getByRole("group", { name: "课堂筛选" })).toContainElement(
      screen.getByRole("button", { name: "全部" }),
    )
  })

  it("renders an empty-state action", async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()

    render(
      <EmptyState
        title="还没有任务"
        description="创建第一项任务后会显示在这里。"
        action={<button onClick={onAction}>创建任务</button>}
      />,
    )

    expect(
      screen.getByRole("heading", { name: "还没有任务" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "创建任务" }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it("announces and dismisses local toast feedback", async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()

    render(
      <ToastRegion
        toasts={[
          {
            id: "published",
            title: "复习卡已发布",
            description: "学生端现在可以查看。",
            tone: "success",
          },
        ]}
        onDismiss={onDismiss}
      />,
    )

    const region = screen.getByRole("region", { name: "操作通知" })
    expect(region).toHaveAttribute("aria-live", "polite")
    expect(within(region).getByText("复习卡已发布")).toBeVisible()

    await user.click(
      within(region).getByRole("button", { name: "关闭通知：复习卡已发布" }),
    )
    expect(onDismiss).toHaveBeenCalledWith("published")
  })
})
