import { z } from "zod"

const topicSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  teachingHint: z.string().min(1),
  misconception: z.string().min(1),
  activity: z.string().min(1),
  check: z.string().min(1),
})

const unitSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  topics: z.array(topicSchema).min(1),
})

export const teachingAidSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  subject: z.string().min(1),
  grade: z.string().min(1),
  volume: z.string().min(1),
  edition: z.string().min(1),
  description: z.string().min(1),
  sourceUrl: z.url(),
  units: z.array(unitSchema).min(1),
})

export type TeachingAid = z.infer<typeof teachingAidSchema>
export type TeachingAidUnit = TeachingAid["units"][number]
export type TeachingAidTopic = TeachingAidUnit["topics"][number]

// A new JSON pack in ./packs is discovered automatically at build time.
const bundledPacks = import.meta.glob("./packs/*.json", { eager: true, import: "default" })

function parsePacks(packs: Record<string, unknown>): TeachingAid[] {
  const aids = Object.entries(packs).map(([path, value]) => {
    const result = teachingAidSchema.safeParse(value)
    if (!result.success) throw new Error(`教辅资源 ${path} 格式无效：${result.error.message}`)
    return result.data
  })
  if (new Set(aids.map((aid) => aid.id)).size !== aids.length) {
    throw new Error("教辅资源 ID 重复")
  }
  for (const aid of aids) {
    if (new Set(aid.units.map((unit) => unit.id)).size !== aid.units.length) {
      throw new Error(`教辅资源 ${aid.id} 的单元 ID 重复`)
    }
    for (const unit of aid.units) {
      if (new Set(unit.topics.map((topic) => topic.id)).size !== unit.topics.length) {
        throw new Error(`教辅资源 ${aid.id}/${unit.id} 的课题 ID 重复`)
      }
    }
  }
  return aids.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"))
}

export const teachingAids = parsePacks(bundledPacks)

export function findTeachingAid(id: string) {
  return teachingAids.find((aid) => aid.id === id)
}

export function getTeachingAidTopic(aidId: string, unitId: string, topicId: string) {
  const aid = findTeachingAid(aidId)
  const unit = aid?.units.find((item) => item.id === unitId)
  const topic = unit?.topics.find((item) => item.id === topicId)
  return aid && unit && topic ? { aid, unit, topic } : null
}
