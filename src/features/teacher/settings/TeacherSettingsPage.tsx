import { useState } from "react"
import { BookOpen, Bot, RotateCcw, Save, UserRound } from "lucide-react"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { Dialog } from "../../../components/shared/Dialog"
import { defaultTeacherSettings, getTeacherSettings, saveTeacherSettings, resetTeacherSettings, type TeacherSettings } from "./teacherSettings"

const input = "mt-2 min-h-11 w-full rounded-2xl border border-[#d7e3d6] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#6f9275] focus:ring-4 focus:ring-[#6f9275]/15"
const label = "block text-sm font-bold text-[#344d3d]"

export function TeacherSettingsPage() {
  const { resetPrototype, lessons } = usePrototype()
  const [settings, setSettings] = useState<TeacherSettings>(getTeacherSettings)
  const [saved, setSaved] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const classes = [...new Set(lessons.map((lesson) => lesson.className).concat(settings.currentClass))].filter(Boolean)

  function change<Key extends keyof TeacherSettings>(key: Key, value: TeacherSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function save() {
    if (!settings.teacherName.trim() || !settings.currentClass.trim() || !settings.chapter.trim()) return
    saveTeacherSettings({ ...settings, teacherName: settings.teacherName.trim(), chapter: settings.chapter.trim() })
    setSaved(true)
  }

  return <main className="mx-auto max-w-5xl p-4 pb-24 text-[#17251b] sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.16em] text-[#66806b]">教师工作区</p><h1 className="mt-2 text-3xl font-black">设置</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#718076]">这里的选择会直接影响班级默认值、备课输入和 AI 生成。配置保存在当前浏览器。</p></div><button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#183021] px-5 text-sm font-bold text-white" onClick={save} type="button"><Save size={17} />保存设置</button></header>
    {saved && <p className="mt-5 rounded-2xl bg-[#e5f1e3] p-3 text-sm font-bold text-[#315b3b]" role="status">设置已保存，备课与任务将使用新的默认值。</p>}
    <div className="mt-6 grid gap-5">
      <section aria-labelledby="profile-heading" className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><UserRound className="text-[#58765e]" size={20} /><div><h2 className="text-lg font-black" id="profile-heading">身份与授课班级</h2><p className="text-sm text-[#718076]">用于侧栏身份、任务发布对象与备课的课堂依据。</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className={label}>教师姓名<input className={input} required value={settings.teacherName} onChange={(event) => change("teacherName", event.target.value)} /></label><label className={label}>教师职称<input className={input} value={settings.teacherTitle} onChange={(event) => change("teacherTitle", event.target.value)} /></label><label className={`${label} sm:col-span-2`}>当前班级<select className={input} value={settings.currentClass} onChange={(event) => change("currentClass", event.target.value)}>{classes.map((className) => <option key={className}>{className}</option>)}</select></label></div></section>
      <section aria-labelledby="curriculum-heading" className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><BookOpen className="text-[#58765e]" size={20} /><div><h2 className="text-lg font-black" id="curriculum-heading">教材与进度</h2><p className="text-sm text-[#718076]">新教案默认采用这里的教材和章节，可在教案中修改。</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className={label}>教材版本<input className={input} value={settings.textbook} onChange={(event) => change("textbook", event.target.value)} /></label><label className={label}>当前章节<input className={input} required value={settings.chapter} onChange={(event) => change("chapter", event.target.value)} /></label><label className={`${label} sm:col-span-2`}>补充教学范围<textarea className={`${input} min-h-24`} value={settings.additionalScope} onChange={(event) => change("additionalScope", event.target.value)} /></label></div></section>
      <section aria-labelledby="ai-heading" className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><Bot className="text-[#58765e]" size={20} /><div><h2 className="text-lg font-black" id="ai-heading">AI 草稿偏好</h2><p className="text-sm text-[#718076]">每次生成时随请求送到本地 AI 服务，生成结果需要教师审阅。</p></div></div><div className="mt-5 grid gap-4"><label className={label}>内容详细程度<select className={input} value={settings.aiDetail} onChange={(event) => change("aiDetail", event.target.value)}><option>精简</option><option>平衡</option><option>详细</option></select></label><label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#dce7da] p-3 text-sm font-bold"><input checked={settings.includeEvidence} onChange={(event) => change("includeEvidence", event.target.checked)} type="checkbox" />生成时使用教师选择的课堂证据</label><label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#dce7da] p-3 text-sm font-bold"><input checked={settings.includeLifeExamples} onChange={(event) => change("includeLifeExamples", event.target.checked)} type="checkbox" />优先生成生活化例子</label></div></section>
      <section aria-labelledby="data-heading" className="rounded-[24px] border border-[#dce7da] bg-white p-5 sm:p-6"><h2 className="text-lg font-black" id="data-heading">本机数据</h2><p className="mt-1 text-sm leading-6 text-[#718076]">重置会恢复课堂、任务、教案、测验和教师设置的初始演示内容。</p><button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dbb6ae] px-4 text-sm font-bold text-[#8d4d43]" onClick={() => setResetOpen(true)} type="button"><RotateCcw size={16} />重置演示数据</button></section>
    </div>
    <Dialog description="此操作会覆盖当前浏览器里已修改的演示内容。" footer={<div className="flex justify-end gap-2"><button className="min-h-11 rounded-full border px-5 text-sm font-bold" onClick={() => setResetOpen(false)} type="button">取消</button><button className="min-h-11 rounded-full bg-[#8d4d43] px-5 text-sm font-bold text-white" onClick={() => { resetPrototype(); resetTeacherSettings(); setSettings(defaultTeacherSettings); setResetOpen(false); setSaved(false) }} type="button">确认重置</button></div>} onClose={() => setResetOpen(false)} open={resetOpen} title="重置所有演示数据"><p className="text-sm">请确认当前修改不再需要。</p></Dialog>
  </main>
}

export default TeacherSettingsPage
