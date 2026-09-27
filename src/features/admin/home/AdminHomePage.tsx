import {
  ArrowRight,
  Building2,
  School,
  ShieldAlert,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import { readSavedAdminSettings } from "../settings/adminSettings"

export interface AdminHomePageProps {
  onNavigate(route: AppRoute): void
}

function NavigationButton({
  children,
  onClick,
  compact = false,
}: {
  children: React.ReactNode
  onClick(): void
  compact?: boolean
}) {
  return (
    <button
      className={`role-action-primary whitespace-nowrap ${compact ? "px-4 text-[13px]" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
      <ArrowRight aria-hidden="true" size={16} />
    </button>
  )
}

export function AdminHomePage({ onNavigate }: AdminHomePageProps) {
  const { safetyCases, students } = usePrototype()
  const settings = readSavedAdminSettings()
  const classNames = Array.from(new Set(students.map(({ className }) => className)))
  const metricCards = [
    { label: "学校", value: "1", detail: settings.schoolName, icon: Building2 },
    { label: "班级", value: String(classNames.length), detail: classNames.join("、") || "尚未创建班级", icon: School },
    { label: "学生", value: String(students.length), detail: "当前本机学生档案", icon: UsersRound },
  ]
  const pendingSafetyCases = safetyCases.filter(
    ({ status }) => status === "new" || status === "reviewing",
  ).length

  return (
    <div className="role-page role-page-flow">
      <header className="role-page-header">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusChip tone="info">管理端</StatusChip>
            <StatusChip tone="neutral">模拟运营数据</StatusChip>
          </div>
          <h1 className="role-page-title">
            学校管理概览
          </h1>
          <p className="role-page-description">
            查看当前学校资料、学生档案与需要人工核实的保护性反馈。
          </p>
        </div>
        <NavigationButton
          onClick={() => onNavigate({ role: "admin", page: "settings" })}
        >
          <SlidersHorizontal aria-hidden="true" size={17} />
          管理学校设置
        </NavigationButton>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-[22px] border border-[#d8c691]/45 bg-[#fff8df]/70 px-4 py-3.5 text-sm leading-6 text-[#67582d] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
        <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
        <p>
          <strong>原型说明：</strong>
          所有学校、班级、教师与安全队列数据均为演示数据，不连接真实校务系统，也不会触发外部通知。
        </p>
      </div>

      <section aria-label="学校运营指标" className="grid gap-4 md:grid-cols-3">
        {metricCards.map(({ detail, icon: Icon, label, value }) => (
          <GlassSurface className="rounded-[26px] p-5" key={label}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#6b7d70]">{label}</p>
                <strong className="mt-2 block text-4xl font-black tracking-[-0.05em] text-[#173022]">
                  {value}
                </strong>
                <p className="mt-2 text-sm text-[#718277]">{detail}</p>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e4eee1] text-[#55745c] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                <Icon aria-hidden="true" size={22} />
              </span>
            </div>
          </GlassSurface>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <GlassSurface
          aria-label="保护性反馈队列"
          className="rounded-[28px] p-5 sm:p-6"
          role="region"
          weight="sheet"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#f7e7d9] text-[#9a5639]">
                <ShieldAlert aria-hidden="true" size={22} />
              </span>
              <h2 className="mt-5 text-xl font-black text-[#17251c]">
                保护性反馈队列
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6c7d72]">
                当前有 {pendingSafetyCases}{" "}
                项待人工核实。系统仅提供最少必要上下文，不作诊断或自动结论。
              </p>
              <StatusChip className="mt-4" tone="warning">
                {pendingSafetyCases} 项待人工核实
              </StatusChip>
            </div>
            <NavigationButton
              compact
              onClick={() => onNavigate({ role: "admin", page: "safety" })}
            >
              打开保护性反馈队列
            </NavigationButton>
          </div>
        </GlassSurface>

        <GlassSurface aria-label="保护性反馈联系人" className="rounded-[28px] p-5 sm:p-6" role="region">
          <h2 className="text-lg font-black text-[#17251c]">保护性反馈联系人</h2>
          <p className="mt-2 text-sm text-[#728178]">人工核实与升级处理时使用</p>
          <dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-[#718076]">主要联系人</dt><dd className="font-black">{settings.primaryContact}</dd></div><div><dt className="text-[#718076]">备用联系人</dt><dd className="font-black">{settings.backupContact}</dd></div><div><dt className="text-[#718076]">升级联系人</dt><dd className="font-black">{settings.escalationContact}</dd></div></dl>
        </GlassSurface>
      </div>

    </div>
  )
}

export default AdminHomePage
