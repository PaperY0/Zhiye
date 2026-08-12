import { useMemo, useState } from "react"

import {
  BookMarked,
  CalendarDays,
  ChevronRight,
  Filter,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react"

import type { MistakeMastery, Subject } from "../../../app/prototype/types"

import { usePrototype } from "../../../app/prototype/PrototypeContext"

import { EmptyState } from "../../../components/shared/EmptyState"

import { FilterBar } from "../../../components/shared/FilterBar"

import { GlassSurface } from "../../../components/shared/GlassSurface"

import { StatusChip } from "../../../components/shared/StatusChip"

import { MistakeDetailDrawer, type MistakeView } from "./MistakeDetailDrawer"

type DateFilter = "all" | "7-days" | "30-days"

type MasteryFilter = "all" | MistakeMastery

type SubjectFilter = "all" | Subject

type ReminderChoice = "tomorrow" | "3-days" | "7-days"

const prototypeToday = new Date("2026-07-25T12:00:00+08:00")

const masteryMeta: Record<MistakeMastery, {
  label: string

  tone: "neutral" | "warning" | "info" | "success"
}> = {
  new: { label: "刚加入", tone: "neutral" },

  learning: { label: "继续练习", tone: "warning" },

  basic: { label: "基本掌握", tone: "info" },

  mastered: { label: "已经掌握", tone: "success" },
}

const sourceLabels = {
  lesson: "课堂复习",

  quiz: "测验",

  tutoring: "拍照答疑",

  task: "教师任务",
} as const

const reminderDates: Record<ReminderChoice, string> = {
  tomorrow: "2026-07-26T19:00:00+08:00",
  "3-days": "2026-07-28T19:00:00+08:00",
  "7-days": "2026-08-01T19:00:00+08:00",
}

function isWithinDays(createdAt: string, days: number) {
  const created = new Date(createdAt)

  const elapsed = prototypeToday.getTime() - created.getTime()

  return elapsed >= 0 && elapsed <= days * 24 * 60 * 60 * 1000
}

export function MistakesPage() {
  const { students, updateMistake } = usePrototype()

  const currentStudent = students.find(
    (student) => student.id === "student-lin-xiaoyu",
  )

  const [records, setRecords] = useState<MistakeView[]>(() =>
    (currentStudent?.mistakes ?? []).map((mistake) => ({
      ...mistake,

      note: mistake.note ?? "",

      reminderChoice: "3-days",
    })),
  )

  const [subject, setSubject] = useState<SubjectFilter>("all")

  const [knowledge, setKnowledge] = useState("all")

  const [date, setDate] = useState<DateFilter>("all")

  const [mastery, setMastery] = useState<MasteryFilter>("all")

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const knowledgePoints = useMemo(
    () => Array.from(new Set(records.map((mistake) => mistake.knowledgePoint))),

    [records],
  )

  const filtered = records.filter((mistake) => {
    if (subject !== "all" && mistake.subject !== subject) return false

    if (knowledge !== "all" && mistake.knowledgePoint !== knowledge)
      return false

    if (mastery !== "all" && mistake.mastery !== mastery) return false

    if (date === "7-days" && !isWithinDays(mistake.createdAt, 7)) return false

    if (date === "30-days" && !isWithinDays(mistake.createdAt, 30)) return false

    return true
  })

  const selectedMistake =
    records.find((mistake) => mistake.id === selectedId) ?? null

  function resetFilters() {
    setSubject("all")

    setKnowledge("all")

    setDate("all")

    setMastery("all")
  }

  function saveRecord(
    mistakeId: string,

    nextMastery: MistakeMastery,

    note: string,
  ) {
    updateMistake("student-lin-xiaoyu", mistakeId, {
      mastery: nextMastery,
      note,
    })
    setRecords((current) =>
      current.map((mistake) =>
        mistake.id === mistakeId
          ? { ...mistake, mastery: nextMastery, note }
          : mistake,
      ),
    )
  }

  function saveReminder(mistakeId: string, choice: ReminderChoice) {
    updateMistake("student-lin-xiaoyu", mistakeId, {
      reminderAt: reminderDates[choice],
    })
    setRecords((current) =>
      current.map((mistake) =>
        mistake.id === mistakeId
          ? { ...mistake, reminderChoice: choice }
          : mistake,
      ),
    )
  }

  return (
    <section className="mx-auto w-full max-w-[1280px] space-y-4 pb-10 text-[#19271e] px-2 sm:px-4">
      <GlassSurface className="p-5 sm:p-7" weight="light">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.14em] text-[#5d7563]">
              <Sparkles aria-hidden="true" size={16} />
              回头看，是为了下次更轻松
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              错题本
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#66766b] sm:text-base">
              这里记录林晓雨在课堂、答疑和任务中主动保存的题目。掌握状态和提醒只在当前原型页面中更新。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <Metric label="当前错题" value={`${records.length} 道`} />
            <Metric
              label="继续练习"
              value={`${records.filter((item) => item.mastery === "learning").length} 道`}
            />
          </div>
        </div>
      </GlassSurface>

      <GlassSurface className="p-4 sm:p-5" weight="card">
        <div className="mb-4 flex items-center gap-2">
          <Filter aria-hidden="true" className="text-[#55705c]" size={18} />
          <h2 className="text-sm font-black">筛选错题</h2>
        </div>
        <FilterBar
          aria-label="错题筛选"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <FilterSelect
            id="mistake-subject-filter"
            label="学科"
            onChange={(value) => {
              setSubject(value as SubjectFilter)

              if (value !== "数学") setKnowledge("all")
            }}
            options={[
              ["all", "全部学科"],

              ["数学", "数学"],

              ["语文", "语文"],

              ["英语", "英语"],
            ]}
            value={subject}
          />
          <FilterSelect
            id="mistake-knowledge-filter"
            label="知识点"
            onChange={setKnowledge}
            options={[
              ["all", "全部知识点"],

              ...knowledgePoints.map(
                (point) => [point, point] as [string, string],
              ),
            ]}
            value={knowledge}
          />
          <FilterSelect
            id="mistake-date-filter"
            label="加入时间"
            onChange={(value) => setDate(value as DateFilter)}
            options={[
              ["all", "全部时间"],

              ["7-days", "近 7 天"],

              ["30-days", "近 30 天"],
            ]}
            value={date}
          />
          <FilterSelect
            id="mistake-mastery-filter"
            label="掌握程度"
            onChange={(value) => setMastery(value as MasteryFilter)}
            options={[
              ["all", "全部状态"],

              ["new", "刚加入"],

              ["learning", "继续练习"],

              ["basic", "基本掌握"],

              ["mastered", "已经掌握"],
            ]}
            value={mastery}
          />
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-2xl border border-[#cbd8cb] bg-white/66 px-4 text-sm font-black text-[#4a6250]"
            onClick={resetFilters}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            清除筛选
          </button>
        </FilterBar>
      </GlassSurface>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mistake) => (
            <GlassSurface
              className="group flex min-h-[286px] flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(44,71,50,.18)]"
              key={mistake.id}
              weight="card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/80 px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <StatusChip tone="info">{mistake.subject}</StatusChip>
                  <StatusChip tone={masteryMeta[mistake.mastery].tone}>
                    {masteryMeta[mistake.mastery].label}
                  </StatusChip>
                </div>
                <span className="text-xs font-bold text-[#738078]">
                  {sourceLabels[mistake.source]}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-black tracking-[0.1em] text-[#5d7562]">
                  {mistake.knowledgePoint}
                </p>
                <div className="mt-3 grid min-h-24 place-items-center rounded-[20px] border border-[#d4e3d0] bg-[#fffef9]/90 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.95)]">
                  <p className="text-lg font-black leading-8 text-[#213027]">
                    {mistake.prompt}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#6d7a72]">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" size={14} />7 月 22 日加入
                  </span>
                  {mistake.note ? (
                    <span className="inline-flex items-center gap-1.5 text-[#496950]">
                      <BookMarked aria-hidden="true" size={14} />
                      有复习笔记
                    </span>
                  ) : null}
                </div>
                <button
                  aria-label={`查看错题：${mistake.prompt}`}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#bed7c1] bg-[#dceedd] px-5 text-sm font-black text-[#416449] shadow-[0_12px_24px_rgba(72,110,79,.12)]"
                  onClick={() => setSelectedId(mistake.id)}
                  type="button"
                >
                  打开错题
                  <ChevronRight aria-hidden="true" size={17} />
                </button>
              </div>
            </GlassSurface>
          ))}
        </div>
      ) : (
        <GlassSurface className="p-5" weight="card">
          <EmptyState
            action={
              <button
                className="min-h-11 rounded-2xl border border-[#bed7c1] bg-[#dceedd] px-5 text-sm font-black text-[#416449]"
                onClick={resetFilters}
                type="button"
              >
                查看全部错题
              </button>
            }
            description="换一个学科、知识点、时间或掌握状态再看看。"
            title="没有符合条件的错题"
          />
        </GlassSurface>
      )}

      <MistakeDetailDrawer
        mistake={selectedMistake}
        onClose={() => setSelectedId(null)}
        onReminder={saveReminder}
        onSave={saveRecord}
      />
    </section>
  )
}

function FilterSelect({
  id,

  label,

  value,

  options,

  onChange,
}: {
  id: string

  label: string

  value: string

  options: Array<[string, string]>

  onChange: (value: string) => void
}) {
  return (
    <label
      className="grid gap-2 text-xs font-black text-[#596b5d]"
      htmlFor={id}
    >
      {label}
      <select
        className="min-h-12 rounded-2xl border border-[#cedace] bg-white/74 px-4 text-sm font-bold text-[#263a2d] outline-none focus:border-[#63836a] focus:ring-4 focus:ring-[#63836a]/15"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

type MetricProps = {
  label: string

  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/54 p-4">
      <span className="flex items-center gap-2 text-xs font-black text-[#637468]">
        <Target aria-hidden="true" size={15} />
        {label}
      </span>
      <strong className="mt-2 block text-xl font-black text-[#203027]">
        {value}
      </strong>
    </div>
  )
}

export default MistakesPage
