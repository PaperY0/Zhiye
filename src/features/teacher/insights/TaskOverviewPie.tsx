import type { taskStatusBreakdown } from "./taskChartData"

type Summary = ReturnType<typeof taskStatusBreakdown>

const segments = [
  { key: "completed", label: "已完成", color: "#234b33" },
  { key: "review", label: "待查看", color: "#70a47a" },
  { key: "active", label: "进行中", color: "#dfb66a" },
  { key: "draft", label: "草稿", color: "#e5ebe3" },
] as const

function pieBackground(summary: Summary) {
  if (!summary.total) return "#edf1eb"
  let position = 0
  const stops = segments.map(({ key, color }) => {
    const start = position
    position += summary[key] / summary.total * 100
    return `${color} ${start}% ${position}%`
  })
  return `conic-gradient(from -90deg, ${stops.join(", ")})`
}

export function TaskOverviewPie({ summary, scope }: { summary: Summary; scope: string }) {
  const description = summary.total
    ? `${scope}共 ${summary.total} 项任务：已完成 ${summary.completed} 项，待查看 ${summary.review} 项，进行中 ${summary.active} 项，草稿 ${summary.draft} 项`
    : `${scope}暂无任务`

  return <section aria-labelledby="task-global-overview-title" className="grid min-w-0 gap-5 rounded-[24px] border border-[#dce6dc] bg-white p-5 shadow-[0_8px_24px_rgba(49,75,55,.035)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
    <div className="min-w-0">
      <p className="text-xs font-black tracking-[.14em] text-[#66806b]">当前范围 · {scope}</p>
      <h2 id="task-global-overview-title" className="mt-1 text-xl font-black">任务全局预览</h2>
      <p className="mt-2 text-sm leading-6 text-[#718076]">按任务条数统计，每项任务只计一次。新增、发布或完成任务后同步更新。</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {segments.map(({ key, label, color }) => <div className="border-l-[3px] pl-3" key={key} style={{ borderColor: color }}><dt className="text-xs text-[#617168]">{label}</dt><dd className="mt-1 text-lg font-black tabular-nums text-[#203427]">{summary[key]} <span className="text-xs font-semibold">项</span></dd></div>)}
      </dl>
    </div>
    <div aria-label={description} className="relative mx-auto grid size-40 shrink-0 place-items-center rounded-full sm:size-44" role="img" style={{ background: pieBackground(summary) }}>
      <div className="grid size-26 place-content-center rounded-full bg-white text-center sm:size-28"><strong className="text-3xl font-black tracking-tight text-[#1d3826]">{summary.total}</strong><span className="mt-1 text-xs font-semibold text-[#718076]">项任务</span></div>
    </div>
  </section>
}
