import { ClipboardCheck, FileText, GraduationCap, ListChecks } from "lucide-react"
import type { RecapDeliverables } from "../../../app/prototype/types"

export default function RecapDeliverablesPreview({ deliverables }: { deliverables?: RecapDeliverables }) {
  if (!deliverables) {
    return <section className="rounded-[24px] border border-dashed border-[#cbdcc8] bg-white/45 p-6 text-sm text-[#718176]">生成成果后会显示在这里。</section>
  }
  const items = [
    { label: "学生复习卡", icon: GraduationCap, body: deliverables.studentRecap },
    { label: "教师报告", icon: FileText, body: deliverables.teacherReport },
    { label: "补讲方案", icon: ClipboardCheck, body: deliverables.remedialPlan },
  ]
  return (
    <section aria-labelledby="recap-deliverables-heading" className="rounded-[24px] border border-white/80 bg-white/75 p-5 shadow-[0_16px_38px_rgba(46,78,54,0.09)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#829487]">Reviewable output</p>
          <h2 id="recap-deliverables-heading" className="text-lg font-black tracking-[-0.03em] text-[#18321f]">四项成果</h2>
        </div>
        <span className="rounded-full bg-[#f4ead3] px-3 py-1.5 text-xs font-black text-[#806126]">AI 草稿</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {items.map(({ label, icon: Icon, body }) => (
          <article key={label} className="rounded-[16px] border border-[#e5ece1] bg-[#fbfcf9] p-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-[#557359]"><Icon aria-hidden="true" size={15} />{label}</div>
            <p className="mt-2 text-sm leading-6 text-[#3c5742]">{body}</p>
          </article>
        ))}
        <article className="rounded-[16px] border border-[#e5ece1] bg-[#fbfcf9] p-3.5 sm:col-span-2">
          <div className="flex items-center gap-2 text-xs font-black text-[#557359]"><ListChecks aria-hidden="true" size={15} />练习题</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-[#3c5742]">
            {deliverables.practiceQuestions.map((question) => <li key={question}>{question}</li>)}
          </ol>
        </article>
      </div>
    </section>
  )
}
