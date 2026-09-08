import { useMemo, useState } from "react"
import { AlertTriangle, ShieldCheck } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type {
  AuditEvent,
  SafetyCase,
  SafetyCaseStatus,
} from "../../../app/prototype/types"
import { FilterBar } from "../../../components/shared/FilterBar"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import { SafetyCaseDrawer } from "./SafetyCaseDrawer"

export interface SafetyPageProps {
  onAuditEvent?: (event: AuditEvent) => void
}

type StatusFilter = "all" | SafetyCaseStatus

const statusLabels: Record<SafetyCaseStatus, string> = {
  new: "待核实",
  reviewing: "核实中",
  transferred: "已转交",
  resolved: "已解决",
}

const statusTones: Record<SafetyCaseStatus, "critical" | "warning" | "info" | "success"> =
  {
    new: "critical",
    reviewing: "warning",
    transferred: "info",
    resolved: "success",
  }

const localTimes = [
  "2026-07-25T16:00:00+08:00",
  "2026-07-25T16:05:00+08:00",
  "2026-07-25T16:10:00+08:00",
  "2026-07-25T16:15:00+08:00",
  "2026-07-25T16:20:00+08:00",
]

export function SafetyPage({ onAuditEvent }: SafetyPageProps) {
  const { addAuditEvent, safetyCases, updateSafetyCase } = usePrototype()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([])
  const [localAuditEvents, setLocalAuditEvents] = useState<AuditEvent[]>([])

  const selectedCase =
    safetyCases.find((item) => item.id === selectedId) ?? null
  const visibleCases = useMemo(
    () =>
      safetyCases.filter(
        (item) =>
          (statusFilter === "all" || item.status === statusFilter) &&
          (priorityFilter === "all" || item.priority === priorityFilter),
      ),
    [priorityFilter, safetyCases, statusFilter],
  )

  const appendAudit = (
    action: string,
    safetyCase: SafetyCase,
    actor = "王老师 · 德育负责人",
    purpose = "人工核实学生支持需求",
  ) => {
    const index = localAuditEvents.length
    const event: AuditEvent = {
      id: `audit-local-${safetyCase.id}-${index + 1}`,
      actor,
      action,
      objectType: "safety-case",
      objectId: safetyCase.id,
      purpose,
      occurredAt: localTimes[index] ?? "2026-07-25T16:30:00+08:00",
    }
    setLocalAuditEvents((current) => [...current, event])
    addAuditEvent(event)
    onAuditEvent?.(event)
  }

  const acknowledge = () => {
    if (!selectedCase) return
    setAcknowledgedIds((current) =>
      current.includes(selectedCase.id)
        ? current
        : [...current, selectedCase.id],
    )
    appendAudit("查看风险提示", selectedCase)
  }

  const assign = () => {
    if (!selectedCase) return
    updateSafetyCase(selectedCase.id, {
      assignee: "王老师 · 德育负责人",
      status: "reviewing",
      updatedAt: "2026-07-25T16:05:00+08:00",
    })
    appendAudit("分配保护性反馈", selectedCase)
  }

  const addNote = (body: string) => {
    if (!selectedCase) return
    updateSafetyCase(selectedCase.id, {
      notes: [
        ...selectedCase.notes,
        {
          id: `safety-note-local-${selectedCase.notes.length + 1}`,
          author: "王老师",
          body,
          createdAt: "2026-07-25T16:10:00+08:00",
        },
      ],
      updatedAt: "2026-07-25T16:10:00+08:00",
    })
    appendAudit("添加人工核实备注", selectedCase)
  }

  const transfer = (recipient: string) => {
    if (!selectedCase) return
    updateSafetyCase(selectedCase.id, {
      transferredTo: recipient,
      status: "transferred",
      updatedAt: "2026-07-25T16:15:00+08:00",
    })
    appendAudit(
      "转交保护性反馈",
      selectedCase,
      "王老师 · 德育负责人",
      `转交给${recipient}继续人工核实`,
    )
  }

  const resolve = () => {
    if (!selectedCase) return
    updateSafetyCase(selectedCase.id, {
      status: "resolved",
      updatedAt: "2026-07-25T16:20:00+08:00",
    })
    appendAudit(
      "记录核实结果并结案",
      selectedCase,
      "王老师 · 德育负责人",
      "完成保护性反馈流程",
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#53705b]">
            <ShieldCheck aria-hidden="true" size={18} />
            学生支持与人工核实
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#15231a] sm:text-4xl">
            保护性反馈
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#657469]">
            仅向获授权人员展示最少必要信息。风险提示仅用于人工核实，不作诊断、自动判断或学生标签。
          </p>
        </div>
        <StatusChip
          tone={
            safetyCases.some((item) => item.status === "new")
              ? "critical"
              : "success"
          }
        >
          {safetyCases.filter((item) => item.status === "new").length}{" "}
          项待人工核实
        </StatusChip>
      </header>

      <GlassSurface
        className="border-amber-200/70 bg-amber-50/55 p-4"
        weight="light"
      >
        <div className="flex items-start gap-3 text-sm leading-6 text-[#5a451c]">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={19}
          />
          <p>
            任何提示都可能不完整或存在误差。请遵循学校保护流程，由受过培训的负责人核实；如存在立即危险，应联系当地紧急服务。
          </p>
        </div>
      </GlassSurface>

      <FilterBar
        aria-label="保护性反馈筛选"
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="text-sm font-bold text-[#536458]">
          处理状态
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3"
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            value={statusFilter}
          >
            <option value="all">全部状态</option>
            <option value="new">待核实</option>
            <option value="reviewing">核实中</option>
            <option value="transferred">已转交</option>
            <option value="resolved">已解决</option>
          </select>
        </label>
        <label className="text-sm font-bold text-[#536458]">
          优先级
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3"
            onChange={(event) => setPriorityFilter(event.target.value)}
            value={priorityFilter}
          >
            <option value="all">全部优先级</option>
            <option value="urgent">优先人工核实</option>
            <option value="high">需要关注</option>
            <option value="normal">常规跟进</option>
          </select>
        </label>
      </FilterBar>

      <section
        aria-label="保护性反馈队列"
        className="grid gap-4 xl:grid-cols-2"
      >
        {visibleCases.map((item) => (
          <GlassSurface
            className="flex min-h-64 flex-col p-5 sm:p-6"
            key={item.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={statusTones[item.status]}>
                {statusLabels[item.status]}
              </StatusChip>
              <StatusChip
                tone={
                  item.priority === "urgent"
                    ? "critical"
                    : item.priority === "high"
                      ? "warning"
                      : "neutral"
                }
              >
                {item.priority === "urgent"
                  ? "优先人工核实"
                  : item.priority === "high"
                    ? "需要关注"
                    : "常规跟进"}
              </StatusChip>
            </div>
            <h2 className="mt-5 text-xl font-black text-[#17241b]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#627267]">
              {item.limitedContext}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#78857c]">学生</dt>
                <dd className="mt-1 font-bold">{item.studentAlias}</dd>
              </div>
              <div>
                <dt className="text-[#78857c]">负责人</dt>
                <dd className="mt-1 font-bold">{item.assignee ?? "待分配"}</dd>
              </div>
            </dl>
            <button
              aria-label={`查看${item.title}`}
              className="mt-auto min-h-11 self-start rounded-full bg-[#15231a] px-5 py-2.5 text-sm font-black text-white"
              onClick={() => setSelectedId(item.id)}
              type="button"
            >
              查看并人工核实
            </button>
          </GlassSurface>
        ))}
      </section>

      {localAuditEvents.length > 0 ? (
        <p
          className="rounded-2xl bg-[#e8f0e5] px-4 py-3 text-sm font-bold text-[#36503c]"
          role="status"
        >
          本页已新增 {localAuditEvents.length} 条审计记录。由于本任务不修改共享
          Context，这些增量仅保存在当前页面，并通过可选回调交给上层整合。
        </p>
      ) : null}

      <SafetyCaseDrawer
        acknowledged={
          selectedCase ? acknowledgedIds.includes(selectedCase.id) : false
        }
        onAcknowledge={acknowledge}
        onAddNote={addNote}
        onAssign={assign}
        onClose={() => setSelectedId(null)}
        onResolve={resolve}
        onTransfer={transfer}
        open={Boolean(selectedCase)}
        safetyCase={selectedCase}
      />
    </div>
  )
}

export default SafetyPage
