import { auth } from "../auth"
import { LogoutButton } from "./logout-button"

const prototypeUrl = process.env.NEXT_PUBLIC_PROTOTYPE_URL ?? "http://localhost:8443"

export default async function WebHomePage() {
  const session = await auth()

  return (
    <main>
      <h1>知野生产入口</h1>
      {session?.user ? (
        <>
          <p>已建立会话</p>
          <p>
            当前身份：{session.user.email ?? "本地演示用户"}
          </p>
          <p>
            <a href={prototypeUrl}>进入知野工作台</a>
          </p>
          <p>工作台当前运行在本机 Vite 服务，需要保持 8443 端口服务运行。</p>
          <LogoutButton />
        </>
      ) : (
        <>
          <p>未登录：业务数据默认不可见</p>
          <p>
            <a href="/login">登录</a>
          </p>
        </>
      )}
    </main>
  )
}
