import { useEffect, useState } from "react"

import {
  BellRing,
  BookOpenCheck,
  CalendarClock,
  FileQuestion,
  Save,
  X,
} from "lucide-react"

import type { Mistake, MistakeMastery } from "../../../app/prototype/types"

import { Drawer } from "../../../components/shared/Drawer"

import { StatusChip } from "../../../components/shared/StatusChip"

export type MistakeView = Mistake & {
  note: string

  reminderChoice: ReminderChoice
}

type ReminderChoice = "tomorrow" | "3-days" | "7-days"

type MistakeDetailDrawerProps = {
  mistake: MistakeView | null

  onClose: () => void

  onSave: (mistakeId: string, mastery: MistakeMastery, note: string) => void

  onReminder: (mistakeId: string, choice: ReminderChoice) => void
}

type MasteryOption = {
  value: MistakeMastery

  label: string
}

const masteryOptions: MasteryOption[] = [
  { value: "new", label: "刚加入" },

  { value: "learning", label: "继续练习" },

  { value: "basic", label: "基本掌握" },

  { value: "mastered", label: "已经掌握" },
]

const reminderLabels: Record<ReminderChoice, string> = {
  tomorrow: "明天 19:00",

  "3-days": "3 天后 19:00",

  "7-days": "7 天后 19:00",
}

function reminderChoiceFromDate(reminderAt?: string): ReminderChoice {
  if (reminderAt?.startsWith("2026-07-26")) return "tomorrow"
  if (reminderAt?.startsWith("2026-08-01")) return "7-days"
  return "3-days"
}

const reminderFeedback: Record<ReminderChoice, string> = {
  tomorrow: "已设置 7 月 26 日 19:00 的模拟提醒",

  "3-days": "已设置 7 月 28 日 19:00 的模拟提醒",

  "7-days": "已设置 8 月 1 日 19:00 的模拟提醒",
}

const masteryLabels: Record<MistakeMastery, string> = {
  new: "刚加入",

  learning: "继续练习",

  basic: "基本掌握",

  mastered: "已经掌握",
}

export function MistakeDetailDrawer({
  mistake,

  onClose,

  onSave,

  onReminder,
}: MistakeDetailDrawerProps) {
  const [mastery, setMastery] = useState<MistakeMastery>(
    mistake?.mastery ?? "new",
  )

  const [note, setNote] = useState(mistake?.note ?? "")

  const [reminderChoice, setReminderChoice] = useState<ReminderChoice>(
    mistake?.reminderChoice ?? reminderChoiceFromDate(mistake?.reminderAt),
  )

  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    if (!mistake) return

    setMastery(mistake.mastery)

    setNote(mistake.note)

    setReminderChoice(
      mistake.reminderChoice ?? reminderChoiceFromDate(mistake.reminderAt),
    )

    setFeedback("")
  }, [mistake?.id])

  return (
    <Drawer
      onClose={onClose}
      open={mistake !== null}
      title={mistake?.knowledgePoint ?? "错题详情"}
    >
      {mistake ? (
        <div className="space-y-6 text-[#203027]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="info">{mistake.subject}</StatusChip>
            <StatusChip
              tone={
                mastery === "mastered" || mastery === "basic"
                  ? "success"
                  : "warning"
              }
            >
              {masteryLabels[mastery]}
            </StatusChip>
            <span className="text-xs font-bold text-[#718078]">
              加入于 2026 年 7 月 22 日
            </span>
          </div>

          <section
            aria-labelledby="mistake-preview-title"
            className="overflow-hidden rounded-[26px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.92),rgba(242,246,238,.76))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_16px_34px_rgba(52,79,58,.08)]"
          >
            <p
              className="flex items-center gap-2 text-xs font-black tracking-[0.12em] text-[#5c735f]"
              id="mistake-preview-title"
            >
              <FileQuestion aria-hidden="true" size={16} />
              原题预览
            </p>
            <div className="mt-5 grid min-h-36 place-items-center rounded-[22px] border border-[#e1e8dc] bg-[#fffef9] p-6 text-center">
              <p className="max-w-lg text-xl font-black leading-9 text-[#1e2d23]">
                {mistake.prompt}
              </p>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-[22px] border border-[#eadcc9] bg-[#fbf4e8] p-4">
              <p className="text-xs font-black tracking-[0.1em] text-[#89693c]">
                当时的卡点
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#5f4c31]">
                {mistake.cause}
              </p>
            </section>
            <section className="rounded-[22px] border border-[#cedfce] bg-[#edf5eb] p-4">
              <p className="text-xs font-black tracking-[0.1em] text-[#45694d]">
                回顾思路
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#35523c]">
                {mistake.explanation}
              </p>
            </section>
          </div>

          <section className="space-y-4 rounded-[24px] border border-[#dce6da] bg-white/58 p-5">
            <div className="flex items-center gap-2">
              <BookOpenCheck
                aria-hidden="true"
                className="text-[#52725a]"
                size={18}
              />
              <h3 className="text-base font-black">更新学习记录</h3>
            </div>
            <label
              className="grid gap-2 text-sm font-black"
              htmlFor="mistake-mastery"
            >
              掌握状态
              <select
                className="min-h-12 rounded-2xl border border-[#cbd9cb] bg-white/82 px-4 font-bold outline-none focus:border-[#63836a] focus:ring-4 focus:ring-[#63836a]/15"
                id="mistake-mastery"
                onChange={(event) =>
                  setMastery(event.target.value as MistakeMastery)
                }
                value={mastery}
              >
                {masteryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="grid gap-2 text-sm font-black"
              htmlFor="mistake-note"
            >
              复习笔记
              <textarea
                className="min-h-28 resize-y rounded-2xl border border-[#cbd9cb] bg-white/82 p-4 font-medium leading-6 outline-none focus:border-[#63836a] focus:ring-4 focus:ring-[#63836a]/15"
                id="mistake-note"
                onChange={(event) => setNote(event.target.value)}
                placeholder="写下这次真正弄明白的地方……"
                value={note}
              />
            </label>
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1d3323] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(29,51,35,.16)]"
              onClick={() => {
                onSave(mistake.id, mastery, note)

                setFeedback(`已保存为${masteryLabels[mastery]}`)
              }}
              type="button"
            >
              <Save aria-hidden="true" size={17} />
              保存学习记录
            </button>
          </section>

          <section className="space-y-4 rounded-[24px] border border-[#e7ddc7] bg-[#faf6ea]/86 p-5">
            <div className="flex items-center gap-2">
              <CalendarClock
                aria-hidden="true"
                className="text-[#8a6a38]"
                size={18}
              />
              <h3 className="text-base font-black">下次复习提醒</h3>
            </div>
            <label
              className="grid gap-2 text-sm font-black"
              htmlFor="mistake-reminder"
            >
              复习提醒
              <select
                className="min-h-12 rounded-2xl border border-[#dfd2ba] bg-white/82 px-4 font-bold outline-none focus:border-[#997b48] focus:ring-4 focus:ring-[#997b48]/15"
                id="mistake-reminder"
                onChange={(event) =>
                  setReminderChoice(event.target.value as ReminderChoice)
                }
                value={reminderChoice}
              >
                {Object.entries(reminderLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#cdb88f] bg-white/74 px-5 text-sm font-black text-[#74572b]"
              onClick={() => {
                onReminder(mistake.id, reminderChoice)

                setFeedback(reminderFeedback[reminderChoice])
              }}
              type="button"
            >
              <BellRing aria-hidden="true" size={17} />
              设置复习提醒
            </button>
            <p className="text-xs leading-5 text-[#81735b]">
              模拟提醒只保存在当前页面，不会发送系统通知或上传学习数据。
            </p>
          </section>

          {feedback ? (
            <p
              className="rounded-2xl bg-[#e7f1e5] px-4 py-3 text-sm font-black text-[#36563d]"
              role="status"
            >
              {feedback}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#ced9cd] bg-white/65 text-sm font-black text-[#526158]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
            关闭抽屉
          </button>
        </div>
      ) : null}
    </Drawer>
  )
}

export default MistakeDetailDrawer
