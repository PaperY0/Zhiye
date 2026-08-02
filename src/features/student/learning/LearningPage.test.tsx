import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { LearningPage } from "./LearningPage"

function renderLearning() {
  return render(
    <PrototypeProvider>
      <LearningPage />
    </PrototypeProvider>,
  )
}

describe("LearningPage", () => {
  it("opens topic history and returns a deterministic explanation, example, and knowledge card", async () => {
    const user = userEvent.setup()
    renderLearning()

    expect(
      screen.getByRole("heading", { name: "知识点学习" }),
    ).toBeInTheDocument()
    expect(screen.getByText("按知识点整理的学习历史")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "继续学习单位换算" }))
    expect(
      screen.getByRole("heading", { name: "单位换算" }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: "为什么换算时有时乘、有时除？",
      }),
    )

    const conversation = screen.getByRole("log", {
      name: "单位换算学习对话",
    })
    expect(
      within(conversation).getByText("为什么换算时有时乘、有时除？"),
    ).toBeInTheDocument()
    expect(within(conversation).getByText("先看方向")).toBeInTheDocument()
    expect(within(conversation).getByText("生活里的例子")).toBeInTheDocument()
    expect(within(conversation).getByText("知识卡")).toBeInTheDocument()
    expect(
      within(conversation).getByText(/大单位换成小单位/),
    ).toBeInTheDocument()
  })

  it("supports simulated voice input without collecting real audio", async () => {
    const user = userEvent.setup()
    renderLearning()

    expect(screen.getByText(/不会采集或上传真实音频/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "开始模拟语音输入" }))
    expect(
      screen.getByRole("button", { name: "结束模拟语音输入" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("正在模拟聆听")

    await user.click(screen.getByRole("button", { name: "结束模拟语音输入" }))
    expect(screen.getByRole("textbox", { name: "输入学习问题" })).toHaveValue(
      "我怎么判断分子和分母要怎样变化？",
    )

    await user.click(screen.getByRole("button", { name: "发送问题" }))
    expect(
      within(
        screen.getByRole("log", { name: "分数的基本性质学习对话" }),
      ).getByText("同时、相同、非零"),
    ).toBeInTheDocument()
  })

  it("accepts a self-explanation and asks a deterministic Feynman follow-up", async () => {
    const user = userEvent.setup()
    renderLearning()

    await user.click(screen.getByRole("button", { name: "我来讲一遍" }))
    await user.type(
      screen.getByRole("textbox", { name: "用自己的话复述" }),
      "分子和分母要同时乘同一个不为零的数，分数大小才不变。",
    )
    await user.click(screen.getByRole("button", { name: "提交我的复述" }))

    const conversation = screen.getByRole("log", {
      name: "分数的基本性质学习对话",
    })
    expect(
      within(conversation).getByText(
        "分子和分母要同时乘同一个不为零的数，分数大小才不变。",
      ),
    ).toBeInTheDocument()
    expect(within(conversation).getByText("费曼追问")).toBeInTheDocument()
    expect(
      within(conversation).getByText(/为什么不能只改变分子/),
    ).toBeInTheDocument()
  })
})
