import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <main>
      <h1>登录知野</h1>
      <p>当前为本地试点演示登录，正式 Provider 接入前不可用于真实学校账号。</p>
      <LoginForm />
    </main>
  )
}
