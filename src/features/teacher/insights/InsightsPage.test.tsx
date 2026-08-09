import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import {
  PrototypeProvider,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import { InsightsPage } from "./InsightsPage"
import { generateDraft } from "../../../services/localAi"

vi.mock("../../../services/localAi", () => ({
  generateDraft: vi.fn(),
}))

function StateProbe() {
  const { plans, quizzes } = usePrototype()

  return (
    <output aria-label="生成结果计数">
      方案 {plans.length} · 练习 {quizzes.length}
    </output>
  )
}

function renderPage() {
  return render(
    <PrototypeProvider>
      <InsightsPage />
      <StateProbe />
    </PrototypeProvider>,
  )
}

describe("InsightsPage", () => {
  beforeEach(() => {
    vi.mocked(generateDraft).mockReset()
  })

  it("filters class signals by time and subject without showing rankings", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      screen.getByRole("heading", { name: "班级洞察" }),
    ).toBeInTheDocument()
    expect(screen.getByText("3 个知识信号")).toBeInTheDocument()
    expect(screen.getByText("12 名学生受影响")).toBeInTheDocument()
    expect(screen.queryByText(/排名|第\s*\d+\s*名/)).not.toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole("combobox", { name: "时间范围" }),
      "today",
    )
    expect(screen.getByText("2 个知识信号")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^分数基本性质 × 概念/ }),
    ).not.toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole("combobox", { name: "学科" }),
      "英语",
    )
    expect(screen.getByText("这个筛选条件下还没有困难信号")).toBeInTheDocument()
    expect(screen.getByText("0 个知识信号")).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole("combobox", { name: "时间范围" }),
      "week",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "学科" }),
      "数学",
    )
    expect(
      screen.getByRole("button", { name: /^单位换算 × 计算/ }),
    ).toBeInTheDocument()
  })

  it("provides text-equivalent heatmap cells and an accessible SVG trend", () => {
    renderPage()

    const heatmap = screen.getByRole("grid", { name: "知识困难热力图" })
    expect(
      within(heatmap).getByRole("button", { name: /^单位换算 × 计算/ }),
    ).toHaveAttribute("aria-label", expect.stringContaining("12 名学生"))
    expect(
      screen.getByRole("img", { name: "困难信号近五次变化趋势" }),
    ).toBeInTheDocument()
    expect(screen.getByText("4 → 6 → 8 → 10 → 12 名学生")).toBeInTheDocument()
  })

  it("opens unit-conversion evidence and adds the remedial plan returned by local AI", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        title: "单位换算方向补讲",
        goals: ["判断换算方向"],
        steps: ["比较单位大小"],
        examples: ["1 米等于 100 厘米"],
        check_for_understanding: "解释一次换算方向",
      },
    })
    renderPage()

    expect(screen.getByLabelText("生成结果计数")).toHaveTextContent(
      "方案 1 · 练习 1",
    )
    await user.click(screen.getByRole("button", { name: /^单位换算 × 计算/ }))

    const drawer = screen.getByRole("dialog", { name: "单位换算 · 计算步骤" })
    expect(within(drawer).getByText("判断乘除方向")).toBeInTheDocument()
    expect(
      within(drawer).getByText("随堂练习第 3 题停顿时间增加"),
    ).toBeInTheDocument()
    expect(
      within(drawer).getByText("课堂中 5 次询问乘还是除"),
    ).toBeInTheDocument()

    await user.click(
      within(drawer).getByRole("button", { name: "一键生成补讲方案" }),
    )
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("remedial-plan", {
      knowledgePoint: "单位换算",
      step: "判断乘除方向",
      affectedCount: 12,
      trend: "4 → 6 → 8 → 10 → 12",
      evidence: ["随堂练习第 3 题停顿时间增加", "课堂中 5 次询问乘还是除"],
    })
    expect(screen.getByLabelText("生成结果计数")).toHaveTextContent(
      "方案 2 · 练习 1",
    )
    expect(
      screen.getByRole("status", { name: "生成结果通知" }),
    ).toHaveTextContent("已生成“单位换算方向补讲”")
  })

  it("generates a focused exercise from the selected signal", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        title: "单位换算计算巩固练习",
        questions: [
          { prompt: "1 米等于多少厘米？", options: ["1", "100"], answer: "100" },
          { prompt: "2 米等于多少厘米？", options: ["2", "200"], answer: "200" },
          { prompt: "3 米等于多少厘米？", options: ["3", "300"], answer: "300" },
        ],
      },
    })
    renderPage()

    await user.click(screen.getByRole("button", { name: /^单位换算 × 计算/ }))
    const drawer = screen.getByRole("dialog", { name: "单位换算 · 计算步骤" })
    await user.click(
      within(drawer).getByRole("button", { name: "一键生成巩固练习" }),
    )

    expect(screen.getByLabelText("生成结果计数")).toHaveTextContent(
      "方案 1 · 练习 2",
    )
    expect(
      screen.getByRole("status", { name: "生成结果通知" }),
    ).toHaveTextContent("已生成“单位换算计算巩固练习”")
  })
})
