import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import RecapDeliverablesReview from "./RecapDeliverablesReview"
import type { RecapDeliverables } from "../../../app/prototype/types"

const deliverables: RecapDeliverables = {
  studentRecap: "原始复习卡",
  teacherReport: "教师报告",
  remedialPlan: "补讲方案",
  practiceQuestions: ["练习题一", "练习题二", "练习题三"],
  evidence: [{ id: "evidence-01", quote: "课堂原话", startSeconds: 0, endSeconds: 3, source: "transcript" }],
  inferences: [],
}

describe("recap deliverables review", () => {
  it("does not export before teacher confirmation", () => {
    render(<RecapDeliverablesReview goal="补讲目标" deliverables={deliverables} onExport={vi.fn()} onPublish={vi.fn()} />)
    expect(screen.getByRole("button", { name: "导出补讲包" })).toBeDisabled()
  })

  it("edits, confirms publishing, then allows export", async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    const onPublish = vi.fn()
    render(<RecapDeliverablesReview goal="补讲目标" deliverables={deliverables} onExport={onExport} onPublish={onPublish} />)

    const recap = screen.getByLabelText("学生复习卡")
    await user.clear(recap)
    await user.type(recap, "修改后的复习卡")
    await user.click(screen.getByRole("button", { name: "确认发布" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/学生将看见复习卡与练习/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "确认发布给学生" }))

    expect(onPublish).toHaveBeenCalledWith(expect.objectContaining({ studentRecap: "修改后的复习卡" }))
    expect(screen.getByRole("button", { name: "导出补讲包" })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "导出补讲包" }))
    expect(onExport).toHaveBeenCalledWith(expect.objectContaining({ studentRecap: "修改后的复习卡" }))
  })
})
