import { useMemo, useState } from "react"
import { LockKeyhole, MessageCircle, Send, UserRoundCheck } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { parentLearningSnapshot } from "../../../app/prototype/parentLearning"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

const BOUND_STUDENT_ID = "student-lin-xiaoyu"

function senderLabel(message: {
  senderName: string
  senderRole: string
}) {
  if (message.senderRole === "parent") return "我"
  return message.senderName
}

function messageTime(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function ParentMessagesPage() {
  const { conversations, addConversation, markConversationRead, sendMessage, students, tasks, quizzes } = usePrototype()
  const [draft, setDraft] = useState("")
  const [notice, setNotice] = useState("")

  const conversation = useMemo(
    () =>
      conversations.find(
        (item) =>
          item.kind === "parent" &&
          item.boundStudentId === BOUND_STUDENT_ID &&
          item.participantIds.includes("teacher-li") &&
          item.participantIds.includes("parent-lin-xiaoyu"),
      ),
    [conversations],
  )

  function submitMessage() {
    const body = draft.trim()
    if (!conversation || !body) return
    sendMessage(conversation.id, body, {
      senderId: "parent-lin-xiaoyu",
      senderName: "林妈妈",
      senderRole: "parent",
    })
    setDraft("")
    setNotice("消息已保存到本地原型，不会真实发送给老师")
  }

  const boundStudent = students.find((student) => student.id === BOUND_STUDENT_ID)
  const learning = boundStudent ? parentLearningSnapshot(boundStudent, tasks, quizzes) : null

  function startConversation() {
    const body = draft.trim()
    if (!boundStudent || !body) return
    addConversation({
      id: `conversation-parent-${boundStudent.id}-${Date.now()}`,
      kind: "parent",
      title: `${boundStudent.name}家长`,
      participantIds: ["teacher-li", "parent-lin-xiaoyu"],
      participantNames: ["李老师", boundStudent.guardianName],
      boundStudentId: boundStudent.id,
      unreadCount: 1,
      unreadByRole: { teacher: 1, parent: 0 },
      messages: [{
        id: `message-parent-first-${Date.now()}`,
        senderId: "parent-lin-xiaoyu",
        senderName: boundStudent.guardianName,
        senderRole: "parent",
        body,
        sentAt: new Date().toISOString(),
      }],
    })
    setDraft("")
  }

  if (!conversation) {
    return (
      <section className="role-page role-page-flow role-page-medium">
        <header className="role-page-header">
          <div>
            <p className="role-page-kicker">家校沟通</p>
            <h1 className="role-page-title">联系李老师</h1>
            {boundStudent && <p className="mt-2 text-sm font-bold text-[#5f7064]">{boundStudent.name} · {boundStudent.className}</p>}
          </div>
        </header>
        {learning && <div aria-label="孩子当前学习进展" role="region" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-[#dce7dc] bg-white/80 px-5 py-3 text-sm text-[#506b57]"><span><strong className="text-[#2c5035]">{learning.pendingCount}</strong> 项待完成</span><span><strong className="text-[#2c5035]">{learning.completedCount}</strong> 项已提交</span><span><strong className="text-[#2c5035]">{learning.answeredInquiryCount}</strong> 次疑问已解答</span><a className="ml-auto inline-flex min-h-10 items-center font-black text-[#365f40]" href="#/parent/home">查看学习近况</a></div>}
        <GlassSurface className="p-8 text-center">
          <h2 className="text-xl font-black text-[#203126]">
            还没有家校消息
          </h2>
          <p className="role-page-description mx-auto">
            {boundStudent ? "还没有关于孩子的家校会话。写下第一条留言后，会在这里持续记录。" : "先完成学生绑定，之后这里会出现与老师的沟通记录。"}
          </p>
          {boundStudent && <div className="mx-auto mt-6 max-w-xl text-left"><label className="block text-sm font-black text-[#405448]" htmlFor="parent-first-message">给李老师的第一条留言</label><textarea className="mt-2 min-h-28 w-full rounded-2xl border border-[#cbdccb] bg-white px-4 py-3 text-sm outline-none focus:border-[#5f8067] focus:ring-4 focus:ring-[#6e9276]/15" id="parent-first-message" onChange={(event) => setDraft(event.target.value)} placeholder="写下与孩子学习陪伴有关的问题…" value={draft} /><button className="mt-3 min-h-11 rounded-xl bg-[#dcefd9] px-5 text-sm font-black text-[#355a3d] disabled:opacity-45" disabled={!draft.trim()} onClick={startConversation} type="button">开始家校沟通</button><p className="mt-3 text-xs text-[#78867d]">消息保存在本地原型中，不会发送到真实学校系统。</p></div>}
        </GlassSurface>
      </section>
    )
  }

  return (
    <section className="role-page role-page-flow role-page-fixed app-fixed-page role-page-medium">
      <header className="role-page-header">
        <div>
          <p className="role-page-kicker">
            家校沟通
          </p>
          <h1 className="role-page-title">
            联系李老师
          </h1>
          <p className="mt-2 text-sm font-bold text-[#5f7064]">
            {boundStudent?.name ?? "林晓雨"} · {boundStudent?.className ?? "五年级（2）班"}
          </p>
        </div>
        <StatusChip tone="success">已绑定当前学生</StatusChip>
      </header>

      {learning && <div aria-label="孩子当前学习进展" role="region" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-[#dce7dc] bg-white/80 px-5 py-3 text-sm text-[#506b57]"><span><strong className="text-[#2c5035]">{learning.pendingCount}</strong> 项待完成</span><span><strong className="text-[#2c5035]">{learning.completedCount}</strong> 项已提交</span><span><strong className="text-[#2c5035]">{learning.answeredInquiryCount}</strong> 次疑问已解答</span><a className="ml-auto inline-flex min-h-10 items-center font-black text-[#365f40]" href="#/parent/home">查看学习近况</a></div>}

      <GlassSurface
        className="app-fixed-body flex min-h-[650px] flex-col overflow-hidden p-0 lg:min-h-0"
        weight="sheet"
      >
        {conversation.unreadByRole?.parent ? (
          <button
            className="border-b border-[#c8dec9] bg-[#edf6e9] px-5 py-3 text-left text-sm font-black text-[#315d3d]"
            onClick={() => markConversationRead(conversation.id, "parent")}
            type="button"
          >
            {conversation.unreadByRole.parent} 条新消息 · 标记已读
          </button>
        ) : null}
        <div className="border-b border-white/70 bg-white/30 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#dfead9] text-[#4c7055]">
              <UserRoundCheck aria-hidden="true" size={23} />
            </span>
            <div className="min-w-0">
              <h2 className="font-black text-[#203126]">李老师</h2>
              <p className="mt-1 text-sm text-[#68786d]">
                五年级数学 · 家校联系
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-white/70 bg-[#f3f7ef]/70 px-5 py-4 sm:px-6">
          <div className="flex gap-3">
            <LockKeyhole
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#5b735f]"
              size={18}
            />
            <div className="text-xs leading-5 text-[#627267]">
              <p className="font-black text-[#42594a]">
                只显示您与李老师围绕{boundStudent?.name ?? "林晓雨"}学习陪伴的沟通。
              </p>
              <p className="mt-1">
                不会展示同学信息、完整学习对话或敏感反馈；请避免在原型中填写真实隐私资料。
              </p>
            </div>
          </div>
        </div>

        <ol
          aria-label="与李老师的家校消息记录"
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-7"
          role="log"
        >
          {conversation.messages.map((message) => {
            const mine = message.senderRole === "parent"
            return (
              <li
                className={`max-w-[88%] rounded-[1.6rem] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%] ${
                  mine
                    ? "ml-auto rounded-br-md border border-[#c9e2c8] bg-[#dcefd9] text-[#355a3d]"
                    : "rounded-bl-md border border-white/80 bg-white/72 text-[#314239]"
                }`}
                key={message.id}
              >
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className={mine ? "text-[#729177]" : "text-[#687a6e]"}>
                    {senderLabel(message)}
                  </span>
                  <time className={mine ? "text-[#8aa48d]" : "text-[#839087]"}>
                    {messageTime(message.sentAt)}
                  </time>
                </div>
                <p className="mt-1 font-medium">{message.body}</p>
              </li>
            )
          })}
        </ol>

        <div className="border-t border-white/75 bg-white/35 p-4 sm:p-6">
          {notice ? (
            <p
              className="mb-3 rounded-2xl bg-[#e7f1e2] px-4 py-3 text-sm font-bold text-[#405e47]"
              role="status"
            >
              {notice}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-black text-[#405448]">
                给李老师留言
              </span>
              <textarea
                aria-label="给李老师留言"
                className="min-h-28 w-full resize-none rounded-3xl border border-white/85 bg-white/75 px-4 py-3 text-sm text-[#203126] outline-none focus:border-[#5f8067] focus:ring-4 focus:ring-[#6e9276]/15 sm:min-h-20"
                onChange={(event) => {
                  setDraft(event.target.value)
                  setNotice("")
                }}
                onKeyDown={(event) => {
                  if (
                    event.key !== "Enter" ||
                    event.shiftKey ||
                    event.nativeEvent.isComposing
                  ) return
                  event.preventDefault()
                  submitMessage()
                }}
                placeholder="写下与学习陪伴有关的问题或反馈…"
                value={draft}
              />
            </label>
            <button
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#c9e2c8] bg-[#dcefd9] px-6 font-black text-[#355a3d] shadow-[0_12px_28px_rgba(84,126,87,.12)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!draft.trim()}
              onClick={submitMessage}
              type="button"
            >
              <Send aria-hidden="true" size={18} />
              发送给李老师
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-[#78867d]">
            <MessageCircle aria-hidden="true" size={15} />
            Enter 发送 · Shift+Enter 换行。本页面消息不会上传，也不会发送到真实学校系统。
          </p>
        </div>
      </GlassSurface>
    </section>
  )
}

export default ParentMessagesPage
