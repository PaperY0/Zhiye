"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    const result = await signIn("credentials", {
      email: formData.get("email"),
      accessCode: formData.get("accessCode"),
      redirect: false,
      callbackUrl: "/",
    })
    if (result?.error) setError("登录信息无效或当前环境未配置演示凭据")
    if (result?.url) window.location.assign(result.url)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        邮箱
        <input name="email" type="email" required />
      </label>
      <label>
        演示访问码
        <input name="accessCode" type="password" required />
      </label>
      <button type="submit">登录</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  )
}
