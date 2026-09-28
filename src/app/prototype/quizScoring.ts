import type { Quiz, QuizQuestion } from "./types"

export function isObjectiveQuestion(question: QuizQuestion) {
  return question.type !== "short-answer"
}

export function isCorrectAnswer(question: QuizQuestion, response: string | undefined) {
  if (!isObjectiveQuestion(question) || !response?.trim()) return false
  const expected = Array.isArray(question.answer) ? question.answer : question.answer.split("、")
  const selected = response.split("、")
  const normalize = (items: string[]) => items.map((item) => item.trim()).filter(Boolean).sort().join("、")
  return normalize(selected) === normalize(expected)
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, string>) {
  return quiz.questions.reduce((total, question) =>
    total + (isCorrectAnswer(question, answers[question.id]) ? question.score : 0), 0)
}
