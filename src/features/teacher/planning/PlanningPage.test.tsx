import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import {
  PrototypeProvider,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import PlanningPage from "./PlanningPage"
import { generateDraft } from "../../../services/localAi"

vi.mock("../../../services/localAi", () => ({
  generateDraft: vi.fn(),
}))

function StateProbe() {
  const { plans, quizzes } = usePrototype()
  return (
    <output aria-label="原型状态">
      教案 {plans.length} · 最新教案 {plans.at(-1)?.title ?? "无"} · 测验{" "}
      {quizzes.length} · 最新测验 {quizzes.at(-1)?.title ?? "无"} · 状态{" "}
      {quizzes.at(-1)?.status ?? "无"}
    </output>
  )
}

function renderPlanningPage() {
  return render(
    <PrototypeProvider>
      <PlanningPage />
      <StateProbe />
    </PrototypeProvider>,
  )
}

describe("PlanningPage", () => {
  beforeEach(() => {
    vi.mocked(generateDraft).mockReset()
  })

  it("renders the lesson plan returned by local AI for review and saving", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        title: "单位换算补讲",
        outline: ["先复习方向判断"],
        examples: ["1 米等于多少厘米"],
        misconceptions: ["忽略单位方向"],
        suggestions: ["先估算再计算"],
        extension: "设计一道换算题",
      },
    })
    renderPlanningPage()

    expect(
      screen.getByRole("heading", { name: "备课与测验" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "教案生成" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    await user.click(screen.getByRole("checkbox", { name: "课堂停顿" }))
    await user.click(screen.getByRole("button", { name: "生成教案" }))

    const editor = screen.getByRole("region", { name: "教案编辑器" })
    expect(await within(editor).findByDisplayValue("单位换算补讲")).toBeInTheDocument()
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("lesson-plan", {
      textbook: "人教版数学五年级上册",
      chapter: "分数的基本性质",
      objective: "理解知识步骤，并能在生活情境中解释方法",
      context: "校园菜园采购",
      evidence: ["课堂停顿"],
    })
    expect(within(editor).getByText("教学流程")).toBeInTheDocument()
    expect(within(editor).getByText("生活化示例")).toBeInTheDocument()
    expect(within(editor).getByText("常见误区")).toBeInTheDocument()
    expect(within(editor).getByText("教学建议")).toBeInTheDocument()
    expect(within(editor).getByText("课后延伸")).toBeInTheDocument()
    expect(within(editor).getByText("课堂停顿")).toBeInTheDocument()

    const title = within(editor).getByRole("textbox", { name: "教案标题" })
    await user.clear(title)
    await user.type(title, "教师修订后的补讲")
    await user.click(
      within(editor).getByRole("button", { name: "保存到备课记录" }),
    )

    expect(screen.getByLabelText("原型状态")).toHaveTextContent(
      "教案 2 · 最新教案 教师修订后的补讲",
    )
    expect(
      screen.getByText("教案已保存", { selector: 'p[role="status"]' }),
    ).toBeInTheDocument()
  })

  it("keeps the editor empty and offers a retry when lesson-plan generation fails", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockRejectedValue(new Error("服务不可用"))
    renderPlanningPage()

    await user.click(screen.getByRole("button", { name: "生成教案" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("服务不可用")
    expect(screen.getByRole("button", { name: "重试生成" })).toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "教案标题" })).not.toBeInTheDocument()
  })

  it.each([
    ["rejects", () => Promise.reject(new Error("测验服务不可用"))],
    ["returns malformed content", () => Promise.resolve({ content: { title: "不完整测验" } })],
  ])(
    "keeps quizzes unchanged and offers a retry when local AI quiz generation %s",
    async (_scenario, response) => {
      const user = userEvent.setup()
      vi.mocked(generateDraft).mockImplementation(response)
      renderPlanningPage()

      await user.click(screen.getByRole("tab", { name: "三题测验" }))
      await user.click(screen.getByRole("button", { name: "生成三题测验" }))

      expect(await screen.findByRole("alert")).toHaveTextContent(
        _scenario === "rejects" ? "测验服务不可用" : "草稿格式不正确",
      )
      expect(screen.getByRole("button", { name: "重试生成" })).toBeInTheDocument()
      expect(screen.getByLabelText("原型状态")).toHaveTextContent(
        "测验 1 · 最新测验 分数基本性质自检 · 状态 published",
      )
      expect(
        screen.queryByRole("group", { name: /第 [123] 题/ }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText("数量变化方向")).not.toBeInTheDocument()
      expect(screen.queryByText("关于“分数基本性质”")).not.toBeInTheDocument()
    },
  )

  it("generates, edits, previews, and publishes a three-question quiz", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        title: "单位换算三题闯关",
        questions: [
          { prompt: "1 米等于多少厘米？", options: ["1", "100"], answer: "100" },
          { prompt: "2 米等于多少厘米？", options: ["2", "200"], answer: "200" },
          { prompt: "3 米等于多少厘米？", options: ["3", "300"], answer: "300" },
        ],
      },
    })
    renderPlanningPage()

    await user.click(screen.getByRole("tab", { name: "三题测验" }))
    expect(screen.getByRole("tab", { name: "三题测验" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    await user.clear(screen.getByRole("textbox", { name: "测验标题" }))
    await user.type(
      screen.getByRole("textbox", { name: "测验标题" }),
      "单位换算三题闯关",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "知识主题" }),
      "单位换算",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "难度结构" }),
      "递进",
    )
    await user.clear(screen.getByRole("textbox", { name: "考查重点" }))
    await user.type(
      screen.getByRole("textbox", { name: "考查重点" }),
      "判断方向、计算进率与解释步骤",
    )
    await user.click(screen.getByRole("button", { name: "生成三题测验" }))

    const editor = screen.getByRole("region", { name: "三题测验编辑器" })
    const questions = within(editor).getAllByRole("group", {
      name: /第 [123] 题/,
    })
    expect(questions).toHaveLength(3)

    const firstPrompt = within(questions[0]).getByRole("textbox", {
      name: "题干",
    })
    await user.clear(firstPrompt)
    await user.type(firstPrompt, "2.5 米等于多少厘米？")
    const firstExplanation = within(questions[0]).getByRole("textbox", {
      name: "解析",
    })
    await user.clear(firstExplanation)
    await user.type(firstExplanation, "米换算成厘米，需要乘 100。")

    await user.click(within(editor).getByRole("button", { name: "预览测验" }))
    const preview = screen.getByRole("dialog", { name: "测验预览" })
    expect(within(preview).getByText("单位换算三题闯关")).toBeInTheDocument()
    expect(
      within(preview).getByText("2.5 米等于多少厘米？"),
    ).toBeInTheDocument()
    expect(within(preview).getAllByRole("listitem")).toHaveLength(3)
    await user.click(within(preview).getByRole("button", { name: "返回编辑" }))

    await user.click(within(editor).getByRole("button", { name: "发布测验" }))
    expect(screen.getByLabelText("原型状态")).toHaveTextContent(
      "测验 2 · 最新测验 单位换算三题闯关 · 状态 published",
    )
    expect(
      screen.getByText("三题测验已发布", { selector: 'p[role="status"]' }),
    ).toBeInTheDocument()
  })
})
