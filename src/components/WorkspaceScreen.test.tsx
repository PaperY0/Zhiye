import { render, screen, within } from "@testing-library/react"
import { useEffect } from "react"
import { vi } from "vitest"
import { PrototypeProvider, usePrototype } from "../app/prototype/PrototypeContext"
import WorkspaceScreen from "./WorkspaceScreen"

function PublishLessonOnMount() {
  const { publishLesson } = usePrototype()

  useEffect(() => {
    publishLesson("lesson-fractions")
    // The fixture action is intentionally fired once to model the prior page action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

describe("WorkspaceScreen", () => {
  it("presents the classroom recap as the primary task", () => {
    render(<WorkspaceScreen onNavigate={vi.fn()} />)

    expect(screen.getByText("五年级（2）班")).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "搜索课堂、学生或知识点" }),
    ).toBeInTheDocument()
    expect(screen.getByText("今日最重要")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "完成这一节课堂复盘" }),
    ).toBeInTheDocument()
    for (const label of ["课堂录音", "已转写", "复习卡草稿", "学生困难"]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(
      screen.getByRole("button", { name: "确认并发布" }),
    ).toBeInTheDocument()
  })
  it("anchors lesson feedback at the bottom and stretches the centered review card", () => {
    render(<WorkspaceScreen onNavigate={vi.fn()} />)

    const stage = screen.getByTestId("current-lesson-stage")
    const reviewCard = screen.getByTestId("current-lesson-review-card")
    const reviewContent = within(reviewCard).getByTestId(
      "current-lesson-review-content",
    )
    const feedback = screen.getByTestId("current-lesson-feedback")

    expect(stage).toHaveClass(
      "flex",
      "h-auto",
      "min-h-0",
      "flex-col",
      "xl:h-full",
    )
    expect(stage).not.toHaveClass("h-full")
    expect(reviewCard).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
    )
    expect(reviewContent).toHaveClass(
      "flex",
      "flex-1",
      "flex-col",
      "items-center",
      "justify-center",
      "text-center",
    )
    expect(
      within(reviewContent).getByText(
        "分子和分母同时乘或除以相同的数，分数的大小不变。",
      ),
    ).toBeInTheDocument()
    expect(feedback).toHaveClass("mt-auto", "shrink-0")
    expect(stage.lastElementChild).toBe(feedback)
  })

  it("shows the teacher action queue and aggregated class pulse", () => {
    render(<WorkspaceScreen onNavigate={vi.fn()} />)

    expect(
      screen.getByRole("complementary", { name: "今日行动与班级脉搏" }),
    ).toBeInTheDocument()
    expect(screen.getByText("今日队列")).toBeInTheDocument()
    expect(screen.getByText("批改随堂练习")).toBeInTheDocument()
    expect(screen.getByText("回复家长消息")).toBeInTheDocument()
    expect(screen.getByText("班级脉搏")).toBeInTheDocument()
    expect(screen.getByText("单位换算 × 计算")).toBeInTheDocument()
    expect(screen.getByTestId("workspace-content-row")).toHaveClass(
      "items-stretch",
      "workspace-content-row-fill",
    )
    expect(
      screen.getByRole("complementary", { name: "今日行动与班级脉搏" }),
    ).toHaveClass("h-full")
    expect(screen.getByRole("heading", { name: "今日队列" }).closest("section")).toHaveClass(
      "workspace-side-surface-centered",
      "workspace-apple-glass-surface",
    )
    expect(screen.getByRole("button", { name: "打开班级脉搏" })).toHaveClass(
      "workspace-side-surface-centered",
      "workspace-apple-glass-surface",
    )
  })

  it("removes the publish action after the lesson is published", async () => {
    render(
      <PrototypeProvider persist={false}>
        <PublishLessonOnMount />
        <WorkspaceScreen onNavigate={vi.fn()} />
      </PrototypeProvider>,
    )

    expect(screen.queryByRole("button", { name: "确认并发布" })).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "查看已发布课堂" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/复习卡已发布给 \d+ 名学生/)).toBeInTheDocument()
  })
})
