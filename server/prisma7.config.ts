// Prisma CLI 配置（Prisma 7 起改名，不再是 prisma.config.ts）。
//
// Prisma 7 不再自动读取 .env，必须在这里显式 import 'dotenv/config'，
// 否则 `prisma migrate` / `prisma generate` 会拿不到 DATABASE_URL。
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma migrate dev` / `prisma db seed` 会执行这条命令。
    // 用 tsx 而不是 `node`：Prisma 7 生成的客户端是纯 .ts 源码
    // （src/generated/prisma/client.ts），而代码里按 ESM 惯例 import 的是
    // `client.js` —— Node 原生类型剥离不会做 .js -> .ts 的路径映射，tsx 会。
    // seed 幂等，随时可重复跑。
    seed: 'tsx prisma/seed.ts',
  },
  // schema.prisma 的 datasource 块不再写 url，连接串从这里注入。
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});