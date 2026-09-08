import { Download, FileCheck2, Save } from "lucide-react"
import { useState } from "react"
import { Dialog } from "../../../components/shared/Dialog"
import type { RecapDeliverables } from "../../../app/prototype/types"
import { downloadRecapPackage } from "./exportRecapPackage"

type RecapDraft = Pick<RecapDeliverables, "studentRecap" | "teacherReport" | "remedialPlan" | "practiceQuestions">

export default function RecapDeliverablesReview({
  goal,
  title = "课堂复盘补讲包",
  date = new Date().toISOString().slice(0, 10),
  deliverables,
  published = false,
  onPublish,
  onExport,
}: {
  goal: string
  title?: string
  date?: string
  deliverables: RecapDeliverables
  published?: boolean
  onPublish?: (draft: RecapDeliverables) => void
  onExport?: (draft: RecapDeliverables) => void
}) {
  const [draft, setDraft] = useState<RecapDraft>({
    studentRecap: deliverables.studentRecap,
    teacherReport: deliverables.teacherReport,
    remedialPlan: deliverables.remedialPlan,
    practiceQuestions: deliverables.practiceQuestions,
  })
  const [publishOpen, setPublishOpen] = useState(false)
  const [confirmedAt, setConfirmedAt] = useState("")
  const fullDraft: RecapDeliverables = { ...deliverables, ...draft }

  function confirmPublish() {
    const now = new Date().toLocaleString("zh-CN", { hour12: false })
    setConfirmedAt(now)
    setPublishOpen(false)
    onPublish?.(fullDraft)
  }

  function handleExport() {
    if (!confirmedAt) return
    onExport?.(fullDraft)
    if (!onExport) {
      downloadRecapPackage({ title, date, goal, deliverables: fullDraft, confirmedAt }, `${title}-${date}`)
    }
  }

  return (
    <section aria-labelledby="review-deliverables-heading" className="rounded-[24px] border border-white/80 bg-white/75 p-5 shadow-[0_16px_38px_rgba(46,78,54,0.09)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#829487]">Teacher review</p><h2 id="review-deliverables-heading" className="text-lg font-black text-[#18321f]">审核并发布</h2></div>
        <span className="rounded-full bg-[#f4ead3] px-3 py-1.5 text-xs font-black text-[#806126]">{published ? "已发布" : confirmedAt ? "已确认" : "AI 草稿"}</span>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-xs font-black text-[#557359]">学生复习卡<textarea aria-label="学生复习卡" className="min-h-20 rounded-[14px] border border-[#dce8d8] bg-[#fbfcf9] p-3 text-sm font-normal leading-6 text-[#3c5742] outline-none focus:ring-2 focus:ring-[#789b7d]/30" value={draft.studentRecap} onChange={(event) => setDraft((current) => ({ ...current, studentRecap: event.target.value }))} /></label>
        <label className="grid gap-1.5 text-xs font-black text-[#557359]">教师报告<textarea aria-label="教师报告" className="min-h-20 rounded-[14px] border border-[#dce8d8] bg-[#fbfcf9] p-3 text-sm font-normal leading-6 text-[#3c5742] outline-none focus:ring-2 focus:ring-[#789b7d]/30" value={draft.teacherReport} onChange={(event) => setDraft((current) => ({ ...current, teacherReport: event.target.value }))} /></label>
        <label className="grid gap-1.5 text-xs font-black text-[#557359]">补讲方案<textarea aria-label="补讲方案" className="min-h-20 rounded-[14px] border border-[#dce8d8] bg-[#fbfcf9] p-3 text-sm font-normal leading-6 text-[#3c5742] outline-none focus:ring-2 focus:ring-[#789b7d]/30" value={draft.remedialPlan} onChange={(event) => setDraft((current) => ({ ...current, remedialPlan: event.target.value }))} /></label>
        <label className="grid gap-1.5 text-xs font-black text-[#557359]">练习题（每行一题）<textarea aria-label="练习题" className="min-h-20 rounded-[14px] border border-[#dce8d8] bg-[#fbfcf9] p-3 text-sm font-normal leading-6 text-[#3c5742] outline-none focus:ring-2 focus:ring-[#789b7d]/30" value={draft.practiceQuestions.join("\n")} onChange={(event) => setDraft((current) => ({ ...current, practiceQuestions: event.target.value.split("\n").filter(Boolean) }))} /></label>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#e5ece1] pt-4">
        <button type="button" disabled={!confirmedAt} onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-full border border-[#cbdcc8] px-4 py-2.5 text-xs font-black text-[#557359] disabled:cursor-not-allowed disabled:opacity-45"><Download aria-hidden="true" size={14} />导出补讲包</button>
        <button type="button" disabled={published} onClick={() => setPublishOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#172019] px-4 py-2.5 text-xs font-black text-white hover:bg-[#2a3c2d] disabled:cursor-not-allowed disabled:opacity-50"><FileCheck2 aria-hidden="true" size={14} />{published ? "已发布" : "确认发布"}</button>
        <button type="button" onClick={() => onPublish?.(fullDraft)} className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f0e3] px-4 py-2.5 text-xs font-black text-[#4d7053]"><Save aria-hidden="true" size={14} />保存草稿</button>
      </div>
      <Dialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="确认发布给学生"
        description="确认后，学生将看见复习卡与练习；教师报告、证据和 AI 推断仍仅供教师查看。"
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setPublishOpen(false)} className="rounded-full bg-[#eceee9] px-4 py-2.5 text-sm font-black text-[#5d685f]">继续检查</button><button type="button" onClick={confirmPublish} className="rounded-full bg-[#142219] px-4 py-2.5 text-sm font-black text-white">确认发布给学生</button></div>}
      >
        <div className="rounded-[18px] border border-[#d6e2d2] bg-[#f5f8f2] p-4 text-sm leading-6 text-[#46564b]">请确认复习卡和练习题已经完成事实核对，且没有把 AI 推断当成课堂事实。</div>
      </Dialog>
    </section>
  )
}
