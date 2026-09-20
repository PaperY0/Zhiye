import { useMemo, useState } from "react"

import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  CalendarRange,
  ChartNoAxesCombined,
  Lightbulb,
  Sparkles,
  UsersRound,
} from "lucide-react"

import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import { aggregateTaskFeedback } from "../../../services/learningFeedback"

import type { KnowledgeSignal, Subject } from "../../../app/prototype/types"

import { Drawer } from "../../../components/shared/Drawer"

import { EmptyState } from "../../../components/shared/EmptyState"

import { FilterBar } from "../../../components/shared/FilterBar"

import { GlassSurface } from "../../../components/shared/GlassSurface"

import {
  StatusChip,
  type StatusTone,
} from "../../../components/shared/StatusChip"

import { KnowledgeHeatmap, getSignalAxis } from "./KnowledgeHeatmap"
import { toQuiz, toRemedialPlanDraft } from "../planning/generators"

type TimeRange = "today" | "week" | "month"

type SubjectFilter = "all" | Subject

const severityMeta: Record<KnowledgeSignal["severity"], {
  label: string
  tone: StatusTone
}> = {
  watch: { label: "持续观察", tone: "info" },

  attention: { label: "需要关注", tone: "warning" },

  priority: { label: "优先处理", tone: "critical" },
}

function matchesTime(signal: KnowledgeSignal, range: TimeRange, referenceDate: string) {
  if (range === "today") return signal.observedAt.startsWith(referenceDate)

  return true
}

function metricTrend(signals: KnowledgeSignal[]) {
  if (signals.length === 0) return 0

  return signals.reduce((total, signal) => {
    const first = signal.trend.at(0) ?? 0

    const last = signal.trend.at(-1) ?? first

    return total + last - first
  }, 0)
}

function TrendChart({ signals }: { signals: KnowledgeSignal[] }) {
  const points = useMemo(() => {
    if (signals.length === 0) return []

    const values = Array.from({ length: 5 }, (_, index) =>
      Math.max(...signals.map((signal) => signal.trend[index] ?? 0)),
    )

    const max = Math.max(...values, 1)

    return values.map((value, index) => ({
      value,

      x: 22 + index * 84,

      y: 132 - (value / max) * 96,
    }))
  }, [signals])

  const path = points.map((point) => `${point.x},${point.y}`).join(" ")

  const primary = signals[0]

  return (
    <GlassSurface className="p-5 sm:p-6" weight="light">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.12em] text-[#617265]">
            变化趋势
          </p>
          <h2 className="mt-2 text-xl font-black text-[#17231b]">
            近五次学习活动
          </h2>
        </div>
        <StatusChip tone="info">按最高受影响人数</StatusChip>
      </div>
      {primary ? (
        <>
          <svg
            aria-label="困难信号近五次变化趋势"
            className="mt-5 h-44 w-full overflow-visible"
            role="img"
            viewBox="0 0 380 160"
          >
            <defs>
              <linearGradient id="insight-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#668c6f" stopOpacity=".34" />
                <stop offset="1" stopColor="#668c6f" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[36, 84, 132].map((y) => (
              <line
                key={y}
                stroke="rgba(54,83,61,.12)"
                x1="22"
                x2="358"
                y1={y}
                y2={y}
              />
            ))}
            <polygon
              fill="url(#insight-area)"
              points={`22,140 ${path} 358,140`}
            />
            <polyline
              fill="none"
              points={path}
              stroke="#416b4d"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
            {points.map((point, index) => (
              <g key={`${point.x}-${point.y}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill="#f8fbf7"
                  r="7"
                  stroke="#416b4d"
                  strokeWidth="3"
                />
                <text
                  fill="#53665a"
                  fontSize="11"
                  textAnchor="middle"
                  x={point.x}
                  y="156"
                >
                  第 {index + 1} 次
                </text>
              </g>
            ))}
          </svg>
          <p className="mt-1 text-sm font-semibold text-[#607166]">
            {primary.trend.join(" → ")} 名学生
          </p>
        </>
      ) : (
        <p className="mt-8 text-sm text-[#68796d]">当前筛选下暂无趋势数据。</p>
      )}
    </GlassSurface>
  )
}

export function InsightsPage() {
  const { signals, tasks, addPlan, addQuiz, addSignal, deleteSignal, updateSignal } = usePrototype()

  const [timeRange, setTimeRange] = useState<TimeRange>("week")

  const [subject, setSubject] = useState<SubjectFilter>("all")

  const [selectedSignal, setSelectedSignal] = useState<KnowledgeSignal | null>(
    null,
  )

  const [notice, setNotice] = useState("")
  const [generationError, setGenerationError] = useState<{
    action: "plan" | "quiz"
    message: string
  } | null>(null)
  const [generatingAction, setGeneratingAction] = useState<"plan" | "quiz" | null>(null)
  const referenceDate = useMemo(() => signals.map((signal) => signal.observedAt.slice(0, 10)).sort().at(-1) ?? new Date().toISOString().slice(0, 10), [signals])

  const filteredSignals = useMemo(
    () =>
      signals.filter(
        (signal) =>
          matchesTime(signal, timeRange, referenceDate) &&
          (subject === "all" || signal.subject === subject),
      ),

    [referenceDate, signals, subject, timeRange],
  )

  const affectedCount = filteredSignals.reduce(
    (largest, signal) => Math.max(largest, signal.affectedCount),

    0,
  )

  const priorityCount = filteredSignals.filter(
    (signal) => signal.severity === "priority",
  ).length

  const trendDelta = metricTrend(filteredSignals)
  const feedback = useMemo(() => aggregateTaskFeedback(tasks), [tasks])
  const latestFeedback = feedback[0]
  const nextLessonDraft = latestFeedback?.signal === "needs-practice"
    ? `下一课教师草稿：针对“${latestFeedback.title}”中未完成的步骤，先用课堂证据复盘，再安排一道同类变式题。`
    : "下一课教师草稿：当前练习完成节奏稳定，可继续观察课堂中的关键条件。"

  async function generatePlan(signal: KnowledgeSignal) {
    setGeneratingAction("plan")
    setGenerationError(null)
    try {
      const response = await generateDraft("remedial-plan", {
        knowledgePoint: signal.knowledgePoint,
        step: signal.step,
        affectedCount: signal.affectedCount,
        trend: signal.trend.join(" → "),
        evidence: signal.evidence,
      })
      const payload = response as { content?: unknown }
      const plan = toRemedialPlanDraft(payload.content, {
        subject: signal.subject,
        knowledgePoint: signal.knowledgePoint,
        evidence: signal.evidence,
      })
      addPlan(plan)
      setNotice(`已生成“${plan.title}”，可在备课与测验中继续编辑。`)
      setSelectedSignal(null)
    } catch (error) {
      setGenerationError({
        action: "plan",
        message: error instanceof Error ? error.message : "生成失败，请重试",
      })
    } finally {
      setGeneratingAction(null)
    }
  }

  async function generateQuiz(signal: KnowledgeSignal) {
    setGeneratingAction("quiz")
    setGenerationError(null)
    try {
      const response = await generateDraft("quiz", {
        title: `${signal.knowledgePoint}${getSignalAxis(signal)}巩固练习`,
        topic: signal.knowledgePoint,
        difficulty: signal.severity,
        focus: signal.step,
      })
      const payload = response as { content?: unknown }
      const quiz = toQuiz(payload.content)
      addQuiz({ ...quiz, subject: signal.subject })
      setNotice(`已生成“${quiz.title}”，可在备课与测验中继续编辑。`)
      setSelectedSignal(null)
    } catch (error) {
      setGenerationError({
        action: "quiz",
        message: error instanceof Error ? error.message : "生成失败，请重试",
      })
    } finally {
      setGeneratingAction(null)
    }
  }

  return (
    <section
      className="mx-auto w-full max-w-[1540px] space-y-5 p-4 sm:p-6 xl:p-8"
      aria-labelledby="insights-title"
    >
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#55705d]">
            <Sparkles aria-hidden="true" size={17} />
            基于课堂事实的保护性观察
          </div>
          <h1
            className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#142018] sm:text-4xl"
            id="insights-title"
          >
            班级洞察
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69786f] sm:text-base">
            从知识点和学习步骤观察全班变化，不进行学生间比较。所有建议都需要教师确认。
          </p>
        </div>

        <FilterBar
          aria-label="洞察筛选"
          className="flex flex-wrap gap-3 rounded-[22px] p-3"
        >
          <label className="flex min-w-40 items-center gap-2 rounded-2xl bg-white/65 px-3 py-2 text-sm font-bold text-[#53665a]">
            <CalendarRange aria-hidden="true" size={16} />
            <span>时间范围</span>
            <select
              aria-label="时间范围"
              className="min-w-0 flex-1 bg-transparent text-[#1f3225] outline-none"
              onChange={(event) =>
                setTimeRange(event.target.value as TimeRange)
              }
              value={timeRange}
            >
              <option value="today">今天</option>
              <option value="week">近 7 天</option>
              <option value="month">近 30 天</option>
            </select>
          </label>
          <label className="flex min-w-36 items-center gap-2 rounded-2xl bg-white/65 px-3 py-2 text-sm font-bold text-[#53665a]">
            <BookOpenCheck aria-hidden="true" size={16} />
            <span>学科</span>
            <select
              aria-label="学科"
              className="min-w-0 flex-1 bg-transparent text-[#1f3225] outline-none"
              onChange={(event) =>
                setSubject(event.target.value as SubjectFilter)
              }
              value={subject}
            >
              <option value="all">全部</option>
              <option value="数学">数学</option>
              <option value="语文">语文</option>
              <option value="英语">英语</option>
            </select>
          </label>
        </FilterBar>
        <button className="min-h-11 rounded-full bg-[#173022] px-5 text-sm font-black text-white" onClick={() => {
          const signal: KnowledgeSignal = { id: `signal-${Date.now()}`, subject: "数学", knowledgePoint: "新知识点", step: "等待教师补充观察", severity: "watch", affectedStudentIds: [], affectedCount: 0, trend: [0, 0, 0, 0, 0], evidence: ["教师新增的待核实观察"], observedAt: new Date().toISOString() }
          addSignal(signal)
          setSelectedSignal(signal)
        }} type="button">新增观察</button>
      </header>

      {notice ? (
        <div
          aria-label="生成结果通知"
          className="rounded-2xl border border-[#a9c9ae]/70 bg-[#edf7ee]/85 px-4 py-3 text-sm font-bold text-[#31563a]"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ChartNoAxesCombined}
          label="知识信号"
          value={`${filteredSignals.length} 个知识信号`}
        />
        <MetricCard
          icon={UsersRound}
          label="影响范围"
          value={`${affectedCount} 名学生受影响`}
        />
        <MetricCard
          icon={Lightbulb}
          label="优先处理"
          value={`${priorityCount} 个步骤`}
        />
        <MetricCard
          icon={trendDelta > 0 ? ArrowUpRight : ArrowDownRight}
          label="变化幅度"
          value={`${trendDelta > 0 ? "+" : ""}${trendDelta} 人次`}
        />
      </div>

      <GlassSurface aria-label="课后回流" role="region" className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)] sm:items-center" weight="light">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black tracking-[0.12em] text-[#617265]">课后回流</p>
            <StatusChip tone={latestFeedback?.signal === "needs-practice" ? "warning" : "success"}>
              {latestFeedback?.signal === "needs-practice" ? "需要再练" : "完成稳定"}
            </StatusChip>
          </div>
          <h2 className="mt-2 text-xl font-black text-[#17231b]">学生完成后，下一课怎么接</h2>
          <p className="mt-2 text-sm leading-6 text-[#637269]">
            {latestFeedback
              ? `${latestFeedback.title}：${latestFeedback.submittedCount}/${latestFeedback.totalCount} 人已提交（${latestFeedback.completionRate}%）。仅显示班级聚合，不展示个人答案。`
              : "学生完成任务后，这里会出现匿名聚合结果。"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dce8d8] bg-[#f7faf5] p-4 text-sm font-bold leading-6 text-[#47604d]">
          <span className="text-xs font-black text-[#758579]">教师草稿 · 不自动推送</span>
          <p className="mt-2">{nextLessonDraft}</p>
        </div>
      </GlassSurface>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.7fr)]">
        <GlassSurface className="min-w-0 p-5 sm:p-6" weight="card">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.12em] text-[#617265]">
                知识点 × 学习步骤
              </p>
              <h2 className="mt-2 text-xl font-black text-[#17231b]">
                困难热力图
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#6b796f]">
              颜色强度表示受影响范围；选择卡片查看课堂证据和生成支持材料。
            </p>
          </div>

          {filteredSignals.length > 0 ? (
            <KnowledgeHeatmap
              signals={filteredSignals}
              onSelect={setSelectedSignal}
            />
          ) : (
            <EmptyState
              description="切换时间或学科后再看看。系统不会用空数据推断学生表现。"
              title="这个筛选条件下还没有困难信号"
            />
          )}
        </GlassSurface>

        <TrendChart signals={filteredSignals} />
      </div>

      <Drawer
        onClose={() => setSelectedSignal(null)}
        open={selectedSignal !== null}
        title={
          selectedSignal
            ? `${selectedSignal.knowledgePoint} · ${getSignalAxis(selectedSignal)}步骤`
            : "信号详情"
        }
      >
        {selectedSignal ? (
          <div className="space-y-6 text-[#203027]">
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip tone={severityMeta[selectedSignal.severity].tone}>
                {severityMeta[selectedSignal.severity].label}
              </StatusChip>
              <span className="text-sm font-bold text-[#66766c]">
                {selectedSignal.affectedCount} 名学生出现相似卡点
              </span>
            </div>

            <section className="grid gap-3 rounded-[22px] border border-white/80 bg-white/60 p-5 sm:grid-cols-2" aria-label="校正知识信号">
              <label className="grid gap-2 text-sm font-black">知识点<input aria-label="信号知识点" className="min-h-11 rounded-2xl border border-[#dce7da] bg-white/80 px-4" onChange={(event) => { const patch = { knowledgePoint: event.target.value }; updateSignal(selectedSignal.id, patch); setSelectedSignal({ ...selectedSignal, ...patch }) }} value={selectedSignal.knowledgePoint} /></label>
              <label className="grid gap-2 text-sm font-black">优先级<select aria-label="信号优先级" className="min-h-11 rounded-2xl border border-[#dce7da] bg-white/80 px-4" onChange={(event) => { const patch = { severity: event.target.value as KnowledgeSignal["severity"] }; updateSignal(selectedSignal.id, patch); setSelectedSignal({ ...selectedSignal, ...patch }) }} value={selectedSignal.severity}><option value="watch">持续观察</option><option value="attention">需要关注</option><option value="priority">优先处理</option></select></label>
              <label className="grid gap-2 text-sm font-black sm:col-span-2">困难步骤<textarea aria-label="信号困难步骤" className="min-h-20 rounded-2xl border border-[#dce7da] bg-white/80 p-4" onChange={(event) => { const patch = { step: event.target.value }; updateSignal(selectedSignal.id, patch); setSelectedSignal({ ...selectedSignal, ...patch }) }} value={selectedSignal.step} /></label>
              <label className="grid gap-2 text-sm font-black">受影响人数<input aria-label="信号受影响人数" className="min-h-11 rounded-2xl border border-[#dce7da] bg-white/80 px-4" min="0" onChange={(event) => { const patch = { affectedCount: Number(event.target.value) }; updateSignal(selectedSignal.id, patch); setSelectedSignal({ ...selectedSignal, ...patch }) }} type="number" value={selectedSignal.affectedCount} /></label>
              <button className="min-h-11 self-end rounded-full border border-[#e3c8c2] bg-[#fff5f2] px-4 text-sm font-black text-[#934f43]" onClick={() => { if (window.confirm(`确认移除“${selectedSignal.knowledgePoint}”信号吗？`)) { deleteSignal(selectedSignal.id); setSelectedSignal(null) } }} type="button">移除这个信号</button>
            </section>

            <section
              aria-labelledby="insight-step-title"
              className="rounded-[22px] border border-white/80 bg-white/60 p-5"
            >
              <p className="text-xs font-black tracking-[0.12em] text-[#617265]">
                观察到的困难步骤
              </p>
              <h3 className="mt-2 text-xl font-black" id="insight-step-title">
                {selectedSignal.step}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#68786d]">
                这是课堂行为和练习结果的聚合事实，不代表学生能力结论，也不用于学生间比较。
              </p>
            </section>

            <section aria-labelledby="insight-evidence-title">
              <h3 className="text-base font-black" id="insight-evidence-title">
                课堂证据
              </h3>
              <ul className="mt-3 space-y-3">
                {selectedSignal.evidence.map((evidence) => (
                  <li
                    className="rounded-2xl border border-[#dfe8df] bg-[#f8fbf7] px-4 py-3 text-sm leading-6"
                    key={evidence}
                  >
                    {evidence}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="insight-trend-title">
              <h3 className="text-base font-black" id="insight-trend-title">
                近五次变化
              </h3>
              <p className="mt-3 rounded-2xl bg-[#eef3ed] px-4 py-3 text-sm font-bold text-[#48604e]">
                {selectedSignal.trend.join(" → ")} 名学生
              </p>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#17251c] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(24,42,29,.18)] transition hover:bg-[#284632] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#416b4d]/25"
                disabled={generatingAction !== null}
                onClick={() => void generatePlan(selectedSignal)}
                type="button"
              >
                <Sparkles aria-hidden="true" size={17} />
                {generatingAction === "plan" ? "正在生成草稿" : "一键生成补讲方案"}
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#b9cdbb] bg-white/75 px-4 py-3 text-sm font-black text-[#2f5638] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#416b4d]/25"
                disabled={generatingAction !== null}
                onClick={() => void generateQuiz(selectedSignal)}
                type="button"
              >
                <BookOpenCheck aria-hidden="true" size={17} />
                {generatingAction === "quiz" ? "正在生成草稿" : "一键生成巩固练习"}
              </button>
            </div>
            {generationError ? (
              <div className="grid gap-3 rounded-2xl border border-[#e4b9b4] bg-[#fff5f3] p-4 text-sm text-[#8d332b]" role="alert">
                <p>{generationError.message}</p>
                <button
                  className="w-fit rounded-full border border-current px-4 py-2 font-black"
                  type="button"
                  onClick={() =>
                    void (generationError.action === "plan"
                      ? generatePlan(selectedSignal)
                      : generateQuiz(selectedSignal))
                  }
                >
                  重试生成
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </section>
  )
}

function MetricCard({
  icon: Icon,

  label,

  value,
}: {
  icon: typeof ChartNoAxesCombined

  label: string

  value: string
}) {
  return (
    <GlassSurface
      className="flex min-h-32 items-center gap-4 p-5"
      weight="light"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e8f0e6] text-[#486a50]">
        <Icon aria-hidden="true" size={21} />
      </span>
      <span>
        <span className="block text-xs font-black tracking-[0.1em] text-[#6a796f]">
          {label}
        </span>
        <strong className="mt-2 block text-lg font-black text-[#19271e]">
          {value}
        </strong>
      </span>
    </GlassSurface>
  )
}

export default InsightsPage
