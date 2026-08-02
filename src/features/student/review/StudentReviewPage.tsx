import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  Lightbulb,
  MessageCircleQuestion,
  Pause,
  Play,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"

type StudentReviewPageProps = {
  lessonId: string
  onNavigate?: (route: AppRoute) => void
}

type SelfAssessment = "我能讲出来" | "还想再看一遍" | "我需要帮助"

type ReviewDetails = {
  mistakeReminder: string
  dailyExample: string
  checkPrompt: string
  checkOptions: string[]
  checkAnswer: string
  checkSuccess: string
  practicePrompt: string
}

const reviewDetails: Record<string, ReviewDetails> = {
  "lesson-fractions": {
    mistakeReminder:
      "相同的数必须不为零，而且分子、分母要同时变化，不能只改一边。",
    dailyExample:
      "把 1 杯浓缩果汁和 1 杯水扩大成 2 杯果汁和 2 杯水，味道的浓淡比例没有改变。",
    checkPrompt: "3/5 的分子和分母同时乘 2，结果是什么？",
    checkOptions: ["6/5", "6/10", "3/10"],
    checkAnswer: "6/10",
    checkSuccess: "答对了，你同时改变了分子和分母。",
    practicePrompt: "想一想：4/7 的分子和分母同时乘 3，会得到什么？",
  },
  "lesson-units": {
    mistakeReminder:
      "不要只看数值大小。先判断要换成更大还是更小的单位，再决定乘或除。",
    dailyExample:
      "量一条 2 米长的跳绳时，也可以说它长 200 厘米：单位变小，数值会变大。",
    checkPrompt: "3 米换成厘米，应该怎样计算？",
    checkOptions: ["3 × 100", "3 ÷ 100", "3 + 100"],
    checkAnswer: "3 × 100",
    checkSuccess: "答对了，大单位换成小单位时，数值乘进率。",
    practicePrompt: "想一想：4500 克换成千克，应该乘还是除以 1000？",
  },
}

function getReviewDetails(lessonId: string): ReviewDetails {
  return (
    reviewDetails[lessonId] ?? {
      mistakeReminder:
        "先确认条件和步骤，再开始计算；不确定时可以回到关键知识。",
      dailyExample:
        "把课堂知识和每天看到、测量或分享的事物联系起来，会更容易记住。",
      checkPrompt: "你能用自己的话说出这节课最重要的一步吗？",
      checkOptions: ["能", "还要想一想"],
      checkAnswer: "能",
      checkSuccess: "很好，用自己的话讲出来就是一次有效复习。",
      practicePrompt: "试着自己设计一道和今天知识点有关的小题。",
    }
  )
}

export function StudentReviewPage({
  lessonId,
  onNavigate,
}: StudentReviewPageProps) {
  const { addStudentTimelineEvent, lessons, students, tasks } = usePrototype()
  const lesson = lessons.find((item) => item.id === lessonId)
  const student =
    students.find((item) => item.id === "student-lin-xiaoyu") ?? students[0]
  const linkedTask = tasks.find(
    (task) =>
      task.title.includes(lesson?.title.replace("的", "") ?? "__missing__") ||
      lesson?.recapTags.some((tag) => task.title.includes(tag)),
  )
  const [isReading, setIsReading] = useState(false)
  const [readingMessage, setReadingMessage] = useState("")
  const [assessment, setAssessment] = useState<SelfAssessment | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)

  if (!lesson) {
    return (
      <GlassSurface
        className="mx-auto grid min-h-80 max-w-2xl place-items-center p-8 text-center"
        weight="sheet"
      >
        <div>
          <BookOpen aria-hidden className="mx-auto text-[#6d8272]" size={34} />
          <h1 className="mt-5 text-2xl font-black text-[#203427]">
            还没有找到这张复习卡
          </h1>
          <p className="mt-3 text-sm font-medium text-[#74837a]">
            它可能还没有发布，或课堂内容正在同步。
          </p>
          <button
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#1b3021] px-5 font-black text-white focus:outline-none focus:ring-4 focus:ring-[#8daa91]/40"
            onClick={() => onNavigate?.({ role: "student", page: "home" })}
            type="button"
          >
            <ArrowLeft aria-hidden size={18} /> 返回学生首页
          </button>
        </div>
      </GlassSurface>
    )
  }

  const details = getReviewDetails(lesson.id)
  const answerIsCorrect = answer === details.checkAnswer

  function recordAssessment(nextAssessment: SelfAssessment) {
    setAssessment(nextAssessment)
    addStudentTimelineEvent("student-lin-xiaoyu", {
      id: `timeline-review-${lesson.id}-${Date.now()}`,
      type: "review",
      title: `完成${lesson.title}复习`,
      detail: nextAssessment,
      occurredAt: "2026-08-02T10:00:00+08:00",
      fact: true,
    })
  }

  function toggleReading() {
    if (isReading) {
      setIsReading(false)
      setReadingMessage("模拟朗读已停止")
    } else {
      setIsReading(true)
      setReadingMessage("正在模拟朗读复习卡，不会播放或采集真实音频")
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-black text-[#59705f] hover:bg-white/45 focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35"
            onClick={() => onNavigate?.({ role: "student", page: "home" })}
            type="button"
          >
            <ArrowLeft aria-hidden size={17} /> 返回首页
          </button>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusChip tone="info">{lesson.subject}复习卡</StatusChip>
            <span className="text-xs font-bold text-[#7b8a80]">
              {lesson.date} · {lesson.className}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#192d20] sm:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#718078]">
            {student?.name ?? "同学"}，慢慢读，能讲清楚比记得快更重要。
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/70 px-5 text-sm font-black text-[#34513b] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35"
            onClick={toggleReading}
            type="button"
          >
            {isReading ? (
              <Pause aria-hidden size={18} />
            ) : (
              <Volume2 aria-hidden size={18} />
            )}
            {isReading ? "停止朗读" : "朗读复习卡"}
          </button>
          <p
            className="max-w-xs text-xs font-medium text-[#829087]"
            role="status"
          >
            {readingMessage}
          </p>
        </div>
      </header>

      <main className="mt-6 grid gap-5">
        <GlassSurface
          aria-label="关键知识"
          className="relative overflow-hidden p-6 sm:p-8"
          role="region"
          weight="sheet"
        >
          <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-[#dcebd7]/60 blur-3xl" />
          <div className="relative max-w-4xl">
            <div className="flex items-center gap-2 text-sm font-black text-[#55705c]">
              <Sparkles aria-hidden size={18} /> 关键知识
            </div>
            <p className="mt-5 text-xl font-black leading-9 text-[#203427] sm:text-2xl">
              {lesson.recap}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {lesson.recapTags.map((tag) => (
                <span
                  className="rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#516b58]"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </GlassSurface>

        <div className="grid gap-5 lg:grid-cols-2">
          <GlassSurface
            aria-label="易错提醒"
            className="p-6"
            role="region"
            weight="card"
          >
            <div className="flex items-center gap-2 text-sm font-black text-[#895b3d]">
              <CircleAlert aria-hidden size={19} /> 易错提醒
            </div>
            <p className="mt-4 text-base font-bold leading-8 text-[#493b31]">
              {details.mistakeReminder}
            </p>
          </GlassSurface>
          <GlassSurface
            aria-label="生活中的例子"
            className="p-6"
            role="region"
            weight="card"
          >
            <div className="flex items-center gap-2 text-sm font-black text-[#55705c]">
              <Lightbulb aria-hidden size={19} /> 生活中的例子
            </div>
            <p className="mt-4 text-base font-bold leading-8 text-[#34483a]">
              {details.dailyExample}
            </p>
          </GlassSurface>
        </div>

        <GlassSurface
          aria-label="自检问题"
          className="p-6 sm:p-8"
          role="region"
          weight="card"
        >
          <div className="flex items-center gap-2 text-sm font-black text-[#55705c]">
            <MessageCircleQuestion aria-hidden size={19} /> 自检问题
          </div>
          <h2 className="mt-4 text-xl font-black text-[#203427]">
            {details.checkPrompt}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {details.checkOptions.map((option) => (
              <button
                aria-pressed={answer === option}
                className="min-h-12 rounded-2xl border border-white/90 bg-white/70 px-5 text-sm font-black text-[#344d3a] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35 aria-pressed:bg-[#d9e8d8]"
                key={option}
                onClick={() => setAnswer(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          {answer && (
            <p
              className={`mt-4 text-sm font-black ${
                answerIsCorrect ? "text-[#3f7349]" : "text-[#8a613f]"
              }`}
              role="status"
            >
              {answerIsCorrect
                ? details.checkSuccess
                : "再看看关键知识：两个部分需要按同样的规则变化。"}
            </p>
          )}
        </GlassSurface>

        <GlassSurface
          aria-label="再练一道"
          className="p-6 sm:p-8"
          role="region"
          weight="light"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-[#55705c]">
                <Target aria-hidden size={19} /> 再练一道
              </div>
              <p className="mt-3 text-base font-bold leading-7 text-[#34483a]">
                {details.practicePrompt}
              </p>
              {linkedTask && (
                <p className="mt-2 text-xs font-bold text-[#7b8a80]">
                  相关任务：{linkedTask.title}
                </p>
              )}
            </div>
            <button
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-white/75 px-5 text-sm font-black text-[#35523c] focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35"
              onClick={() => onNavigate?.({ role: "student", page: "tasks" })}
              type="button"
            >
              去任务里练习 <ArrowRight aria-hidden size={17} />
            </button>
          </div>
        </GlassSurface>

        <GlassSurface className="p-6 sm:p-8" weight="sheet">
          <div className="text-center">
            <p className="text-sm font-black text-[#58715e]">
              复习后，你现在感觉怎么样？
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#203427]">
              给自己一个小小的学习标记
            </h2>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {(["我能讲出来", "还想再看一遍", "我需要帮助"] as const).map(
                (item) => (
                  <button
                    aria-pressed={assessment === item}
                    className="min-h-12 rounded-2xl bg-white/70 px-5 text-sm font-black text-[#36513d] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#abc4ae]/35 aria-pressed:bg-[#2b4933] aria-pressed:text-white"
                    key={item}
                    onClick={() => recordAssessment(item)}
                    type="button"
                  >
                    {assessment === item && (
                      <Check aria-hidden className="mr-2 inline" size={16} />
                    )}
                    {item}
                  </button>
                ),
              )}
            </div>
            {assessment && (
              <p className="mt-4 text-sm font-black text-[#4e6d56]">
                已记录：{assessment}
              </p>
            )}
          </div>
        </GlassSurface>

        <GlassSurface
          className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
          weight="light"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e3ecdd] text-[#486750]">
              <Play aria-hidden size={19} />
            </span>
            <div>
              <p className="text-sm font-black text-[#2e4935]">
                还想把这个知识点弄得更明白？
              </p>
              <p className="text-xs font-medium text-[#77867d]">
                进入知识学习，用自己的问题继续探索。
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1b3021] px-5 text-sm font-black text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-[#8daa91]/40"
            onClick={() => onNavigate?.({ role: "student", page: "learning" })}
            type="button"
          >
            学习{lesson.title} <ArrowRight aria-hidden size={17} />
          </button>
        </GlassSurface>
      </main>
    </div>
  )
}

export default StudentReviewPage
