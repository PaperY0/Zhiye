const storageKey = "zhiye-ai-access-v1"
export const aiInviteRequestedEvent = "zhiye-ai-invite-requested"
export const aiAccessChangedEvent = "zhiye-ai-access-changed"

type AccessSession = { token: string; expiresAt: number }
type PendingAccess = {
  promise: Promise<string>
  resolve: (token: string) => void
  reject: (error: Error) => void
}

let pendingAccess: PendingAccess | null = null

export function aiInviteEnabled(): boolean {
  return import.meta.env.VITE_AI_INVITE_REQUIRED === "true"
}

function aiBaseUrl(): string {
  return import.meta.env.VITE_LOCAL_AI_BASE_URL ?? "http://127.0.0.1:8787"
}

export function currentAiToken(): string | null {
  let raw: string | null
  try {
    raw = window.sessionStorage.getItem(storageKey)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const saved = JSON.parse(raw) as AccessSession
    if (typeof saved.token === "string" && saved.expiresAt * 1000 > Date.now() + 5000) return saved.token
  } catch { /* Expired or malformed session. */ }
  clearAiAccess()
  return null
}

export function clearAiAccess(): void {
  try { window.sessionStorage.removeItem(storageKey) } catch { /* Continue without persistence. */ }
  window.dispatchEvent(new Event(aiAccessChangedEvent))
}

export function requestAiToken(): Promise<string> {
  const existing = currentAiToken()
  if (existing) return Promise.resolve(existing)
  if (pendingAccess) return pendingAccess.promise
  let resolve!: (token: string) => void
  let reject!: (error: Error) => void
  const promise = new Promise<string>((res, rej) => { resolve = res; reject = rej })
  pendingAccess = { promise, resolve, reject }
  window.dispatchEvent(new Event(aiInviteRequestedEvent))
  return promise
}

export function openAiInvite(): void {
  window.dispatchEvent(new Event(aiInviteRequestedEvent))
}

export function cancelAiInvite(): void {
  pendingAccess?.reject(new Error("已取消输入邀请码，AI 请求未发送。"))
  pendingAccess = null
}

export async function exchangeAiInvite(code: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${aiBaseUrl()}/auth/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    })
  } catch {
    throw new Error("AI 服务暂时无法连接，请稍后再试。")
  }
  const payload = await response.json().catch(() => null) as { token?: unknown; expiresAt?: unknown; detail?: unknown } | null
  if (!response.ok) {
    throw new Error(typeof payload?.detail === "string" ? payload.detail : "邀请码验证失败，请重试。")
  }
  if (typeof payload?.token !== "string" || typeof payload.expiresAt !== "number" || !Number.isFinite(payload.expiresAt) || payload.expiresAt * 1000 <= Date.now() + 5000) {
    throw new Error("AI 服务返回的邀请码会话无效。")
  }
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify({ token: payload.token, expiresAt: payload.expiresAt }))
  } catch { /* The current request can still proceed. */ }
  pendingAccess?.resolve(payload.token)
  pendingAccess = null
  window.dispatchEvent(new Event(aiAccessChangedEvent))
}
