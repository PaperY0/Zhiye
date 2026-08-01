import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { ParentHomePage } from "./ParentHomePage"

function renderHome() {
  const onNavigate = vi.fn<(route: AppRoute) => void>()
  render(
    <PrototypeProvider>
      <ParentHomePage onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

describe("ParentHomePage", () => {
  it("shows a calm weekly summary with learning topics and personal activity without rankings", () => {
    renderHome()

    expect(
      screen.getByRole("heading", { name: "林晓雨的本周学习摘要" }),
    ).toBeInTheDocument()
    expect(screen.getByText("林晓雨 · 五年级（2）班")).toBeInTheDocument()
    expect(screen.getByText("7 月 20 日—7 月 26 日")).toBeInTheDocument()

    const topics = screen.getByRole("region", { name: "本周学习主题" })
    expect(topics).toHaveTextContent("分数的基本性质")
    expect(topics).toHaveTextContent("约分")
    expect(topics).toHaveTextContent("单位换算")

    const activity = screen.getByRole("region", { name: "本周学习脚印" })
    expect(activity).toHaveTextContent("主动提问")
    expect(activity).toHaveTextContent("4 次")
    expect(activity).toHaveTextContent("完成练习")
    expect(activity).toHaveTextContent("7 次")

    expect(
      screen.queryByText(/排名|第\s*\d+\s*名|超过.*同学/),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/完整对话|题目图片|同学记录/),
    ).not.toBeInTheDocument()
  })

  it("shows encouragement, the teacher message, and a clearly simulated audio letter", async () => {
    const user = userEvent.setup()
    renderHome()

    expect(
      screen.getByRole("region", { name: "给家长的陪伴建议" }),
    ).toHaveTextContent("孩子愿意把不明白的地方说出来，这份主动很珍贵。")
    expect(
      screen.getByRole("region", { name: "李老师留言" }),
    ).toHaveTextContent(
      "本周可以陪孩子用生活里的比例例子复述分数基本性质，不需要额外刷题。",
    )

    expect(screen.getByText("李老师的本周语音信")).toBeInTheDocument()
    expect(screen.getByText("48 秒 · 模拟音频")).toBeInTheDocument()
    expect(screen.getByText(/不会播放、采集或上传真实音频/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "播放模拟语音家书" }))
    expect(screen.getByRole("status")).toHaveTextContent(
      "正在模拟播放李老师的本周语音信",
    )
    expect(
      screen.getByRole("button", { name: "停止模拟语音家书" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "停止模拟语音家书" }))
    expect(screen.getByRole("status")).toHaveTextContent("模拟语音家书已停止")
  })

  it("opens the private parent-teacher conversation", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderHome()

    const contact = screen.getByRole("region", { name: "联系老师" })
    expect(contact).toHaveTextContent(/仅展示与林晓雨学习陪伴相关的教师沟通/)
    await user.click(
      within(contact).getByRole("button", { name: "联系李老师" }),
    )

    expect(onNavigate).toHaveBeenCalledWith({
      role: "parent",
      page: "messages",
    })
  })
})
