import { afterEach, describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import {
  formatRoute,
  getRoleHome,
  navigate,
  parseHash,
  type AppRoute,
  type Role,
} from "./routes"
import { useHashRoute } from "./useHashRoute"

describe("typed hash routes", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "#/welcome")
  })

  it("parses dynamic routes and falls back safely", () => {
    expect(parseHash("#/teacher/classroom/lesson-fractions")).toEqual({
      role: "teacher",
      page: "lesson-detail",
      lessonId: "lesson-fractions",
    })
    expect(parseHash("#/student/review/lesson-fractions")).toEqual({
      role: "student",
      page: "review",
      lessonId: "lesson-fractions",
    })
    expect(parseHash("#/bad/path")).toEqual({ page: "welcome" })
    expect(getRoleHome("parent")).toEqual({ role: "parent", page: "home" })
    expect(formatRoute({ role: "admin", page: "safety" })).toBe(
      "#/admin/safety",
    )
  })

  it("validates known pages and decodes dynamic identifiers", () => {
    expect(parseHash("#/teacher/classroom")).toEqual({
      role: "teacher",
      page: "classroom",
    })
    expect(parseHash("#/teacher/students/%E5%BC%A0%E4%B8%89")).toEqual({
      role: "teacher",
      page: "student-detail",
      studentId: "张三",
    })
    expect(parseHash("#/student/review/unit%201")).toEqual({
      role: "student",
      page: "review",
      lessonId: "unit 1",
    })
    expect(parseHash("#/teacher/not-a-page")).toEqual({ page: "welcome" })
    expect(parseHash("#/teacher/classroom/%E0%A4%A")).toEqual({
      page: "welcome",
    })
    expect(parseHash("#/teacher/classroom/")).toEqual({ page: "welcome" })
    expect(parseHash("")).toEqual({ page: "welcome" })
  })

  it("formats every route canonically and URI-encodes identifiers", () => {
    expect(formatRoute({ page: "welcome" })).toBe("#/welcome")
    expect(
      formatRoute({
        role: "teacher",
        page: "lesson-detail",
        lessonId: "分数 单元/一",
      }),
    ).toBe(
      "#/teacher/classroom/%E5%88%86%E6%95%B0%20%E5%8D%95%E5%85%83%2F%E4%B8%80",
    )
    expect(
      formatRoute({
        role: "teacher",
        page: "student-detail",
        studentId: "student/42",
      }),
    ).toBe("#/teacher/students/student%2F42")
  })

  it("provides a typed home route for every role", () => {
    const roles: Role[] = ["teacher", "student", "parent", "admin"]
    const homes: AppRoute[] = roles.map(getRoleHome)

    expect(homes).toEqual([
      { role: "teacher", page: "workspace" },
      { role: "student", page: "home" },
      { role: "parent", page: "home" },
      { role: "admin", page: "home" },
    ])
  })

  it("navigates and publishes hash route changes", () => {
    window.history.replaceState(null, "", "#/teacher/workspace")
    const { result } = renderHook(() => useHashRoute())

    expect(result.current).toEqual({ role: "teacher", page: "workspace" })

    act(() => {
      navigate({ role: "student", page: "review", lessonId: "lesson-1" })
    })

    expect(window.location.hash).toBe("#/student/review/lesson-1")
    expect(result.current).toEqual({
      role: "student",
      page: "review",
      lessonId: "lesson-1",
    })
  })

  it("initializes an empty hash to the canonical welcome route", () => {
    window.history.replaceState(null, "", window.location.pathname)

    const { result } = renderHook(() => useHashRoute())

    expect(window.location.hash).toBe("#/welcome")
    expect(result.current).toEqual({ page: "welcome" })
  })
})
