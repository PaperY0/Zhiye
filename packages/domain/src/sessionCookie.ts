export const SESSION_COOKIE_NAME = "zhiye.session"

export type SessionCookieOptions = {
  secure?: boolean
  maxAgeSeconds?: number
}

function formatCookie(value: string, options: SessionCookieOptions) {
  const attributes = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${options.maxAgeSeconds ?? 60 * 60 * 8}`,
  ]
  if (options.secure) attributes.push("Secure")
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; ${attributes.join("; ")}`
}

export function createSessionCookie(
  opaqueToken: string,
  options: SessionCookieOptions = {},
): string {
  if (!opaqueToken) throw new Error("SESSION_TOKEN_REQUIRED")
  return formatCookie(opaqueToken, options)
}

export function clearSessionCookie(): string {
  return formatCookie("", { maxAgeSeconds: 0 })
}

export function readSessionCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null
  const prefix = `${SESSION_COOKIE_NAME}=`
  const part = cookieHeader.split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix))
  return part ? decodeURIComponent(part.slice(prefix.length)) || null : null
}
