import { useState } from "react"
import { ClipboardList, Trash2 } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import LessonPlanBuilder from "./LessonPlanBuilder"
import QuizBuilder from "./QuizBuilder"

type PlanningMode = "plan" | "quiz"

export function PlanningPage() {
  const { deletePlan, deleteQuiz, plans, quizzes, updatePlanTitle, updateQuizTitle } = usePrototype()
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
      <GlassSurface aria-label="已保存的备课内容" className="mt-6 p-5 sm:p-6" weight="light">
        <div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-black tracking-[.12em] text-[#66806b]"><ClipboardList aria-hidden="true" size={16} />内容资料库</p><h2 className="mt-2 text-xl font-black">已保存的教案与测验</h2></div><span className="text-sm font-bold text-[#708078]">{plans.length + quizzes.length} 项</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plans.map((plan) => <article className="rounded-[20px] border border-white/80 bg-white/60 p-4" key={plan.id}><p className="text-xs font-black text-[#66806b]">教案 · {plan.status}</p><div className="mt-2 flex items-center gap-2"><input aria-label={`编辑教案${plan.title}`} className="min-h-10 min-w-0 flex-1 rounded-xl border border-[#dce7da] bg-white/80 px-3 font-black" onChange={(event) => updatePlanTitle(plan.id, event.target.value)} value={plan.title} /><button aria-label={`删除教案${plan.title}`} className="grid size-10 place-items-center rounded-full bg-[#fff4f1] text-[#934f43]" onClick={() => { if (window.confirm(`确认删除教案“${plan.title}”吗？`)) deletePlan(plan.id) }} type="button"><Trash2 aria-hidden="true" size={16} /></button></div><p className="mt-2 text-xs text-[#718076]">{plan.subject} · {plan.chapter}</p></article>)}
          {quizzes.map((quiz) => <article className="rounded-[20px] border border-white/80 bg-white/60 p-4" key={quiz.id}><p className="text-xs font-black text-[#66806b]">测验 · {quiz.status}</p><div className="mt-2 flex items-center gap-2"><input aria-label={`编辑测验${quiz.title}`} className="min-h-10 min-w-0 flex-1 rounded-xl border border-[#dce7da] bg-white/80 px-3 font-black" onChange={(event) => updateQuizTitle(quiz.id, event.target.value)} value={quiz.title} /><button aria-label={`删除测验${quiz.title}`} className="grid size-10 place-items-center rounded-full bg-[#fff4f1] text-[#934f43]" onClick={() => { if (window.confirm(`确认删除测验“${quiz.title}”吗？`)) deleteQuiz(quiz.id) }} type="button"><Trash2 aria-hidden="true" size={16} /></button></div><p className="mt-2 text-xs text-[#718076]">{quiz.subject} · {quiz.questions.length} 题</p></article>)}
        </div>
      </GlassSurface>
    </section>
  )
}

export default PlanningPage
