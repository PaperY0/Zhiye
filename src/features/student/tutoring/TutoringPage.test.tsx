import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  PrototypeProvider,
  usePrototype,
} from "../../../app/prototype/PrototypeContext"
import { TutoringPage } from "./TutoringPage"

function renderPage() {
  return render(
    <PrototypeProvider>
      <TutoringPage />
    </PrototypeProvider>,
  )
}

describe("TutoringPage entry flow", () => {
  it("selects and replaces a simulated problem image", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      screen.getByRole("heading", { name: "拍照答疑" }),
    ).toBeInTheDocument()
    expect(screen.getByText("原型演示，不会上传真实图片")).toBeInTheDocument()

    await user.upload(
      screen.getByLabelText("选择一道清晰的题目图片"),
      new File(["first"], "first-question.png", { type: "image/png" }),
    )

    expect(screen.getByText("first-question.png")).toBeInTheDocument()
    expect(
      screen.getByText("代表题目：比较 2/3 和 3/5 的大小"),
    ).toBeInTheDocument()

    await user.upload(
      screen.getByLabelText("替换题目图片"),
      new File(["second"], "replacement.jpg", { type: "image/jpeg" }),
    )

    expect(screen.getByText("replacement.jpg")).toBeInTheDocument()
    expect(screen.queryByText("first-question.png")).not.toBeInTheDocument()
  })

  it("offers all four sticking-point choices with large controls", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.upload(
      screen.getByLabelText("选择一道清晰的题目图片"),
      new File(["question"], "fraction.png", { type: "image/png" }),
    )

    for (const choice of [
      "完全没思路",
      "卡在某一步",
      "想核对思路",
      "已做完想检查",
    ]) {
      expect(screen.getByRole("button", { name: choice })).toHaveClass(
        "min-h-16",
      )
    }
  })

  it("shows the unclear-photo and describe-your-attempt branches", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getByRole("button", { name: "模拟一张不清晰的照片" }),
    )
    expect(
      screen.getByRole("heading", { name: "这张照片有点看不清" }),
    ).toBeInTheDocument()

    await user.upload(
      screen.getByLabelText("重新选择清晰图片"),
      new File(["clear"], "clear-fraction.png", { type: "image/png" }),
    )
    await user.click(screen.getByRole("button", { name: "卡在某一步" }))

    expect(screen.getByLabelText("描述你已经尝试到哪一步")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "继续确认题目" }))
    expect(screen.getByText("先写下你已经尝试到哪一步。")).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("描述你已经尝试到哪一步"),
      "我尝试通分，但不确定公分母。",
    )
    await user.click(screen.getByRole("button", { name: "继续确认题目" }))

    expect(
      screen.getByRole("heading", { name: "先确认我们读到的题目" }),
    ).toBeInTheDocument()
  })

  it("completes layered help, requires a retell, solves a transfer, and saves an editable mistake", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.upload(
      screen.getByLabelText("选择一道清晰的题目图片"),
      new File(["question"], "fraction-work.png", { type: "image/png" }),
    )
    await user.click(screen.getByRole("button", { name: "卡在某一步" }))
    await user.type(
      screen.getByLabelText("描述你已经尝试到哪一步"),
      "我知道要通分，但不知道下一步。",
    )
    await user.click(screen.getByRole("button", { name: "继续确认题目" }))
    await user.click(screen.getByRole("button", { name: "题目正确，开始提示" }))

    expect(
      screen.getByRole("heading", { name: "提示 1：先看条件" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "再给我一点提示" }))
    expect(
      screen.getByRole("heading", { name: "关键步骤" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "我想看完整讲解" }))
    expect(
      screen.getByRole("heading", { name: "完整讲解" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "我来复述" }))

    await user.click(screen.getByRole("button", { name: "提交复述并做迁移题" }))
    expect(
      screen.getByText("先用自己的话复述这道题的关键方法。"),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("用自己的话复述解题方法"),
      "先找公分母，把两个分数通分，再比较分子。",
    )
    await user.click(screen.getByRole("button", { name: "提交复述并做迁移题" }))

    expect(
      screen.getByRole("heading", { name: "换一道题试试" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "3/4 更大" }))
    await user.click(screen.getByRole("button", { name: "检查迁移题" }))

    expect(
      screen.getByRole("heading", { name: "整理进错题本" }),
    ).toBeInTheDocument()
    await user.clear(screen.getByLabelText("知识点"))
    await user.type(screen.getByLabelText("知识点"), "异分母分数比较")
    await user.clear(screen.getByLabelText("错因"))
    await user.type(screen.getByLabelText("错因"), "没有先找到公分母")
    await user.selectOptions(screen.getByLabelText("掌握状态"), "basic")
    await user.click(screen.getByRole("button", { name: "保存到错题本" }))

    expect(
      screen.getByRole("heading", { name: "已经保存到错题本" }),
    ).toBeInTheDocument()
    expect(screen.getByText("异分母分数比较")).toBeInTheDocument()
    expect(screen.getByText("没有先找到公分母")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "查看我的错题本" }),
    ).toHaveAttribute("href", "#/student/mistakes")
  })

  it("writes the saved tutoring mistake into the shared student state", async () => {
    function MistakeCount() {
      const { students } = usePrototype()
      const student = students.find((item) => item.id === "student-lin-xiaoyu")
      return (
        <output aria-label="林晓雨错题数量">
          {student?.mistakes.length ?? 0}
        </output>
      )
    }

    const user = userEvent.setup()
    render(
      <PrototypeProvider>
        <TutoringPage />
        <MistakeCount />
      </PrototypeProvider>,
    )
    const before = Number(screen.getByLabelText("林晓雨错题数量").textContent)

    await user.upload(
      screen.getByLabelText("选择一道清晰的题目图片"),
      new File(["question"], "fraction.png", { type: "image/png" }),
    )
    await user.click(screen.getByRole("button", { name: "完全没思路" }))
    await user.click(screen.getByRole("button", { name: "题目正确，开始提示" }))
    await user.click(screen.getByRole("button", { name: "我来复述" }))
    await user.type(
      screen.getByLabelText("用自己的话复述解题方法"),
      "统一分母以后比较分子。",
    )
    await user.click(screen.getByRole("button", { name: "提交复述并做迁移题" }))
    await user.click(screen.getByRole("radio", { name: "3/4 更大" }))
    await user.click(screen.getByRole("button", { name: "检查迁移题" }))
    await user.click(screen.getByRole("button", { name: "保存到错题本" }))

    expect(screen.getByLabelText("林晓雨错题数量")).toHaveTextContent(
      String(before + 1),
    )
  })
})
