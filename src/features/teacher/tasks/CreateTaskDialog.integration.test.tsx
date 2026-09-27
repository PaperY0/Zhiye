import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { lessonFixtures, planFixtures, studentFixtures } from "../../../app/prototype/fixtures"
import { generateDraft } from "../../../services/localAi"
import { CreateTaskDialog } from "./CreateTaskDialog"

vi.mock("../../../services/localAi", () => ({ generateDraft: vi.fn() }))

describe("CreateTaskDialog teaching flow", () => {
  beforeEach(() => { localStorage.clear(); vi.mocked(generateDraft).mockReset() })

  it("brings a saved plan into the task and lets AI complete an editable draft", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const plan = planFixtures[0]
    vi.mocked(generateDraft).mockResolvedValue({ content: { title: "巩固任务", objective: "解释分数", successCriteria: "完成两道题", content: "先画图，再解释", supportNote: "需要时看示例" } })
    render(<CreateTaskDialog open students={studentFixtures} plans={[plan]} initialPlanId={plan.id} taskCount={0} onClose={() => {}} onCreate={onCreate} />)
    const dialog = screen.getByRole("dialog", { name: "新建任务" })
    expect(within(dialog).getByRole("combobox", { name: "关联教案" })).toHaveValue(plan.id)
    await user.click(within(dialog).getByRole("button", { name: "用 AI 补全任务草稿" }))
    expect(await within(dialog).findByRole("textbox", { name: "任务内容" })).toHaveValue("先画图，再解释")
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("task-draft", expect.objectContaining({ sourcePlan: expect.stringContaining(plan.chapter) }))
    await user.click(within(dialog).getByRole("button", { name: "保存并预览" }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ sourcePlanId: plan.id, title: "巩固任务", status: "draft" }), undefined)
  })

  it("creates three editable questions from classroom content and saves them with the task", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const lesson = lessonFixtures[0]
    vi.mocked(generateDraft).mockResolvedValue({ content: { title: "课堂自检", questions: [
      { prompt: "第一题", options: ["正确", "错误"], answer: "正确" },
      { prompt: "第二题", options: ["正确", "错误"], answer: "错误" },
      { prompt: "第三题", options: ["正确", "错误"], answer: "正确" },
    ] } })
    render(<CreateTaskDialog open students={studentFixtures} lessons={[lesson]} initialLessonId={lesson.id} taskCount={0} onClose={() => {}} onCreate={onCreate} />)
    const dialog = screen.getByRole("dialog", { name: "新建任务" })
    expect(await within(dialog).findByDisplayValue("第一题")).toBeInTheDocument()
    expect(within(dialog).getAllByRole("group", { name: /第 .* 题/ })).toHaveLength(3)
    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("quiz", expect.objectContaining({ focus: expect.stringContaining(lesson.transcript[0].body) }))
    await user.click(within(dialog).getByRole("button", { name: "保存并预览" }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ sourceLessonId: lesson.id, sourceQuizId: expect.any(String), audience: expect.objectContaining({ label: lesson.className }) }), expect.objectContaining({ questions: expect.arrayContaining([expect.objectContaining({ prompt: "第一题" })]) }))
    expect(onCreate.mock.calls[0][1].questions).toHaveLength(3)
  })

  it("keeps the draft stable when a classroom is detached or replaced by a plan", async () => {
    const user = userEvent.setup()
    const lesson = lessonFixtures[0]
    const plan = planFixtures[0]
    let resolveQuiz!: (value: unknown) => void
    vi.mocked(generateDraft).mockImplementation(() => new Promise((resolve) => { resolveQuiz = resolve }))
    render(<CreateTaskDialog open students={studentFixtures} lessons={[lesson]} plans={[plan]} taskCount={0} onClose={() => {}} onCreate={vi.fn()} />)
    const dialog = screen.getByRole("dialog", { name: "新建任务" })
    const classroom = within(dialog).getByRole("combobox", { name: "关联课堂" })
    const planSelect = within(dialog).getByRole("combobox", { name: "关联教案" })

    await user.selectOptions(classroom, lesson.id)
    expect(within(dialog).getByRole("combobox", { name: "任务形式" })).toHaveValue("quiz")
    expect(within(dialog).getByRole("textbox", { name: "任务标题" })).toHaveValue(`${lesson.title} · 课堂三题自检`)
    expect(within(dialog).getByRole("radio", { name: new RegExp(lesson.className) })).toBeChecked()

    await user.selectOptions(classroom, "")
    expect(within(dialog).getByRole("combobox", { name: "任务形式" })).toHaveValue("quiz")
    expect(within(dialog).getByRole("textbox", { name: "任务标题" })).toHaveValue(`${lesson.title} · 课堂三题自检`)
    expect(within(dialog).getAllByRole("group", { name: /第 .* 题/ })).toHaveLength(3)

    await user.selectOptions(planSelect, plan.id)
    expect(classroom).toHaveValue("")
    expect(within(dialog).getByRole("combobox", { name: "任务形式" })).toHaveValue("reading")
    expect(within(dialog).getByRole("textbox", { name: "学习目标" })).toHaveValue(plan.objective)
    await act(async () => resolveQuiz({ content: { title: "过期题组", questions: [] } }))
    expect(within(dialog).queryByText("过期题组")).not.toBeInTheDocument()
    expect(within(dialog).getByRole("combobox", { name: "任务形式" })).toHaveValue("reading")
  })

  it("does not let a stale AI draft overwrite a newly selected classroom", async () => {
    const user = userEvent.setup()
    const lesson = lessonFixtures[0]
    const resolveRequests: Array<(value: unknown) => void> = []
    vi.mocked(generateDraft).mockImplementation(() => new Promise((resolve) => { resolveRequests.push(resolve) }))
    render(<CreateTaskDialog open students={studentFixtures} lessons={[lesson]} taskCount={0} onClose={() => {}} onCreate={vi.fn()} />)
    const dialog = screen.getByRole("dialog", { name: "新建任务" })
    await user.type(within(dialog).getByRole("textbox", { name: "任务标题" }), "手写草稿")
    await user.type(within(dialog).getByRole("textbox", { name: "学习目标" }), "明确知识点")
    await user.click(within(dialog).getByRole("button", { name: "用 AI 补全任务草稿" }))
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "关联课堂" }), lesson.id)
    await act(async () => resolveRequests[0]({ content: { title: "过期草稿", objective: "过期目标", successCriteria: "过期标准", content: "过期说明" } }))
    expect(within(dialog).getByRole("textbox", { name: "任务标题" })).toHaveValue(`${lesson.title} · 课堂三题自检`)
    expect(within(dialog).getByRole("textbox", { name: "学习目标" })).toHaveValue(`检查学生对“${lesson.title}”的理解`)
  })
})
