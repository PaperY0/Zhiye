import { useMemo, useState } from "react"

import {
  BookOpen,
  Brain,
  History,
  Lightbulb,
  MessageCircleQuestion,
  Mic,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react"

import { GlassSurface } from "../../../components/shared/GlassSurface"

import { usePrototype } from "../../../app/prototype/PrototypeContext"

import { StatusChip } from "../../../components/shared/StatusChip"
import { Dialog } from "../../../components/shared/Dialog"
import { generateDraft } from "../../../services/localAi"
import type { LearningTopic } from "../../../app/prototype/types"

type TopicId = string

type LearningReply = {
  explanation: string

  example: string

  card: string

  followUp: string
}

type LocalAiDraft<TContent> = {
  draft: true

  source: "deepseek"

  content: TContent
}

type StudentEntry = {
  id: string

  kind: "student"

  body: string
}

type AssistantEntry = {
  id: string

  kind: "assistant"

  reply: LearningReply
}

type RetellEntry = {
  id: string

  kind: "retell"

  body: string

}

type RetellFollowUpEntry = {
  id: string

  kind: "retell-follow-up"

  followUp: string
}

type LearningRequest = {
  topic: string

  recap: string

  question: string
}

type RetellRequest = {
  topic: string

  retell: string
}

type LoadingEntry = {
  id: string

  kind: "loading"

  request: LearningRequest | RetellRequest

  responseKind: "learning-reply" | "retell-follow-up"
}

type ErrorEntry = {
  id: string

  kind: "error"

  error: string

  request: LearningRequest | RetellRequest

  responseKind: "learning-reply" | "retell-follow-up"
}

type ConversationEntry =
  | StudentEntry
  | AssistantEntry
  | RetellEntry
  | RetellFollowUpEntry
  | LoadingEntry
  | ErrorEntry

function createEntryId(prefix: string, index: number) {
  return `${prefix}-${index}`
}

function isLearningReply(value: unknown): value is LearningReply {
  if (!value || typeof value !== "object") return false

  const reply = value as Partial<LearningReply>
  return [reply.explanation, reply.example, reply.card, reply.followUp].every(
    (field) => typeof field === "string" && field.trim().length > 0,
  )
}

function isRetellFollowUp(value: unknown): value is { followUp: string } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { followUp?: unknown }).followUp === "string" &&
    (value as { followUp: string }).followUp.trim().length > 0
  )
}

function isLocalAiDraft<TContent>(
  value: unknown,
  isContent: (content: unknown) => content is TContent,
): value is LocalAiDraft<TContent> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const response = value as Record<string, unknown>
  return (
    response.draft === true &&
    response.source === "deepseek" &&
    isContent(response.content)
  )
}

export function LearningPage() {
  const { addStudentTimelineEvent, deleteLearningTopic, learningTopics, upsertLearningTopic } = usePrototype()
  const [activeTopicId, setActiveTopicId] = useState<TopicId>(() => learningTopics[0]?.id ?? "")
  const [topicEditorOpen, setTopicEditorOpen] = useState(false)
  const [topicDraft, setTopicDraft] = useState<LearningTopic | null>(null)

  const [conversations, setConversations] =
    useState<Record<TopicId, ConversationEntry[]>>({})

  const [question, setQuestion] = useState("")

  const [voiceActive, setVoiceActive] = useState(false)

  const [retellOpen, setRetellOpen] = useState(false)

  const [retell, setRetell] = useState("")

  const activeTopic = useMemo(
    () => learningTopics.find((topic) => topic.id === activeTopicId) ?? learningTopics[0],

    [activeTopicId, learningTopics],
  )

  const activeEntries = conversations[activeTopicId] ?? []

  function selectTopic(topicId: TopicId) {
    setActiveTopicId(topicId)

    setQuestion("")

    setVoiceActive(false)

    setRetellOpen(false)

    setRetell("")
  }

  function replaceEntry(
    topicId: TopicId,
    entryId: string,
    nextEntry: ConversationEntry,
  ) {
    setConversations((current) => ({
      ...current,
      [topicId]: (current[topicId] ?? []).map((entry) =>
        entry.id === entryId ? nextEntry : entry,
      ),
    }))
  }

  async function generateLearningReply(
    topicId: TopicId,
    entryId: string,
    request: LearningRequest,
  ) {
    try {
      const response = await generateDraft("learning-reply", request)
      if (!isLocalAiDraft(response, isLearningReply)) {
        throw new Error("学习回复格式不正确")
      }

      replaceEntry(topicId, entryId, {
        id: entryId,
        kind: "assistant",
        reply: response.content,
      })
    } catch (error) {
      replaceEntry(topicId, entryId, {
        id: entryId,
        kind: "error",
        error: error instanceof Error ? error.message : "学习回复生成失败",
        request,
        responseKind: "learning-reply",
      })
    }
  }

  async function generateRetellFollowUp(
    topicId: TopicId,
    entryId: string,
    request: RetellRequest,
  ) {
    try {
      const response = await generateDraft("retell-follow-up", request)
      if (!isLocalAiDraft(response, isRetellFollowUp)) {
        throw new Error("复述追问格式不正确")
      }

      replaceEntry(topicId, entryId, {
        id: entryId,
        kind: "retell-follow-up",
        followUp: response.content.followUp,
      })
    } catch (error) {
      replaceEntry(topicId, entryId, {
        id: entryId,
        kind: "error",
        error: error instanceof Error ? error.message : "复述追问生成失败",
        request,
        responseKind: "retell-follow-up",
      })
    }
  }

  function sendQuestion(body: string) {
    if (!activeTopic) return
    const normalized = body.trim()

    if (!normalized) return

    addStudentTimelineEvent("student-lin-xiaoyu", {
      id: `timeline-learning-question-${Date.now()}`,
      type: "message",
      title: `提问：${activeTopic.title}`,
      detail: normalized,
      occurredAt: new Date().toISOString(),
      fact: true,
    })

    const request: LearningRequest = {
      topic: activeTopic.title,
      recap: activeTopic.summary,
      question: normalized,
    }
    const entryId = createEntryId(`${activeTopicId}-assistant`, Date.now())

    setConversations((current) => {
      const activeConversation = current[activeTopicId] ?? []
      const nextIndex = activeConversation.length

      return {
        ...current,

        [activeTopicId]: [
          ...activeConversation,

          {
            id: createEntryId(`${activeTopicId}-student`, nextIndex),

            kind: "student",

            body: normalized,
          },

          {
            id: entryId,

            kind: "loading",

            request,

            responseKind: "learning-reply",
          },
        ],
      }
    })

    setQuestion("")

    void generateLearningReply(activeTopicId, entryId, request)
  }

  function toggleVoice() {
    if (voiceActive) {
      setVoiceActive(false)

      setQuestion("我怎么判断分子和分母要怎样变化？")

      if (activeTopicId !== "fractions") setActiveTopicId("fractions")

      return
    }

    setVoiceActive(true)
  }

  function submitRetell() {
    if (!activeTopic) return
    const normalized = retell.trim()

    if (!normalized) return

    const request: RetellRequest = { topic: activeTopic.title, retell: normalized }
    const entryId = createEntryId(`${activeTopicId}-retell-follow-up`, Date.now())

    setConversations((current) => ({
      ...current,

      [activeTopicId]: [
        ...(current[activeTopicId] ?? []),

        {
          id: createEntryId(
            `${activeTopicId}-retell`,

            (current[activeTopicId] ?? []).length,
          ),

          kind: "retell",

          body: normalized,
        },

        {
          id: entryId,

          kind: "loading",

          request,

          responseKind: "retell-follow-up",
        },
      ],
    }))

    setRetell("")

    setRetellOpen(false)

    void generateRetellFollowUp(activeTopicId, entryId, request)
  }

  function retryEntry(topicId: TopicId, entry: ErrorEntry) {
    const loadingEntry: LoadingEntry = {
      id: entry.id,
      kind: "loading",
      request: entry.request,
      responseKind: entry.responseKind,
    }
    replaceEntry(topicId, entry.id, loadingEntry)

    if (entry.responseKind === "learning-reply") {
      void generateLearningReply(topicId, entry.id, entry.request as LearningRequest)
      return
    }

    void generateRetellFollowUp(topicId, entry.id, entry.request as RetellRequest)
  }

  return (
    <section className="role-page role-page-flow role-page-fixed app-fixed-page text-[#19271e]">
      <GlassSurface className="overflow-hidden p-5 sm:p-7" weight="light">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="role-page-kicker inline-flex items-center gap-2">
              <Sparkles aria-hidden="true" size={16} />
              和知识点聊一聊
            </span>
            <h1 className="role-page-title">
              知识点学习
            </h1>
            <p className="role-page-description">
              从一个问题开始，先理解，再用自己的话讲出来。这里的对话和语音都是本地原型演示。
            </p>
          </div>
          <div className="rounded-[22px] border border-white/80 bg-white/55 px-4 py-3 text-sm leading-6 text-[#627369]">
            <strong className="block text-[#294332]">模拟语音说明</strong>
            不会采集或上传真实音频
          </div>
        </div>
      </GlassSurface>

      <div className="app-fixed-body grid min-h-[680px] gap-4 xl:min-h-0 xl:grid-cols-[320px_minmax(0,1fr)]">
        <GlassSurface className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-5" weight="card">
          <div>
            <div className="flex items-center gap-2 text-[#41634a]">
              <History aria-hidden="true" size={18} />
              <h2 className="text-sm font-black">按知识点整理的学习历史</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#748178]">
              选择一个知识点，会保留这个主题在本次页面中的对话。
            </p>
          </div>

          <nav aria-label="学习历史" className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#748178]">{learningTopics.length} 个主题</span>
              <button className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[#e7efe4] px-3 text-xs font-black text-[#3e6247]" onClick={() => {
                const id = `topic-${Date.now()}`
                setTopicDraft({ id, title: "新知识点", subject: "数学", summary: "填写这个知识点最重要的理解。", lastStudied: "刚刚", prompts: ["我最不明白的地方是什么？"] })
                setTopicEditorOpen(true)
              }} type="button"><Plus aria-hidden="true" size={14} />新增</button>
            </div>
            {learningTopics.map((topic) => {
              const selected = topic.id === activeTopicId

              return (
                <div className={`rounded-[22px] border p-2 ${selected ? "border-[#9db69f] bg-[#e9f0e6]" : "border-white/80 bg-white/48"}`} key={topic.id}>
                <button
                  aria-label={`继续学习${topic.title}`}
                  aria-pressed={selected}
                  className="w-full rounded-[16px] p-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#426c4c]/20"
                  onClick={() => selectTopic(topic.id)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-[#203027]">
                      {topic.title}
                    </span>
                    <span className="text-[11px] font-bold text-[#708078]">
                      {topic.lastStudied}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#68786e]">
                    {topic.summary}
                  </span>
                </button>
                <div className="flex justify-end gap-2 px-2 pb-1">
                  <button aria-label={`编辑${topic.title}`} className="grid size-8 place-items-center rounded-full bg-white/70" onClick={() => { setTopicDraft(structuredClone(topic)); setTopicEditorOpen(true) }} type="button"><Pencil aria-hidden="true" size={14} /></button>
                  <button aria-label={`删除${topic.title}`} className="grid size-8 place-items-center rounded-full bg-[#fff4f1] text-[#934f43]" onClick={() => { deleteLearningTopic(topic.id); if (activeTopicId === topic.id) setActiveTopicId(learningTopics.find((item) => item.id !== topic.id)?.id ?? "") }} type="button"><Trash2 aria-hidden="true" size={14} /></button>
                </div>
                </div>
              )
            })}
          </nav>
        </GlassSurface>

        <GlassSurface
          className="flex min-h-[620px] flex-col overflow-hidden p-0 xl:min-h-0"
          weight="sheet"
        >
          <header className="border-b border-[#dce7dc]/80 px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#66796b]">
                  {activeTopic?.subject ?? "学习"} · 当前主题
                </p>
                <h2
                  className="mt-1 text-2xl font-black"
                  id="learning-topic-title"
                >
                  {activeTopic?.title ?? "还没有知识点"}
                </h2>
              </div>
              <StatusChip tone="success">循序理解</StatusChip>
            </div>
          </header>

          <div
            aria-live="polite"
            aria-label={`${activeTopic?.title ?? "知识点"}学习对话`}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-7"
            role="log"
          >
            {!activeTopic ? (
              <div className="m-auto text-center"><h3 className="text-xl font-black">还没有知识点</h3><p className="mt-2 text-sm text-[#6b796f]">从左侧新增一个主题开始学习。</p></div>
            ) : activeEntries.length === 0 ? (
              <div className="m-auto max-w-xl text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-[22px] bg-[#e8f0e6] text-[#45694e]">
                  <Brain aria-hidden="true" size={26} />
                </span>
                <h3 className="mt-4 text-xl font-black">
                  先选一个你想弄明白的问题
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6b796f]">
                  我会给出思路、生活例子和一张可以带走的知识卡，不急着只看答案。
                </p>
              </div>
            ) : null}

            {activeEntries.map((entry) => {
              if (entry.kind === "student") {
                return (
                  <div
                    className="ml-auto max-w-[85%] rounded-[24px_24px_8px_24px] border border-[#c8dfc9] bg-[#e5f2e4] px-5 py-4 text-sm font-bold leading-6 text-[#416449] shadow-[0_12px_28px_rgba(80,121,86,.10)]"
                    key={entry.id}
                  >
                    {entry.body}
                  </div>
                )
              }

              if (entry.kind === "retell") {
                return (
                  <div
                    className="ml-auto max-w-[85%] rounded-[24px_24px_8px_24px] bg-[#e7efe4] px-5 py-4 text-sm font-bold leading-6 text-[#294532]"
                    key={entry.id}
                  >
                    {entry.body}
                  </div>
                )
              }

              if (entry.kind === "loading") {
                return (
                  <p className="text-sm font-bold text-[#5b775f]" key={entry.id} role="status">
                    {entry.responseKind === "learning-reply"
                      ? "正在生成学习回复…"
                      : "正在生成复述追问…"}
                  </p>
                )
              }

              if (entry.kind === "error") {
                return (
                  <div className="max-w-2xl rounded-2xl border border-[#e7c8bc] bg-[#fff5f1] p-4" key={entry.id}>
                    <p className="text-sm font-bold text-[#8e452c]" role="alert">
                      {entry.error}
                    </p>
                    <button
                      className="mt-3 min-h-10 rounded-xl border border-[#d8a995] bg-white px-4 text-sm font-black text-[#8e452c]"
                      onClick={() => retryEntry(activeTopicId, entry)}
                      type="button"
                    >
                      {entry.responseKind === "learning-reply" ? "重试回答" : "重试追问"}
                    </button>
                  </div>
                )
              }

              if (entry.kind === "retell-follow-up") {
                return (
                  <article
                    className="max-w-2xl rounded-[26px_26px_26px_8px] border border-[#d6e3d4] bg-white/74 p-5 shadow-[0_14px_34px_rgba(48,76,54,.08)]"
                    key={entry.id}
                  >
                    <p className="text-xs font-black tracking-[0.12em] text-[#5b775f]">
                      费曼追问
                    </p>
                    <p className="mt-2 text-sm font-bold leading-7">{entry.followUp}</p>
                  </article>
                )
              }

              return (
                <article
                  className="max-w-3xl space-y-4 rounded-[26px_26px_26px_8px] border border-[#d9e5d8] bg-white/76 p-5 shadow-[0_14px_34px_rgba(48,76,54,.08)] sm:p-6"
                  key={entry.id}
                >
                  <section>
                    <p className="flex items-center gap-2 text-xs font-black tracking-[0.12em] text-[#5b775f]">
                      <Lightbulb aria-hidden="true" size={15} />
                      先看方向
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#33483a]">
                      {entry.reply.explanation}
                    </p>
                  </section>
                  <section className="rounded-2xl bg-[#f4efe0] p-4">
                    <p className="text-xs font-black text-[#80662d]">
                      生活里的例子
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5c5137]">
                      {entry.reply.example}
                    </p>
                  </section>
                  <section className="rounded-2xl border border-[#c9dbc8] bg-[#edf4eb] p-4">
                    <p className="flex items-center gap-2 text-xs font-black text-[#3e6547]">
                      <BookOpen aria-hidden="true" size={15} />
                      知识卡
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#294532]">
                      {entry.reply.card}
                    </p>
                  </section>
                </article>
              )
            })}
          </div>

          <div className="border-t border-[#dce7dc]/80 bg-white/32 px-5 py-5 sm:px-7">
            <div
              aria-label="建议问题"
              className="flex gap-2 overflow-x-auto pb-3"
            >
              {(activeTopic?.prompts ?? []).map((prompt) => (
                <button
                  className="min-h-10 shrink-0 rounded-full border border-[#ceddce] bg-white/75 px-4 text-xs font-bold text-[#38563f] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#426c4c]/20"
                  key={prompt}
                  onClick={() => sendQuestion(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {retellOpen ? (
              <div className="mb-4 rounded-[22px] border border-[#d7e4d6] bg-[#f6f9f4] p-4">
                <label
                  className="text-sm font-black text-[#2c4934]"
                  htmlFor="learning-retell"
                >
                  用自己的话复述
                </label>
                <textarea
                  className="mt-3 min-h-24 w-full resize-y rounded-2xl border border-[#cfdccf] bg-white/80 p-3 text-sm leading-6 outline-none focus:border-[#63836a] focus:ring-4 focus:ring-[#63836a]/15"
                  id="learning-retell"
                  onChange={(event) => setRetell(event.target.value)}
                  placeholder="不用背原句，说出你真正理解的部分……"
                  value={retell}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    className="min-h-11 rounded-2xl border border-[#bed7c1] bg-[#dceedd] px-5 text-sm font-black text-[#416449] disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={!retell.trim()}
                    onClick={submitRetell}
                    type="button"
                  >
                    提交我的复述
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                aria-label={
                  voiceActive ? "结束模拟语音输入" : "开始模拟语音输入"
                }
                className={`grid min-h-12 min-w-12 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#426c4c]/20 ${
                  voiceActive
                    ? "border-[#d6aa94] bg-[#fae8df] text-[#9a4d2d]"
                    : "border-[#ceddce] bg-white/72 text-[#46684e]"
                }`}
                onClick={toggleVoice}
                type="button"
              >
                {voiceActive ? (
                  <Square aria-hidden="true" size={18} />
                ) : (
                  <Mic aria-hidden="true" size={19} />
                )}
              </button>
              <div className="flex min-w-0 flex-1 gap-2 rounded-2xl border border-[#ccdacc] bg-white/78 p-1.5 focus-within:border-[#66846c] focus-within:ring-4 focus-within:ring-[#66846c]/15">
                <label className="sr-only" htmlFor="learning-question">
                  输入学习问题
                </label>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#8b968f]"
                  id="learning-question"
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendQuestion(question)
                  }}
                  placeholder="写下你不明白的地方……"
                  value={question}
                />
                <button
                  aria-label="发送问题"
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#bed7c1] bg-[#dceedd] text-[#416449] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!question.trim()}
                  onClick={() => sendQuestion(question)}
                  type="button"
                >
                  <Send aria-hidden="true" size={17} />
                </button>
              </div>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#aec4b0] bg-[#e8f0e6] px-4 text-sm font-black text-[#33553c]"
                onClick={() => setRetellOpen((open) => !open)}
                type="button"
              >
                <MessageCircleQuestion aria-hidden="true" size={18} />
                我来讲一遍
              </button>
            </div>
            {voiceActive ? (
              <p
                className="mt-3 text-sm font-bold text-[#965238]"
                role="status"
              >
                正在模拟聆听，不会启用麦克风。再次点击即可生成示例语音文字。
              </p>
            ) : null}
          </div>
        </GlassSurface>
      </div>
      <Dialog
        description="这些内容会保存在当前浏览器，并用于后续学习对话与搜索。"
        footer={topicDraft ? (
          <div className="flex justify-end gap-3">
            <button className="rounded-full border border-[#cbdaca] px-4 py-2.5 text-sm font-black" onClick={() => setTopicEditorOpen(false)} type="button">取消</button>
            <button className="rounded-full bg-[#173021] px-5 py-2.5 text-sm font-black text-white" onClick={() => {
              if (!topicDraft.title.trim() || !topicDraft.summary.trim()) return
              upsertLearningTopic(topicDraft)
              setActiveTopicId(topicDraft.id)
              setTopicEditorOpen(false)
            }} type="button">保存知识点</button>
          </div>
        ) : null}
        onClose={() => setTopicEditorOpen(false)}
        open={topicEditorOpen}
        title={topicDraft?.id.startsWith("topic-") ? "新增知识点" : "编辑知识点"}
      >
        {topicDraft ? (
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-black">名称<input aria-label="知识点名称" className="min-h-11 rounded-2xl border border-[#d9e4d7] bg-white/80 px-4" onChange={(event) => setTopicDraft({ ...topicDraft, title: event.target.value })} value={topicDraft.title} /></label>
            <label className="grid gap-2 text-sm font-black">学科<select aria-label="知识点学科" className="min-h-11 rounded-2xl border border-[#d9e4d7] bg-white/80 px-4" onChange={(event) => setTopicDraft({ ...topicDraft, subject: event.target.value as LearningTopic["subject"] })} value={topicDraft.subject}><option>数学</option><option>语文</option><option>英语</option></select></label>
            <label className="grid gap-2 text-sm font-black">核心理解<textarea aria-label="知识点摘要" className="min-h-24 rounded-2xl border border-[#d9e4d7] bg-white/80 p-4" onChange={(event) => setTopicDraft({ ...topicDraft, summary: event.target.value })} value={topicDraft.summary} /></label>
            <label className="grid gap-2 text-sm font-black">建议问题（每行一个）<textarea aria-label="知识点建议问题" className="min-h-28 rounded-2xl border border-[#d9e4d7] bg-white/80 p-4" onChange={(event) => setTopicDraft({ ...topicDraft, prompts: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} value={topicDraft.prompts.join("\n")} /></label>
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}

export default LearningPage
