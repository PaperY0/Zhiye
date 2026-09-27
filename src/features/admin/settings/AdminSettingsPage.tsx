import { useState } from "react"
import { Save, ShieldCheck, RotateCcw } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { Dialog } from "../../../components/shared/Dialog"
import { adminSettingsStorageKey, initialAdminSettings, readSavedAdminSettings, type AdminSettings } from "./adminSettings"

const input = "mt-2 min-h-11 w-full rounded-2xl border border-[#d7e3d6] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#6f9275] focus:ring-4 focus:ring-[#6f9275]/15"

export function AdminSettingsPage() {
  const { resetPrototype } = usePrototype()
  const [settings, setSettings] = useState<AdminSettings>(readSavedAdminSettings)
  const [saved, setSaved] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  function change(key: keyof AdminSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function save() {
    if (!settings.schoolName.trim() || !settings.primaryContact.trim()) return
    window.localStorage.setItem(adminSettingsStorageKey, JSON.stringify(settings))
    setSaved(true)
  }

  return <main className="role-page role-page-flow mx-auto max-w-5xl">
    <header className="role-page-header"><div><p className="role-page-kicker">学校管理</p><h1 className="role-page-title">学校设置</h1><p className="role-page-description">维护学校名称和保护性反馈联系人。内容只保存在当前浏览器。</p></div><button className="role-action-primary" onClick={save} type="button"><Save size={17} />保存设置</button></header>
    {saved && <p className="rounded-2xl bg-[#e5f1e3] p-3 text-sm font-bold text-[#315b3b]" role="status">设置已保存，管理概览与保护性反馈会使用新的信息。</p>}
    <div className="mt-5 grid gap-5">
      <section aria-labelledby="school-heading" className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><h2 className="text-lg font-black" id="school-heading">学校资料</h2><p className="mt-1 text-sm text-[#718076]">学校名称会显示在管理概览中。</p><label className="mt-5 block text-sm font-bold">学校名称<input className={input} required value={settings.schoolName} onChange={(event) => change("schoolName", event.target.value)} /></label></section>
      <section aria-labelledby="contact-heading" className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck className="text-[#58765e]" size={20} /><h2 className="text-lg font-black" id="contact-heading">保护性反馈联系人</h2></div><p className="mt-1 text-sm text-[#718076]">主要联系人用于分配待核实的反馈，备用和升级联系人供人工处理时参考。</p><div className="mt-5 grid gap-4">{([ ["主要响应联系人", "primaryContact"], ["备用响应联系人", "backupContact"], ["升级处理联系人", "escalationContact"] ] as const).map(([title, key]) => <label className="block text-sm font-bold" key={key}>{title}<input className={input} required={key === "primaryContact"} value={settings[key]} onChange={(event) => change(key, event.target.value)} /></label>)}</div></section>
      <section className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><h2 className="text-lg font-black">本机数据</h2><p className="mt-1 text-sm leading-6 text-[#718076]">恢复所有角色的演示数据和设置，包括课堂、学生、任务、教案与管理资料。</p><button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d9b9b2] px-4 text-sm font-bold text-[#8d4d43]" onClick={() => setResetOpen(true)} type="button"><RotateCcw size={16} />重置演示数据</button></section>
    </div>
    <Dialog description="此操作会覆盖当前浏览器中已修改的演示内容。" footer={<div className="flex justify-end gap-2"><button className="min-h-11 rounded-full border px-5 text-sm font-bold" onClick={() => setResetOpen(false)} type="button">取消</button><button className="min-h-11 rounded-full bg-[#8d4d43] px-5 text-sm font-bold text-white" onClick={() => { resetPrototype(); window.localStorage.removeItem(adminSettingsStorageKey); setSettings(initialAdminSettings); setResetOpen(false); setSaved(false) }} type="button">确认重置</button></div>} onClose={() => setResetOpen(false)} open={resetOpen} title="重置所有演示数据"><p className="text-sm">请确认当前修改不再需要。</p></Dialog>
  </main>
}

export default AdminSettingsPage
