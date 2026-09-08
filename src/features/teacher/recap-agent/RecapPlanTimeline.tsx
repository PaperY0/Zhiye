import { AlertTriangle, Check, Circle, Loader2, RefreshCw, Wrench } from "lucide-react"
import type { RecapJob, RecapStep } from "../../../app/prototype/types"

const stepLabels: Record<RecapStep["key"], string> = {
  transcribe: "转写课堂录音",
  "extract-evidence": "提取课堂证据",
  "identify-gaps": "识别学习缺口",
  "generate-deliverables": "生成补讲包",
  "teacher-review": "教师审核发布",
}

const toolLabels: Record<RecapStep["key"], string> = {
  transcribe: "FunASR 本地转写",
  "extract-evidence": "Evidence Extractor",
  "identify-gaps": "Gap Analyzer",
  "generate-deliverables": "Recap Generator",
  "teacher-review": "Teacher Review",
}

function StepIcon({ step }: { step: RecapStep }) {
  if (step.status === "succeeded") return <Check aria-hidden="true" size={17} />
  if (step.status === "running") return <Loader2 aria-hidden="true" className="animate-spin" size={17} />
  if (step.status === "failed") return <AlertTriangle aria-hidden="true" size={17} />
  return <Circle aria-hidden="true" size={13} />
}

export default function RecapPlanTimeline({
  job,
  onRetry,
}: {
  job: RecapJob
  onRetry?: (stepKey: RecapStep["key"]) => void
}) {
  return (
    <section aria-labelledby="recap-plan-heading" className="rounded-[24px] border border-white/80 bg-white/70 p-5 shadow-[0_16px_38px_rgba(46,78,54,0.09)] backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#829487]">Execution plan</p>
          <h2 id="recap-plan-heading" className="text-lg font-black tracking-[-0.03em] text-[#18321f]">五步工作流</h2>
        </div>
        <span className="rounded-full bg-[#e5f0e3] px-3 py-1.5 text-xs font-black text-[#4d7053]">{job.steps.filter((step) => step.status === "succeeded").length}/5 已完成</span>
      </div>

      <ol className="space-y-2">
        {job.steps.map((step, index) => {
          const failed = step.status === "failed"
          const succeeded = step.status === "succeeded"
          return (
            <li key={step.key} className={`relative rounded-[18px] border p-3.5 transition-colors ${failed ? "border-[#dfb6a3] bg-[#fff5f0]" : succeeded ? "border-[#d9e7d6] bg-[#f8fbf6]" : "border-[#e7eee5] bg-white/55"}`}>
              {index < job.steps.length - 1 ? <span aria-hidden="true" className="absolute bottom-[-10px] left-[26px] z-10 h-5 w-px bg-[#d8e5d7]" /> : null}
              <div className="flex items-start gap-3">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${failed ? "bg-[#b9684d] text-white" : succeeded ? "bg-[#5b8060] text-white" : step.status === "running" ? "bg-[#d2ad62] text-white" : "bg-[#edf2eb] text-[#829487]"}`}>
                  <StepIcon step={step} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-black text-[#203d28]">{index + 1}. {stepLabels[step.key]}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#849287]"><Wrench aria-hidden="true" size={12} />{toolLabels[step.key]}</span>
                  </div>
                  <p className={`mt-1 text-xs leading-5 ${failed ? "text-[#9f553f]" : "text-[#718176]"}`}>{step.error ?? step.summary}</p>
                  {step.evidenceIds.length > 0 ? <p className="mt-1 text-[11px] font-bold text-[#7d987f]">已挂接 {step.evidenceIds.length} 条证据</p> : null}
                </div>
                {failed && onRetry ? <button type="button" onClick={() => onRetry(step.key)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#172019] px-3 py-2 text-xs font-black text-white transition hover:bg-[#2a3c2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d]" aria-label="仅重试生成补讲包"><RefreshCw aria-hidden="true" size={13} />仅重试生成补讲包</button> : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
