import { ArrowRight, Sparkles } from "lucide-react"
import type { AppRoute } from "../../../app/routes"
import { PinyinText } from "../../../components/pinyin/PinyinText"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import companionImage from "../../../assets/zhiye-kite-valley.png"

type StudentCompanionCardProps = {
  onNavigate?: (route: AppRoute) => void
}

export function StudentCompanionCard({ onNavigate }: StudentCompanionCardProps) {
  return (
    <GlassSurface
      aria-label="学习陪伴"
      className="relative flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:p-6"
      role="region"
      weight="light"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#e5f0ca]/65 blur-2xl" />
      <img
        alt="小野陪伴插画"
        className="relative size-20 shrink-0 object-contain sm:size-24"
        src={companionImage}
      />
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-black text-[#66806b]">
          <Sparkles aria-hidden size={15} />
          <PinyinText text="小野陪你学习" pinyin="xiǎo yě péi nǐ xué xí" />
        </div>
        <p className="mt-2 text-sm font-medium leading-6 text-[#5f7465]">
          <PinyinText text="一步一步来，遇到卡点就告诉我。" pinyin="yí bù yí bù lái, yù dào kǎ diǎn jiù gào sù wǒ." />
        </p>
      </div>
      <button
        className="relative inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#edf4df] px-4 text-sm font-black text-[#31523a]"
        onClick={() => onNavigate?.({ role: "student", page: "tutoring" })}
        type="button"
      >
        <PinyinText text="需要提示吗" />
        <ArrowRight aria-hidden size={16} />
      </button>
    </GlassSurface>
  )
}

export default StudentCompanionCard
