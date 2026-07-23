import { Menu, X } from "lucide-react"
import { useState } from "react"
import LivingLandscapeBackdrop from "./LivingLandscapeBackdrop"

type WelcomeScreenProps = { onEnter: () => void }

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = [
    { label: "首页 Home", href: "#home" },
    { label: "课堂空间 Classroom", href: "#classroom" },
    { label: "关于知野 About", href: "#about" },
    { label: "教育手记 Journal", href: "#journal" },
  ]

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white text-black">
      <LivingLandscapeBackdrop />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <a aria-label="知野 Zhì Yě" className="flex items-baseline gap-2 font-display text-3xl tracking-tight" href="#home">
          知野
          <span className="font-sans text-[11px] font-medium tracking-[0.18em] text-black/55">ZHÌ YĚ</span>
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item, index) => <a key={item.href} className={`text-sm transition-colors ${index === 0 ? "text-black" : "text-[#6F6F6F] hover:text-black"}`} href={item.href}>{item.label}</a>)}
          <button className="rounded-full bg-black px-6 py-2.5 text-sm text-white transition duration-200 hover:scale-[1.03]" onClick={onEnter}>进入课堂</button>
        </div>
        <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 md:hidden" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </nav>

      {menuOpen && <nav className="relative z-20 mx-8 rounded-3xl border border-black/10 bg-white p-6 shadow-xl md:hidden"><div className="flex flex-col gap-4">{navItems.map((item, index) => <a key={item.href} className={`text-lg ${index === 0 ? "text-black" : "text-[#6F6F6F]"}`} href={item.href}>{item.label}</a>)}<button className="mt-2 rounded-full bg-black px-6 py-3 text-sm text-white" onClick={onEnter}>进入课堂</button></div></nav>}

      <section className="relative z-10 flex flex-col items-center justify-center px-6 pb-40 pt-[calc(8rem-75px)] text-center" id="home">
        <p className="animate-fade-rise mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.28em] text-[#6F6F6F]">ZHIYE · RURAL CLASSROOM INTELLIGENCE</p>
        <h1 className="animate-fade-rise max-w-6xl font-display text-5xl font-normal leading-[0.98] tracking-[-2.46px] text-black sm:text-7xl md:text-8xl">让每一间课堂，<br className="hidden md:block" />长出自己的 <em className="text-[#6F6F6F]">回响。</em></h1>
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-[#6F6F6F] sm:text-lg">Where every classroom finds its own rhythm.<br />让真实的学习被看见，让每一次教学都有回应。</p>
        <button className="animate-fade-rise-delay-2 mt-12 rounded-full bg-black px-14 py-5 text-base text-white transition duration-200 hover:scale-[1.03]" onClick={onEnter}>进入知野 · Enter Zhiye</button>
      </section>
    </main>
  )
}
