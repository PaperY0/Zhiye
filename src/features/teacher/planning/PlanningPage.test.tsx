import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  PrototypeProvider,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import PlanningPage from "./PlanningPage"
import {
  generateLessonPlan,
  generateThreeQuestionQuiz,
  type LessonPlanGeneratorInput,
  type QuizGeneratorInput,
} from "./generators"

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

describe("planning generators", () => {
  it("generates deterministic lesson plans and exactly three quiz questions", () => {
    const planInput: LessonPlanGeneratorInput = {
      textbook: "人教版数学五年级上册",
      chapter: "小数乘法 · 估算",
      objective: "能解释估算步骤并检查结果是否合理",
      context: "校园菜园采购",
      evidence: ["课堂停顿", "自检错题"],
    }
    const quizInput: QuizGeneratorInput = {
      title: "小数乘法估算三题测验",
      topic: "小数乘法估算",
      difficulty: "递进",
      focus: "步骤与合理性判断",
    }

    expect(generateLessonPlan(planInput)).toEqual(generateLessonPlan(planInput))
    expect(generateThreeQuestionQuiz(quizInput)).toEqual(
      generateThreeQuestionQuiz(quizInput),
    )
    expect(generateThreeQuestionQuiz(quizInput).questions).toHaveLength(3)
  })
})

describe("PlanningPage", () => {
  it("configures, generates, edits, and saves an evidence-aware lesson plan", async () => {
    const user = userEvent.setup()
    renderPlanningPage()

    expect(
      screen.getByRole("heading", { name: "备课与测验" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "教案生成" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    await user.selectOptions(
      screen.getByRole("combobox", { name: "教材" }),
      "人教版数学五年级上册",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "章节" }),
      "小数乘法 · 估算",
    )
    await user.clear(screen.getByRole("textbox", { name: "教学目标" }))
    await user.type(
      screen.getByRole("textbox", { name: "教学目标" }),
      "能解释估算步骤并检查结果是否合理",
    )
    await user.selectOptions(
      screen.getByRole("combobox", { name: "生活情境" }),
      "校园菜园采购",
    )
    await user.click(screen.getByRole("checkbox", { name: "课堂停顿" }))
    await user.click(screen.getByRole("checkbox", { name: "自检错题" }))
    await user.click(screen.getByRole("button", { name: "生成教案" }))

    const editor = screen.getByRole("region", { name: "教案编辑器" })
    expect(within(editor).getByText("教学流程")).toBeInTheDocument()
    expect(within(editor).getByText("生活化示例")).toBeInTheDocument()
    expect(within(editor).getByText("常见误区")).toBeInTheDocument()
    expect(within(editor).getByText("教学建议")).toBeInTheDocument()
    expect(within(editor).getByText("课后延伸")).toBeInTheDocument()
    expect(within(editor).getByText("课堂停顿")).toBeInTheDocument()
    expect(within(editor).getByText("自检错题")).toBeInTheDocument()

    const title = within(editor).getByRole("textbox", { name: "教案标题" })
    await user.clear(title)
    await user.type(title, "校园菜园里的小数估算")
    await user.type(
      within(editor).getByRole("textbox", { name: "课后延伸" }),
      "让学生设计一张采购估算清单。",
    )
    await user.click(
      within(editor).getByRole("button", { name: "保存到备课记录" }),
    )

    expect(screen.getByLabelText("原型状态")).toHaveTextContent(
      "教案 2 · 最新教案 校园菜园里的小数估算",
    )
    expect(
      screen.getByText("教案已保存", { selector: 'p[role="status"]' }),
    ).toBeInTheDocument()
  })

  it("generates, edits, previews, and publishes a three-question quiz", async () => {
    const user = userEvent.setup()
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
