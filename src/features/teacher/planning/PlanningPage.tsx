import { useState } from "react"
import { BookOpen, ListChecks, Plus, Trash2 } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { navigate } from "../../../app/routes"
import LessonPlanBuilder from "./LessonPlanBuilder"
import { Dialog } from "../../../components/shared/Dialog"
import type { PlanDraft } from "../../../app/prototype/types"
import { consumeProgressImport } from "./progressImport"

export function PlanningPage() {
  const { plans, addPlan, deletePlan, updatePlan } = usePrototype()
  const [progressImport, setProgressImport] = useState(consumeProgressImport)
  const [selectedId, setSelectedId] = useState<string | null>(() => progressImport ? null : plans[0]?.id ?? null)
  const [newVersion, setNewVersion] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string | null | undefined>(undefined)
  const [recentlyDeleted, setRecentlyDeleted] = useState<PlanDraft | null>(null)
  const selectedPlan = plans.find((plan) => plan.id === selectedId) ?? null

  function makeTask(id: string) {
    window.sessionStorage.setItem("zhiye-task-source-plan", id)
    navigate({ role: "teacher", page: "tasks" })
  }

  return <main className="mx-auto max-w-[1500px] p-4 text-[#17251b] sm:p-6 lg:p-8">
    <header className="mb-6"><p className="text-xs font-black tracking-[.16em] text-[#66806b]">教学设计</p><h1 className="role-page-title">备课</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#718076]">选择已有教案继续编辑，或新建一份教案。填写课题与目标后保存。</p></header>
    {progressImport && !selectedPlan && <p className="mb-5 rounded-2xl border border-[#c9dfca] bg-[#eaf4e8] px-5 py-4 text-sm leading-6 text-[#315b3b]" role="status">已从“{progressImport.lessonTitle}”带入下一步教学内容。请核对课题并补充教学目标。</p>}
    <div className="grid gap-5">
      {recentlyDeleted && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c8ddc8] bg-[#edf5eb] px-4 py-3 text-sm" role="status"><span>已删除“{recentlyDeleted.title}”。</span><button className="rounded-xl border border-[#86a889] bg-white px-3 py-2 font-bold" onClick={() => { addPlan(recentlyDeleted); setSelectedId(recentlyDeleted.id); setRecentlyDeleted(null) }} type="button">撤销删除</button></div>}
      <aside aria-label="我的教案" className="rounded-[24px] border border-[#dce6dc] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpen size={18} /><h2 className="font-black">我的教案</h2><span className="text-sm text-[#718076]">{plans.length}</span></div><button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#183021] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#294c34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183021]" onClick={() => { if (hasUnsavedChanges) setPendingSelection(null); else { setProgressImport(null); setSelectedId(null); setNewVersion((value) => value + 1) } }} type="button"><Plus size={17} aria-hidden="true" />新建教案</button></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <button aria-current={selectedId === plan.id ? "true" : undefined} className={`min-w-0 rounded-2xl border px-4 py-3 text-left ${selectedId === plan.id ? "border-[#a7c3a7] bg-[#e8f1e6]" : "border-[#e5ece4] hover:bg-[#f1f5ef]"}`} key={plan.id} onClick={() => { if (selectedId === plan.id) return; if (hasUnsavedChanges) setPendingSelection(plan.id); else setSelectedId(plan.id) }} type="button"><strong className="block truncate text-sm">{plan.title}</strong><span className="mt-1 block truncate text-xs text-[#718076]">{plan.chapter} · {plan.status === "ready" ? "已备好" : "草稿"}</span></button>)}</div>
        {!plans.length && <p className="py-4 text-sm text-[#718076]">还没有教案，可以从下方开始。</p>}
        {selectedPlan && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e0e9df] pt-4"><button className="min-h-10 rounded-xl border border-[#bed0bd] px-3 text-sm font-bold" onClick={() => updatePlan(selectedPlan.id, { status: selectedPlan.status === "ready" ? "draft" : "ready" })} type="button">{selectedPlan.status === "ready" ? "改为草稿" : "标记备好"}</button><button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#183021] px-3 text-sm font-bold text-white" onClick={() => makeTask(selectedPlan.id)} type="button"><ListChecks size={16} />创建课堂热身</button><button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-[#965344] hover:bg-[#fff1ee]" onClick={() => setDeleteOpen(true)} type="button"><Trash2 size={16} />删除教案</button></div>}
      </aside>
      <LessonPlanBuilder key={newVersion} importedProgress={selectedPlan ? null : progressImport} selectedPlan={selectedPlan} startNew={!selectedPlan} onSaved={(id) => { setSelectedId(id); setProgressImport(null) }} onDirtyChange={setHasUnsavedChanges} />
    </div>
    <Dialog open={pendingSelection !== undefined} title="放弃未保存的修改？" description="当前教案的修改尚未保存。" onClose={() => setPendingSelection(undefined)} footer={<><button className="rounded-xl border px-4 py-2" onClick={() => setPendingSelection(undefined)} type="button">继续编辑</button><button className="rounded-xl bg-[#9a4239] px-4 py-2 font-bold text-white" onClick={() => { if (pendingSelection === null) { setSelectedId(null); setNewVersion((value) => value + 1) } else if (pendingSelection) setSelectedId(pendingSelection); setHasUnsavedChanges(false); setPendingSelection(undefined) }} type="button">放弃修改</button></>}><p>可以先关闭弹窗并保存当前教案。</p></Dialog>
    <Dialog open={deleteOpen} title="删除教案？" description={selectedPlan ? `确认删除“${selectedPlan.title}”？删除后可在本页撤销。` : ""} onClose={() => setDeleteOpen(false)} footer={<><button className="rounded-xl border px-4 py-2" onClick={() => setDeleteOpen(false)} type="button">取消</button><button className="rounded-xl bg-[#9a4239] px-4 py-2 font-bold text-white" onClick={() => { if (selectedPlan) { setRecentlyDeleted(selectedPlan); deletePlan(selectedPlan.id) } setSelectedId(null); setDeleteOpen(false); setNewVersion((value) => value + 1) }} type="button">确认删除</button></>}><p>请确认这份教案不再需要。</p></Dialog>
  </main>
}

export default PlanningPage
