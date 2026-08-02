import { useMemo, useState } from "react"
import { ClipboardList, LockKeyhole } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AuditEvent } from "../../../app/prototype/types"
import { EmptyState } from "../../../components/shared/EmptyState"
import { FilterBar } from "../../../components/shared/FilterBar"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

export interface AuditPageProps {
  localEvents?: AuditEvent[]
}

function dateKey(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function objectLabel(event: AuditEvent) {
  const labels: Record<AuditEvent["objectType"], string> = {
    "safety-case": "保护性反馈",
    settings: "系统设置",
    invitation: "邀请与绑定",
    lesson: "课堂",
    task: "任务",
  }
  return labels[event.objectType]
}

export function AuditPage({ localEvents = [] }: AuditPageProps) {
  const { auditEvents } = usePrototype()
  const [actor, setActor] = useState("all")
  const [action, setAction] = useState("all")
  const [date, setDate] = useState("")

  const events = useMemo(
    () =>
      [...auditEvents, ...localEvents].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      ),
    [auditEvents, localEvents],
  )
  const actors = useMemo(
    () => Array.from(new Set(events.map((event) => event.actor))),
    [events],
  )
  const actions = useMemo(
    () => Array.from(new Set(events.map((event) => event.action))),
    [events],
  )
  const visibleEvents = events.filter(
    (event) =>
      (actor === "all" || event.actor === actor) &&
      (action === "all" || event.action === action) &&
      (!date || dateKey(event.occurredAt) === date),
  )
  const localIds = new Set(localEvents.map((event) => event.id))

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#53705b]">
            <ClipboardList aria-hidden="true" size={18} />
            受控访问与操作留痕
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#15231a] sm:text-4xl">
            审计记录
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#657469]">
            查看谁在什么时间、因何目的访问或处理了受控对象。记录只展示必要的操作元数据，不展示学生表达、普通对话或未经核实的敏感内容。
          </p>
        </div>
        <StatusChip tone="info">{events.length} 条可见记录</StatusChip>
      </header>

      {localEvents.length > 0 ? (
        <GlassSurface
          className="border-sky-200/70 bg-sky-50/55 p-4"
          weight="light"
        >
          <div className="flex items-start gap-3 text-sm leading-6 text-[#345366]">
            <LockKeyhole
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={19}
            />
            <p>
              当前含 {localEvents.length} 条页面本地新增事件。它们通过可选 props
              接入，仅用于原型联调；主代理后续可在扩展 Context 后统一持久化。
            </p>
          </div>
        </GlassSurface>
      ) : null}

      <FilterBar
        aria-label="审计记录筛选"
        className="grid gap-3 md:grid-cols-3"
      >
        <label className="text-sm font-bold text-[#536458]">
          操作人
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3"
            onChange={(event) => setActor(event.target.value)}
            value={actor}
          >
            <option value="all">全部操作人</option>
            {actors.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-[#536458]">
          操作类型
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3"
            onChange={(event) => setAction(event.target.value)}
            value={action}
          >
            <option value="all">全部操作</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-[#536458]">
          发生日期
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-white/90 bg-white/75 px-3"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>
      </FilterBar>

      {visibleEvents.length === 0 ? (
        <EmptyState
          action={
            <button
              className="min-h-11 rounded-full bg-[#15231a] px-5 text-sm font-black text-white"
              onClick={() => {
                setActor("all")
                setAction("all")
                setDate("")
              }}
              type="button"
            >
              清除筛选
            </button>
          }
          description="请调整操作人、操作类型或日期范围。"
          title="没有匹配的审计记录"
        />
      ) : (
        <section aria-label="审计事件列表" className="space-y-3">
          <div className="hidden grid-cols-[1.1fr_1.2fr_1fr_1.35fr_1fr] gap-4 px-5 text-xs font-black tracking-[0.08em] text-[#6b796f] lg:grid">
            <span>操作人</span>
            <span>操作</span>
            <span>对象</span>
            <span>目的</span>
            <span>时间</span>
          </div>
          {visibleEvents.map((event) => (
            <GlassSurface
              className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1.2fr_1fr_1.35fr_1fr] lg:items-center"
              key={event.id}
              weight="light"
            >
              <div>
                <p className="text-xs font-black text-[#718076] lg:hidden">
                  操作人
                </p>
                <p className="mt-1 font-black text-[#1c2a21] lg:mt-0">
                  {event.actor}
                </p>
                {localIds.has(event.id) ? (
                  <StatusChip className="mt-2" tone="info">
                    页面本地新增事件
                  </StatusChip>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-black text-[#718076] lg:hidden">
                  操作
                </p>
                <p className="mt-1 font-bold lg:mt-0">{event.action}</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#718076] lg:hidden">
                  对象
                </p>
                <p className="mt-1 text-sm font-bold lg:mt-0">
                  {objectLabel(event)}
                </p>
                <p className="mt-1 break-all text-xs text-[#718076]">
                  {event.objectId}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-[#718076] lg:hidden">
                  目的
                </p>
                <p className="mt-1 text-sm leading-6 lg:mt-0">
                  {event.purpose}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-[#718076] lg:hidden">
                  时间
                </p>
                <time
                  className="mt-1 block text-sm font-bold lg:mt-0"
                  dateTime={event.occurredAt}
                >
                  {formatDateTime(event.occurredAt)}
                </time>
              </div>
            </GlassSurface>
          ))}
        </section>
      )}
    </div>
  )
}

export default AuditPage
