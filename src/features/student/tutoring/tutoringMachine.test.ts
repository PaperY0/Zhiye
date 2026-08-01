import { describe, expect, it } from "vitest"
import {
  initialTutoringState,
  tutoringReducer,
  type TutoringEvent,
  type TutoringState,
} from "./tutoringMachine"

function reduce(events: TutoringEvent[]): TutoringState {
  return events.reduce(tutoringReducer, initialTutoringState)
}

describe("tutoringReducer", () => {
  it("follows the main layered-help path to completion", () => {
    const state = reduce([
      {
        type: "SELECT_IMAGE",
        fileName: "fraction-question.png",
        quality: "clear",
      },
      { type: "CHOOSE_STICKING_POINT", choice: "no-idea" },
      { type: "CONFIRM_PROBLEM" },
      { type: "REQUEST_MORE_HINT" },
      { type: "REQUEST_EXPLANATION" },
      { type: "CONTINUE_TO_RETELL" },
      { type: "SUBMIT_RETELL", text: "先把两个分数化成同分母，再比较分子。" },
      { type: "COMPLETE_TRANSFER", answer: "3/4 更大" },
      { type: "UPDATE_MISTAKE", patch: { cause: "没有先统一分母" } },
      { type: "SAVE_MISTAKE" },
    ])

    expect(state.step).toBe("complete")
    expect(state.retell).toContain("同分母")
    expect(state.mistake.cause).toBe("没有先统一分母")
  })

  it("branches to a clearer-photo request and accepts a replacement", () => {
    const unclear = tutoringReducer(initialTutoringState, {
      type: "SELECT_IMAGE",
      fileName: "blurred.jpg",
      quality: "unclear",
    })

    expect(unclear.step).toBe("needs-clearer-photo")
    expect(unclear.image?.fileName).toBe("blurred.jpg")

    const replaced = tutoringReducer(unclear, {
      type: "REPLACE_IMAGE",
      fileName: "clear.jpg",
      quality: "clear",
    })

    expect(replaced.step).toBe("sticking-point")
    expect(replaced.image?.fileName).toBe("clear.jpg")
  })

  it("requires students who are stuck at a step to describe what they tried", () => {
    const selected = reduce([
      { type: "SELECT_IMAGE", fileName: "work.jpg", quality: "clear" },
      { type: "CHOOSE_STICKING_POINT", choice: "stuck-step" },
    ])

    expect(selected.step).toBe("sticking-point")
    expect(selected.attemptRequired).toBe(true)

    const empty = tutoringReducer(selected, {
      type: "SUBMIT_ATTEMPT",
      text: "   ",
    })
    expect(empty.step).toBe("sticking-point")
    expect(empty.validationError).toBe("先写下你已经尝试到哪一步。")

    const described = tutoringReducer(empty, {
      type: "SUBMIT_ATTEMPT",
      text: "我先通分了，但不知道分母应该用几。",
    })
    expect(described.step).toBe("confirm-problem")
    expect(described.attemptDescription).toContain("先通分")
  })

  it("retains the current state for invalid events and rejects an empty retell", () => {
    const invalid = tutoringReducer(initialTutoringState, {
      type: "CONFIRM_PROBLEM",
    })
    expect(invalid).toBe(initialTutoringState)

    const retell = reduce([
      { type: "SELECT_IMAGE", fileName: "work.jpg", quality: "clear" },
      { type: "CHOOSE_STICKING_POINT", choice: "no-idea" },
      { type: "CONFIRM_PROBLEM" },
      { type: "CONTINUE_TO_RETELL" },
    ])
    const empty = tutoringReducer(retell, { type: "SUBMIT_RETELL", text: "" })

    expect(empty.step).toBe("retell")
    expect(empty.validationError).toBe("先用自己的话复述这道题的关键方法。")
  })
})
