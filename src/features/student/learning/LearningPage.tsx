import { useMemo, useState } from "react"

import {
  BookOpen,
  Brain,
  History,
  Lightbulb,
  MessageCircleQuestion,
  Mic,
  Send,
  Sparkles,
  Square,
} from "lucide-react"

import { GlassSurface } from "../../../components/shared/GlassSurface"

import { StatusChip } from "../../../components/shared/StatusChip"

type TopicId = "fractions" | "units" | "decimals"

type Topic = {
  id: TopicId

  title: string

  subject: string

  summary: string

  lastStudied: string

  prompts: string[]
}

type LearningReply = {
  explanation: string

  example: string

  card: string

  followUp: string
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

  followUp: string
}

type ConversationEntry = StudentEntry | AssistantEntry | RetellEntry

const topics: Topic[] = [
  {
    id: "fractions",

    title: "分数的基本性质",

    subject: "数学",

    summary: "同时、相同、非零，是保持分数大小不变的三个关键。",

    lastStudied: "今天 16:20",

    prompts: [
      "我怎么判断分子和分母要怎样变化？",

      "为什么不能只改变分子？",

      "给我一个生活里的例子",
    ],
  },

  {
    id: "units",

    title: "单位换算",

    subject: "数学",

    summary: "先判断单位方向，再根据进率决定乘或除。",

    lastStudied: "昨天 19:10",

    prompts: [
      "为什么换算时有时乘、有时除？",

      "千米和米之间怎样换算？",

      "怎样检查换算结果？",
    ],
  },

  {
    id: "decimals",

    title: "小数乘法估算",

    subject: "数学",

    summary: "先取接近且好算的数，再判断估算结果是否合理。",

    lastStudied: "7 月 23 日",

    prompts: [
      "估算时应该把数看成多少？",

      "怎样判断估算结果合理？",

      "给我一道简单的估算题",
    ],
  },
]

const responses: Record<TopicId, LearningReply> = {
  fractions: {
    explanation:
      "判断时记住三个词：同时、相同、非零。分子和分母必须同时乘或除以同一个不为零的数，分数的大小才不变。",

    example:
      "把半杯果汁平均倒进两个同样的小杯里：份数和每份的表示一起变化，但果汁总量没有改变。",

    card: "分子和分母同时乘或除以相同的非零数，分数大小不变。",

    followUp:
      "为什么不能只改变分子？如果只把分子乘 2，分数表示的大小会发生什么变化？",
  },

  units: {
    explanation:
      "先看方向。大单位换成小单位，数值通常变大，要乘进率；小单位换成大单位，数值通常变小，要除以进率。",

    example:
      "1 米长的彩带可以看成 100 厘米：单位变小了，表示长度的数字就变大了。",

    card: "大单位 → 小单位：乘进率；小单位 → 大单位：除以进率。",

    followUp: "3 米换成厘米时，为什么答案应该比 3 大？",
  },

  decimals: {
    explanation:
      "先把小数看成接近、好算的整数或一位小数，再计算大约结果，最后检查数量级是否合理。",

    example: "一支笔 4.9 元，买 6 支，可以先按每支 5 元估算，大约需要 30 元。",

    card: "找接近的好算数 → 估算 → 检查结果大小是否合理。",

    followUp: "4.9 × 6 为什么可以用 5 × 6 来估算？",
  },
}

function createEntryId(prefix: string, index: number) {
  return `${prefix}-${index}`
}

export function LearningPage() {
  const [activeTopicId, setActiveTopicId] = useState<TopicId>("fractions")

  const [conversations, setConversations] =
    useState<Record<TopicId, ConversationEntry[]>>({
      fractions: [],

      units: [],

      decimals: [],
    })

  const [question, setQuestion] = useState("")

  const [voiceActive, setVoiceActive] = useState(false)

  const [retellOpen, setRetellOpen] = useState(false)

  const [retell, setRetell] = useState("")

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) ?? topics[0],

    [activeTopicId],
  )

  const activeEntries = conversations[activeTopicId]

  function selectTopic(topicId: TopicId) {
    setActiveTopicId(topicId)

    setQuestion("")

    setVoiceActive(false)

    setRetellOpen(false)

    setRetell("")
  }

  function sendQuestion(body: string) {
    const normalized = body.trim()

    if (!normalized) return

    setConversations((current) => {
      const nextIndex = current[activeTopicId].length

      return {
        ...current,

        [activeTopicId]: [
          ...current[activeTopicId],

          {
            id: createEntryId(`${activeTopicId}-student`, nextIndex),

            kind: "student",

            body: normalized,
          },

          {
            id: createEntryId(`${activeTopicId}-assistant`, nextIndex + 1),

            kind: "assistant",

            reply: responses[activeTopicId],
          },
        ],
      }
    })

    setQuestion("")
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
    const normalized = retell.trim()

    if (!normalized) return

    setConversations((current) => ({
      ...current,

      [activeTopicId]: [
        ...current[activeTopicId],

        {
          id: createEntryId(
            `${activeTopicId}-retell`,

            current[activeTopicId].length,
          ),

          kind: "retell",

          body: normalized,

          followUp: responses[activeTopicId].followUp,
        },
      ],
    }))

    setRetell("")

    setRetellOpen(false)
  }

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-12 text-[#19271e]">
      <GlassSurface className="overflow-hidden p-5 sm:p-7" weight="light">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.14em] text-[#5d7563]">
              <Sparkles aria-hidden="true" size={16} />
              和知识点聊一聊
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              知识点学习
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#66766b] sm:text-base">
              从一个问题开始，先理解，再用自己的话讲出来。这里的对话和语音都是本地原型演示。
            </p>
          </div>
          <div className="rounded-[22px] border border-white/80 bg-white/55 px-4 py-3 text-sm leading-6 text-[#627369]">
            <strong className="block text-[#294332]">模拟语音说明</strong>
            不会采集或上传真实音频
          </div>
        </div>
      </GlassSurface>

      <div className="grid min-h-[680px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <GlassSurface className="flex flex-col gap-4 p-4 sm:p-5" weight="card">
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
            {topics.map((topic) => {
              const selected = topic.id === activeTopicId

              return (
                <button
                  aria-label={`继续学习${topic.title}`}
                  aria-pressed={selected}
                  className={`rounded-[22px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#426c4c]/20 ${
                    selected
                      ? "border-[#9db69f] bg-[#e9f0e6] shadow-[0_12px_28px_rgba(45,76,52,.1)]"
                      : "border-white/80 bg-white/48 hover:bg-white/72"
                  }`}
                  key={topic.id}
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
                  <span className="sr-only">继续学习{topic.title}</span>
                </button>
              )
            })}
          </nav>
        </GlassSurface>

        <GlassSurface
          className="flex min-h-[620px] flex-col overflow-hidden p-0"
          weight="sheet"
        >
          <header className="border-b border-[#dce7dc]/80 px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#66796b]">
                  {activeTopic.subject} · 当前主题
                </p>
                <h2
                  className="mt-1 text-2xl font-black"
                  id="learning-topic-title"
                >
                  {activeTopic.title}
                </h2>
              </div>
              <StatusChip tone="success">循序理解</StatusChip>
            </div>
          </header>

          <div
            aria-live="polite"
            aria-label={`${activeTopic.title}学习对话`}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-7"
            role="log"
          >
            {activeEntries.length === 0 ? (
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
                    className="ml-auto max-w-[85%] rounded-[24px_24px_8px_24px] bg-[#183020] px-5 py-4 text-sm font-bold leading-6 text-white shadow-[0_12px_28px_rgba(25,49,32,.16)]"
                    key={entry.id}
                  >
                    {entry.body}
                  </div>
                )
              }

              if (entry.kind === "retell") {
                return (
                  <div className="space-y-3" key={entry.id}>
                    <div className="ml-auto max-w-[85%] rounded-[24px_24px_8px_24px] bg-[#e7efe4] px-5 py-4 text-sm font-bold leading-6 text-[#294532]">
                      {entry.body}
                    </div>
                    <article className="max-w-2xl rounded-[26px_26px_26px_8px] border border-[#d6e3d4] bg-white/74 p-5 shadow-[0_14px_34px_rgba(48,76,54,.08)]">
                      <p className="text-xs font-black tracking-[0.12em] text-[#5b775f]">
                        费曼追问
                      </p>
                      <p className="mt-2 text-sm font-bold leading-7">
                        {entry.followUp}
                      </p>
                    </article>
                  </div>
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
                    {activeTopicId === "fractions" ? (
                      <p className="mt-2 inline-flex rounded-full bg-[#e8f0e6] px-3 py-1 text-xs font-black text-[#3d6145]">
                        同时、相同、非零
                      </p>
                    ) : null}
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
              {activeTopic.prompts.map((prompt) => (
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
                    className="min-h-11 rounded-2xl bg-[#1d3323] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
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
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1d3323] text-white disabled:cursor-not-allowed disabled:opacity-40"
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
    </section>
  )
}

export default LearningPage
