import { useMemo, useState } from "react"
import {
  AlertTriangle,
  FileText,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Conversation } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { FilterBar } from "../../../components/shared/FilterBar"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type ConversationFilter = "all" | Conversation["kind"]

type SimulatedAttachment = {
  name: string
  kind: "document"
  sizeLabel: string
}

type ConversationFilterOption = {
  value: ConversationFilter
  label: string
}

const filters: ConversationFilterOption[] = [
  { value: "all", label: "全部" },
  { value: "student", label: "学生" },
  { value: "parent", label: "家长" },
  { value: "group", label: "班级群" },
]

const simulatedAttachment: SimulatedAttachment = {
  name: "课堂复习卡.pdf",
  kind: "document",
  sizeLabel: "1.2 MB",
}

function conversationKindLabel(kind: Conversation["kind"]) {
  if (kind === "student") return "学生"
  if (kind === "parent") return "家长"
  return "班级群"
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function containsProtectionSignal(body: string) {
  return body.replace(/\s+/g, "").includes("我不敢回家")
}

export function MessagesPage() {
  const { conversations, sendMessage } = usePrototype()
  const [filter, setFilter] = useState<ConversationFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(() => conversations[0]?.id ?? "")
  const [draft, setDraft] = useState("")
  const [attachment, setAttachment] = useState<SimulatedAttachment | null>(null)
  const [protectionOpen, setProtectionOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN")
    return conversations.filter((conversation) => {
      const matchesKind = filter === "all" || conversation.kind === filter
      const searchable = [
        conversation.title,
        ...conversation.participantNames,
        conversation.messages.at(-1)?.body ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("zh-CN")
      return (
        matchesKind &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      )
    })
  }, [conversations, filter, query])

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ??
    conversations[0]

  function submitMessage() {
    const normalizedDraft = draft.trim()
    if (!selectedConversation || (!normalizedDraft && !attachment)) return

    if (containsProtectionSignal(normalizedDraft)) {
      setProtectionOpen(true)
      setStatusMessage("")
      return
    }

    const attachmentLine = attachment
      ? `[模拟附件：${attachment.name}，仅本地原型展示]`
      : ""
    const body = [normalizedDraft, attachmentLine].filter(Boolean).join("\n")
    sendMessage(selectedConversation.id, body)
    setDraft("")
    setAttachment(null)
    setStatusMessage("消息已在本地原型中发送")
  }

  function transferToProtectionDemo() {
    setProtectionOpen(false)
    setDraft("")
    setAttachment(null)
    setStatusMessage("已转入保护流程演示，未向任何外部系统发送")
  }

  return (
    <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-5 p-4 sm:p-6 xl:h-full xl:min-h-0">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#66806d]">
            教师沟通中心
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#15231a]">
            消息
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64746a]">
            与学生、家长和班级群保持联系。当前为高保真原型，消息和附件均不会传输到外部。
          </p>
        </div>
        <StatusChip tone="success">本地模拟</StatusChip>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(290px,0.36fr)_minmax(0,1fr)]">
        <GlassSurface
          className="flex min-h-[420px] flex-col overflow-hidden p-3 sm:p-4 lg:min-h-0"
          weight="card"
        >
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#728278]"
              size={17}
            />
            <input
              aria-label="搜索会话"
              className="w-full rounded-2xl border border-white/80 bg-white/55 py-3 pl-10 pr-4 text-sm text-[#1c2b21] outline-none transition focus:border-[#6d8a74] focus:ring-4 focus:ring-[#7f9c86]/15"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索联系人或消息"
              type="search"
              value={query}
            />
          </div>

          <FilterBar
            aria-label="会话类型"
            className="mt-3 flex flex-wrap gap-2"
          >
            {filters.map((item) => (
              <button
                aria-pressed={filter === item.value}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  filter === item.value
                    ? "bg-[#183124] text-white shadow-sm"
                    : "bg-white/55 text-[#516459] hover:bg-white/80"
                }`}
                key={item.value}
                onClick={() => setFilter(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </FilterBar>

          <div
            aria-label="会话列表"
            className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
          >
            {filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const active = conversation.id === selectedConversation?.id
                const latestMessage = conversation.messages.at(-1)
                return (
                  <button
                    aria-label={`打开${conversation.title}会话`}
                    aria-pressed={active}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${
                      active
                        ? "border-white bg-white/85 shadow-[0_12px_28px_rgba(49,79,58,0.10)]"
                        : "border-transparent bg-white/34 hover:border-white/80 hover:bg-white/62"
                    }`}
                    key={conversation.id}
                    onClick={() => {
                      setSelectedId(conversation.id)
                      setStatusMessage("")
                    }}
                    type="button"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[#1b2a20]">
                          {conversation.title}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-[#718077]">
                          {conversationKindLabel(conversation.kind)}
                        </span>
                      </span>
                      {conversation.unreadCount ? (
                        <span className="flex min-w-6 items-center justify-center rounded-full bg-[#d8aa55] px-2 py-1 text-[11px] font-black text-[#3b2a0c]">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-3 block truncate text-xs leading-5 text-[#68786e]">
                      {latestMessage?.body ?? "暂无消息"}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="grid flex-1 place-items-center px-6 py-12 text-center">
                <div>
                  <MessageCircle
                    aria-hidden="true"
                    className="mx-auto text-[#8da096]"
                    size={28}
                  />
                  <p className="mt-3 text-sm font-bold text-[#405247]">
                    没有匹配的会话
                  </p>
                  <button
                    className="mt-3 text-xs font-bold text-[#416b4d] underline underline-offset-4"
                    onClick={() => {
                      setFilter("all")
                      setQuery("")
                    }}
                    type="button"
                  >
                    清除筛选
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlassSurface>

        {selectedConversation ? (
          <GlassSurface
            className="flex min-h-[560px] min-w-0 flex-col overflow-hidden lg:min-h-0"
            weight="sheet"
          >
            <header className="flex items-center justify-between gap-4 border-b border-[#34583d]/10 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e4ede1] text-[#4f7258]">
                  {selectedConversation.kind === "group" ? (
                    <Users aria-hidden="true" size={19} />
                  ) : (
                    <MessageCircle aria-hidden="true" size={19} />
                  )}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-[#17251b]">
                    {selectedConversation.title}
                  </h2>
                  <p className="mt-1 truncate text-xs text-[#718077]">
                    {selectedConversation.participantNames.join(" · ")}
                  </p>
                </div>
              </div>
              <StatusChip tone="neutral">
                {conversationKindLabel(selectedConversation.kind)}
              </StatusChip>
            </header>

            <div
              aria-label={`${selectedConversation.title}的消息记录`}
              aria-live="polite"
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white/18 p-5 sm:p-6"
              role="log"
            >
              {selectedConversation.messages.map((message) => {
                const teacherMessage = message.senderRole === "teacher"
                return (
                  <article
                    className={`flex ${
                      teacherMessage ? "justify-end" : "justify-start"
                    }`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[82%] rounded-[22px] px-4 py-3 shadow-sm ${
                        teacherMessage
                          ? "rounded-br-md bg-[#173225] text-white"
                          : "rounded-bl-md border border-white/90 bg-white/82 text-[#223128]"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 text-[11px] font-bold ${
                          teacherMessage ? "text-white/65" : "text-[#77867d]"
                        }`}
                      >
                        <span>{message.senderName}</span>
                        <time dateTime={message.sentAt}>
                          {formatMessageTime(message.sentAt)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                        {message.body}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="border-t border-[#34583d]/10 bg-white/32 p-4 sm:p-5">
              {attachment ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/90 bg-white/72 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf1e9] text-[#52705a]">
                      <FileText aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#26362c]">
                        {attachment.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#738178]">
                        <span>{attachment.sizeLabel} · </span>
                        <span>仅本地预览，不会上传</span>
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label="移除模拟附件"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[#68786e] hover:bg-[#e7eee5]"
                    onClick={() => setAttachment(null)}
                    type="button"
                  >
                    <X aria-hidden="true" size={17} />
                  </button>
                </div>
              ) : null}

              <label className="sr-only" htmlFor="teacher-message-composer">
                输入消息
              </label>
              <textarea
                className="min-h-24 w-full resize-none rounded-[20px] border border-white/90 bg-white/76 px-4 py-3 text-sm leading-6 text-[#1d2d23] outline-none placeholder:text-[#94a198] focus:border-[#66836d] focus:ring-4 focus:ring-[#73927b]/15"
                id="teacher-message-composer"
                onChange={(event) => {
                  setDraft(event.target.value)
                  setStatusMessage("")
                }}
                placeholder="输入消息；保护性表达会先进入确认流程"
                value={draft}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-2.5 text-xs font-bold text-[#50645a] transition hover:bg-white"
                  onClick={() => setAttachment(simulatedAttachment)}
                  type="button"
                >
                  <Paperclip aria-hidden="true" size={16} />
                  添加模拟附件
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[#152c20] px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(22,49,34,0.20)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!draft.trim() && !attachment}
                  onClick={submitMessage}
                  type="button"
                >
                  <Send aria-hidden="true" size={16} />
                  发送消息
                </button>
              </div>
              {statusMessage ? (
                <p
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-[#4f7158]"
                  role="status"
                >
                  <ShieldCheck aria-hidden="true" size={15} />
                  {statusMessage}
                </p>
              ) : null}
            </div>
          </GlassSurface>
        ) : null}
      </div>

      <Dialog
        description="系统检测到可能涉及学生安全的表达。此处只演示教师端保护性分流，不会自动判断、报警或向外部发送数据。"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-full bg-[#edf1ec] px-5 py-3 text-sm font-bold text-[#405247]"
              onClick={() => setProtectionOpen(false)}
              type="button"
            >
              返回修改
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6c321f] px-5 py-3 text-sm font-black text-white"
              onClick={transferToProtectionDemo}
              type="button"
            >
              <ShieldCheck aria-hidden="true" size={17} />
              转入保护流程演示
            </button>
          </div>
        }
        onClose={() => setProtectionOpen(false)}
        open={protectionOpen}
        title="需要进一步确认"
      >
        <div className="rounded-[22px] border border-[#c78b64]/25 bg-[#fff5ed] p-4 text-[#5c3425]">
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
            />
            <div>
              <p className="text-sm font-black">不会作为普通消息发送</p>
              <p className="mt-1 text-sm leading-6">
                请先保留原意、核实上下文，并按学校既有保护流程由人工决定下一步。
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default MessagesPage
