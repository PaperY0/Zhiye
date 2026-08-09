import { render, screen, within } from "@testing-library/react"
import { useEffect } from "react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import { LessonDetailPage } from "./LessonDetailPage"

function AnalysisSeed() {
  const { updateLessonAnalysis } = usePrototype()
  useEffect(() => {
    updateLessonAnalysis(
      "lesson-fractions",
      [{ id: "analysis-01", speaker: "李老师", startSeconds: 0, endSeconds: 10, body: "单位换算" }],
      "先判断单位变化方向。",
      ["单位换算"],
      "完成随堂自检",
      40,
      "学生在乘除方向上需要更多示范。",
      "下节课先复盘单位阶梯。",
      ["课堂中有两次关于乘除方向的提问。"],
    )
  }, [])
  return null
}

function renderDetail(lessonId = "lesson-fractions", withAnalysis = false) {
  render(
    <PrototypeProvider>
      {withAnalysis ? <AnalysisSeed /> : null}
      <LessonDetailPage lessonId={lessonId} />
    </PrototypeProvider>,
  )
}

describe("LessonDetailPage", () => {
  it("switches among transcript, recap, teacher report, and course progress tabs", async () => {
    const user = userEvent.setup()
    renderDetail("lesson-fractions", true)

    expect(
      screen.getByRole("heading", { name: "分数的基本性质" }),
    ).toBeInTheDocument()
    expect(screen.getByText("单位换算")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "学生复习卡" }))
    expect(screen.getByLabelText("复习卡内容")).toHaveValue(
      "先判断单位变化方向。",
    )

    await user.click(screen.getByRole("tab", { name: "教师课堂报告" }))
    expect(screen.getByText("学生在乘除方向上需要更多示范。")).toBeInTheDocument()
    expect(screen.getByText("课堂中有两次关于乘除方向的提问。")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "课程进度" }))
    expect(screen.getByText("下节课先复盘单位阶梯。")).toBeInTheDocument()
    expect(screen.getByLabelText("课程完成进度")).toHaveValue(72)
  })

  it("edits and saves the current AI recap through PrototypeContext", async () => {
    const user = userEvent.setup()
    renderDetail("lesson-fractions", true)

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

  it("shows empty states in every tab instead of fixture content when no analysis ran", async () => {
    const user = userEvent.setup()
    renderDetail()

    expect(screen.getByText("暂无课堂转写初稿")).toBeInTheDocument()
    expect(screen.queryByText(/分子和分母要同时乘同一个不为零的数/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "学生复习卡" }))
    expect(screen.getByText("暂无学生复习卡初稿")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "教师课堂报告" }))
    expect(screen.getByText("暂无教师报告初稿")).toBeInTheDocument()
    expect(screen.queryByText("补充不为零的条件")).not.toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "课程进度" }))
    expect(screen.getByText("暂无课程进度初稿")).toBeInTheDocument()
  })

  it("does not offer publishing before a complete AI analysis exists", () => {
    renderDetail()
    expect(screen.queryByRole("button", { name: "确认并发布" })).not.toBeInTheDocument()
    expect(screen.getByText("请先完成本次 AI 课堂分析，再确认发布。")).toBeInTheDocument()
  })

  it("updates the displayed course progress controls", async () => {
    const user = userEvent.setup()
    renderDetail("lesson-fractions", true)

    await user.click(screen.getByRole("tab", { name: "课程进度" }))
    const progress = screen.getByLabelText("课程完成进度")
    await user.clear(progress)
    await user.type(progress, "80")
    const nextStep = screen.getByLabelText("下一步教学内容")
    await user.clear(nextStep)
    await user.type(nextStep, "通分综合练习")
    await user.click(screen.getByRole("button", { name: "保存课程进度" }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "课程进度保存成功 · 已同步到课堂记录",
    )
    expect(nextStep).toHaveValue("通分综合练习")
  })

  it("requires confirmation before publishing the lesson to students", async () => {
    const user = userEvent.setup()
    renderDetail("lesson-fractions", true)

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
