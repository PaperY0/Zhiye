import type { MistakeMastery, Subject } from "../../../app/prototype/types"

export type TutoringStep = "upload" | "sticking-point" | "confirm-problem" | "hint" | "key-step" | "explanation" | "retell" | "transfer" | "save-mistake" | "complete" | "needs-clearer-photo"

export type StickingPoint = "no-idea" | "stuck-step" | "check-idea" | "check-answer"
export type ImageQuality = "clear" | "unclear"

export type TutoringImage = {
  fileName: string
  quality: ImageQuality
}

export type MistakeDraft = {
  subject: Subject
  knowledgePoint: string
  cause: string
  mastery: MistakeMastery
  createdAt: string
}

export type TutoringState = {
  step: TutoringStep
  image: TutoringImage | null
  stickingPoint: StickingPoint | null
  attemptRequired: boolean
  attemptDescription: string
  retell: string
  transferAnswer: string
  mistake: MistakeDraft
  validationError: string | null
}

type SelectImageEvent = {
  type: "SELECT_IMAGE"
  fileName: string
  quality: ImageQuality
}

type ReplaceImageEvent = {
  type: "REPLACE_IMAGE"
  fileName: string
  quality: ImageQuality
}

type ChooseStickingPointEvent = {
  type: "CHOOSE_STICKING_POINT"
  choice: StickingPoint
}

type SubmitAttemptEvent = {
  type: "SUBMIT_ATTEMPT"
  text: string
}

type SubmitRetellEvent = {
  type: "SUBMIT_RETELL"
  text: string
}

type CompleteTransferEvent = {
  type: "COMPLETE_TRANSFER"
  answer: string
}

type UpdateMistakeEvent = {
  type: "UPDATE_MISTAKE"
  patch: Partial<MistakeDraft>
}

export type TutoringEvent = SelectImageEvent | ReplaceImageEvent | ChooseStickingPointEvent | SubmitAttemptEvent | {
  type: "CONFIRM_PROBLEM"
} | { type: "REQUEST_MORE_HINT" } | { type: "REQUEST_EXPLANATION" } | {
  type: "CONTINUE_TO_RETELL"
} | SubmitRetellEvent | CompleteTransferEvent | UpdateMistakeEvent | {
  type: "SAVE_MISTAKE"
} | { type: "RESET" }

export const initialTutoringState: TutoringState = {
  step: "upload",
  image: null,
  stickingPoint: null,
  attemptRequired: false,
  attemptDescription: "",
  retell: "",
  transferAnswer: "",
  mistake: {
    subject: "数学",
    knowledgePoint: "分数大小比较",
    cause: "没有先找到合适的公分母",
    mastery: "learning",
    createdAt: "2026-07-25",
  },
  validationError: null,
}

function imageSelected(
  state: TutoringState,
  event: SelectImageEvent | ReplaceImageEvent,
): TutoringState {
  return {
    ...state,
    step: event.quality === "clear" ? "sticking-point" : "needs-clearer-photo",
    image: { fileName: event.fileName, quality: event.quality },
    stickingPoint: null,
    attemptRequired: false,
    attemptDescription: "",
    validationError: null,
  }
}

export function tutoringReducer(
  state: TutoringState,
  event: TutoringEvent,
): TutoringState {
  switch (event.type) {
    case "SELECT_IMAGE":
      return state.step === "upload" ? imageSelected(state, event) : state

    case "REPLACE_IMAGE":
      return state.step === "needs-clearer-photo" ||
        state.step === "sticking-point"
        ? imageSelected(state, event)
        : state

    case "CHOOSE_STICKING_POINT":
      if (state.step !== "sticking-point") return state
      if (event.choice === "stuck-step") {
        return {
          ...state,
          stickingPoint: event.choice,
          attemptRequired: true,
          validationError: null,
        }
      }
      return {
        ...state,
        step: "confirm-problem",
        stickingPoint: event.choice,
        attemptRequired: false,
        validationError: null,
      }

    case "SUBMIT_ATTEMPT": {
      if (state.step !== "sticking-point" || !state.attemptRequired)
        return state
      const text = event.text.trim()
      if (!text) {
        return { ...state, validationError: "先写下你已经尝试到哪一步。" }
      }
      return {
        ...state,
        step: "confirm-problem",
        attemptDescription: text,
        validationError: null,
      }
    }

    case "CONFIRM_PROBLEM":
      return state.step === "confirm-problem"
        ? { ...state, step: "hint", validationError: null }
        : state

    case "REQUEST_MORE_HINT":
      return state.step === "hint" ? { ...state, step: "key-step" } : state

    case "REQUEST_EXPLANATION":
      return state.step === "hint" || state.step === "key-step"
        ? { ...state, step: "explanation" }
        : state

    case "CONTINUE_TO_RETELL":
      return state.step === "hint" ||
        state.step === "key-step" ||
        state.step === "explanation"
        ? { ...state, step: "retell", validationError: null }
        : state

    case "SUBMIT_RETELL": {
      if (state.step !== "retell") return state
      const text = event.text.trim()
      if (!text) {
        return {
          ...state,
          validationError: "先用自己的话复述这道题的关键方法。",
        }
      }
      return { ...state, step: "transfer", retell: text, validationError: null }
    }

    case "COMPLETE_TRANSFER":
      return state.step === "transfer"
        ? {
            ...state,
            step: "save-mistake",
            transferAnswer: event.answer.trim(),
            validationError: null,
          }
        : state

    case "UPDATE_MISTAKE":
      return state.step === "save-mistake"
        ? { ...state, mistake: { ...state.mistake, ...event.patch } }
        : state

    case "SAVE_MISTAKE":
      return state.step === "save-mistake"
        ? { ...state, step: "complete" }
        : state

    case "RESET":
      return initialTutoringState
  }
}
