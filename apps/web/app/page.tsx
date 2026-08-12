import { auth } from "../auth"
import { LogoutButton } from "./logout-button"

export default async function WebHomePage() {
  const session = await auth()

  return (
    <main>
      <h1>知野生产入口</h1>
      <p>{session?.user ? "已建立会话" : "未登录：业务数据默认不可见"}</p>
      {session?.user ? <LogoutButton /> : null}
    </main>
  )
}
