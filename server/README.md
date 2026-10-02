# PhantomMirror Server

幻境（PhantomMirror）云端 API —— NestJS 12 + Prisma 7 + PostgreSQL 16 + Redis 7 + MinIO。

> 架构设计与决策记录见 [`../docs/architecture/server-architecture.md`](../docs/architecture/server-architecture.md)。

---

## 一句话架构

```
客户端 ──(1) 要上传地址──→ API ──签发预签名 URL──→ MinIO
   │                        │
   └──(2) 直传图片─────────────────────────────────→ MinIO   （不过 API，省带宽）
                            │
   └──(3) POST /simulations ─→ API ─→ BullMQ(Redis) ─→ Worker ─→ AI Provider
                                       │                  │
                                       └── 状态写 ai_tasks ┘── 结果图写 MinIO
```

**状态只有一份事实来源**：`ai_tasks.status`。其它业务表（`simulations` 等）
一律不存状态，避免两处不一致 —— 这类 bug 最难查。

---

## 本地开发

### 1. 依赖装到 D 盘（C 盘空间紧张）

```bash
cd D:/PlantomMirror/server
npm install
```

### 2. 建立 SSH 隧道（把服务器的存储层映射到本机）

```bash
ssh -N -L 5433:127.0.0.1:5433 -L 6380:127.0.0.1:6380 \
       -L 9000:127.0.0.1:9000 -L 9901:127.0.0.1:9001 ubuntu@101.35.163.174
```

服务器上已有原生 Postgres/Redis 占用 5432/6379，所以容器栈用备用端口，
且只绑 `127.0.0.1` —— 必须靠隧道访问。

> 控制台映射到本机 **9901** 而非 9001：Windows 本机 9001 被某个 svchost
> 服务占着，绑定会报 `WinError 10013`。S3 API 的 9000 没冲突，不用改。

### 3. 准备 `.env`

```bash
cp .env.example .env   # 然后填真实密码（服务器上的密码见服务器 .env）
```

### 4. 建表 + 灌种子数据

```bash
npm run prisma:migrate   # 建表
npm run prisma:seed      # 发型目录（幂等，可反复跑）
```

### 5. 起服务

```bash
npm run start:dev
```

- API：<http://127.0.0.1:3000/api/v1>
- Swagger：<http://127.0.0.1:3000/api/docs>
- MinIO 控制台：<http://127.0.0.1:9901>

### 6. 自检

```bash
curl http://127.0.0.1:3000/api/v1/health
```

---

## API 一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/health` | 健康检查（会真连一次数据库） |
| `POST` | `/api/v1/photos/upload-url` | 换取图片直传地址 |
| `POST` | `/api/v1/photos/{id}/complete` | 客户端传完图后确认落盘 |
| `GET` | `/api/v1/hairstyles` | 发型目录 |
| `POST` | `/api/v1/analysis` | 发起外貌分析（异步） |
| `GET` | `/api/v1/analysis/{taskId}` | 查分析状态 / 结果 |
| `POST` | `/api/v1/simulations` | 发起试戴（异步） |
| `GET` | `/api/v1/simulations/{id}` | 查试戴状态 / 结果图 |
| `POST` | `/api/v1/feedback` | 提交反馈 |

**身份**：所有接口都要带 `X-Anonymous-Id` 请求头（客户端生成 `anon_<32位十六进制>`）。
服务端首次见到就自动建用户，无需注册登录。

**错误结构**（与客户端 `ApiException` 严格对齐）：

```json
{ "code": "PHOTO_NOT_FOUND", "message": "照片不存在", "retryable": false }
```

`retryable` 是给客户端自动重试逻辑用的：`true` 表示是瞬时故障，重试有意义。

---

## AI Provider

Phase 1 默认 `AI_PROVIDER=mock`：**返回结构真实、内容假**。

- 分析结果字段齐全（脸型/发质/发长…），值由图片 hash 派生 —— 同一张图结果稳定
- 试戴返回一张确定性的占位 PNG

好处是**整条链路零 AI 成本就能端到端跑通**，客户端 UI 与状态机可以全部调完。

切真实供应商只需改 `.env` 里的 `AI_PROVIDER`，业务代码一行不用动：

```bash
AI_PROVIDER=perfect-corp   # 或 gemini
```

> `perfect-corp` / `gemini` 目前是**空实现**：每个方法都显式抛
> `AI_PROVIDER_UNAVAILABLE`，绝不返回假数据冒充成功。

---

## 常用命令

```bash
npm run start:dev        # 开发模式（热重载）
npm run build            # 构建（含 prisma generate）
npm run lint             # oxlint
npm test                 # 单元测试（不需要外部依赖）
npm run test:e2e         # 端到端（需要隧道 + 容器栈在跑）
npm run prisma:studio    # 数据库可视化
```

---

## 部署（服务器侧）

```bash
ssh ubuntu@101.35.163.174
cd ~/phantommirror
docker compose up -d
docker compose ps
```

存储层容器（Postgres/Redis/MinIO）与服务器上已有服务完全隔离，可随时
`docker compose down` 干净拆除。

### 镜像从哪来（国内拉取的坑）

服务器上配的三个 registry mirror 里**只有 daocloud 是通的**，其余两个和
docker.io 全部超时 —— 直接 `docker pull` 会卡死不动（不报错，就是不动）。
所以拉镜像一律用**全限定名绕开 daemon 的 mirror 配置**：

```bash
docker pull docker.m.daocloud.io/library/postgres:16-alpine
docker tag  docker.m.daocloud.io/library/postgres:16-alpine postgres:16-alpine
```

⚠️ **MinIO 的镜像是特例**：MinIO 官方已经停止发布社区版镜像
（`dl.min.io` 现在返回 410，docker.io 上的 `minio/minio` 也已被删，
daocloud 会直接回 `denied`）。当前用的这份是从 `docker.1panel.live`
拉到的缓存镜像，**构建时间是 12 个月前**。

这意味着它不会再有安全更新。Phase 1 只在内网回环上跑、只存自己的测试图，
风险可控；但**上线前必须处理**，可选：改用 MinIO 的商业/自建发布渠道、
换成其他 S3 兼容实现（如 Garage / SeaweedFS），或直接用云厂商对象存储。

---

## 排查手册

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 启动即退出，提示配置错误 | `.env` 缺项或格式不对 | 看报错里列出的字段名，对照 `.env.example` |
| `STORAGE_UNAVAILABLE` | MinIO 没起或隧道断了 | `docker compose ps`；重连隧道 |
| 任务一直 `PROCESSING` | Worker 没起来 / Redis 连不上 | 检查 `REDIS_*`，看有没有 BullMQ 连接报错 |
| `docker pull` 卡住不动 | 国内镜像源不通 | 用全限定名绕过：`docker pull docker.m.daocloud.io/library/postgres:16-alpine` |