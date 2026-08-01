import type { CSSProperties } from "react"
import type { KnowledgeSignal } from "../../../app/prototype/types"

const severityLabels: Record<KnowledgeSignal["severity"], string> = {
  watch: "持续观察",
  attention: "需要关注",
  priority: "优先处理",
}

const signalAxes: Record<string, string> = {
  "signal-unit-calculation": "计算",
  "signal-fraction-condition": "概念",
  "signal-decimal-estimation": "估算",
}

function cellStyle(signal: KnowledgeSignal): CSSProperties {
  const strength = Math.min(1, Math.max(0.28, signal.affectedCount / 12))
  const hue =
    signal.severity === "priority"
      ? 38
      : signal.severity === "attention"
        ? 72
        : 126

  return {
    "--heat-strength": strength,
    "--heat-hue": hue,
  } as CSSProperties
}

export function getSignalAxis(signal: KnowledgeSignal) {
  return signalAxes[signal.id] ?? signal.step
}

export interface KnowledgeHeatmapProps {
  signals: KnowledgeSignal[]
  onSelect: (signal: KnowledgeSignal) => void
}

export function KnowledgeHeatmap({ signals, onSelect }: KnowledgeHeatmapProps) {
  return (
    <div className="space-y-4">
      <div
        aria-label="知识困难热力图"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        role="grid"
      >
        {signals.map((signal) => {
          const axis = getSignalAxis(signal)
          const label = `${signal.knowledgePoint} × ${axis}`

          return (
            <div key={signal.id} role="gridcell">
              <button
                aria-label={`${label}：${signal.affectedCount} 名学生受影响，${severityLabels[signal.severity]}`}
                className="group relative h-full min-h-40 w-full overflow-hidden rounded-[24px] border border-white/80 p-5 text-left shadow-[0_18px_45px_rgba(47,72,53,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(47,72,53,0.13)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#416b4d]/25"
                onClick={() => onSelect(signal)}
                style={cellStyle(signal)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[calc(.16_+_var(--heat-strength)*.34)]"
                  style={{
                    background:
                      "radial-gradient(circle at 82% 16%, hsl(var(--heat-hue) 58% 62% / .72), transparent 45%), linear-gradient(145deg, hsl(var(--heat-hue) 34% 95% / .9), rgba(255,255,255,.66))",
                  }}
                />
                <span className="relative flex h-full flex-col justify-between gap-8">
                  <span>
                    <span className="block text-xs font-bold tracking-[0.12em] text-[#607365]">
                      {axis}步骤
                    </span>
                    <span className="mt-2 block text-lg font-black text-[#17231b]">
                      {label}
                    </span>
                  </span>
                  <span className="flex items-end justify-between gap-4">
                    <span className="text-sm font-semibold text-[#65766a]">
                      {severityLabels[signal.severity]}
                    </span>
                    <span className="text-right">
                      <strong className="block text-3xl font-black text-[#1f3a27]">
                        {signal.affectedCount}
                      </strong>
                      <span className="text-xs font-bold text-[#68796d]">
                        名学生
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            </div>
          )
        })}
      </div>

      <ul className="sr-only" aria-label="热力图文本说明">
        {signals.map((signal) => (
          <li key={signal.id}>
            {signal.knowledgePoint}，{getSignalAxis(signal)}步骤，
            {signal.affectedCount} 名学生受影响，
            {severityLabels[signal.severity]}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default KnowledgeHeatmap
