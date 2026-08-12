export type Role = "teacher" | "student" | "parent" | "admin"

export type AppRoute = {
  page: "welcome"
} | {
  role: "teacher"
  page: "workspace" | "classroom" | "insights" | "planning" | "students" | "tasks" | "messages" | "settings" | "history"
} | {
  role: "teacher"
  page: "lesson-detail"
  lessonId: string
} | {
  role: "teacher"
  page: "student-detail"
  studentId: string
} | {
  role: "student"
  page: "home" | "tutoring" | "learning" | "mistakes" | "tasks" | "messages" | "history"
} | {
  role: "student"
  page: "review"
  lessonId: string
} | {
  role: "parent"
  page: "home" | "messages" | "history"
} | {
  role: "admin"
  page: "home" | "safety" | "audit" | "settings" | "history"
}

type RoleRoute<R extends Role> = Extract<AppRoute, { role: R }>
type TeacherStaticPage = Exclude<RoleRoute<"teacher">["page"], "lesson-detail" | "student-detail">
type StudentStaticPage = Exclude<RoleRoute<"student">["page"], "review">

const teacherPages = [
  "workspace",
  "classroom",
  "insights",
  "planning",
  "students",
  "tasks",
  "messages",
  "settings",
  "history",
] as const satisfies readonly TeacherStaticPage[]

const studentPages = [
  "home",
  "tutoring",
  "learning",
  "mistakes",
  "tasks",
  "messages",
  "history",
] as const satisfies readonly StudentStaticPage[]

const parentPages = [
  "home",
  "messages",
  "history",
] as const satisfies readonly RoleRoute<"parent">["page"][]
const adminPages = [
  "home",
  "safety",
  "audit",
  "settings",
  "history",
] as const satisfies readonly RoleRoute<"admin">["page"][]

function isKnownPage<const Pages extends readonly string[]>(
  pages: Pages,
  page: string | undefined,
): page is Pages[number] {
  return typeof page === "string" && pages.includes(page)
}

function decodeSegments(hash: string): string[] | null {
  const path = hash.startsWith("#") ? hash.slice(1) : hash
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path

  if (normalizedPath === "") return []

  try {
    return normalizedPath
      .split("/")
      .map((segment) => decodeURIComponent(segment))
  } catch {
    return null
  }
}

export function parseHash(hash: string): AppRoute {
  const segments = decodeSegments(hash)
  if (segments === null || segments.length === 0) return { page: "welcome" }

  const [role, page, identifier] = segments

  if (role === "teacher") {
    if (segments.length === 2 && isKnownPage(teacherPages, page)) {
      return { role, page }
    }

    if (
      segments.length === 3 &&
      page === "classroom" &&
      identifier !== undefined &&
      identifier.length > 0
    ) {
      return { role, page: "lesson-detail", lessonId: identifier }
    }

    if (
      segments.length === 3 &&
      page === "students" &&
      identifier !== undefined &&
      identifier.length > 0
    ) {
      return { role, page: "student-detail", studentId: identifier }
    }
  }

  if (role === "student") {
    if (segments.length === 2 && isKnownPage(studentPages, page)) {
      return { role, page }
    }

    if (
      segments.length === 3 &&
      page === "review" &&
      identifier !== undefined &&
      identifier.length > 0
    ) {
      return { role, page: "review", lessonId: identifier }
    }
  }

  if (
    role === "parent" &&
    segments.length === 2 &&
    isKnownPage(parentPages, page)
  ) {
    return { role, page }
  }

  if (
    role === "admin" &&
    segments.length === 2 &&
    isKnownPage(adminPages, page)
  ) {
    return { role, page }
  }

  return { page: "welcome" }
}

export function formatRoute(route: AppRoute): string {
  if (route.page === "welcome") return "#/welcome"

  if (route.role === "teacher") {
    if (route.page === "lesson-detail") {
      return `#/teacher/classroom/${encodeURIComponent(route.lessonId)}`
    }
    if (route.page === "student-detail") {
      return `#/teacher/students/${encodeURIComponent(route.studentId)}`
    }
    return `#/teacher/${route.page}`
  }

  if (route.role === "student") {
    if (route.page === "review") {
      return `#/student/review/${encodeURIComponent(route.lessonId)}`
    }
    return `#/student/${route.page}`
  }

  return `#/${route.role}/${route.page}`
}

export function getRoleHome<R extends Role>(role: R): RoleRoute<R> {
  switch (role) {
    case "teacher":
      return { role, page: "workspace" } as RoleRoute<R>
    case "student":
    case "parent":
    case "admin":
      return { role, page: "home" } as RoleRoute<R>
  }
}

export function navigate(route: AppRoute): void {
  if (typeof window === "undefined") return

  const nextHash = formatRoute(route)
  if (window.location.hash === nextHash) return

  const oldURL = window.location.href
  window.history.pushState(null, "", nextHash)
  window.dispatchEvent(
    new HashChangeEvent("hashchange", {
      oldURL,
      newURL: window.location.href,
    }),
  )
}

