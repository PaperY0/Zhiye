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

it("shows all records for the chosen class without a search bar, then opens 林晓雨", async () => {
  const user = userEvent.setup()
  const onNavigate = vi.fn()

  renderPrototype(<StudentsPage onNavigate={onNavigate} />)

  expect(screen.getByRole("heading", { name: "学生档案" })).toBeInTheDocument()
  expect(screen.getByText("5 名学生")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "全部班级" }))

  expect(screen.getByText("郭浩然")).toBeInTheDocument()
  expect(screen.getByText("林晓雨")).toBeInTheDocument()
  expect(screen.queryByRole("searchbox", { name: "搜索学生" })).not.toBeInTheDocument()
  expect(screen.queryByRole("combobox", { name: "关注知识点" })).not.toBeInTheDocument()
  expect(screen.queryByRole("combobox", { name: "档案状态" })).not.toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "查看林晓雨档案" }))
  expect(onNavigate).toHaveBeenCalledWith({
    role: "teacher",
    page: "student-detail",
    studentId: "student-lin-xiaoyu",
  })
})

it("keeps student cards within the selected class", async () => {
  const user = userEvent.setup()
  renderPrototype(<StudentsPage onNavigate={vi.fn()} />)
  expect(screen.getByText("林晓雨")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /五年级（1）班/ }))
  expect(screen.queryByText("林晓雨")).not.toBeInTheDocument()
  expect(screen.getByText("郭浩然")).toBeInTheDocument()
  expect(screen.getByText("5 名学生")).toBeInTheDocument()
})

it("imports a local CSV into the live student records", async () => {
  const user = userEvent.setup()
  renderPrototype(<StudentsPage onNavigate={vi.fn()} />)

  await user.click(screen.getByRole("button", { name: "导入学生名单" }))
  const file = new File(
    ["姓名,班级,监护人,关系,当前关注\n陈小满,五年级（1）班,陈女士,母亲,分数运算；单位换算"],
    "students.csv",
    { type: "text/csv" },
  )
  if (!file.text) {
    Object.defineProperty(file, "text", {
      value: async () => "姓名,班级,监护人,关系,当前关注\n陈小满,五年级（1）班,陈女士,母亲,分数运算；单位换算",
    })
  }
  await user.upload(screen.getByLabelText("选择 CSV 文件"), file)

  expect(await screen.findByText(/已读取：students.csv · 1 名学生/)).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "导入 1 名学生" }))

  await user.click(screen.getByRole("button", { name: /五年级（1）班/ }))
  expect(screen.getByText("陈小满")).toBeInTheDocument()
  expect(screen.getByText("6 名学生")).toBeInTheDocument()
})

it("shows 林晓雨 timeline, evidence and facts without unreviewed AI labels", () => {
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

  expect(screen.queryByRole("region", { name: "AI 推断 · 需教师判断" })).not.toBeInTheDocument()
})

it("saves a teacher note without showing a nonfunctional correction request", async () => {
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

  expect(screen.queryByRole("button", { name: "申请更正档案" })).not.toBeInTheDocument()
})
