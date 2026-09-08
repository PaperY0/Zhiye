import { describe, expect, it } from "vitest"
import { buildRecapPackageHtml } from "./exportRecapPackage"
import type { RecapDeliverables } from "../../../app/prototype/types"

const deliverables: RecapDeliverables = {
  studentRecap: "分子和分母同时乘同一个不为零的数。",
  teacherReport: "学生能够复述核心规则。",
  remedialPlan: "明天用 5 分钟补讲不为零条件。",
  practiceQuestions: ["请复述规则。", "只改变分子会怎样？", "举一个变式题。"],
  evidence: [{ id: "evidence-01", quote: "课堂原话", startSeconds: 85, endSeconds: 112, source: "transcript" }],
  inferences: [{ id: "inference-01", statement: "需要补讲条件。", evidenceIds: ["evidence-01"] }],
}

describe("recap package export", () => {
  it("includes goal, four deliverables, and evidence without secrets", () => {
    const html = buildRecapPackageHtml({
      title: "分数的基本性质",
      date: "2026-09-08",
      goal: "为明天准备 5 分钟补讲",
      deliverables,
      confirmedAt: "2026-09-08 20:00",
    })

    expect(html).toContain("为明天准备 5 分钟补讲")
    expect(html).toContain("学生复习卡")
    expect(html).toContain("教师报告")
    expect(html).toContain("补讲方案")
    expect(html).toContain("练习题")
    expect(html).toContain("课堂原话")
    expect(html).toContain("2026-09-08 20:00")
    expect(html).not.toContain("DEEPSEEK_API_KEY")
    expect(html).not.toContain("真实学生")
  })
})
