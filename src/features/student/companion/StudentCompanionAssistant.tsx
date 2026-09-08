import { useState, type FormEvent } from "react"
import { ArrowRight, Send, X } from "lucide-react"
import companionImage from "../../../assets/zhiye-companion-ip.png"
import type { AppRoute } from "../../../app/routes"
import { PinyinText } from "../../../components/pinyin/PinyinText"
import {
  generateCompanionReply,
  type StudentCompanionReply,
} from "../../../services/localAi"

type StudentPage = Extract<AppRoute, { role: "student" }>["page"]

type Message =
  | { id: string; role: "assistant"; text: string; pinyin: string; response?: StudentCompanionReply }
  | { id: string; role: "user"; text: string }

const ACTION_ROUTES: Record<NonNullable<StudentCompanionReply["action"]>, AppRoute | null> = {
  none: null,
  "go-tutoring": { role: "student", page: "tutoring" },
  "go-learning": { role: "student", page: "learning" },
  "go-mistakes": { role: "student", page: "mistakes" },
  "go-tasks": { role: "student", page: "tasks" },
  "go-messages": { role: "student", page: "messages" },
}

function fallback(message: string): StudentCompanionReply {
  if (/拍照|题目|答疑/.test(message)) {
    return {
      reply: "你可以去拍照答疑，把题目拍清楚后上传。我会陪你一步一步看懂题目。",
      pinyin: "nǐ kě yǐ qù pāi zhào dá yí, bǎ tí mù pāi qīng chu hòu shàng chuán. wǒ huì péi nǐ yí bù yí bù kàn dǒng tí mù.",
      action: "go-tutoring",
      actionLabel: "去拍照答疑",
      actionPinyin: "qù pāi zhào dá yí",
      instructions: "进入后点击“重新选择题目图片”，再确认识别出的题目。",
      instructionsPinyin: "jìn rù hòu diǎn jī “chóng xīn xuǎn zé tí mù tú piàn”, zài què rèn shí bié chū de tí mù.",
    }
  }
  if (/错题/.test(message)) {
    return { reply: "去错题本可以看到做错过的题目，再慢慢复习。", pinyin: "qù cuò tí běn kě yǐ kàn dào zuò cuò guò de tí mù, zài màn màn fù xí.", action: "go-mistakes", actionLabel: "去错题本", actionPinyin: "qù cuò tí běn" }
  }
  if (/知识点|学习/.test(message)) {
    return { reply: "去知识点学习，我们可以先选一个你想弄明白的问题。", pinyin: "qù zhī shí diǎn xué xí, wǒ men kě yǐ xiān xuǎn yí gè nǐ xiǎng nòng míng bái de wèn tí.", action: "go-learning", actionLabel: "去知识点学习", actionPinyin: "qù zhī shí diǎn xué xí" }
  }
  return { reply: "我在这里陪你学习。有什么不懂的或者不会的吗？", pinyin: "wǒ zài zhè lǐ péi nǐ xué xí. yǒu shén me bù dǒng de huò zhě bú huì de ma?", action: "none" }
}

const initialMessage: Message = {
  id: "companion-welcome",
  role: "assistant",
  text: "有什么不懂的或者不会的吗？",
  pinyin: "yǒu shén me bù dǒng de huò zhě bú huì de ma?",
}

export function StudentCompanionAssistant({
  currentPage,
  onNavigate,
}: {
  currentPage: StudentPage
  onNavigate: (route: AppRoute) => void
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = message.trim()
    if (!value || loading) return
    setMessage("")
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text: value }])
    setLoading(true)
    try {
      const response = await generateCompanionReply(value, currentPage)
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: response.reply, pinyin: response.pinyin, response }])
    } catch {
      const response = fallback(value)
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: response.reply, pinyin: response.pinyin, response }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-companion fixed bottom-5 left-5 z-40 lg:left-7">
      {open ? (
        <section aria-label="小野学习陪伴对话" className="student-companion-panel prototype-glass w-[min(460px,calc(100vw-24px))] overflow-hidden rounded-[26px]">
          <header className="flex items-center gap-3 border-b border-white/70 px-4 py-3">
            <img src={companionImage} alt="小野" className="size-12 shrink-0 rounded-2xl bg-[#eef7fb] object-contain object-center" />
            <div className="min-w-0 flex-1">
              <PinyinText text="小野" pinyin="xiǎo yě" className="text-sm font-black text-[#315b3d]" />
              <PinyinText text="学习陪伴" pinyin="xué xí péi bàn" className="text-[11px] text-[#75917a]" />
            </div>
            <button type="button" aria-label="关闭陪伴" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full text-[#5d7b65] hover:bg-white/70"><X size={17} /></button>
          </header>
          <div className="student-companion-messages space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((item) => item.role === "user" ? (
              <div key={item.id} className="ml-8 rounded-2xl rounded-br-md bg-[#d8ecd7] px-3 py-2 text-sm text-[#34553c] shadow-sm"><p>{item.text}</p></div>
            ) : (
              <div key={item.id} className="w-full rounded-2xl rounded-bl-md bg-white/85 px-3 py-2 text-sm text-[#36533d] shadow-sm">
                <PinyinText text={item.text} pinyin={item.pinyin} className="w-full gap-1" pinyinClassName="text-[#789b7d]" />
                {item.response?.instructions ? <PinyinText text={item.response.instructions} pinyin={item.response.instructionsPinyin ?? undefined} className="mt-2 w-full text-xs text-[#6e8872]" pinyinClassName="text-[10px]" /> : null}
                {item.response && item.response.action !== "none" && ACTION_ROUTES[item.response.action] ? (
                  <button type="button" onClick={() => onNavigate(ACTION_ROUTES[item.response!.action]!)} className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#e5f2e1] px-3 py-2 text-left text-xs font-bold text-[#3d7048] hover:bg-[#d7ebd5]">
                    <PinyinText text={item.response.actionLabel ?? "打开页面"} pinyin={item.response.actionPinyin ?? undefined} />
                    <ArrowRight size={15} />
                  </button>
                ) : null}
              </div>
            ))}
            {loading ? <div className="mr-12 rounded-2xl bg-white/70 px-3 py-2 text-xs text-[#78917c]"><PinyinText text="小野正在想一想" pinyin="xiǎo yě zhèng zài xiǎng yì xiǎng" /></div> : null}
          </div>
          <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/70 p-3">
            <label htmlFor="student-companion-input" className="sr-only">请输入你的问题</label>
            <input id="student-companion-input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="可以问我一个问题" className="min-w-0 flex-1 rounded-full border border-white/80 bg-white/75 px-3 py-2 text-sm text-[#36533d] outline-none placeholder:text-[#9ab0a0] focus:ring-2 focus:ring-[#a9cfaa]" />
            <button type="submit" aria-label="发送问题" disabled={loading || !message.trim()} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#b9d9b8] text-[#315b3d] disabled:opacity-50"><Send size={16} /></button>
          </form>
        </section>
      ) : (
        <button type="button" aria-label="打开小野学习陪伴" title="需要帮助吗？" onClick={() => setOpen(true)} className="student-companion-bubble group relative grid size-[76px] place-items-center overflow-hidden rounded-full border-4 border-white/85 bg-[#e7f3e3] shadow-[0_14px_32px_rgba(61,104,68,0.22)]">
          <img src={companionImage} alt="小野" className="size-full rounded-full object-cover object-center transition-transform group-hover:scale-105" />
        </button>
      )}
    </div>
  )
}
