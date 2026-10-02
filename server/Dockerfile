# PhantomMirror API 镜像
#
# 用法：与 docker-compose.yml 里的 app 服务配套，在服务器上 `docker compose up -d --build`。
# 本地开发不用它（本地是 npm run start + SSH 隧道，且开发机没装 docker）。
#
# ── 为什么构建阶段要垫一个假的 DATABASE_URL ──────────────────────
# package.json 的 postinstall 会跑 `prisma generate`，而 Prisma 7 的配置
# （prisma7.config.ts）会读 DATABASE_URL 填 datasource.url。generate 本身
# 不需要真连库，但拿不到值会直接报错。这里给一个占位串，
# 真连接串在运行时由环境变量注入 —— 绝不是把它打进镜像。
# ────────────────────────────────────────────────────────────────

# ---------- 构建 ----------
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Prisma CLI 需要 openssl 才能正确探测运行环境
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# 先只拷 manifest：依赖没变时这层可以复用，改代码不必重装依赖
COPY package.json package-lock.json ./

# 占位值，仅为让 prisma generate 跑得过去（见文件头注释）
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
RUN npm ci

COPY . .

# prisma generate && nest build
RUN npm run build


# ---------- 运行 ----------
#
# 直接复用 build 阶段：NestJS 的产物 dist/ 依赖运行时 node_modules，
# 而镜像里同时留着 prisma CLI，`docker compose exec app npx prisma migrate deploy`
# 才能直接在容器里跑迁移（部署流程的正规做法）。
#
# 代价是 devDependencies 也进了镜像（+200MB 左右）。服务器磁盘够用，
# Phase 1 先这样；要瘦身的话后续拆成 --omit=dev + 单独带 prisma CLI。
FROM build AS runtime

ENV NODE_ENV=production

EXPOSE 3000

# 启动前不自动跑迁移：迁移失败时希望容器起不来并报错，
# 而不是带着半套 schema 提供服务。迁移在部署脚本里显式执行。
CMD ["node", "dist/main"]