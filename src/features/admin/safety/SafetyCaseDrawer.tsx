import { useState } from "react"
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react"
import type { SafetyCase } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { Drawer } from "../../../components/shared/Drawer"
import { StatusChip } from "../../../components/shared/StatusChip"

export interface SafetyCaseDrawerProps {
  safetyCase: SafetyCase | null
  open: boolean
  acknowledged: boolean
  onClose(): void
  onAcknowledge(): void
  onAssign(): void
  onAddNote(body: string): void
  onTransfer(recipient: string): void
  onResolve(): void
}

const statusLabels: Record<SafetyCase["status"], string> = {
  new: "待核实",
  reviewing: "核实中",
  transferred: "已转交",
  resolved: "已解决",
}

const statusTones: Record<SafetyCase["status"], "critical" | "warning" | "info" | "success"> =
  {
    new: "critical",
    reviewing: "warning",
    transferred: "info",
    resolved: "success",
  }

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

export function SafetyCaseDrawer({
  safetyCase,
  open,
  acknowledged,
  onClose,
  onAcknowledge,
  onAssign,
  onAddNote,
  onTransfer,
  onResolve,
}: SafetyCaseDrawerProps) {
  const [note, setNote] = useState("")
  const [transferTarget, setTransferTarget] = useState("陈老师 · 年级负责人")
  const [resolveOpen, setResolveOpen] = useState(false)

  if (!safetyCase) {
    return (
      <Drawer onClose={onClose} open={false} title="保护性反馈详情">
        <span />
      </Drawer>
    )
  }

  const addNote = () => {
    const normalized = note.trim()
    if (!normalized) return
    onAddNote(normalized)
    setNote("")
  }

  return (
    <>
      <Drawer onClose={onClose} open={open} title={safetyCase.title}>
        {!acknowledged ? (
          <section className="rounded-[24px] border border-amber-200/80 bg-amber-50/80 p-5 text-[#493919] shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={22}
              />
              <div>
                <h3 className="text-lg font-black">访问前提示</h3>
                <p className="mt-2 text-sm leading-7">
                  以下内容是需要人工核实的风险提示，不代表诊断或事实结论。请仅为学生支持目的查看最少必要信息，并避免复制、扩散或给学生贴标签。
                </p>
              </div>
            </div>
            <button
              className="mt-5 min-h-11 rounded-full bg-[#15231a] px-5 py-2.5 text-sm font-black text-white"
              onClick={onAcknowledge}
              type="button"
            >
              我已了解，查看最少必要信息
            </button>
          </section>
        ) : (
          <div className="space-y-5 text-[#17241b]">
            <section className="rounded-[24px] border border-white/80 bg-white/60 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={statusTones[safetyCase.status]}>
                  {statusLabels[safetyCase.status]}
                </StatusChip>
                <StatusChip
                  tone={
                    safetyCase.priority === "urgent" ? "critical" : "warning"
                  }
                >
                  {safetyCase.priority === "urgent"
                    ? "优先人工核实"
                    : "需要关注"}
                </StatusChip>
              </div>
              <h3 className="mt-5 text-xs font-black tracking-[0.12em] text-[#66796b]">
                最少必要上下文
              </h3>
              <p className="mt-2 text-base font-bold leading-7">
                {safetyCase.signal}
              </p>
              <p className="mt-3 rounded-2xl bg-[#edf3eb] p-4 text-sm leading-6 text-[#56685a]">
                {safetyCase.limitedContext}
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#718076]">学生代称</dt>
                  <dd className="mt-1 font-bold">{safetyCase.studentAlias}</dd>
                </div>
                <div>
                  <dt className="text-[#718076]">班级</dt>
                  <dd className="mt-1 font-bold">{safetyCase.className}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" size={20} />
                <h3 className="font-black">人工核实与可信任成年人指引</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {safetyCase.guidance.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <span aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-[#5d6d61]">
                风险提示需由受过培训的人员人工核实；系统不作诊断、不自动报警，也不能代替学校既有保护流程。
              </p>
            </section>

            <section className="rounded-[24px] border border-white/80 bg-white/60 p-5">
              <h3 className="font-black">负责人</h3>
              {safetyCase.assignee ? (
                <p className="mt-2 font-bold">{safetyCase.assignee}</p>
              ) : (
                <button
                  className="mt-3 min-h-11 rounded-full bg-[#dcead8] px-4 py-2 text-sm font-black text-[#27442e]"
                  onClick={onAssign}
                  type="button"
                >
                  分配给王老师 · 德育负责人
                </button>
              )}
              {safetyCase.transferredTo ? (
                <p className="mt-3 rounded-2xl bg-[#edf3eb] px-4 py-3 text-sm font-bold">
                  已转交给{safetyCase.transferredTo}
                </p>
              ) : null}
            </section>

            <section className="rounded-[24px] border border-white/80 bg-white/60 p-5">
              <h3 className="font-black">人工核实备注</h3>
              <p className="mt-1 text-xs leading-5 text-[#6a786e]">
                只记录可核实事实、已采取的支持行动和待办事项，不记录诊断性判断。
              </p>
              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="safety-note"
              >
                人工核实备注
              </label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-[#ccd8cd] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#52745a]"
                id="safety-note"
                onChange={(event) => setNote(event.target.value)}
                placeholder="例如：已联系班主任，等待进一步核实。"
                value={note}
              />
              <button
                className="mt-3 min-h-11 rounded-full bg-[#15231a] px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"
                disabled={!note.trim()}
                onClick={addNote}
                type="button"
              >
                添加备注
              </button>
              <div className="mt-4 space-y-3">
                {safetyCase.notes.map((item) => (
                  <article
                    className="rounded-2xl bg-[#f2f5f0] p-4"
                    key={item.id}
                  >
                    <p className="text-sm leading-6">{item.body}</p>
                    <p className="mt-2 text-xs text-[#718076]">
                      {item.author} · {formatTime(item.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {safetyCase.status !== "resolved" ? (
              <section className="rounded-[24px] border border-white/80 bg-white/60 p-5">
                <h3 className="font-black">转交与解决</h3>
                <label
                  className="mt-4 block text-sm font-bold"
                  htmlFor="transfer-target"
                >
                  转交对象
                </label>
                <select
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[#ccd8cd] bg-white px-3"
                  id="transfer-target"
                  onChange={(event) => setTransferTarget(event.target.value)}
                  value={transferTarget}
                >
                  <option>陈老师 · 年级负责人</option>
                  <option>周老师 · 学校心理老师</option>
                  <option>校级保护负责人</option>
                </select>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="min-h-11 rounded-full border border-[#9db09f] bg-white px-5 py-2.5 text-sm font-black"
                    onClick={() => onTransfer(transferTarget)}
                    type="button"
                  >
                    确认转交
                  </button>
                  <button
                    className="min-h-11 rounded-full bg-[#345c3d] px-5 py-2.5 text-sm font-black text-white"
                    onClick={() => setResolveOpen(true)}
                    type="button"
                  >
                    标记为已解决
                  </button>
                </div>
              </section>
            ) : (
              <section className="flex items-start gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <CheckCircle2 aria-hidden="true" className="mt-0.5" size={21} />
                <div>
                  <h3 className="font-black">已解决</h3>
                  <p className="mt-1 text-sm leading-6">
                    该状态仅表示负责人已完成并记录人工核实，不代表系统形成诊断结论。
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </Drawer>

      <Dialog
        description="只有在受过培训的负责人已完成必要人工核实、记录支持行动并确认后续责任人后，才可标记为解决。"
        onClose={() => setResolveOpen(false)}
        open={resolveOpen}
        title="确认解决保护性反馈"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="min-h-11 rounded-full border border-[#b9c6ba] bg-white px-5 text-sm font-black"
              onClick={() => setResolveOpen(false)}
              type="button"
            >
              返回继续核实
            </button>
            <button
              className="min-h-11 rounded-full bg-[#345c3d] px-5 text-sm font-black text-white"
              onClick={() => {
                onResolve()
                setResolveOpen(false)
              }}
              type="button"
            >
              确认已人工核实并解决
            </button>
          </div>
        }
      >
        <p className="text-sm leading-7 text-[#56685a]">
          解决确认必须基于人工核实，不得仅凭关键词、模型提示或未经核实的推断。
        </p>
      </Dialog>
    </>
  )
}

export default SafetyCaseDrawer
