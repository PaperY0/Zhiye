import { describe, expect, it } from "vitest"
import { initialTutoringState, tutoringReducer, type TutoringDraft, type TutoringEvent, type TutoringState } from "./tutoringMachine"

const draft: TutoringDraft = {
  hint: "先看数量关系。",
  keyStep: "把总数除以份数。",
  explanation: "平均分时，每份数量相同。",
  retellPrompt: "说说为什么要除以份数。",
  transferQuestion: "15 支笔分给 3 人，每人几支？",
  transferOptions: ["4 支", "5 支", "6 支"],
  transferAnswer: "5 支",
}

function reduce(events: TutoringEvent[]): TutoringState {
  return events.reduce(tutoringReducer, initialTutoringState)
}

describe("tutoringReducer", () => {
  it("does not advance to generation until recognized OCR text is confirmed", () => {
    const recognized = reduce([
      { type: "SELECT_IMAGE", fileName: "question.png" },
      { type: "OCR_RECOGNIZED", text: "12 个苹果平均分给 3 人" },
    ])

    expect(recognized.step).toBe("confirm-ocr")
    expect(recognized.questionText).toBe("12 个苹果平均分给 3 人")

    const confirmed = tutoringReducer(recognized, { type: "CONFIRM_OCR", text: recognized.questionText })
    expect(confirmed.step).toBe("sticking-point")
  })

  it("keeps low-confidence OCR in a retake state", () => {
    const recognizing = tutoringReducer(initialTutoringState, { type: "SELECT_IMAGE", fileName: "blurred.jpg" })
    const failed = tutoringReducer(recognizing, { type: "OCR_FAILED", message: "题目没有识别清楚，请补拍。" })

    expect(failed.step).toBe("ocr-failed")
    expect(failed.ocrError).toContain("补拍")
  })

  it("requires an attempt for a stuck-step request before generating", () => {
    const selected = reduce([
      { type: "SELECT_IMAGE", fileName: "work.jpg" },
      { type: "OCR_RECOGNIZED", text: "平均分问题" },
      { type: "CONFIRM_OCR", text: "平均分问题" },
      { type: "CHOOSE_STICKING_POINT", choice: "stuck-step" },
    ])
    expect(selected.step).toBe("sticking-point")
    expect(selected.attemptRequired).toBe(true)

    const empty = tutoringReducer(selected, { type: "SUBMIT_ATTEMPT", text: "   " })
    expect(empty.step).toBe("sticking-point")
    expect(empty.validationError).toBe("先写下你已经尝试到哪一步。")

    const submitted = tutoringReducer(empty, { type: "SUBMIT_ATTEMPT", text: "我不知道该除以几。" })
    expect(submitted.step).toBe("generating")
    expect(submitted.attemptDescription).toContain("除以")
  })

  it("keeps failed generation retryable and only enters layered help with a valid draft", () => {
    const generating = reduce([
      { type: "SELECT_IMAGE", fileName: "work.jpg" },
      { type: "OCR_RECOGNIZED", text: "平均分问题" },
      { type: "CONFIRM_OCR", text: "平均分问题" },
      { type: "CHOOSE_STICKING_POINT", choice: "no-idea" },
    ])
    const failed = tutoringReducer(generating, { type: "DRAFT_FAILED", message: "生成失败" })
    expect(failed.step).toBe("generation-failed")

    const retrying = tutoringReducer(failed, { type: "RETRY_DRAFT" })
    const ready = tutoringReducer(retrying, { type: "DRAFT_READY", draft })
    expect(ready.step).toBe("hint")
    expect(ready.draft?.transferAnswer).toBe("5 支")
  })
})
