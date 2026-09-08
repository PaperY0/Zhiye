import { render, screen, within } from "@testing-library/react"
import { beforeEach, expect, it } from "vitest"
import App from "../../App"

beforeEach(() => {
  window.history.replaceState(null, "", "#/student/tutoring")
})

it("renders connected student learning routes inside the student shell", () => {
  render(<App />)
  expect(screen.getByRole("navigation", { name: "学生端主导航" })).toBeInTheDocument()
  const main = screen.getByRole("main")
  expect(within(main).getByRole("heading", { name: "拍照答疑" })).toBeInTheDocument()
  expect(within(main).queryByText("该页面将在学生端阶段完成完整交互。")).not.toBeInTheDocument()
})
