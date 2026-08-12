# @zhiye/web

知野生产 Web 入口，独立于根目录 Vite 原型。

当前已接入：

- Next.js App Router
- Auth.js route handler 骨架
- 本地演示 Credentials Provider、登录页和退出按钮
- 未登录私有接口返回 `401 UNAUTHENTICATED`
- `/api/health` 健康检查
- `.env.example` 环境变量声明

当前边界：Credentials Provider 只接受本地环境变量中的演示凭据，生产环境明确拒绝；真实学校账号 Provider、用户数据库查询、邀请/绑定码和公共设备退出后的服务端撤销流程仍未接入。

运行：

```powershell
pnpm --filter @zhiye/web dev
```

本地伪造账号：

- 教师：`teacher@example.test`
- 学生：`student@example.test`
- 监护人：`guardian@example.test`
- 管理员：`admin@example.test`

访问码读取 `DEMO_LOGIN_CODE`，并且必须显式设置 `DEMO_DATA_MODE=true`；只用于本地验收。这些账号均为脱敏伪造数据。
