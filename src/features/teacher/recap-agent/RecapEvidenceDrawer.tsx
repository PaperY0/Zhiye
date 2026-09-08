import { BookOpenText, ChevronDown, Lightbulb } from "lucide-react"
import type { RecapEvidenceItem, RecapInferenceItem } from "../../../app/prototype/types"

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${remainder}`
}

export default function RecapEvidenceDrawer({
  evidence,
  inferences,
}: {
  evidence: RecapEvidenceItem[]
  inferences: RecapInferenceItem[]
}) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]))
  return (
    <section aria-labelledby="recap-evidence-heading" className="rounded-[24px] border border-white/80 bg-[#f8fbf6]/85 p-5 shadow-[0_16px_38px_rgba(46,78,54,0.07)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#829487]">Traceable context</p>
          <h2 id="recap-evidence-heading" className="text-lg font-black tracking-[-0.03em] text-[#18321f]">课堂证据</h2>
        </div>
        <span className="rounded-full bg-[#e8f0e5] px-3 py-1.5 text-xs font-black text-[#557359]">{evidence.length} 条原话</span>
      </div>

      <div className="space-y-2.5">
        {evidence.map((item) => (
          <details key={item.id} className="group rounded-[16px] border border-[#dde9da] bg-white/75 p-3.5">
            <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
              <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-[#e6f0e4] text-[#557a5c]"><BookOpenText aria-hidden="true" size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black text-[#557359]">课堂原话 · {formatTime(item.startSeconds)}–{formatTime(item.endSeconds)}</span>
                <span className="mt-1 block text-sm leading-6 text-[#31503a]">“{item.quote}”</span>
              </span>
              <ChevronDown aria-hidden="true" className="mt-1 text-[#8ea08f] transition-transform group-open:rotate-180" size={15} />
            </summary>
            <p className="mt-3 border-t border-[#e8efe6] pt-3 text-[11px] leading-5 text-[#829287]">来源：{item.source === "transcript" ? "课堂转写" : "学生回答"} · 证据 ID：{item.id}</p>
          </details>
        ))}
      </div>

      {inferences.length > 0 ? (
        <div className="mt-4 border-t border-[#dfeade] pt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[#9b6d20]"><Lightbulb aria-hidden="true" size={15} />AI 推断，仅供教师确认</div>
          <div className="space-y-2">
            {inferences.map((inference) => (
              <div key={inference.id} className="rounded-[15px] border border-[#edd9aa] bg-[#fff9e9] p-3 text-sm leading-6 text-[#795d29]">
                <p>{inference.statement}</p>
                <p className="mt-1 text-[11px] font-bold text-[#a08042]">依据：{inference.evidenceIds.map((id) => evidenceById.get(id)?.id ?? id).join("、")}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
