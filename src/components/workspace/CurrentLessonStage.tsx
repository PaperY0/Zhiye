import { ArrowRight, Sparkles, Waves } from "lucide-react"
import type { AppRoute } from "../../app/routes"

const timeline = ["课堂录音", "已转写", "复习卡草稿", "学生困难"]

export default function CurrentLessonStage({ onNavigate = () => undefined }: { onNavigate?: (route: AppRoute) => void }) {
  return (
    <section
      aria-labelledby="current-lesson-title"
      className="workspace-task-stage flex h-auto min-h-0 flex-col xl:h-full"
      data-testid="current-lesson-stage"
    >
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-stage-kicker">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            今日最重要
          </p>
          <h1
            className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl"
            id="current-lesson-title"
          >
            完成这一节课堂复盘
          </h1>
          <h2 className="mt-4 font-brand text-xl font-black tracking-[-0.04em]">
            分数的基本性质
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776e]">
            40 分钟课堂录音已经整理好，确认后 32 名学生将看到复习卡。
          </p>
        </div>
        <span className="workspace-status-chip">待确认</span>
      </div>

      <ol aria-label="课堂回响处理进度" className="workspace-echo-timeline">
        {timeline.map((label, index) => (
          <li
            className={
              index === 2
                ? "workspace-echo-step workspace-echo-step-active"
                : "workspace-echo-step"
            }
            key={label}
          >
            <span aria-hidden="true" className="workspace-echo-dot" />
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <section
        className="workspace-recap-sheet flex min-h-0 flex-1 flex-col"
        data-testid="current-lesson-review-card"
      >
        <div
          className="workspace-recap-content flex min-h-0 flex-1 flex-col items-center justify-center text-center"
          data-testid="current-lesson-review-content"
        >
          <div className="workspace-recap-heading flex flex-wrap items-center justify-center gap-3">
            <p className="text-xs font-black tracking-[0.12em] text-[#687b6c]">
              给学生的复习卡
            </p>
            <span className="workspace-ai-chip">AI 草稿 · 可编辑</span>
          </div>
          <p className="workspace-recap-copy mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 sm:text-lg">
            分子和分母同时乘或除以相同的数，分数的大小不变。
          </p>
          <div className="workspace-recap-tags mt-5 flex flex-wrap justify-center gap-2">
            {["约分", "分数基本性质", "自检问题"].map((tag) => (
              <span className="workspace-topic-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="workspace-recap-actions mt-6 flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-[#34583d]/10 pt-5">
          <button className="workspace-tertiary-action" type="button">
            <Waves aria-hidden="true" className="h-4 w-4" />
            查看课堂依据
          </button>
          <button
            className="workspace-primary-action"
            onClick={() => onNavigate({ role: "teacher", page: "lesson-detail", lessonId: "lesson-fractions" })}
            type="button"
          >
            确认并发布
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div
        className="workspace-feedback-strip mt-auto shrink-0"
        data-testid="current-lesson-feedback"
      >
        <div>
          <span>最近课堂</span>
          <strong>约分与通分</strong>
          <small>昨天 · 已发布给学生</small>
        </div>
        <div>
          <span>备课建议</span>
          <strong>单位换算补讲</strong>
          <small>预计用时 5 分钟</small>
        </div>
        <div>
          <span>班级变化</span>
          <strong>计算步骤求助增加</strong>
          <small>
            进入知识点回响地图查看
            <ArrowRight aria-hidden="true" className="ml-1 inline h-3 w-3" />
          </small>
        </div>
      </div>
    </section>
  )
}
