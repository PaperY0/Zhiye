import {
  CalendarClock,
  Check,
  KeyRound,
  Link2,
  Save,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react"
import { useState } from "react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { Dialog } from "../../../components/shared/Dialog"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import {
  ToastRegion,
  type ToastMessage,
} from "../../../components/shared/ToastRegion"

type AdminSettings = {
  primaryContact: string
  backupContact: string
  escalationContact: string
  retentionDays: "7" | "14" | "30"
  aiContentDays: "30" | "90" | "180"
  auditDays: "180" | "365" | "730"
}

const initialSettings: AdminSettings = {
  primaryContact: "王老师 · 德育负责人",
  backupContact: "陈老师 · 年级负责人",
  escalationContact: "周主任 · 校务负责人",
  retentionDays: "7",
  aiContentDays: "90",
  auditDays: "365",
}

const adminSettingsStorageKey = "zhiye-admin-settings-v1"

function readSavedSettings(): AdminSettings {
  try {
    const saved = window.localStorage.getItem(adminSettingsStorageKey)
    return saved
      ? { ...initialSettings, ...(JSON.parse(saved) as Partial<AdminSettings>) }
      : initialSettings
  } catch {
    return initialSettings
  }
}

const inputClassName =
  "mt-2 min-h-11 w-full rounded-2xl border border-white/80 bg-white/60 px-4 text-sm font-semibold text-[#263b2d] outline-none transition placeholder:text-[#91a097] focus:border-[#7f9b84] focus:ring-4 focus:ring-[#6f9475]/18"
const labelClassName = "text-sm font-bold text-[#33483a]"

function SettingsSection({
  children,
  description,
  icon,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <GlassSurface className="rounded-[28px] p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e5efe1] text-[#4e7358] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em] text-[#17251c]">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6b7d70]">{description}</p>
        </div>
      </div>
      {children}
    </GlassSurface>
  )
}

export function AdminSettingsPage() {
  const { resetPrototype } = usePrototype()
  const [settings, setSettings] = useState<AdminSettings>(readSavedSettings)
  const [savedRetentionDays, setSavedRetentionDays] =
    useState<AdminSettings["retentionDays"]>(readSavedSettings().retentionDays)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [bindingCode, setBindingCode] = useState("")
  const [bindingFeedback, setBindingFeedback] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [resetOpen, setResetOpen] = useState(false)

  function updateSetting<Key extends keyof AdminSettings>(
    key: Key,
    value: AdminSettings[Key],
  ) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  function simulateBinding() {
    if (bindingCode.trim() === "520826") {
      setBindingFeedback("已在本地原型中绑定五年级（2）班")
      return
    }
    setBindingFeedback("绑定码未匹配演示班级，请输入 520826")
  }

  function confirmSave() {
    window.localStorage.setItem(adminSettingsStorageKey, JSON.stringify(settings))
    setSavedRetentionDays(settings.retentionDays)
    setConfirmOpen(false)
    setToasts([
      {
        id: "admin-settings-saved",
        title: "管理设置已保存到当前原型",
        description: `课堂原始音频留存时间：${settings.retentionDays} 天。刷新后仍会保留，不会上传。`,
        tone: "success",
      },
    ])
  }

  return (
    <div className="relative mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusChip tone="info">管理端</StatusChip>
            <StatusChip tone="neutral">本地学校设置</StatusChip>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.045em] text-[#132219] sm:text-4xl">
            学校与数据设置
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66796d] sm:text-base">
            配置人工响应联系人、学校接入凭据和数据留存边界。敏感变更必须再次确认。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cbd9cb] bg-white/70 px-5 text-sm font-black text-[#46614c]"
            onClick={() => setResetOpen(true)}
            type="button"
          >
            重置全部演示数据
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#15251b] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(20,40,27,.18)] transition hover:-translate-y-0.5 hover:bg-[#223b2a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66886d]/30"
            onClick={() => setConfirmOpen(true)}
            type="button"
          >
            <Save aria-hidden="true" size={18} />
            保存管理设置
          </button>
        </div>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-[22px] border border-[#d8c691]/45 bg-[#fff8df]/70 px-4 py-3.5 text-sm leading-6 text-[#67582d] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
        <p>
          <strong>原型说明：</strong>
          所有操作仅用于当前本地原型，不会生成真实账号、发送邀请、绑定班级、上传联系人或更改学校数据。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection
          description="指定保护性反馈进入人工流程时的校内可信任联系人。"
          icon={<UserRoundCog aria-hidden="true" size={21} />}
          title="响应联系人"
        >
          <div className="grid gap-4">
            <label className={labelClassName}>
              主要响应联系人
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("primaryContact", event.target.value)
                }
                type="text"
                value={settings.primaryContact}
              />
            </label>
            <label className={labelClassName}>
              备用响应联系人
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("backupContact", event.target.value)
                }
                type="text"
                value={settings.backupContact}
              />
            </label>
            <label className={labelClassName}>
              升级处理联系人
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("escalationContact", event.target.value)
                }
                type="text"
                value={settings.escalationContact}
              />
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          description="生成一次性演示邀请码，并用固定绑定码模拟加入班级。"
          icon={<KeyRound aria-hidden="true" size={21} />}
          title="邀请码与绑定"
        >
          <div className="rounded-[22px] border border-white/80 bg-white/45 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#293d30]">
                  教师学校邀请码
                </p>
                <p className="mt-1 text-xs leading-5 text-[#74837a]">
                  邀请码仅在当前页面显示，不会写入真实学校系统。
                </p>
              </div>
              <button
                className="min-h-11 rounded-full border border-[#53715b]/18 bg-[#e5eee2] px-4 text-sm font-black text-[#365640] transition hover:bg-[#dbe9d8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6f9475]/25"
                onClick={() => setInvitationCode("ZY-2026-0725-01")}
                type="button"
              >
                生成模拟邀请码
              </button>
            </div>
            {invitationCode ? (
              <strong className="mt-4 block rounded-2xl bg-[#173022] px-4 py-3 text-center font-mono text-lg tracking-[0.08em] text-white">
                {invitationCode}
              </strong>
            ) : null}
          </div>

          <div className="mt-4 rounded-[22px] border border-white/80 bg-white/45 p-4">
            <label className={labelClassName}>
              输入绑定码
              <input
                className={inputClassName}
                inputMode="numeric"
                onChange={(event) => setBindingCode(event.target.value)}
                placeholder="例如 520826"
                type="text"
                value={bindingCode}
              />
            </label>
            <button
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#31553c] px-4 text-sm font-black text-white transition hover:bg-[#24472f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6f9475]/25"
              onClick={simulateBinding}
              type="button"
            >
              <Link2 aria-hidden="true" size={17} />
              模拟绑定班级
            </button>
            {bindingFeedback ? (
              <p
                className="mt-3 flex items-center gap-2 text-sm font-bold text-[#44684d]"
                role="status"
              >
                <Check aria-hidden="true" size={16} />
                {bindingFeedback}
              </p>
            ) : null}
          </div>
        </SettingsSection>

        <SettingsSection
          description="调整课堂原始音频和 AI 生成内容在原型中的留存说明。"
          icon={<CalendarClock aria-hidden="true" size={21} />}
          title="数据留存"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              课堂原始音频留存时间
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting(
                    "retentionDays",
                    event.target.value as AdminSettings["retentionDays"],
                  )
                }
                value={settings.retentionDays}
              >
                <option value="7">7 天</option>
                <option value="14">14 天</option>
                <option value="30">30 天</option>
              </select>
            </label>
            <label className={labelClassName}>
              AI 生成内容留存时间
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting(
                    "aiContentDays",
                    event.target.value as AdminSettings["aiContentDays"],
                  )
                }
                value={settings.aiContentDays}
              >
                <option value="30">30 天</option>
                <option value="90">90 天</option>
                <option value="180">180 天</option>
              </select>
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              管理审计记录留存时间
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting(
                    "auditDays",
                    event.target.value as AdminSettings["auditDays"],
                  )
                }
                value={settings.auditDays}
              >
                <option value="180">180 天</option>
                <option value="365">365 天</option>
                <option value="730">730 天</option>
              </select>
            </label>
          </div>
          <p className="mt-4 rounded-2xl bg-[#eef4eb] px-4 py-3 text-xs leading-5 text-[#5d7163]">
            留存周期应由学校政策、监护人授权和适用法律共同确定。此页面只演示配置流程。
          </p>
        </SettingsSection>

        <SettingsSection
          description="保存前复核本次本地修改，避免把原型操作误认为真实配置。"
          icon={<ShieldCheck aria-hidden="true" size={21} />}
          title="变更确认"
        >
          <dl className="divide-y divide-[#385443]/10 rounded-[20px] border border-white/75 bg-white/42 px-4">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-bold text-[#425648]">
                当前已保存音频留存
              </dt>
              <dd className="text-sm font-black text-[#173022]">
                {savedRetentionDays} 天
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-bold text-[#425648]">
                待保存音频留存
              </dt>
              <dd className="text-sm font-black text-[#173022]">
                {settings.retentionDays} 天
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm font-bold text-[#425648]">
                主要响应联系人
              </dt>
              <dd className="text-right text-sm font-black text-[#173022]">
                {settings.primaryContact}
              </dd>
            </div>
          </dl>
        </SettingsSection>
      </div>

      <Dialog
        description="请再次确认响应联系人和数据留存修改。"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="min-h-11 rounded-full border border-[#405948]/16 bg-white/65 px-5 text-sm font-black text-[#405448]"
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              返回检查
            </button>
            <button
              className="min-h-11 rounded-full bg-[#173022] px-5 text-sm font-black text-white"
              onClick={confirmSave}
              type="button"
            >
              确认保存
            </button>
          </div>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="确认更新管理设置"
      >
        <div className="space-y-3 text-sm leading-6 text-[#53675a]">
          <p>{`课堂原始音频将从 ${savedRetentionDays} 天调整为 ${settings.retentionDays} 天。`}</p>
          <p>
            本次确认只更新当前页面状态，不会更改真实学校系统，也不会自动删除、延长或上传任何数据。
          </p>
        </div>
      </Dialog>

      <Dialog
        description="课堂、任务、学生记录和教师、管理员设置都会恢复为初始示例。"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="rounded-full border border-[#405948]/16 bg-white/65 px-5 py-2.5 text-sm font-black text-[#405448]"
              onClick={() => setResetOpen(false)}
              type="button"
            >
              取消
            </button>
            <button
              className="rounded-full bg-[#8a4f3f] px-5 py-2.5 text-sm font-black text-white"
              onClick={() => {
                resetPrototype()
                setSettings(initialSettings)
                setSavedRetentionDays(initialSettings.retentionDays)
                setResetOpen(false)
                setToasts([
                  {
                    id: "admin-prototype-reset",
                    title: "演示数据已重置",
                    description: "业务数据和角色设置已恢复为初始示例。",
                    tone: "success",
                  },
                ])
              }}
              type="button"
            >
              确认重置
            </button>
          </div>
        }
        onClose={() => setResetOpen(false)}
        open={resetOpen}
        title="确认重置全部演示数据"
      >
        <p className="text-sm leading-7 text-[#53675a]">
          此操作会清理本地快照，不能恢复你刚才的演示修改。
        </p>
      </Dialog>

      <ToastRegion
        label="管理设置通知"
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
        toasts={toasts}
      />
    </div>
  )
}

export default AdminSettingsPage
