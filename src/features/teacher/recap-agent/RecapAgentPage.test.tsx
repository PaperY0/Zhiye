import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import RecapAgentPage, { createDemoRecapJob } from "./RecapAgentPage"
import RecapEvidenceDrawer from "./RecapEvidenceDrawer"
import RecapPlanTimeline from "./RecapPlanTimeline"
import type { RecapJob } from "../../../app/prototype/types"

function jobWith(status: RecapJob["steps"][number]["status"]): RecapJob {
  const keys = [
    "transcribe",
    "extract-evidence",
    "identify-gaps",
    "generate-deliverables",
    "teacher-review",
  ] as const
  return {
    id: "job-test",
    goal: "为明天准备 5 分钟补讲",
    status: status === "failed" ? "failed" : "needs-review",
    steps: keys.map((key, index) => ({
      key,
      status: index === 3 ? status : index < 3 ? "succeeded" : "pending",
      summary: index === 3 && status === "failed" ? "该工具失败，已保留前序结果" : "已完成",
      evidenceIds: index < 3 ? ["evidence-01"] : [],
      ...(index === 3 && status === "failed" ? { error: "DeepSeek 暂时不可用" } : {}),
    })) as RecapJob["steps"],
    evidence: [
      {
        id: "evidence-01",
        quote: "分子和分母要同时乘同一个不为零的数。",
        startSeconds: 85,
        endSeconds: 112,
        source: "transcript",
      },
    ],
    inferences: [
      { id: "inference-01", statement: "需要补讲操作条件。", evidenceIds: ["evidence-01"] },
    ],
  }
}

describe("recap agent execution page", () => {
  it("shows goal, five-step plan, evidence, and deliverable areas", () => {
    render(<RecapAgentPage onNavigate={vi.fn()} initialJob={createDemoRecapJob()} />)

    expect(screen.getByRole("heading", { name: "课堂复盘数字员工" })).toBeInTheDocument()
    expect(screen.getByText("为明天准备 5 分钟补讲")).toBeInTheDocument()
    expect(screen.getByText(/提取课堂证据/)).toBeInTheDocument()
    expect(screen.getByText("审核并发布")).toBeInTheDocument()
    expect(screen.getAllByText(/分子和分母要同时乘同一个不为零的数/).length).toBeGreaterThan(0)
  })

  it("shows a retry action for a failed generation step", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <RecapPlanTimeline
        job={jobWith("failed")}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText("DeepSeek 暂时不可用")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "仅重试生成补讲包" }))
    expect(onRetry).toHaveBeenCalledWith("generate-deliverables")
  })

  it("marks the teacher review step and page status after publishing", async () => {
    const user = userEvent.setup()
    render(<RecapAgentPage onNavigate={vi.fn()} initialJob={createDemoRecapJob()} />)

    await user.click(screen.getByRole("button", { name: "确认发布" }))
    await user.click(screen.getByRole("button", { name: "确认发布给学生" }))

    expect(screen.getByText("5/5 已完成")).toBeInTheDocument()
    expect(screen.getAllByText("已发布").length).toBeGreaterThan(0)
    expect(screen.getByText("已完成发布")).toBeInTheDocument()
  })

  it("separates AI inference from classroom evidence", () => {
    render(<RecapEvidenceDrawer evidence={jobWith("succeeded").evidence} inferences={jobWith("succeeded").inferences} />)

    expect(screen.getByText(/课堂原话/)).toBeInTheDocument()
    expect(screen.getByText(/AI 推断/)).toBeInTheDocument()
    expect(screen.getByText("需要补讲操作条件。")).toBeInTheDocument()
  })
})
