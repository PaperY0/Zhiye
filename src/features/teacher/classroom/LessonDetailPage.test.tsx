import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { LessonDetailPage } from "./LessonDetailPage"

function renderDetail(lessonId = "lesson-fractions") {
  render(
    <PrototypeProvider>
      <LessonDetailPage lessonId={lessonId} />
    </PrototypeProvider>,
  )
}

describe("LessonDetailPage", () => {
  it("switches among transcript, recap, teacher report, and course progress tabs", async () => {
    const user = userEvent.setup()
    renderDetail()

    expect(
      screen.getByRole("heading", { name: "分数的基本性质" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/分子和分母要同时乘同一个不为零的数/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "学生复习卡" }))
    expect(screen.getByLabelText("复习卡内容")).toHaveValue(
      "分子和分母同时乘或除以相同的数，分数的大小不变。",
    )

    await user.click(screen.getByRole("tab", { name: "教师课堂报告" }))
    expect(screen.getByText("补充不为零的条件")).toBeInTheDocument()
    expect(screen.getByText("高置信度 · AI 推断")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "课程进度" }))
    expect(screen.getByText("第四单元 · 分数的意义和性质")).toBeInTheDocument()
    expect(screen.getByLabelText("课程完成进度")).toHaveValue(72)
  })

  it("edits and saves the student recap through PrototypeContext", async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole("tab", { name: "学生复习卡" }))
    const editor = screen.getByLabelText("复习卡内容")
    await user.clear(editor)
    await user.type(
      editor,
      "分子和分母同时乘或除以相同且不为零的数，分数大小不变。",
    )
    await user.click(screen.getByRole("button", { name: "保存复习卡" }))

    expect(screen.getByText("复习卡已保存")).toBeInTheDocument()
    expect(editor).toHaveValue(
      "分子和分母同时乘或除以相同且不为零的数，分数大小不变。",
    )
  })

  it("opens quoted transcript evidence in a drawer", async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole("tab", { name: "教师课堂报告" }))
    await user.click(
      screen.getByRole("button", { name: "查看补充不为零的条件的课堂证据" }),
    )

    const drawer = screen.getByRole("dialog", { name: "课堂证据" })
    expect(within(drawer).getByText(/李老师 · 01:25–01:52/)).toBeInTheDocument()
    expect(within(drawer).getByText(/学生 · 15:52–16:18/)).toBeInTheDocument()
    expect(within(drawer).getAllByRole("blockquote")).toHaveLength(2)
  })

  it("accepts and ignores uncertain report suggestions locally", async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole("tab", { name: "教师课堂报告" }))
    expect(screen.getByText("高置信度 · AI 推断")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "采纳补充不为零的条件" }),
    )
    expect(screen.getByText("已采纳")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "撤回补充不为零的条件" }),
    )
    expect(screen.getByText("待处理")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "忽略补充不为零的条件" }),
    )
    expect(screen.getByText("已忽略")).toBeInTheDocument()
  })

  it("updates the displayed course progress controls", async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole("tab", { name: "课程进度" }))
    const progress = screen.getByLabelText("课程完成进度")
    await user.clear(progress)
    await user.type(progress, "80")
    const nextStep = screen.getByLabelText("下一步教学内容")
    await user.clear(nextStep)
    await user.type(nextStep, "通分综合练习")
    await user.click(screen.getByRole("button", { name: "保存课程进度" }))

    expect(screen.getByText("课程进度已更新为 80%")).toBeInTheDocument()
    expect(nextStep).toHaveValue("通分综合练习")
  })

  it("requires confirmation before publishing the lesson to students", async () => {
    const user = userEvent.setup()
    renderDetail()

    expect(screen.getByText("学生不可见")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "确认并发布" }))

    const dialog = screen.getByRole("dialog", { name: "发布课堂复习资料" })
    expect(
      within(dialog).getByText(/发布后学生将可以看到复习卡/),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole("button", { name: "确认发布给学生" }),
    )

    expect(screen.getByText("学生可见")).toBeInTheDocument()
    expect(screen.getByText("课堂资料已发布")).toBeInTheDocument()
    expect(
      screen.queryByRole("dialog", { name: "发布课堂复习资料" }),
    ).not.toBeInTheDocument()
  })

  it("shows a recoverable empty state for an unknown lesson", () => {
    renderDetail("missing-lesson")
    expect(
      screen.getByRole("heading", { name: "没有找到这节课堂" }),
    ).toBeInTheDocument()
  })
})
