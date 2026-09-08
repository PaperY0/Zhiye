import { GraduationCap, Menu, School, ShieldCheck, Sparkles, X } from "lucide-react"
import { useState } from "react"
import LivingLandscapeBackdrop from "./LivingLandscapeBackdrop"
import type { Role } from "../app/routes"
import Dialog from "./shared/Dialog"

type WelcomeScreenProps = { onEnterRole: (role: Role) => void }

const roleOptions = [
  { role: "teacher" as const, label: "教师", description: "课堂复盘、班级洞察与备课", icon: Sparkles },
  { role: "student" as const, label: "学生", description: "复习、答疑与错题回顾", icon: GraduationCap },
  { role: "parent" as const, label: "家长", description: "学习摘要与联系老师", icon: School },
  { role: "admin" as const, label: "管理员", description: "学校管理与保护性反馈", icon: ShieldCheck },
]

export default function WelcomeScreen({ onEnterRole }: WelcomeScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
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
        <a aria-label="知野 Zhì Yě" className="flex items-baseline gap-2 font-brand text-3xl font-black" href="#home">
          <span className="tracking-[0.1em]">知野</span>
          <span className="font-sans text-[11px] font-medium tracking-[0.18em] text-black/55">ZHÌ YĚ</span>
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item, index) => <a key={item.href} className={`text-sm transition-colors ${index === 0 ? "text-black" : "text-[#6F6F6F] hover:text-black"}`} href={item.href}>{item.label}</a>)}
          <button className="rounded-full bg-black px-6 py-2.5 text-sm text-white transition duration-200 hover:scale-[1.03]" onClick={() => setRoleDialogOpen(true)}>进入课堂</button>
        </div>
        <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 md:hidden" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </nav>

      {menuOpen && <nav className="relative z-20 mx-8 rounded-3xl border border-black/10 bg-white p-6 shadow-xl md:hidden"><div className="flex flex-col gap-4">{navItems.map((item, index) => <a key={item.href} className={`text-lg ${index === 0 ? "text-black" : "text-[#6F6F6F]"}`} href={item.href}>{item.label}</a>)}<button className="mt-2 rounded-full bg-black px-6 py-3 text-sm text-white" onClick={() => setRoleDialogOpen(true)}>进入课堂</button></div></nav>}

      <section className="relative z-10 flex flex-col items-center justify-center px-6 pb-40 pt-[calc(8rem-75px)] text-center" id="home">
        <p className="animate-fade-rise mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.28em] text-[#6F6F6F]">ZHIYE · RURAL CLASSROOM INTELLIGENCE</p>
        <h1 className="animate-fade-rise max-w-6xl font-handwriting text-[3.7rem] font-normal leading-[1.12] tracking-[0.02em] text-black sm:text-[5.7rem] md:translate-x-[2vw] md:text-[7.5rem]">让每一间课堂<br className="hidden md:block" />长出自己的 <em className="not-italic text-[#487a3a]">回响</em></h1>
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-[#6F6F6F] sm:text-lg">Where every classroom finds its own rhythm.<br />让真实的学习被看见，让每一次教学都有回应。</p>
        <button className="animate-fade-rise-delay-2 mt-12 rounded-full bg-black px-14 py-5 text-base text-white transition duration-200 hover:scale-[1.03]" onClick={() => setRoleDialogOpen(true)}>进入知野 · Enter Zhiye</button>
      </section>

      <Dialog
        open={roleDialogOpen}
        title="选择体验角色"
        description="选择一个身份进入对应的知野空间。所有操作均为本地原型演示。"
        onClose={() => setRoleDialogOpen(false)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {roleOptions.map(({ role, label, description, icon: Icon }) => (
            <button
              key={role}
              type="button"
              aria-label={`以${label}身份进入`}
              className="group flex min-h-28 items-start gap-4 rounded-[22px] border border-white/75 bg-white/58 p-4 text-left shadow-[0_12px_30px_rgba(34,61,42,.08)] transition hover:-translate-y-0.5 hover:bg-white/78 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54775d]"
              onClick={() => onEnterRole(role)}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-[#e3ecdf] text-[#365a3e]">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block text-base font-black text-[#172019]">{label}端</strong>
                <span className="mt-1 block text-sm leading-6 text-[#6f7e73]">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    </main>
  )
}
