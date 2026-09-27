import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

function DeleteDraftLessonOnMount() {
  const { deleteLesson } = usePrototype()

  useEffect(() => {
    deleteLesson("lesson-fractions")
    // The fixture action is intentionally fired once to model deletion on the classroom page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

describe("WorkspaceScreen", () => {
  it("presents the classroom recap as the primary task", () => {
    render(
      <PrototypeProvider persist={false}>
        <WorkspaceScreen onNavigate={vi.fn()} />
      </PrototypeProvider>,
    )

    expect(screen.getByText("五年级（2）班")).toBeInTheDocument()
    expect(screen.getByText("现在要做")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "审核课堂复盘" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "查看并发布" }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("课堂回响处理进度")).not.toBeInTheDocument()
  })
  it("keeps the primary decision compact and removes the repeated summary strip", () => {
    render(
      <PrototypeProvider persist={false}>
        <WorkspaceScreen onNavigate={vi.fn()} />
      </PrototypeProvider>,
    )

    const stage = screen.getByTestId("current-lesson-stage")
    const reviewCard = screen.getByTestId("current-lesson-review-card")
    const reviewContent = within(reviewCard).getByTestId(
      "current-lesson-review-content",
    )
    expect(stage).toHaveClass("flex", "flex-col")
    expect(reviewCard).toHaveClass(
      "flex",
      "flex-col",
    )
    expect(reviewContent).toHaveClass(
      "flex",
      "flex-col",
    )
    expect(
      within(reviewContent).getByText(
        "分子和分母同时乘或除以相同的数，分数的大小不变。",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByTestId("current-lesson-feedback")).not.toBeInTheDocument()
  })

  it("shows only real pending work and one evidence-backed class signal", () => {
    render(
      <PrototypeProvider persist={false}>
        <WorkspaceScreen onNavigate={vi.fn()} />
      </PrototypeProvider>,
    )

    expect(
      screen.getByRole("complementary", { name: "待办与班级动态" }),
    ).toBeInTheDocument()
    expect(screen.getByText("待处理")).toBeInTheDocument()
    expect(screen.getByText("批改随堂练习")).toBeInTheDocument()
    expect(screen.getByText("回复新消息")).toBeInTheDocument()
    expect(screen.queryByText("继续备课")).not.toBeInTheDocument()
    expect(screen.getByText("班级动态")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "查看班级动态" })).toHaveTextContent("单位换算")
    expect(screen.getByTestId("workspace-content-row")).toHaveClass(
      "app-split-layout",
    )
    expect(
      screen.getByRole("complementary", { name: "待办与班级动态" }),
    ).toHaveClass("app-split-rail")
    expect(screen.getByRole("heading", { name: "待处理" }).closest("section")).toHaveClass(
      "workspace-queue-surface",
    )
  })

  it("does not invent a review card after its lesson has been deleted", () => {
    render(
      <PrototypeProvider persist={false}>
        <DeleteDraftLessonOnMount />
        <WorkspaceScreen onNavigate={vi.fn()} />
      </PrototypeProvider>,
    )

    expect(screen.queryByTestId("current-lesson-review-card")).not.toBeInTheDocument()
    expect(screen.queryByText("分子和分母同时乘或除以相同的数，分数的大小不变。")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "开始下一节课堂" })).toBeInTheDocument()
    expect(screen.getByText("小数乘法估算")).toBeInTheDocument()
  })

  it("connects classroom evidence to the lesson detail", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <PrototypeProvider persist={false}>
        <WorkspaceScreen onNavigate={onNavigate} />
      </PrototypeProvider>,
    )

    await user.click(screen.getByRole("button", { name: "查看课堂依据" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "teacher",
      page: "lesson-detail",
      lessonId: "lesson-fractions",
    })
  })

  it("moves on to the next useful action after the lesson is published", async () => {
    render(
      <PrototypeProvider persist={false} dataset="acceptance">
        <PublishLessonOnMount />
        <WorkspaceScreen onNavigate={vi.fn()} />
      </PrototypeProvider>,
    )

    expect(screen.queryByRole("button", { name: "查看并发布" })).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "开始课堂录音" }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId("current-lesson-review-card")).not.toBeInTheDocument()
  })
})
