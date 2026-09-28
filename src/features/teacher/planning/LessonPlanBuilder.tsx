import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Dialog } from "../../../components/shared/Dialog"
import type { PlanDraft } from "../../../app/prototype/types"
import { usePrototype } from "../../../app/prototype/PrototypeContext"
import { generateDraft } from "../../../services/localAi"
import { toPlanDraft, type LessonPlanGeneratorInput } from "./generators"
import { getTeacherSettings } from "../settings/teacherSettings"
import { findTeachingAid, getTeachingAidTopic, teachingAids } from "./resources/catalog"
import type { ProgressImport } from "./progressImport"


function LinesEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange(value: string[]): void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.max(144, textarea.scrollHeight)}px`
  }, [value])
  return (
    <label className="grid gap-2 text-sm font-bold text-[#263b2b]">
      {label}
      <textarea
        ref={textareaRef}
        aria-label={label}
        className="w-full min-w-0 resize-none overflow-hidden rounded-2xl border border-[#dce6dc] bg-white px-4 py-3 text-base font-normal leading-8 text-[#314238] outline-none focus:border-[#64836a] focus:ring-4 focus:ring-[#64836a]/15"
        placeholder="每行写一项，按课堂顺序排列"
        value={value.join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n"))}
      />
    </label>
  )
}

function importedFields(importedProgress?: ProgressImport | null) {
  const chapter = importedProgress ? importedProgress.nextStep.length <= 40 ? importedProgress.nextStep : `${importedProgress.lessonTitle} · 下一课` : ""
  const context = importedProgress ? `承接“${importedProgress.lessonTitle}”（${importedProgress.chapter || "上一课"}）${importedProgress.nextStep.length > 40 ? `；下节课安排：${importedProgress.nextStep}` : ""}` : ""
  return { chapter, context }
}

function blankPlan(settings: ReturnType<typeof getTeacherSettings>, importedProgress?: ProgressImport | null): PlanDraft {
  const { chapter, context } = importedFields(importedProgress)
  return {
    id: crypto.randomUUID(), title: "", subject: "数学",
    grade: importedProgress?.className.match(/^.+?年级/)?.[0] ?? settings.currentClass.match(/^.+?年级/)?.[0] ?? "",
    chapter, objective: "",
    context, evidence: [],
    outline: [], examples: [], misconceptions: [], suggestions: [],
    extension: "", durationMinutes: 40, materials: "", assessment: "",
    status: "draft", createdAt: new Date().toISOString(),
  }
}

export function LessonPlanBuilder({ selectedPlan, importedProgress, startNew = false, onSaved, onDirtyChange }: { selectedPlan?: PlanDraft | null; importedProgress?: ProgressImport | null; startNew?: boolean; onSaved?: (id: string) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const { addPlan, updatePlan, lessons, storageError } = usePrototype()
  const settings = getTeacherSettings()
  const importedPlan = importedFields(importedProgress)
  const [input, setInput] = useState<LessonPlanGeneratorInput>({
    textbook: `${settings.textbook}数学${importedProgress?.className ?? settings.currentClass}`,
    chapter: selectedPlan?.chapter ?? (importedProgress ? importedPlan.chapter : startNew ? "" : settings.chapter),
    objective: selectedPlan?.objective ?? "",
    context: selectedPlan?.context ?? (importedProgress ? importedPlan.context : ""),
    evidence: selectedPlan?.evidence ?? [],
  })
  const [draft, setDraft] = useState<PlanDraft | null>(() => selectedPlan ?? (startNew ? blankPlan(settings, importedProgress) : null))
  const [notice, setNotice] = useState("")
  const [generationError, setGenerationError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const generationToken = useRef(0)
  const [savedId, setSavedId] = useState<string | null>(selectedPlan?.id ?? null)
  const [dirty, setDirty] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => { if (storageError) setSaveDialogOpen(false) }, [storageError])
  const [aidId, setAidId] = useState(teachingAids[0]?.id ?? "")
  const [unitId, setUnitId] = useState(teachingAids[0]?.units[0]?.id ?? "")
  const [topicId, setTopicId] = useState(teachingAids[0]?.units[0]?.topics[0]?.id ?? "")
  const selectedAid = findTeachingAid(aidId)
  const selectedUnit = selectedAid?.units.find((unit) => unit.id === unitId)
  const selectedTopic = selectedUnit?.topics.find((topic) => topic.id === topicId)
  const recentLesson = lessons.find((lesson) => lesson.className === settings.currentClass)

  useEffect(() => {
    if (!selectedPlan) return
    generationToken.current += 1
    setIsGenerating(false)
    setDraft(selectedPlan)
    setSavedId(selectedPlan.id)
    setInput({ textbook: `${settings.textbook}${selectedPlan.subject}${selectedPlan.grade}`, chapter: selectedPlan.chapter, objective: selectedPlan.objective, context: selectedPlan.context, evidence: selectedPlan.evidence })
    if (selectedPlan.teachingAidId) {
      setAidId(selectedPlan.teachingAidId)
      setUnitId(selectedPlan.teachingAidUnitId ?? "")
      setTopicId(selectedPlan.teachingAidTopicId ?? "")
    }
    setNotice("")
    setDirty(false)
    setReplaceDialogOpen(false)
  }, [selectedPlan?.id])
  useEffect(() => {
    if (!selectedPlan) return
    setDraft((current) => current?.id === selectedPlan.id ? { ...current, status: selectedPlan.status } : current)
  }, [selectedPlan?.id, selectedPlan?.status])

  function changeInput(patch: Partial<LessonPlanGeneratorInput>) {
    generationToken.current += 1
    setIsGenerating(false)
    setInput((current) => ({ ...current, ...patch }))
    const planPatch = Object.fromEntries(Object.entries(patch).filter(([key]) => key !== "textbook")) as Partial<PlanDraft>
    if (draft && Object.keys(planPatch).length) {
      setDraft((current) => current ? { ...current, ...planPatch } : current)
      setDirty(true)
    }
  }

  function patchDraft(patch: Partial<PlanDraft>) {
    if (!draft) return
    generationToken.current += 1
    setIsGenerating(false)
    setDraft((current) => current ? { ...current, ...patch } : current)
    setDirty(true)
  }

  function applyTeachingAid() {
    const resource = getTeachingAidTopic(aidId, unitId, topicId)
    if (!resource) return
    const { aid, unit, topic } = resource
    const chapter = `${unit.title} · ${topic.title}`
    setInput((current) => ({ ...current,
      textbook: `${aid.publisher} ${aid.subject} ${aid.grade}${aid.volume}（${aid.edition}）`,
      chapter,
      objective: topic.objective,
      context: topic.activity,
    }))
    if (draft) patchDraft({ chapter, objective: topic.objective, context: topic.activity, teachingAidId: aid.id, teachingAidUnitId: unit.id, teachingAidTopicId: topic.id, materials: topic.activity, assessment: topic.check })
    setNotice("已把课题、目标和活动带入备课；可继续按本班情况修改。")
  }

  async function generatePlan() {
    if (!input.chapter.trim() || !input.objective.trim()) { setGenerationError("请先填写课题和教学目标。") ; return }
    const requestId = ++generationToken.current
    setIsGenerating(true)
    setGenerationError("")
    try {
      const resource = getTeachingAidTopic(aidId, unitId, topicId)
      const useResource = resource && input.chapter.includes(resource.topic.title)
      const teachingAid = useResource
        ? `教辅：${resource.aid.title}（${resource.aid.edition}）；课题：${resource.topic.title}；教学提示：${resource.topic.teachingHint}；易错点：${resource.topic.misconception}；活动：${resource.topic.activity}；检验：${resource.topic.check}`
        : ""
      const response = await generateDraft("lesson-plan", { ...input, teachingAid, evidence: settings.includeEvidence ? input.evidence : [] })
      const payload = response as { content?: unknown }
      const generated = toPlanDraft(payload.content, input)
      if (requestId !== generationToken.current) return
      generated.durationMinutes = draft?.durationMinutes ?? 40
      generated.materials = draft?.materials ?? ""
      generated.assessment = draft?.assessment ?? ""
      if (useResource && resource) {
        generated.teachingAidId = resource.aid.id
        generated.teachingAidUnitId = resource.unit.id
        generated.teachingAidTopicId = resource.topic.id
        generated.materials ||= resource.topic.activity
        generated.assessment ||= resource.topic.check
      }
      setDraft(draft ? { ...generated, id: draft.id, createdAt: draft.createdAt, status: draft.status } : generated)
      setDirty(true)
      setNotice("")
    } catch (error) {
      if (requestId === generationToken.current) setGenerationError(error instanceof Error ? error.message : "生成失败，请重试")
    } finally {
      if (requestId === generationToken.current) setIsGenerating(false)
    }
  }

  function requestGeneration() {
    if (!input.chapter.trim() || !input.objective.trim()) { setGenerationError("请先填写课题和教学目标。"); return }
    if (dirty && draft && [draft.outline, draft.examples, draft.misconceptions, draft.suggestions].some((lines) => lines.some((line) => line.trim()))) {
      setReplaceDialogOpen(true)
      return
    }
    void generatePlan()
  }

  const setupSection = (
      <section className="mx-auto w-full max-w-5xl rounded-[24px] border border-[#dce6dc] bg-white p-5 shadow-[0_10px_30px_rgba(54,82,61,0.04)] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black tracking-[0.18em] text-[#66806b]">
            第一步 · 课题与目标
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#15241a]">
             这节课要教什么
          </h2>
           <p className="mt-2 text-sm leading-6 text-[#718076]">写下课题和学生学完后能做到什么。下方教案可以直接编辑，AI 起草是可选的。</p>
        </div>

        <div className="grid gap-4">
          <details className="rounded-2xl border border-[#dce6dc] bg-[#f7faf6] p-4">
            <summary className="cursor-pointer font-bold">从教辅带入课题（可选）</summary>
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-black">同步教辅</h3><span className="text-xs text-[#718076]">选课题后带入备课，可自行修改</span></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="grid min-w-0 gap-1 text-xs font-bold">教材<select aria-label="选择教辅" className="planning-select" value={aidId} onChange={(event) => { const aid = findTeachingAid(event.target.value); setAidId(event.target.value); setUnitId(aid?.units[0]?.id ?? ""); setTopicId(aid?.units[0]?.topics[0]?.id ?? "") }}>{teachingAids.map((aid) => <option key={aid.id} value={aid.id}>{aid.title} · {aid.edition}</option>)}</select></label>
              <label className="grid min-w-0 gap-1 text-xs font-bold">单元<select aria-label="选择单元" className="planning-select" value={unitId} onChange={(event) => { const unit = selectedAid?.units.find((item) => item.id === event.target.value); setUnitId(event.target.value); setTopicId(unit?.topics[0]?.id ?? "") }}>{selectedAid?.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.title}</option>)}</select></label>
              <label className="grid min-w-0 gap-1 text-xs font-bold">课题<select aria-label="选择课题" className="planning-select" value={topicId} onChange={(event) => setTopicId(event.target.value)}>{selectedUnit?.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></label>
            </div>
            {selectedTopic && <div className="mt-3 grid gap-1 text-sm leading-6 text-[#53675a]"><p><strong className="text-[#263b2b]">教学提示：</strong>{selectedTopic.teachingHint}</p><p><strong className="text-[#263b2b]">易错点：</strong>{selectedTopic.misconception}</p><p><strong className="text-[#263b2b]">课堂检验：</strong>{selectedTopic.check}</p></div>}
            <button className="mt-3 min-h-10 rounded-xl bg-[#e4eee3] px-4 text-sm font-bold text-[#315a3a] hover:bg-[#d8e8d7]" onClick={applyTeachingAid} type="button" disabled={!selectedTopic}>应用到备课</button>
          </details>
          <label className="grid gap-2 text-sm font-bold">
            课题 <span className="sr-only">必填</span>
            <input
              aria-label="课题"
              className="rounded-2xl border border-[#dce6dc] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              placeholder="例如：认识轴对称图形"
              value={input.chapter}
              onChange={(event) =>
                changeInput({ chapter: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            教学目标
            <textarea
              aria-label="教学目标"
              className="min-h-24 rounded-2xl border border-[#dce6dc] bg-white px-4 py-3 font-normal leading-6 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              placeholder="学生学完这节课，能够……"
              value={input.objective}
              onChange={(event) =>
                changeInput({ objective: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            本班情况或课堂情境（可选）
            <input
              aria-label="生活情境"
              className="rounded-2xl border border-[#dce6dc] bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#64836a]/15"
              placeholder="例如：学生已经接触过对折活动"
              value={input.context}
              onChange={(event) =>
                changeInput({ context: event.target.value })
              }
            />
          </label>

          <details className="rounded-2xl border border-[#dce6dc] bg-[#f7faf6] p-4"><summary className="cursor-pointer text-sm font-bold">教材信息（AI 起草时参考）</summary><label className="mt-3 grid gap-2 text-sm font-bold">教材<input aria-label="教材" className="rounded-2xl border border-[#dce6dc] bg-white px-4 py-3 font-normal" value={input.textbook} onChange={(event) => changeInput({ textbook: event.target.value })} /></label></details>

          {recentLesson && <p className="rounded-2xl bg-[#edf4eb] p-3 text-sm leading-6">最近课堂：{recentLesson.title} · {recentLesson.progress.nextStep}</p>}
          <details className="rounded-2xl border border-[#dce6db] p-3"><summary className="cursor-pointer text-sm font-bold">补充课堂观察（可选）</summary><label className="mt-3 grid gap-2 text-sm">每行一条<textarea className="min-h-20 rounded-2xl border border-[#dce6db] bg-white px-4 py-3 font-normal" value={input.evidence.join("\n")} onChange={(event) => changeInput({ evidence: event.target.value.split("\n").filter(Boolean) })} /></label></details>
          <button
            className="w-fit rounded-full border border-[#b7ccb7] px-5 py-3 font-bold text-[#315a3a] transition hover:bg-[#edf4eb]"
            disabled={isGenerating}
            type="button"
            onClick={requestGeneration}
          >
            {isGenerating ? "正在起草教学流程…" : "用 AI 起草教学流程"}
          </button>
          {generationError ? (
            <div className="grid gap-3 rounded-2xl border border-[#e4b9b4] bg-[#fff5f3] p-4 text-sm text-[#8d332b]" role="alert">
              <p>{generationError}</p>
              <button className="w-fit rounded-full border border-current px-4 py-2 font-black" type="button" onClick={() => void generatePlan()}>
                重试生成
              </button>
            </div>
          ) : null}
        </div>
      </section>
  )
  const editorSection = (
      <section
        aria-label="教案编辑器"
        className="mx-auto w-full max-w-5xl min-w-0 rounded-[24px] border border-[#dce6dc] bg-white p-5 shadow-[0_10px_30px_rgba(54,82,61,0.04)] sm:p-6"
      >
        {draft ? (
          <div className="grid gap-5">
            <div><p className="text-xs font-black tracking-[0.18em] text-[#66806b]">第二步 · 教学活动</p><h2 className="mt-2 text-2xl font-black text-[#15241a]">怎么教、怎么检验</h2><p className="mt-2 text-sm leading-6 text-[#718076]">先写教学流程，再补充例子、易错点和课堂检验。</p></div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <label className="grid min-w-0 flex-1 gap-2 text-sm font-black">
                教案标题（可选，默认使用课题）
                <input
                  aria-label="教案标题"
                  className="w-full rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-base font-bold outline-none focus:ring-4 focus:ring-[#64836a]/15"
                  placeholder="留空则使用课题作为标题"
                  value={draft.title}
                  onChange={(event) =>
                    patchDraft({ title: event.target.value })
                  }
                />
              </label>
            </div>

            {draft.evidence.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#eef4eb] p-3 text-sm">
                <strong>已引用证据</strong>
                {draft.evidence.map((item) => (
                  <span className="rounded-full bg-white px-3 py-1" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}

            <div className="grid gap-5 border-t border-[#e5ece4] pt-5">
              <LinesEditor
                label="教学流程"
                value={draft.outline}
                onChange={(outline) => patchDraft({ outline })}
              />
            </div>
            <div className="grid gap-5 border-t border-[#e5ece4] pt-5 sm:grid-cols-2">
              <LinesEditor
                label="生活化示例"
                value={draft.examples}
                onChange={(examples) => patchDraft({ examples })}
              />
              <LinesEditor
                label="常见误区"
                value={draft.misconceptions}
                onChange={(misconceptions) => patchDraft({ misconceptions })}
              />
            </div>
            <div className="border-t border-[#e5ece4] pt-5">
              <LinesEditor
                label="教学建议"
                value={draft.suggestions}
                onChange={(suggestions) => patchDraft({ suggestions })}
              />
            </div>
            <div className="border-t border-[#e5ece4] pt-5"><h3 className="text-base font-black text-[#263b2b]">上课准备与检验</h3><p className="mt-1 text-sm text-[#718076]">记录上课时要用的材料和判断学生是否学会的方法。</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black">课时（分钟）<input className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-3" min={10} max={120} type="number" value={draft.durationMinutes ?? 40} onChange={(event) => patchDraft({ durationMinutes: Number(event.target.value) })} /></label>
              <label className="grid gap-2 text-sm font-black">所需材料<input className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-3" value={draft.materials ?? ""} onChange={(event) => patchDraft({ materials: event.target.value })} /></label>
              <label className="grid gap-2 text-sm font-black lg:col-span-2">课堂检验方式<textarea className="min-h-20 rounded-2xl border border-[#dfe8df] bg-white px-4 py-3" placeholder="用什么表现判断学生达成了目标？" value={draft.assessment ?? ""} onChange={(event) => patchDraft({ assessment: event.target.value })} /></label>
            </div>
            <label className="grid gap-2 text-sm font-black">
              课后延伸
              <textarea
                aria-label="课后延伸"
                className="min-h-24 rounded-2xl border border-[#dfe8df] bg-white/75 px-4 py-3 font-normal leading-7 outline-none focus:ring-4 focus:ring-[#64836a]/15"
                value={draft.extension}
                onChange={(event) =>
                  patchDraft({ extension: event.target.value })
                }
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe8df] pt-5">
              <p className="text-sm text-[#718076]">
                {dirty ? "有未保存的修改" : savedId ? "所有修改已保存" : "新教案尚未保存"}
              </p>
              <button
                className="rounded-full bg-[#173021] px-5 py-3 font-black text-white"
                type="button"
                onClick={() => {
                   if (!draft.chapter.trim() || !draft.objective.trim()) { setNotice("请先填写课题和教学目标后保存。"); return }
                   const planToSave = { ...draft, title: draft.title.trim() || draft.chapter.trim() }
                   if (savedId === draft.id) updatePlan(draft.id, planToSave)
                   else { addPlan(planToSave); setSavedId(draft.id) }
                   setDraft(planToSave)
                   setDirty(false)
                   setSaveDialogOpen(true)
                   setNotice("")
                   onSaved?.(draft.id)
                }}
              >
                {savedId ? "保存修改" : "保存教案"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[430px] place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#e9f0e6] text-2xl">
                ✦
              </div>
              <h2 className="mt-5 text-2xl font-black">教案会在这里展开</h2>
              <p className="mt-2 leading-7 text-[#718076]">
                生成后可逐段编辑教学流程、例子、误区、建议与延伸活动。
              </p>
            </div>
          </div>
        )}
        <Dialog open={saveDialogOpen} title="教案已保存" description="这份教案已加入我的教案，可继续编辑或新建另一份。" onClose={() => setSaveDialogOpen(false)} footer={<button className="rounded-xl bg-[#173021] px-5 py-2 font-bold text-white" onClick={() => setSaveDialogOpen(false)} type="button">知道了</button>}><p>“{draft?.title}”已保存。</p></Dialog>
        <Dialog open={replaceDialogOpen} title="用 AI 替换已写内容？" description="AI 起草会替换教学流程、示例、误区和教学建议。" onClose={() => setReplaceDialogOpen(false)} footer={<><button className="rounded-full border border-[#bed0bd] px-4 py-2 font-bold" onClick={() => setReplaceDialogOpen(false)} type="button">继续编辑</button><button className="rounded-full bg-[#173021] px-4 py-2 font-bold text-white" onClick={() => { setReplaceDialogOpen(false); void generatePlan() }} type="button">确认起草</button></>}><p>请先保存想保留的内容。</p></Dialog>
        {storageError && <p className="mt-4 rounded-2xl border border-[#d89b90] bg-[#fff2ef] px-4 py-3 text-sm font-bold text-[#8c3d33]" role="alert">{storageError}</p>}
        {notice && (
          <p
            role="status"
            className="mt-4 rounded-2xl bg-[#e4f2e5] px-4 py-3 text-sm font-bold text-[#355b3d]"
          >
            {notice}
          </p>
        )}
      </section>
  )
  return (
    <div className="grid min-w-0 content-start gap-5">
      {setupSection}
      {editorSection}
    </div>
  )
}

export default LessonPlanBuilder
