import type { RecapDeliverables } from "../../../app/prototype/types"

export type RecapPackageInput = {
  title: string
  date: string
  goal: string
  deliverables: RecapDeliverables
  confirmedAt: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character)
}

export function buildRecapPackageHtml(input: RecapPackageInput) {
  if (!input.confirmedAt.trim()) throw new Error("教师确认后才能导出补讲包")
  const { deliverables } = input
  const evidence = deliverables.evidence.map((item) => `<li><strong>${escapeHtml(item.id)}</strong> · ${escapeHtml(item.quote)} <span>(${Math.round(item.startSeconds)}s–${Math.round(item.endSeconds)}s)</span></li>`).join("")
  const questions = deliverables.practiceQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")
  const inferences = deliverables.inferences.map((item) => `<li>${escapeHtml(item.statement)} <small>依据：${item.evidenceIds.map(escapeHtml).join("、")}</small></li>`).join("")
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(input.title)} · 课堂补讲包</title>
<style>body{margin:0;background:#f4f7f1;color:#203528;font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.7}main{max-width:820px;margin:0 auto;padding:42px 24px}header,section{background:#fff;border:1px solid #dce8d8;border-radius:18px;padding:24px;margin-bottom:18px}h1{margin:0 0 6px;font-size:30px}h2{font-size:18px;margin:0 0 10px;color:#315b3b}.meta{color:#718176;font-size:13px}.label{display:inline-block;padding:3px 9px;border-radius:99px;background:#f4ead3;color:#806126;font-size:12px;font-weight:bold}li{margin:7px 0}small,span{color:#7d8b80}@media print{body{background:white}main{padding:0}header,section{break-inside:avoid}}</style></head>
<body><main><header><span class="label">教师确认后的补讲包</span><h1>${escapeHtml(input.title)}</h1><p class="meta">目标：${escapeHtml(input.goal)} · 日期：${escapeHtml(input.date)} · 确认时间：${escapeHtml(input.confirmedAt)}</p></header>
<section><h2>学生复习卡</h2><p>${escapeHtml(deliverables.studentRecap)}</p></section>
<section><h2>教师报告</h2><p>${escapeHtml(deliverables.teacherReport)}</p></section>
<section><h2>补讲方案</h2><p>${escapeHtml(deliverables.remedialPlan)}</p></section>
<section><h2>练习题</h2><ol>${questions}</ol></section>
<section><h2>课堂证据</h2><ul>${evidence}</ul>${inferences ? `<h2>教师待确认的 AI 推断</h2><ul>${inferences}</ul>` : ""}</section>
</main></body></html>`
}

export function downloadRecapPackage(input: RecapPackageInput, filename: string) {
  const blob = new Blob([buildRecapPackageHtml(input)], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.endsWith(".html") ? filename : `${filename}.html`
  anchor.style.display = "none"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
