import { useEffect, useState, type FormEvent } from "react"
import { Dialog } from "../shared/Dialog"
import {
  aiAccessChangedEvent,
  aiInviteEnabled,
  aiInviteRequestedEvent,
  cancelAiInvite,
  currentAiToken,
  exchangeAiInvite,
  openAiInvite,
} from "../../services/aiAccess"

export function AiDemoNotice() {
  const enabled = aiInviteEnabled()
  const [open, setOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(() => enabled && Boolean(currentAiToken()))
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const show = () => { setError(""); setOpen(true) }
    const refresh = () => setUnlocked(Boolean(currentAiToken()))
    window.addEventListener(aiInviteRequestedEvent, show)
    window.addEventListener(aiAccessChangedEvent, refresh)
    return () => {
      window.removeEventListener(aiInviteRequestedEvent, show)
      window.removeEventListener(aiAccessChangedEvent, refresh)
    }
  }, [])

  function close() {
    if (busy) return
    cancelAiInvite()
    setCode("")
    setError("")
    setOpen(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!code.trim() || busy) return
    setBusy(true)
    setError("")
    try {
      await exchangeAiInvite(code)
      setCode("")
      setOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "邀请码验证失败，请重试。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <aside className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8e5d8] bg-[#f9fcf7]/95 px-4 py-3 text-sm leading-relaxed text-[#49634e] shadow-sm sm:mx-6 lg:mx-8" aria-label="公开演示说明">
        <p>
          <strong className="mr-2 text-[#27472f]">公开演示版</strong>
          任务与记录只保存在当前浏览器，不会同步到其他设备；
          {enabled ? (unlocked ? "AI 已解锁，可使用文字、题图和录音功能。" : "输入邀请码后可使用 AI 功能。") : "AI 功能在公网演示中暂不可用。"}
        </p>
        {enabled ? (
          <button className="min-h-11 shrink-0 rounded-full border border-[#9fbaa4] bg-white px-4 font-bold text-[#2f6140] transition-colors hover:bg-[#ecf5eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52775a]" onClick={openAiInvite} type="button">
            {unlocked ? "重新输入邀请码" : "输入邀请码"}
          </button>
        ) : null}
      </aside>
      <Dialog open={open} onClose={close} title="解锁 AI 功能" description="请输入获得的邀请码。验证后当前标签页可使用文字、题图和录音 AI 功能。">
        <form className="space-y-4" onSubmit={submit}>
          <label className="block space-y-2 text-sm font-bold text-[#27472f]">
            <span>邀请码</span>
            <input autoComplete="off" autoFocus className="min-h-12 w-full rounded-2xl border border-[#c8d9ca] bg-white px-4 text-base text-[#142319] outline-none focus:border-[#5e8a66] focus:ring-2 focus:ring-[#5e8a66]/25" maxLength={128} onChange={(event) => setCode(event.target.value)} required type="password" value={code} />
          </label>
          {error ? <p role="alert" className="rounded-xl bg-[#fff0e9] px-4 py-3 text-sm text-[#9a4e2e]">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button className="min-h-11 rounded-full border border-[#c8d9ca] bg-white px-5 font-bold text-[#44614a]" onClick={close} type="button">取消</button>
            <button className="min-h-11 rounded-full bg-[#214e31] px-5 font-bold text-white disabled:opacity-60" disabled={busy || !code.trim()} type="submit">{busy ? "验证中…" : "解锁 AI"}</button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
