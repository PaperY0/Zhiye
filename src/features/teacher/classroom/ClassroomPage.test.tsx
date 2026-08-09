import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PrototypeProvider } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { ClassroomPage } from "./ClassroomPage"

const lessonAnalysis = vi.hoisted(() => ({
  analyzeLessonAudio: vi.fn(),
}))

vi.mock("../../../services/lessonAnalysis", () => lessonAnalysis)

function renderClassroom(onNavigate = vi.fn<(route: AppRoute) => void>()) {
  render(
    <PrototypeProvider>
      <ClassroomPage onNavigate={onNavigate} />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

class TestMediaRecorder {
  mimeType = "audio/webm"
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null

  constructor(_stream: MediaStream) {}

  start() {}

  stop() {
    this.ondataavailable?.({ data: new Blob(["recording"], { type: this.mimeType }) } as BlobEvent)
    this.onstop?.()
  }
}

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  })
  vi.stubGlobal("MediaRecorder", TestMediaRecorder)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("ClassroomPage", () => {
  it("filters lessons by status and exposes duration, sync, and student visibility", async () => {
    const user = userEvent.setup()
    renderClassroom()

    expect(screen.getByRole("heading", { name: "课堂" })).toBeInTheDocument()
    expect(screen.getByText("分数的基本性质")).toBeInTheDocument()
    expect(screen.getByText("单位换算中的乘除步骤")).toBeInTheDocument()
    expect(screen.getByText("小数乘法估算")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "进行中" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "处理中" })).toBeInTheDocument()
    expect(screen.getAllByText(/40 分钟|42 分钟/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/已同步|仅本机/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/学生可见|学生不可见/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole("button", { name: "待开始" }))
    expect(screen.getByText("小数乘法估算")).toBeInTheDocument()
    expect(screen.queryByText("分数的基本性质")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "AI 初稿" }))
    expect(screen.getByText("分数的基本性质")).toBeInTheDocument()
    expect(screen.queryByText("单位换算中的乘除步骤")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "已发布" }))
    expect(screen.getByText("单位换算中的乘除步骤")).toBeInTheDocument()
    expect(screen.queryByText("小数乘法估算")).not.toBeInTheDocument()
  })

  it("writes a completed local AI analysis into the newly recorded lesson", async () => {
    lessonAnalysis.analyzeLessonAudio.mockResolvedValue({
      transcript: [{ id: "live-01", speaker: "李老师", startSeconds: 0, endSeconds: 10, body: "单位换算" }],
      recap: "先判断单位变化方向。",
      recapTags: ["单位换算"],
      nextStep: "完成随堂自检",
      teacherReport: "学生在乘除方向上需要更多示范。",
      progressSuggestion: "下节课先复盘单位阶梯。",
      evidence: ["课堂中有两次关于乘除方向的提问。"],
    })
    const { onNavigate } = renderClassroom()

    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    expect(within(dialog).getByText("等待开始")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    await waitFor(() => expect(within(dialog).getByText("录音中")).toBeInTheDocument())

    fireEvent.click(
      within(dialog).getByRole("button", { name: "结束并生成 AI 初稿" }),
    )
    expect(within(dialog).getByText("正在整理课堂内容")).toBeInTheDocument()

    await waitFor(() => {
      expect(lessonAnalysis.analyzeLessonAudio).toHaveBeenCalledOnce()
      expect(within(dialog).getByText("AI 初稿已就绪")).toBeInTheDocument()
    })

    fireEvent.click(
      within(dialog).getByRole("button", { name: "查看 AI 初稿" }),
    )
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "teacher",
        page: "lesson-detail",
        lessonId: expect.stringMatching(/^lesson-recording-/),
      }),
    )
  })

  it("keeps a recording out of draft-ready when local AI analysis fails", async () => {
    lessonAnalysis.analyzeLessonAudio.mockRejectedValue(new Error("本地 AI 服务未启动"))
    renderClassroom()

    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    await waitFor(() => expect(within(dialog).getByText("录音中")).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole("button", { name: "结束并生成 AI 初稿" }))

    await waitFor(() => {
      expect(within(dialog).getByText("处理失败")).toBeInTheDocument()
      expect(within(dialog).getByText("本地 AI 服务未启动")).toBeInTheDocument()
    })
    expect(within(dialog).queryByRole("button", { name: "查看 AI 初稿" })).not.toBeInTheDocument()
  })

  it("opens an existing lesson from its card", async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderClassroom()

    await user.click(screen.getByRole("button", { name: "查看分数的基本性质" }))
    expect(onNavigate).toHaveBeenCalledWith({
      role: "teacher",
      page: "lesson-detail",
      lessonId: "lesson-fractions",
    })
  })
})
