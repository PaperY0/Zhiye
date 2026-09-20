import {
  ArrowRight,
  Building2,
  CalendarClock,
  KeyRound,
  Link2,
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
    { label: "教师", value: String(settings.teacherCount), detail: "可在学校设置中修改", icon: UsersRound },
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
            汇总学校组织、接入凭据、数据留存和需要人工核实的保护性反馈入口。
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

        <GlassSurface
          aria-label="数据留存摘要"
          className="rounded-[28px] p-5 sm:p-6"
          role="region"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e7eee5] text-[#58735e]">
              <CalendarClock aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#17251c]">
                数据留存摘要
              </h2>
              <p className="mt-1 text-sm text-[#728178]">当前原型策略</p>
            </div>
          </div>
          <dl className="mt-5 divide-y divide-[#385443]/10 rounded-[20px] border border-white/75 bg-white/42 px-4">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-bold text-[#33483a]">课堂原始音频</dt>
              <dd className="text-sm font-black text-[#173022]">{settings.retentionDays} 天</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-bold text-[#33483a]">AI 生成内容</dt>
              <dd className="text-sm font-black text-[#173022]">{settings.aiContentDays} 天</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-bold text-[#33483a]">审计记录</dt>
              <dd className="text-sm font-black text-[#173022]">{settings.auditDays} 天</dd>
            </div>
          </dl>
        </GlassSurface>
      </div>

      <GlassSurface
        aria-label="邀请码与绑定码"
        className="mt-5 rounded-[28px] p-5 sm:p-6"
        role="region"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#17251c]">
              邀请码与绑定码
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6d7e73]">
              用于演示教师加入学校与班级绑定。代码不会在真实系统中生效。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-[220px] rounded-[20px] border border-white/80 bg-white/48 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-bold text-[#708176]">
                <KeyRound aria-hidden="true" size={15} /> 学校邀请码
              </p>
              <strong className="mt-2 block font-mono text-lg text-[#183023]">
                {settings.invitationCode}
              </strong>
            </div>
            <div className="min-w-[220px] rounded-[20px] border border-white/80 bg-white/48 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-bold text-[#708176]">
                <Link2 aria-hidden="true" size={15} /> 五年级（2）班绑定码
              </p>
              <strong className="mt-2 block font-mono text-lg text-[#183023]">
                {settings.bindingCode}
              </strong>
            </div>
          </div>
        </div>
      </GlassSurface>
    </div>
  )
}

export default AdminHomePage
