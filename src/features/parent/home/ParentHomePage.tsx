import { useState } from "react"
import {
  ArrowRight,
  BookOpenCheck,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Sparkles,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"

export type ParentHomePageProps = {
  onNavigate(route: AppRoute): void
}

export function ParentHomePage({ onNavigate }: ParentHomePageProps) {
  const { parentSummary } = usePrototype()
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioNotice, setAudioNotice] = useState("")

  function toggleAudioLetter() {
    const nextPlaying = !isPlaying
    setIsPlaying(nextPlaying)
    setAudioNotice(
      nextPlaying
        ? `正在模拟播放${parentSummary.audioLetter.title}`
        : "模拟语音家书已停止",
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-[2rem] border border-white/75 bg-white/45 p-5 shadow-[0_24px_70px_rgba(51,78,59,0.09)] backdrop-blur-2xl sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black tracking-[0.08em] text-[#62806a]">
            家庭学习陪伴
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#142319] sm:text-4xl">
            {parentSummary.studentName}的本周学习摘要
          </h1>
          <p className="mt-3 text-sm font-bold text-[#5f7064]">
            {parentSummary.studentName} · {parentSummary.className}
          </p>
        </div>
        <div className="rounded-full border border-white/80 bg-white/65 px-4 py-2 text-sm font-bold text-[#51665a] shadow-sm">
          {parentSummary.weekLabel}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <GlassSurface
            aria-label="本周学习主题"
            className="p-5 sm:p-7"
            role="region"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e4efe0] text-[#4f7658]">
                <BookOpenCheck aria-hidden="true" size={21} />
              </span>
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#718276]">
                  本周学习主题
                </p>
                <h2 className="mt-1 text-xl font-black text-[#1d3023]">
                  一起看看孩子接触了什么
                </h2>
              </div>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {parentSummary.topics.map((topic, index) => (
                <li
                  className="rounded-3xl border border-white/80 bg-white/55 px-4 py-5 text-center shadow-sm"
                  key={topic}
                >
                  <span className="text-xs font-bold text-[#819086]">
                    主题 {index + 1}
                  </span>
                  <p className="mt-2 font-black text-[#28402f]">{topic}</p>
                </li>
              ))}
            </ul>
          </GlassSurface>

          <GlassSurface
            aria-label="本周学习脚印"
            className="p-5 sm:p-7"
            role="region"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#f7e9bf] text-[#8b6a25]">
                <Sparkles aria-hidden="true" size={21} />
              </span>
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#718276]">
                  本周学习脚印
                </p>
                <h2 className="mt-1 text-xl font-black text-[#1d3023]">
                  看见主动与坚持
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <article className="rounded-3xl border border-white/80 bg-white/55 p-5">
                <p className="text-sm font-bold text-[#66776b]">主动提问</p>
                <p className="mt-2 text-3xl font-black text-[#26472e]">
                  {parentSummary.voluntaryQuestions} 次
                </p>
                <p className="mt-2 text-xs leading-5 text-[#7b8980]">
                  记录孩子愿意表达疑问的次数，只与自己的学习过程相关。
                </p>
              </article>
              <article className="rounded-3xl border border-white/80 bg-white/55 p-5">
                <p className="text-sm font-bold text-[#66776b]">完成练习</p>
                <p className="mt-2 text-3xl font-black text-[#26472e]">
                  {parentSummary.practiceCount} 次
                </p>
                <p className="mt-2 text-xs leading-5 text-[#7b8980]">
                  用于了解本周练习节奏，不与其他孩子进行比较。
                </p>
              </article>
            </div>
          </GlassSurface>

          <GlassSurface
            aria-label="给家长的陪伴建议"
            className="overflow-hidden p-0"
            role="region"
            weight="sheet"
          >
            <div className="grid gap-0 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="grid min-h-40 place-items-center bg-[linear-gradient(145deg,rgba(231,242,225,.95),rgba(249,235,198,.72))] p-6">
                <span className="grid size-16 place-items-center rounded-[1.6rem] bg-white/70 text-[#58745e] shadow-sm">
                  <Heart aria-hidden="true" size={29} />
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-xs font-black tracking-[0.12em] text-[#718276]">
                  给家长的陪伴建议
                </p>
                <h2 className="mt-2 text-xl font-black text-[#1d3023]">
                  先肯定孩子愿意开口
                </h2>
                <p className="mt-4 text-base font-bold leading-8 text-[#405448]">
                  {parentSummary.encouragement}
                </p>
              </div>
            </div>
          </GlassSurface>
        </div>

        <aside className="space-y-5">
          <GlassSurface
            aria-label="李老师留言"
            className="p-5 sm:p-6"
            role="region"
            weight="sheet"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e8eee4] text-[#56705d]">
                <MessageCircle aria-hidden="true" size={21} />
              </span>
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#718276]">
                  李老师留言
                </p>
                <h2 className="mt-1 font-black text-[#1d3023]">本周陪伴重点</h2>
              </div>
            </div>
            <p className="mt-5 rounded-3xl border border-white/80 bg-white/55 p-5 text-sm font-bold leading-7 text-[#405448]">
              {parentSummary.teacherMessage}
            </p>
          </GlassSurface>

          <GlassSurface className="p-5 sm:p-6">
            <p className="text-xs font-black tracking-[0.12em] text-[#718276]">
              模拟音频家书
            </p>
            <h2 className="mt-2 text-xl font-black text-[#1d3023]">
              {parentSummary.audioLetter.title}
            </h2>
            <p className="mt-2 text-sm font-bold text-[#687a6e]">
              {parentSummary.audioLetter.durationSeconds} 秒 · 模拟音频
            </p>
            <button
              aria-label={isPlaying ? "停止模拟语音家书" : "播放模拟语音家书"}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#183023] px-5 font-black text-white shadow-[0_12px_28px_rgba(24,48,35,.2)]"
              onClick={toggleAudioLetter}
              type="button"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" size={18} />
              ) : (
                <Play aria-hidden="true" size={18} />
              )}
              {isPlaying ? "停止播放" : "播放语音家书"}
            </button>
            <p className="mt-3 text-xs leading-5 text-[#7b8980]">
              此处仅演示播放状态，不会播放、采集或上传真实音频。
            </p>
            {audioNotice ? (
              <p
                className="mt-3 text-sm font-bold text-[#48614f]"
                role="status"
              >
                {audioNotice}
              </p>
            ) : null}
          </GlassSurface>

          <GlassSurface
            aria-label="联系老师"
            className="p-5 sm:p-6"
            role="region"
          >
            <p className="text-xs font-black tracking-[0.12em] text-[#718276]">
              联系老师
            </p>
            <h2 className="mt-2 text-xl font-black text-[#1d3023]">
              有需要时，和李老师聊一聊
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#65766b]">
              仅展示与林晓雨学习陪伴相关的教师沟通，不提供班级或同学的私人信息。
            </p>
            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#496a51]/20 bg-[#edf4ea] px-5 font-black text-[#315139]"
              onClick={() => onNavigate({ role: "parent", page: "messages" })}
              type="button"
            >
              联系李老师
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </GlassSurface>
        </aside>
      </div>
    </section>
  )
}

export default ParentHomePage
