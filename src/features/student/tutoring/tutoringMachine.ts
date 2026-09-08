import type { MistakeMastery, Subject } from "../../../app/prototype/types"

export type TutoringStep =
  | "upload"
  | "recognizing-image"
  | "confirm-ocr"
  | "ocr-failed"
  | "sticking-point"
  | "generating"
  | "generation-failed"
  | "hint"
  | "key-step"
  | "explanation"
  | "retell"
  | "transfer"
  | "save-mistake"
  | "complete"

export type StickingPoint = "no-idea" | "stuck-step" | "check-idea" | "check-answer"

export type TutoringImage = { fileName: string }

export type TutoringDraft = {
  hint: string
  keyStep: string
  explanation: string
  retellPrompt: string
  transferQuestion: string
  transferOptions: string[]
  transferAnswer: string
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
  questionText: string
  ocrError: string | null
  stickingPoint: StickingPoint | null
  attemptRequired: boolean
  attemptDescription: string
  draft: TutoringDraft | null
  retell: string
  transferAnswer: string
  mistake: MistakeDraft
  validationError: string | null
}

export type TutoringEvent =
  | { type: "SELECT_IMAGE"; fileName: string }
  | { type: "OCR_RECOGNIZED"; text: string }
  | { type: "OCR_FAILED"; message: string }
  | { type: "CONFIRM_OCR"; text: string }
  | { type: "CHOOSE_STICKING_POINT"; choice: StickingPoint }
  | { type: "SUBMIT_ATTEMPT"; text: string }
  | { type: "DRAFT_READY"; draft: TutoringDraft }
  | { type: "DRAFT_FAILED"; message: string }
  | { type: "RETRY_DRAFT" }
  | { type: "REQUEST_MORE_HINT" }
  | { type: "REQUEST_EXPLANATION" }
  | { type: "CONTINUE_TO_RETELL" }
  | { type: "SUBMIT_RETELL"; text: string }
  | { type: "COMPLETE_TRANSFER"; answer: string }
  | { type: "UPDATE_MISTAKE"; patch: Partial<MistakeDraft> }
  | { type: "SAVE_MISTAKE" }
  | { type: "RESET" }

export const initialTutoringState: TutoringState = {
  step: "upload",
  image: null,
  questionText: "",
  ocrError: null,
  stickingPoint: null,
  attemptRequired: false,
  attemptDescription: "",
  draft: null,
  retell: "",
  transferAnswer: "",
  mistake: {
    subject: "数学",
    knowledgePoint: "待补充",
    cause: "待学生补充",
    mastery: "learning",
    createdAt: "2026-08-11",
  },
  validationError: null,
}

export function tutoringReducer(state: TutoringState, event: TutoringEvent): TutoringState {
  switch (event.type) {
    case "SELECT_IMAGE":
      return {
        ...initialTutoringState,
        step: "recognizing-image",
        image: { fileName: event.fileName },
      }
    case "OCR_RECOGNIZED":
      return state.step === "recognizing-image"
        ? { ...state, step: "confirm-ocr", questionText: event.text, ocrError: null }
        : state
    case "OCR_FAILED":
      return state.step === "recognizing-image"
        ? { ...state, step: "ocr-failed", ocrError: event.message }
        : state
    case "CONFIRM_OCR": {
      const text = event.text.trim()
      return state.step !== "confirm-ocr"
        ? state
        : !text
          ? { ...state, validationError: "请先补全或重新拍摄题目。" }
          : { ...state, step: "sticking-point", questionText: text, validationError: null }
    }
    case "CHOOSE_STICKING_POINT":
      if (state.step !== "sticking-point") return state
      return event.choice === "stuck-step"
        ? { ...state, stickingPoint: event.choice, attemptRequired: true, validationError: null }
        : { ...state, stickingPoint: event.choice, attemptRequired: false, step: "generating", validationError: null }
    case "SUBMIT_ATTEMPT": {
      if (state.step !== "sticking-point" || !state.attemptRequired) return state
      const text = event.text.trim()
      return !text
        ? { ...state, validationError: "先写下你已经尝试到哪一步。" }
        : { ...state, step: "generating", attemptDescription: text, validationError: null }
    }
    case "DRAFT_READY":
      return state.step === "generating"
        ? { ...state, step: "hint", draft: event.draft, validationError: null }
        : state
    case "DRAFT_FAILED":
      return state.step === "generating"
        ? { ...state, step: "generation-failed", validationError: event.message }
        : state
    case "RETRY_DRAFT":
      return state.step === "generation-failed" ? { ...state, step: "generating", validationError: null } : state
    case "REQUEST_MORE_HINT":
      return state.step === "hint" ? { ...state, step: "key-step" } : state
    case "REQUEST_EXPLANATION":
      return state.step === "hint" || state.step === "key-step" ? { ...state, step: "explanation" } : state
    case "CONTINUE_TO_RETELL":
      return ["hint", "key-step", "explanation"].includes(state.step)
        ? { ...state, step: "retell", validationError: null }
        : state
    case "SUBMIT_RETELL": {
      if (state.step !== "retell") return state
      const text = event.text.trim()
      return !text
        ? { ...state, validationError: "先用自己的话复述这道题的关键方法。" }
        : { ...state, step: "transfer", retell: text, validationError: null }
    }
    case "COMPLETE_TRANSFER":
      return state.step === "transfer"
        ? { ...state, step: "save-mistake", transferAnswer: event.answer.trim(), validationError: null }
        : state
    case "UPDATE_MISTAKE":
      return state.step === "save-mistake"
        ? { ...state, mistake: { ...state.mistake, ...event.patch } }
        : state
    case "SAVE_MISTAKE":
      return state.step === "save-mistake" ? { ...state, step: "complete" } : state
    case "RESET":
      return initialTutoringState
  }
}
