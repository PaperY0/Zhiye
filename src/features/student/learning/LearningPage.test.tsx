import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  PrototypeProvider,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import { LearningPage } from "./LearningPage"

vi.mock("../../../services/localAi", () => ({
  generateDraft: vi.fn(),
}))

function MasteryProbe() {
  const { students } = usePrototype()
  const student = students.find((item) => item.id === "student-lin-xiaoyu")

  return <output aria-label="小雨当前掌握度">{student?.mistakes[0]?.mastery}</output>
}

function renderLearning() {
  return render(
    <PrototypeProvider>
      <LearningPage />
      <MasteryProbe />
    </PrototypeProvider>,
  )
}

describe("LearningPage", () => {
  beforeEach(() => {
    vi.mocked(generateDraft).mockReset()
  })

  it("sends the student question to local AI and renders its validated reply", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: {
        explanation: "先判断方向",
        example: "1 米等于 100 厘米",
        card: "大变小乘",
        followUp: "3 米是多少厘米？",
      },
    })
    renderLearning()

    await user.click(screen.getByRole("button", { name: "继续学习单位换算" }))
    await user.type(screen.getByRole("textbox", { name: "输入学习问题" }), "为什么要乘？")
    await user.click(screen.getByRole("button", { name: "发送问题" }))

    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("learning-reply", {
      topic: "单位换算",
      recap: "先判断单位方向，再根据进率决定乘或除。",
      question: "为什么要乘？",
    })
    const conversation = screen.getByRole("log", { name: "单位换算学习对话" })
    expect(within(conversation).getByText("为什么要乘？")).toBeInTheDocument()
    expect(await within(conversation).findByText("先判断方向")).toBeInTheDocument()
    expect(within(conversation).getByText("1 米等于 100 厘米")).toBeInTheDocument()
    expect(within(conversation).getByText("大变小乘")).toBeInTheDocument()
  })

  it("keeps a failed student question and retries without fixed answers", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft)
      .mockRejectedValueOnce(new Error("学习回复服务不可用"))
      .mockResolvedValueOnce({
        content: {
          explanation: "重试后生成的解释",
          example: "重试后的例子",
          card: "重试后的知识卡",
          followUp: "重试后的追问",
        },
      })
    renderLearning()

    await user.type(screen.getByRole("textbox", { name: "输入学习问题" }), "我该怎么换算？")
    await user.click(screen.getByRole("button", { name: "发送问题" }))

    const conversation = screen.getByRole("log", { name: "分数的基本性质学习对话" })
    expect(within(conversation).getByText("我该怎么换算？")).toBeInTheDocument()
    expect(await within(conversation).findByRole("alert")).toHaveTextContent("学习回复服务不可用")
    expect(within(conversation).getByRole("button", { name: "重试回答" })).toBeInTheDocument()
    expect(within(conversation).queryByText("同时、相同、非零")).not.toBeInTheDocument()

    await user.click(within(conversation).getByRole("button", { name: "重试回答" }))
    expect(await within(conversation).findByText("重试后生成的解释")).toBeInTheDocument()
    expect(vi.mocked(generateDraft)).toHaveBeenCalledTimes(2)
  })

  it("uses local AI for retell follow-up without changing mastery", async () => {
    const user = userEvent.setup()
    vi.mocked(generateDraft).mockResolvedValue({
      content: { followUp: "如果分母也乘 2，分数为什么不变？" },
    })
    renderLearning()

    const mastery = screen.getByLabelText("小雨当前掌握度").textContent
    await user.click(screen.getByRole("button", { name: "我来讲一遍" }))
    await user.type(
      screen.getByRole("textbox", { name: "用自己的话复述" }),
      "分子和分母要同时变化。",
    )
    await user.click(screen.getByRole("button", { name: "提交我的复述" }))

    expect(vi.mocked(generateDraft)).toHaveBeenCalledWith("retell-follow-up", {
      topic: "分数的基本性质",
      retell: "分子和分母要同时变化。",
    })
    expect(await screen.findByText("如果分母也乘 2，分数为什么不变？")).toBeInTheDocument()
    expect(screen.getByLabelText("小雨当前掌握度")).toHaveTextContent(mastery ?? "")
  })

  it("supports simulated voice input without collecting real audio", async () => {
    const user = userEvent.setup()
    renderLearning()

    expect(screen.getByText(/不会采集或上传真实音频/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "开始模拟语音输入" }))
    expect(screen.getByRole("button", { name: "结束模拟语音输入" })).toBeInTheDocument()
  })
})
