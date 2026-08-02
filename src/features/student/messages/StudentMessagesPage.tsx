import { useMemo, useState } from "react"
import { HeartHandshake, MessageCircle, Send, ShieldCheck } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { Conversation } from "../../../app/prototype/types"
import { Dialog } from "../../../components/shared/Dialog"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

const STUDENT_ID = "student-lin-xiaoyu"

type StudentConversation = Conversation & { displayTitle: string }

function studentConversationTitle(conversation: Conversation) {
  return conversation.kind === "group" ? conversation.title : "李老师"
}

function displaySender(
  messageId: string,
  senderName: string,
  senderId: string,
) {
  if (messageId.startsWith("message-local-") || senderId === STUDENT_ID)
    return "我"
  return senderName
}

export function StudentMessagesPage() {
  const { conversations, sendMessage } = usePrototype()
  const allowedConversations = useMemo<StudentConversation[]>(
    () =>
      conversations
        .filter(
          (conversation) =>
            conversation.id === "conversation-student-xiaoyu" ||
            (conversation.kind === "group" &&
              conversation.participantIds.includes(STUDENT_ID) &&
              conversation.participantIds.includes("teacher-li")),
        )
        .map((conversation) => ({
          ...conversation,
          displayTitle: studentConversationTitle(conversation),
        })),
    [conversations],
  )
  const [selectedId, setSelectedId] = useState(
    () => allowedConversations[0]?.id ?? "",
  )
  const [draft, setDraft] = useState("")
  const [helpOpen, setHelpOpen] = useState(false)
  const [notice, setNotice] = useState("")

  const selected =
    allowedConversations.find(
      (conversation) => conversation.id === selectedId,
    ) ?? allowedConversations[0]
  const isTeacherConversation = selected?.kind === "student"

  function submitMessage() {
    const body = draft.trim()
    if (!selected || !body) return
    sendMessage(selected.id, body)
    setDraft("")
    setNotice(
      isTeacherConversation ? "普通反馈已发送" : "消息已发送到老师管理的班级群",
    )
  }

  function closeHelp() {
    setHelpOpen(false)
    setNotice("帮助信息只在本地显示，没有发送消息")
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#5f765f]">和老师保持联系</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#142319]">
            消息
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#65736a]">
            只可联系李老师和由老师管理的班级群。普通反馈会写入当前原型消息记录。
          </p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#ba6f4f]/25 bg-[#fff1e8]/85 px-5 font-black text-[#8a432b] shadow-sm"
          onClick={() => {
            setNotice("")
            setHelpOpen(true)
          }}
          type="button"
        >
          <HeartHandshake aria-hidden="true" size={20} />
          需要帮助
        </button>
      </header>

      {notice ? (
        <p
          className="rounded-2xl border border-white/80 bg-white/65 px-4 py-3 text-sm font-bold text-[#36533e] shadow-sm"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <div className="grid min-h-[650px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <GlassSurface className="p-3 sm:p-4">
          <h2 className="px-2 py-2 text-sm font-black text-[#506456]">
            可以联系
          </h2>
          <div className="mt-2 grid gap-2">
            {allowedConversations.map((conversation) => (
              <button
                aria-label={`打开${conversation.displayTitle}会话`}
                aria-pressed={selected?.id === conversation.id}
                className={`rounded-3xl border p-4 text-left transition ${
                  selected?.id === conversation.id
                    ? "border-white bg-white/80 shadow-md"
                    : "border-transparent bg-white/25 hover:bg-white/55"
                }`}
                key={conversation.id}
                onClick={() => {
                  setSelectedId(conversation.id)
                  setDraft("")
                  setNotice("")
                }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#dfead9] text-[#48664f]">
                    <MessageCircle aria-hidden="true" size={19} />
                  </span>
                  <StatusChip
                    tone={conversation.kind === "group" ? "info" : "success"}
                  >
                    {conversation.kind === "group" ? "老师管理" : "教师"}
                  </StatusChip>
                </div>
                <strong className="mt-3 block text-base text-[#1d3022]">
                  {conversation.displayTitle}
                </strong>
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#718078]">
                  {conversation.messages.at(-1)?.body ?? "还没有消息"}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-3xl bg-[#edf3e9]/75 p-4 text-xs leading-5 text-[#66766b]">
            <ShieldCheck
              aria-hidden="true"
              className="mb-2 text-[#5c7d63]"
              size={20}
            />
            家长和其他学生的私人会话不会出现在这里。
          </div>
        </GlassSurface>

        {selected ? (
          <GlassSurface
            className="flex min-h-0 flex-col overflow-hidden p-0"
            weight="sheet"
          >
            <header className="border-b border-white/70 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#728078]">
                    {selected.kind === "group"
                      ? "由李老师管理"
                      : "你的数学老师"}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#18281d]">
                    {selected.displayTitle}
                  </h2>
                </div>
                <StatusChip tone="success">原型消息</StatusChip>
              </div>
            </header>

            <ol
              aria-label={`与${selected.displayTitle}的消息记录`}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-6 sm:px-6"
              role="log"
            >
              {selected.messages.map((message) => {
                const mine =
                  message.senderId === STUDENT_ID ||
                  message.id.startsWith("message-local-")
                return (
                  <li
                    className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      mine
                        ? "ml-auto bg-[#21412d] text-white"
                        : "mr-auto border border-white/80 bg-white/75 text-[#26372b]"
                    }`}
                    key={message.id}
                  >
                    <span
                      className={`block text-xs font-bold ${
                        mine ? "text-white/70" : "text-[#6d7d72]"
                      }`}
                    >
                      {displaySender(
                        message.id,
                        message.senderName,
                        message.senderId,
                      )}
                    </span>
                    <p className="mt-1">{message.body}</p>
                  </li>
                )
              })}
            </ol>

            <div className="border-t border-white/70 bg-white/28 p-4 sm:p-5">
              {isTeacherConversation ? (
                <div
                  className="mb-3 flex flex-wrap gap-2"
                  aria-label="普通反馈快捷输入"
                >
                  {["我有一点没听懂", "我完成任务了", "我想再看一个例子"].map(
                    (feedback) => (
                      <button
                        className="rounded-full border border-white/80 bg-white/60 px-3 py-2 text-xs font-bold text-[#405646]"
                        key={feedback}
                        onClick={() => setDraft(feedback)}
                        type="button"
                      >
                        普通反馈：{feedback}
                      </button>
                    ),
                  )}
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex-1">
                  <span className="sr-only">
                    {isTeacherConversation ? "给李老师留言" : "在班级群留言"}
                  </span>
                  <textarea
                    aria-label={
                      isTeacherConversation ? "给李老师留言" : "在班级群留言"
                    }
                    className="min-h-24 w-full resize-none rounded-3xl border border-white/85 bg-white/70 px-4 py-3 text-sm text-[#203126] outline-none focus:border-[#5f8067] focus:ring-4 focus:ring-[#6e9276]/15 sm:min-h-14"
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="写下你的普通学习反馈…"
                    value={draft}
                  />
                </label>
                <button
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#183023] px-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!draft.trim()}
                  onClick={submitMessage}
                  type="button"
                >
                  <Send aria-hidden="true" size={18} />
                  {isTeacherConversation ? "发送给李老师" : "发送到班级群"}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#78857d]">
                这是本地交互原型，不会向真实教师或班级群发送。
              </p>
            </div>
          </GlassSurface>
        ) : null}
      </div>

      <Dialog
        footer={
          <button
            className="min-h-12 rounded-2xl bg-[#183023] px-5 font-black text-white"
            onClick={closeHelp}
            type="button"
          >
            我知道了，关闭
          </button>
        }
        onClose={closeHelp}
        open={helpOpen}
        title="现在需要帮助吗？"
      >
        <div className="space-y-4">
          <p className="rounded-3xl bg-[#fff0e6] p-4 font-bold leading-7 text-[#7d402c]">
            如果你感到害怕、不安全，或有人正在伤害你，请尽快告诉一位你信任的成年人。
          </p>
          <section className="rounded-3xl border border-white/80 bg-white/60 p-5">
            <h3 className="font-black text-[#203126]">可以找谁</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f6f64]">
              可以找家长或监护人、李老师、班主任、学校心理老师，或其他可信任的成年人。你不需要独自处理。
            </p>
          </section>
          <section className="rounded-3xl border border-[#c36a4a]/20 bg-[#fff6ef] p-5">
            <h3 className="font-black text-[#7c3e29]">如果有立即危险</h3>
            <p className="mt-2 text-sm leading-6 text-[#744f40]">
              请离开危险位置，立即呼叫身边可信任的成年人，并联系当地紧急服务。
            </p>
          </section>
          <p className="text-xs leading-5 text-[#77847c]">
            这个入口只显示帮助指引，不会作为普通消息发送，也不会真实联系外部系统。
          </p>
        </div>
      </Dialog>
    </section>
  )
}

export default StudentMessagesPage
