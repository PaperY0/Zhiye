import "@testing-library/jest-dom/vitest"

import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import { StudentDetailPage } from "./StudentDetailPage"
import { StudentsPage } from "./StudentsPage"

function renderPrototype(ui: React.ReactNode) {
  return render(<PrototypeProvider>{ui}</PrototypeProvider>)
}

it("searches and filters student records, then opens 林晓雨", async () => {
  const user = userEvent.setup()
  const onNavigate = vi.fn()

  renderPrototype(<StudentsPage onNavigate={onNavigate} />)

  expect(screen.getByRole("heading", { name: "学生档案" })).toBeInTheDocument()
  expect(screen.getByText("12 名学生")).toBeInTheDocument()

  const search = screen.getByRole("searchbox", { name: "搜索学生" })
  await user.type(search, "唐若曦")

  expect(screen.getByText("唐若曦")).toBeInTheDocument()
  expect(screen.queryByText("林晓雨")).not.toBeInTheDocument()

  await user.clear(search)
  await user.selectOptions(
    screen.getByRole("combobox", { name: "关注知识点" }),
    "单位换算",
  )

  expect(screen.getByText("林晓雨")).toBeInTheDocument()
  expect(screen.queryByText("唐若曦")).not.toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "查看林晓雨档案" }))
  expect(onNavigate).toHaveBeenCalledWith({
    role: "teacher",
    page: "student-detail",
    studentId: "student-lin-xiaoyu",
  })
})

it("shows 林晓雨 timeline, evidence, facts and clearly separated AI inference", () => {
  renderPrototype(<StudentDetailPage studentId="student-lin-xiaoyu" />)

  expect(screen.getByRole("heading", { name: "林晓雨" })).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: "学习时间线" }),
  ).toBeInTheDocument()
  expect(screen.getByText("查看课堂复习卡")).toBeInTheDocument()
  expect(screen.getByText("完成教师任务")).toBeInTheDocument()

  const evidence = screen.getByRole("region", { name: "知识证据" })
  expect(within(evidence).getByText("单位换算")).toBeInTheDocument()
  expect(
    within(evidence).getByText("随堂练习第 3 题停顿时间增加"),
  ).toBeInTheDocument()
  expect(within(evidence).getByText("分数基本性质")).toBeInTheDocument()

  const facts = screen.getByRole("region", { name: "可核实事实" })
  expect(within(facts).getByText("本周主动提问 4 次")).toBeInTheDocument()
  expect(within(facts).getByText("完成练习 7 次")).toBeInTheDocument()

  const inference = screen.getByRole("region", {
    name: "AI 推断 · 需教师判断",
  })
  expect(
    within(inference).getByText(
      "可能需要更多单位换算步骤提示，需结合后续练习人工确认。",
    ),
  ).toBeInTheDocument()
})

it("saves a teacher note and submits a correction request", async () => {
  const user = userEvent.setup()
  renderPrototype(<StudentDetailPage studentId="student-lin-xiaoyu" />)

  await user.type(
    screen.getByRole("textbox", { name: "教师笔记" }),
    "下节课观察晓雨能否独立判断单位换算方向。",
  )
  await user.click(screen.getByRole("button", { name: "保存笔记" }))

  expect(screen.getByRole("status")).toHaveTextContent("教师笔记已保存")
  expect(
    screen.getByText("下节课观察晓雨能否独立判断单位换算方向。"),
  ).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "申请更正档案" }))
  const dialog = screen.getByRole("dialog", { name: "申请更正学生档案" })
  await user.type(
    within(dialog).getByRole("textbox", { name: "更正说明" }),
    "监护人称谓应改为家长。",
  )
  await user.click(within(dialog).getByRole("button", { name: "提交更正申请" }))

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  expect(screen.getByRole("status")).toHaveTextContent(
    "更正申请已提交，等待人工核实",
  )
})
