import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { ClassroomPage } from "./ClassroomPage"

function renderClassroom(onNavigate = vi.fn<(route: AppRoute) => void>()) {
  render(
    <PrototypeProvider>
      <ClassroomPage onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

afterEach(() => {
  vi.useRealTimers()
})

describe("ClassroomPage", () => {
  it("filters lessons by status and exposes duration, sync, and student visibility", async () => {
    const user = userEvent.setup()
    renderClassroom()

    expect(screen.getByRole("heading", { name: "课堂" })).toBeInTheDocument()
    expect(screen.getByText("分数的基本性质")).toBeInTheDocument()
    expect(screen.getByText("单位换算中的乘除步骤")).toBeInTheDocument()
    expect(screen.getByText("小数乘法估算")).toBeInTheDocument()
    expect(screen.getAllByText(/40 分钟|42 分钟/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/已同步|仅本机/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/学生可见|学生不可见/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole("button", { name: "待开始" }))
    expect(screen.getByText("小数乘法估算")).toBeInTheDocument()
    expect(screen.queryByText("分数的基本性质")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "AI 初稿" }))
    expect(screen.getByText("分数的基本性质")).toBeInTheDocument()
    expect(screen.queryByText("单位换算中的乘除步骤")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "已发布" }))
    expect(screen.getByText("单位换算中的乘除步骤")).toBeInTheDocument()
    expect(screen.queryByText("小数乘法估算")).not.toBeInTheDocument()
  })

  it("runs start, pause, resume, end, processing, and draft-ready recording states", async () => {
    vi.useFakeTimers()
    const { onNavigate } = renderClassroom()

    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    expect(within(dialog).getByText("等待开始")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    expect(within(dialog).getByText("录音中")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "暂停录音" }))
    expect(within(dialog).getByText("已暂停")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "继续录音" }))
    expect(within(dialog).getByText("录音中")).toBeInTheDocument()

    fireEvent.click(
      within(dialog).getByRole("button", { name: "结束并生成 AI 初稿" }),
    )
    expect(within(dialog).getByText("正在整理课堂内容")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "关闭新课堂录音" }))
    expect(screen.getByText("处理中")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const reopenedDialog = screen.getByRole("dialog", { name: "新课堂录音" })

    act(() => vi.advanceTimersByTime(799))
    expect(
      within(reopenedDialog).queryByRole("button", { name: "查看 AI 初稿" }),
    ).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(within(reopenedDialog).getByText("等待开始")).toBeInTheDocument()

    fireEvent.click(within(reopenedDialog).getByRole("button", { name: "开始录音" }))
    fireEvent.click(
      within(reopenedDialog).getByRole("button", { name: "结束并生成 AI 初稿" }),
    )
    act(() => vi.advanceTimersByTime(800))
    expect(within(reopenedDialog).getByText("AI 初稿已就绪")).toBeInTheDocument()

    fireEvent.click(
      within(reopenedDialog).getByRole("button", { name: "查看 AI 初稿" }),
    )
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "teacher",
        page: "lesson-detail",
        lessonId: expect.stringMatching(/^lesson-recording-/),
      }),
    )
  })

  it("opens an existing lesson from its card", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderClassroom()

    await user.click(screen.getByRole("button", { name: "查看分数的基本性质" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "teacher",
      page: "lesson-detail",
      lessonId: "lesson-fractions",
    })
  })
})
