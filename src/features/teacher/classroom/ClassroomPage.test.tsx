import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PrototypeProvider, usePrototype } from "../../../app/prototype/PrototypeContext"
import type { AppRoute } from "../../../app/routes"
import { ClassroomPage } from "./ClassroomPage"

const lessonAnalysis = vi.hoisted(() => ({
  analyzeLessonAudio: vi.fn(),
}))

vi.mock("../../../services/lessonAnalysis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../services/lessonAnalysis")>()

  return {
    ...actual,
    analyzeLessonAudio: lessonAnalysis.analyzeLessonAudio,
  }
})

function renderClassroom(onNavigate = vi.fn<(route: AppRoute) => void>()) {
  render(
    <PrototypeProvider>
      <ClassroomPage onNavigate={onNavigate} />
      <DraftReadyLessonIds />
      <LessonStatuses />
    </PrototypeProvider>,
  )
  return { onNavigate }
}

function LessonStatuses() {
  const { lessons } = usePrototype()
  return (
    <output data-testid="lesson-statuses">
      {lessons.map((lesson) => `${lesson.id}:${lesson.status}`).join(",")}
    </output>
  )
}

function DraftReadyLessonIds() {
  const { lessons } = usePrototype()
  return (
    <output data-testid="draft-ready-lesson-ids">
      {lessons
        .filter((lesson) => lesson.status === "draft-ready")
        .map((lesson) => lesson.id)
        .join(",")}
    </output>
  )
}

class TestMediaRecorder {
  static instances: TestMediaRecorder[] = []
  mimeType = "audio/webm"
  state: "inactive" | "recording" | "paused" = "inactive"
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null

  constructor(_stream: MediaStream) {
    TestMediaRecorder.instances.push(this)
  }

  start() { this.state = "recording" }

  pause() { this.state = "paused" }

  resume() { this.state = "recording" }

  stop() {
    this.state = "inactive"
    this.ondataavailable?.({ data: new Blob(["recording"], { type: this.mimeType }) } as BlobEvent)
    this.onstop?.()
  }
}

beforeEach(() => {
  TestMediaRecorder.instances = []
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
    expect(within(dialog).getByRole("button", { name: "重试录音" })).toBeInTheDocument()
    expect(within(dialog).queryByRole("button", { name: "查看 AI 初稿" })).not.toBeInTheDocument()
  })

  it("persists an AI analysis failure after the recording panel closes", async () => {
    lessonAnalysis.analyzeLessonAudio.mockRejectedValue(new Error("本地 AI 服务未启动"))
    renderClassroom()

    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    await waitFor(() => expect(within(dialog).getByText("录音中")).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole("button", { name: "结束并生成 AI 初稿" }))
    await waitFor(() => expect(within(dialog).getByText("处理失败")).toBeInTheDocument())

    fireEvent.click(within(dialog).getByRole("button", { name: "关闭新课堂录音" }))

    expect(screen.getByTestId("lesson-statuses")).toHaveTextContent(
      /lesson-recording-\d+:failed/,
    )
  })

  it("returns a failed lesson to scheduled before retrying a recording", async () => {
    lessonAnalysis.analyzeLessonAudio.mockRejectedValueOnce(new Error("本地 AI 服务未启动"))
    renderClassroom()

    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    await waitFor(() => expect(within(dialog).getByText("录音中")).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole("button", { name: "结束并生成 AI 初稿" }))
    await waitFor(() => expect(within(dialog).getByText("处理失败")).toBeInTheDocument())

    fireEvent.click(within(dialog).getByRole("button", { name: "重试录音" }))

    expect(within(dialog).getByText("等待开始")).toBeInTheDocument()
    expect(screen.getByTestId("lesson-statuses")).toHaveTextContent(
      /lesson-recording-\d+:scheduled/,
    )
  })

  it("cancels recording without analyzing audio or creating a draft", async () => {
    renderClassroom()
    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    await waitFor(() => expect(within(dialog).getByText("录音中")).toBeInTheDocument())

    fireEvent.click(within(dialog).getByRole("button", { name: "关闭新课堂录音" }))

    expect(lessonAnalysis.analyzeLessonAudio).not.toHaveBeenCalled()
    expect(screen.getByTestId("draft-ready-lesson-ids")).not.toHaveTextContent(
      "lesson-recording-",
    )
    fireEvent.click(screen.getByRole("button", { name: "AI 初稿" }))
    expect(screen.queryByText("新课堂录音")).not.toBeInTheDocument()
  })

  it("stops a late permission stream without starting a recorder after cancellation", async () => {
    let resolveStream: (stream: MediaStream) => void = () => undefined
    const permission = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve
    })
    const getUserMedia = vi.fn(() => permission)
    const stop = vi.fn()
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    })

    renderClassroom()
    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "关闭新课堂录音" }))

    resolveStream({ getTracks: () => [{ stop }] } as unknown as MediaStream)

    await waitFor(() => expect(stop).toHaveBeenCalledOnce())
    expect(TestMediaRecorder.instances).toHaveLength(0)
    expect(lessonAnalysis.analyzeLessonAudio).not.toHaveBeenCalled()
    expect(screen.getByTestId("lesson-statuses")).toHaveTextContent(
      /lesson-recording-\d+:scheduled/,
    )
  })

  it("uses the native recorder pause and resume operations", async () => {
    renderClassroom()
    fireEvent.click(screen.getByRole("button", { name: "开始新课堂录音" }))
    const dialog = screen.getByRole("dialog", { name: "新课堂录音" })
    fireEvent.click(within(dialog).getByRole("button", { name: "开始录音" }))
    await waitFor(() => expect(within(dialog).getByText("录音中")).toBeInTheDocument())

    fireEvent.click(within(dialog).getByRole("button", { name: "暂停录音" }))
    expect(TestMediaRecorder.instances[0]?.state).toBe("paused")
    fireEvent.click(within(dialog).getByRole("button", { name: "继续录音" }))
    expect(TestMediaRecorder.instances[0]?.state).toBe("recording")
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
