import { ArrowLeft, ChevronDown, CircleCheck, Lightbulb, Sparkles, Waves } from "lucide-react"

type WorkspaceScreenProps = { onBackToWelcome: () => void }

export default function WorkspaceScreen({ onBackToWelcome }: WorkspaceScreenProps) {
  return (
    <main className="min-h-dvh bg-[#f3f0e7] p-4 text-[#18302a] sm:p-7">
      <header className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#245a43] hover:text-[#183d2d] focus:outline-none focus:ring-2 focus:ring-[#245a43]" onClick={onBackToWelcome}><ArrowLeft className="h-4 w-4" />返回知野首页</button>
        <div className="hidden items-center gap-3 text-sm text-[#61716a] sm:flex"><span>五年级（2）班</span><ChevronDown className="h-4 w-4" /><span className="h-4 w-px bg-black/10" /><span>数学 · 7 月 21 日</span></div>
        <span className="font-serif text-xl tracking-[0.12em]">知野</span>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(27,51,40,0.09)] sm:p-9">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#6d756f]"><Waves className="h-4 w-4 text-[#c79035]" />今天 10:30 完成的数学课</p>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">分数的基本性质</h1><p className="mt-3 text-[#68756f]">40 分钟课堂录音已整理成可编辑的学生复习卡。</p></div><span className="rounded-full bg-[#edf4ec] px-3 py-1.5 text-xs font-semibold text-[#245a43]">AI 草稿 · 可确认</span></div>
          <div className="my-8 flex flex-wrap items-center gap-3 rounded-2xl bg-[#f8f6ef] p-4 text-sm"><span className="rounded-full bg-[#f8efd9] px-3 py-2 font-medium text-[#97661e]">05:12 分数不变</span><span className="text-[#9da59e]">→ 已转写 →</span><span className="rounded-full bg-[#e9f0ed] px-3 py-2 font-semibold text-[#245a43]">复习卡草稿</span><span className="text-[#9da59e]">→ 学生困难</span></div>
          <section className="rounded-2xl border border-[#e7e5dd] bg-[#fffefb] p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><p className="text-xs font-bold tracking-[0.14em] text-[#718078]">给学生的复习卡</p><button className="text-sm font-semibold text-[#245a43] underline-offset-4 hover:underline">查看依据</button></div><p className="max-w-2xl text-lg font-medium leading-8">分子和分母同时乘或除以相同的数，分数的大小不变。</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-lg bg-[#f0eee6] px-3 py-2 text-sm">约分</span><span className="rounded-lg bg-[#f0eee6] px-3 py-2 text-sm">分数基本性质</span></div><div className="mt-7 rounded-xl bg-[#f1f7f0] p-4"><p className="text-xs font-semibold text-[#65756b]">自检问题</p><p className="mt-1 font-medium text-[#245a43]">为什么 1/2 和 2/4 一样大？</p></div></section>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-[#6d756f]">发布后，32 名学生将看到这张复习卡。</p><div className="flex gap-4"><button className="text-sm font-semibold text-[#63706a]">稍后处理</button><button className="rounded-xl bg-[#245a43] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(36,90,67,0.23)] transition hover:bg-[#183d2d]">确认并发布</button></div></div>
        </article>
        <aside className="rounded-[28px] bg-[#173a32] p-6 text-white shadow-[0_20px_60px_rgba(17,48,40,0.2)]"><p className="text-xs font-semibold tracking-[0.14em] text-[#dbeaa1]">班级脉搏</p><h2 className="mt-3 font-serif text-3xl tracking-[-0.04em]">困惑正在<br />回到课堂。</h2><div className="mt-8 grid grid-cols-4 gap-2"><span className="h-10 rounded-md bg-white/10" /><span className="h-10 rounded-md bg-white/20" /><span className="h-10 rounded-md bg-white/10" /><span className="h-10 rounded-md bg-white/15" /><span className="h-10 rounded-md bg-white/10" /><span className="h-10 rounded-md bg-[#d6b44e]/60" /><span className="h-10 rounded-md bg-[#d6b44e] shadow-[0_0_18px_rgba(214,180,78,0.55)]" /><span className="h-10 rounded-md bg-white/10" /></div><p className="mt-5 text-sm leading-6 text-white/75">12 位学生在“单位换算 × 计算”处停下来。</p><div className="mt-8 border-t border-white/15 pt-5"><Lightbulb className="h-5 w-5 text-[#dbeaa1]" /><p className="mt-3 text-base font-medium leading-7">下一节课，用 5 分钟把单位换算再讲一遍。</p><button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#dbeaa1]">生成补讲方案 <CircleCheck className="h-4 w-4" /></button></div><p className="mt-12 text-xs text-white/45"><Sparkles className="mr-1 inline h-3 w-3" />依据来自已聚合的学习事实</p></aside>
      </section>
    </main>
  )
}
