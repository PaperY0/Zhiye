import { useState } from "react"
import LessonPlanBuilder from "./LessonPlanBuilder"
import QuizBuilder from "./QuizBuilder"

type PlanningMode = "plan" | "quiz"

export function PlanningPage() {
  const [mode, setMode] = useState<PlanningMode>("plan")

  return (
    <section className="min-h-full p-4 text-[#17251b] sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-[#66806b]">
            TEACHER STUDIO
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            备课与测验
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-[#718076]">
            从教材、生活情境和课堂证据出发，快速生成可编辑的教案与三题自检。
          </p>
        </div>
        <div
          aria-label="备课模式"
          role="tablist"
          className="flex rounded-full border border-white/80 bg-white/55 p-1 shadow-sm backdrop-blur-xl"
        >
          <button
            aria-selected={mode === "plan"}
            className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
              mode === "plan"
                ? "bg-[#183021] text-white shadow-md"
                : "text-[#506556]"
            }`}
            role="tab"
            type="button"
            onClick={() => setMode("plan")}
          >
            教案生成
          </button>
          <button
            aria-selected={mode === "quiz"}
            className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
              mode === "quiz"
                ? "bg-[#183021] text-white shadow-md"
                : "text-[#506556]"
            }`}
            role="tab"
            type="button"
            onClick={() => setMode("quiz")}
          >
            三题测验
          </button>
        </div>
      </header>
      {mode === "plan" ? <LessonPlanBuilder /> : <QuizBuilder />}
    </section>
  )
}

export default PlanningPage
