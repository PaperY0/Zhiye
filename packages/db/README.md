# @zhiye/db

当前包提交的是首轮数据库契约，并提供本地 PostgreSQL 迁移入口。

- Prisma schema：`prisma/schema.prisma`
- Prisma 7 配置：`prisma.config.ts`
- 首个结构迁移：`prisma/migrations/0001_init/migration.sql`
- 脱敏种子契约：`prisma/seed-data.ts`
- 可执行种子：`prisma/seed.ts`
- 校验：`pnpm exec prisma validate --config packages/db/prisma.config.ts`
- 迁移：`pnpm exec prisma migrate dev --config packages/db/prisma.config.ts --name init`
- 本地依赖：根目录 `docker compose up -d postgres redis minio`
- 写入一份验收数据：`pnpm --dir packages/db seed`
- 伪造数据清单：`docs/qa/zhiye-fake-data-catalog.md`

迁移目录只保存结构，不保存任何真实业务内容。`seed-data.ts` 仍是脱敏契约，下一步再转为事务化 seed。种子数据不包含真实音频、题图、完整对话或保护正文。
