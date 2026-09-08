import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { generateDraft, recognizeQuestionImage } from "../../../services/localAi"
import { TutoringPage } from "./TutoringPage"

vi.mock("../../../services/localAi", () => ({
  generateDraft: vi.fn(),
  recognizeQuestionImage: vi.fn(),
}))

const validDraft = {
  hint: "先找出题目中已知的数量关系。",
  keyStep: "把等式两边同时除以 3。",
  explanation: "这样能先得到每一份的数量。",
  retellPrompt: "请用自己的话说说为什么要先除以 3。",
  transferQuestion: "另一组有 12 个苹果，平均分给 3 人，每人几个？",
  transferOptions: ["3 个", "4 个", "5 个"],
  transferAnswer: "4 个",
}

function renderPage() {
  return render(
    <PrototypeProvider>
      <TutoringPage />
    </PrototypeProvider>,
  )
}

async function uploadQuestion(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(
    screen.getByLabelText("选择题目图片"),
    new File(["image"], "question.png", { type: "image/png" }),
  )
}

async function confirmAndRequestHelp(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "确认题目，继续" }))
  await user.click(screen.getByRole("button", { name: "完全没思路" }))
}

describe("TutoringPage OCR and local AI flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(recognizeQuestionImage).mockResolvedValue({
      recognizedText: "一组有 12 个苹果，平均分给 3 人，每人几个？",
      ocrConfidence: 0.92,
      needsConfirmation: true,
    })
  })

  it("requires confirmation of editable OCR text before invoking AI", async () => {
    const user = userEvent.setup()
    renderPage()

    await uploadQuestion(user)

    expect(
      await screen.findByDisplayValue("一组有 12 个苹果，平均分给 3 人，每人几个？"),
    ).toBeInTheDocument()
    expect(generateDraft).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "完全没思路" })).not.toBeInTheDocument()
  })

  it("guides students to retake when OCR is empty or low confidence without invoking AI", async () => {
    vi.mocked(recognizeQuestionImage).mockResolvedValue({
      recognizedText: "",
      ocrConfidence: 0.31,
      needsConfirmation: true,
      retryMessage: "题目没有识别清楚，请补拍。",
    })
    const user = userEvent.setup()
    renderPage()

    await uploadQuestion(user)

    expect(await screen.findByText("题目没有识别清楚，请补拍。")).toBeInTheDocument()
    expect(generateDraft).not.toHaveBeenCalled()
  })

  it("guides students to retake OCR text below the documented 0.65 threshold", async () => {
    vi.mocked(recognizeQuestionImage).mockResolvedValue({
      recognizedText: "比较 2/3 和 3/5 的大小",
      ocrConfidence: 0.64,
      needsConfirmation: true,
      retryMessage: "题目文字不清晰，请重新拍摄。",
    })
    const user = userEvent.setup()
    renderPage()

    await uploadQuestion(user)

    expect(await screen.findByText("题目文字不清晰，请重新拍摄。")).toBeInTheDocument()
    expect(screen.queryByLabelText("识别文本")).not.toBeInTheDocument()
    expect(generateDraft).not.toHaveBeenCalled()
  })

  it("renders a successful layered tutoring response from local AI", async () => {
    vi.mocked(generateDraft).mockResolvedValue(validDraft)
    const user = userEvent.setup()
    renderPage()

    await uploadQuestion(user)
    await confirmAndRequestHelp(user)

    expect(await screen.findByText(validDraft.hint)).toBeInTheDocument()
    expect(generateDraft).toHaveBeenCalledWith("tutoring", {
      questionText: "一组有 12 个苹果，平均分给 3 人，每人几个？",
      stickingPoint: "no-idea",
      attempt: "",
    })
  })

  it("keeps the tutoring flow out of layered help when the AI response is invalid", async () => {
    vi.mocked(generateDraft).mockResolvedValue({
      hint: "缺少其余字段的无效响应",
    })
    const user = userEvent.setup()
    renderPage()

    await uploadQuestion(user)
    await confirmAndRequestHelp(user)

    expect(await screen.findByRole("button", { name: "重试生成提示" })).toBeInTheDocument()
    expect(screen.queryByText("比较 2/3 和 3/5 的大小")).not.toBeInTheDocument()
  })

  it("offers retry after a generation failure and recovers with the retried response", async () => {
    vi.mocked(generateDraft)
      .mockRejectedValueOnce(new Error("本地 AI 暂时不可用"))
      .mockResolvedValueOnce(validDraft)
    const user = userEvent.setup()
    renderPage()

    await uploadQuestion(user)
    await confirmAndRequestHelp(user)
    await user.click(await screen.findByRole("button", { name: "重试生成提示" }))

    expect(await screen.findByText(validDraft.hint)).toBeInTheDocument()
    expect(generateDraft).toHaveBeenCalledTimes(2)
  })
})
