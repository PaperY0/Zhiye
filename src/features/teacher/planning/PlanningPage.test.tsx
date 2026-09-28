import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import PlanningPage from "./PlanningPage"
import { generateDraft } from "../../../services/localAi"
import { progressImportKey } from "./progressImport"

vi.mock("../../../services/localAi", () => ({ generateDraft: vi.fn() }))

function Probe() { const { plans } = usePrototype(); return <output aria-label="教案状态">{plans.map((plan) => `${plan.title}:${plan.objective}`).join("|")}</output> }
function setup() { return render(<PrototypeProvider><PlanningPage /><Probe /></PrototypeProvider>) }

describe("PlanningPage", () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.mocked(generateDraft).mockReset() })

  it("opens an independent plan with the next lesson content from classroom progress", () => {
    sessionStorage.setItem(progressImportKey, JSON.stringify({
      lessonId: "lesson-fractions", lessonTitle: "分数的基本性质",
      nextStep: "通分综合练习", chapter: "分数的意义和性质",
      className: "五年级（2）班", subject: "数学",
    }))
    setup()

    expect(screen.getByText(/已从“分数的基本性质”带入下一步教学内容/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "课题" })).toHaveValue("通分综合练习")
    expect(screen.getByRole("textbox", { name: "生活情境" })).toHaveValue("承接“分数的基本性质”（分数的意义和性质）")
    expect(screen.getByRole("textbox", { name: "教学目标" })).toHaveValue("")
    expect(sessionStorage.getItem(progressImportKey)).toBeNull()
  })

  it("keeps a long next-lesson note readable in context instead of stretching the topic", () => {
    const nextStep = "先回顾圆面积公式，再用不同半径完成练习，最后比较正方形和圆形面积公式的适用条件，并让学生解释每一步计算的依据。"
    sessionStorage.setItem(progressImportKey, JSON.stringify({ lessonId: "lesson-area", lessonTitle: "圆形面积公式", nextStep, chapter: "图形面积", className: "五年级（1）班", subject: "数学" }))
    setup()
    expect(screen.getByRole("textbox", { name: "课题" })).toHaveValue("圆形面积公式 · 下一课")
    expect((screen.getByRole("textbox", { name: "生活情境" }) as HTMLTextAreaElement).value).toContain(nextStep)
  })

  it("creates a manual plan, saves it, and reopens the full editor", async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole("button", { name: "新建教案" }))
    await user.type(screen.getByRole("textbox", { name: "课题" }), "分数的意义")
    await user.type(screen.getByRole("textbox", { name: "教学目标" }), "能解释分数的意义")
    await user.type(screen.getByRole("textbox", { name: "教学流程" }), "观察图形")
    await user.click(screen.getByRole("button", { name: "保存教案" }))
    expect(screen.getByRole("status", { name: "教案状态" })).toHaveTextContent("能解释分数的意义")
    await user.click(within(screen.getByRole("complementary", { name: "我的教案" })).getByRole("button", { name: /分数的意义/ }))
    expect(screen.getByRole("textbox", { name: "教学流程" })).toHaveValue("观察图形")
    await user.type(screen.getByRole("textbox", { name: "课堂检验方式" }), "口头解释")
    expect(screen.getByRole("textbox", { name: "课堂检验方式" })).toHaveValue("口头解释")
  })

  it("uses local AI for an editable lesson draft and reports service errors", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockRejectedValueOnce(new Error("本地 AI 服务未启动"))
    vi.mocked(generateDraft).mockResolvedValueOnce({ content: { title: "分数教案", outline: ["导入"], examples: ["分苹果"], misconceptions: ["分母理解"], suggestions: ["画图"], extension: "完成练习" } })
    setup()
    await user.click(screen.getByRole("button", { name: "新建教案" }))
    await user.type(screen.getByRole("textbox", { name: "课题" }), "分数")
    await user.type(screen.getByRole("textbox", { name: "教学目标" }), "能解释分数")
    await user.type(screen.getByRole("textbox", { name: "生活情境" }), "分享苹果")
    await user.click(screen.getByRole("button", { name: "用 AI 起草教学流程" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("本地 AI 服务未启动")
    await user.click(screen.getByRole("button", { name: "重试生成" }))
    expect(await screen.findByRole("textbox", { name: "教案标题" })).toHaveValue("分数教案")
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("lesson-plan", expect.objectContaining({ objective: "能解释分数" }))
  })

  it("applies a bundled teaching aid to the lesson and AI context", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({ content: { title: "小数乘法教案", outline: ["操作"], examples: ["购物"], misconceptions: ["积的大小"], suggestions: ["估算"], extension: "解释算法" } })
    setup()
    await user.click(screen.getByRole("button", { name: "新建教案" }))
    await user.selectOptions(screen.getByRole("combobox", { name: "选择教辅" }), "pep-math-g5-2026-autumn")
    await user.selectOptions(screen.getByRole("combobox", { name: "选择单元" }), "u2")
    await user.selectOptions(screen.getByRole("combobox", { name: "选择课题" }), "decimal")
    await user.click(screen.getByRole("button", { name: "应用到备课" }))
    expect(screen.getByRole("textbox", { name: "课题" })).toHaveValue("二 小数乘法 · 小数乘小数")
    expect(screen.getByRole("textbox", { name: "教学目标" })).toHaveValue("能解释两个小数相乘时积的小数位数与数量大小的关系。")
    await user.click(screen.getByRole("button", { name: "用 AI 起草教学流程" }))
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("lesson-plan", expect.objectContaining({ teachingAid: expect.stringContaining("小数乘小数") }))
  })

  it("asks before AI replaces handwritten teaching activities", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({ content: { title: "AI 教案", outline: ["新流程"], examples: [], misconceptions: [], suggestions: [], extension: "" } })
    setup()
    await user.click(screen.getByRole("button", { name: "新建教案" }))
    await user.type(screen.getByRole("textbox", { name: "课题" }), "分数")
    await user.type(screen.getByRole("textbox", { name: "教学目标" }), "理解分数")
    await user.type(screen.getByRole("textbox", { name: "教学流程" }), "自己写的流程")
    await user.click(screen.getByRole("button", { name: "用 AI 起草教学流程" }))
    expect(screen.getByRole("dialog", { name: "用 AI 替换已写内容？" })).toBeInTheDocument()
    expect(generateDraft).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "继续编辑" }))
    expect(screen.getByRole("textbox", { name: "教学流程" })).toHaveValue("自己写的流程")
  })

  it("keeps a new plan separate from an existing plan and saves only on confirmation", async () => {
    const user = userEvent.setup()
    setup()
    const existing = within(screen.getByRole("complementary", { name: "我的教案" })).getAllByRole("button").find((button) => button.getAttribute("aria-current") === "true")
    expect(existing).toBeDefined()
    await user.click(existing!)
    const originalTitle = (screen.getByRole("textbox", { name: "教案标题" }) as HTMLInputElement).value
    await user.click(screen.getByRole("button", { name: "新建教案" }))
    expect(screen.getByRole("textbox", { name: "教案标题" })).toHaveValue("")
    await user.type(screen.getByRole("textbox", { name: "教案标题" }), "独立新教案")
    await user.type(screen.getByRole("textbox", { name: "课题" }), "分数加减法")
    await user.type(screen.getByRole("textbox", { name: "教学目标" }), "掌握同分母分数加减法")
    expect(screen.getByRole("complementary", { name: "我的教案" })).not.toHaveTextContent("独立新教案")
    await user.click(screen.getByRole("button", { name: "保存教案" }))
    expect(screen.getByRole("dialog", { name: "教案已保存" })).toBeInTheDocument()
    const list = screen.getByRole("complementary", { name: "我的教案" })
    expect(list).toHaveTextContent("独立新教案")
    expect(list).toHaveTextContent(originalTitle)
  })

  it("asks before discarding unsaved edits and before deleting a plan", async () => {
    const user = userEvent.setup()
    setup()
    const list = screen.getByRole("complementary", { name: "我的教案" })
    const existing = within(list).getAllByRole("button").find((button) => button.textContent?.includes("单位换算"))!
    await user.click(existing)
    await user.type(screen.getByRole("textbox", { name: "教案标题" }), "修改")
    await user.click(screen.getByRole("button", { name: "新建教案" }))
    expect(screen.getByRole("dialog", { name: "放弃未保存的修改？" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "继续编辑" }))
    expect(screen.getByRole("textbox", { name: "教案标题" })).toHaveValue("单位换算步骤补讲修改")
    await user.click(screen.getByRole("button", { name: "删除教案" }))
    expect(screen.getByRole("dialog", { name: "删除教案？" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "取消" }))
    expect(list).toHaveTextContent("单位换算")
    await user.click(screen.getByRole("button", { name: "删除教案" }))
    await user.click(screen.getByRole("button", { name: "确认删除" }))
    expect(screen.getByRole("button", { name: "撤销删除" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "撤销删除" }))
    expect(list).toHaveTextContent("单位换算")
  })
})
