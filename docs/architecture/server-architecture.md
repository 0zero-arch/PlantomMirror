# PhantomMirror 云端（Backend）架构设计与技术选型

**版本：** V0.1
**阶段：** Phase 1 / MVP 技术验证
**决策日期：** 2026-10-02
**上游文档：** 《PhantomMirror（幻境）客户端_云端 模块拆解与架构设计》（以下简称「上版文档」）
**关联文档：** 《client-architecture.md》、《client-modules.md》

---

## 1. 文档目的

本文档回答云端三个问题：

1. 云端**用什么技术**（选型）
2. 云端**代码怎么组织**（模块划分）
3. 云端与客户端**怎么对话**（API 契约与数据流）

> **阅读前提**：上版文档已经定了大方向（NestJS / PostgreSQL / Redis / S3 对象存储 / 单体 + Worker / Docker Compose）。本文档**不推翻它**，只把「大方向 → 可执行细节」这一步补齐，并记录本轮新增的决策。

---

## 2. 本轮新增决策（2026-10-02 与创始人确认）

| 议题 | 决定 | 理由 |
|---|---|---|
| 开发分工 | **AI 搭骨架 + 基建，核心设计留给创始人** | 呼应上版文档 §41「40% 学习 / 30% 自己设计 / 20% AI 编码 / 10% 文档」，避免「拥有代码但没有拥有系统」 |
| 对象存储 | **MinIO 自建**（部署在自有云服务器） | 完全免费、数据自己掌控、本地与生产同为 S3 协议 |
| AI 第一步 | **先落 Provider 抽象层 + MockProvider** | 呼应 ADR-008「BUY → BUILD → RESEARCH」；闭环可零 AI 成本跑通，拿到 Key 再插真实实现 |

---

## 3. 技术选型

### 3.1 选型总表

| 维度 | 选择 | 备选 | 状态 |
|---|---|---|---|
| 语言 / 框架 | **TypeScript + NestJS** | — | 上版文档 ADR-002 已定 |
| 数据库 | **PostgreSQL** | — | 上版文档 ADR-004 已定 |
| 队列 / 缓存 | **Redis + BullMQ** | RabbitMQ / Kafka | BullMQ 与 NestJS 集成最顺 |
| 对象存储 | **MinIO**（S3 兼容） | 阿里云 OSS / 腾讯云 COS | 本轮确定（自建） |
| ORM | **Prisma** | TypeORM / Drizzle | 本轮确定，见 ADR-202 |
| 参数校验 | **class-validator + class-transformer** | zod | NestJS 官方 pipe 生态 |
| API 文档 | **Swagger（@nestjs/swagger）** | — | 本轮确定，见 ADR-204 |
| 配置管理 | **@nestjs/config** | — | 官方方案 |
| AI 抽象 | **HairstyleProvider 接口 + MockProvider** | 直接写死 Perfect Corp | 本轮确定 |

### 3.2 关键选型理由

#### ORM：Prisma（ADR-202）

**为什么选它：**

- `schema.prisma` 一个文件就能读完整个数据模型，**对「自己读懂系统」这个目标最友好**。
- 迁移（`prisma migrate`）语义清晰，能回看「表结构怎么演化的」。
- 生成的 Client 类型安全，配合 TS 减少字段拼错。

**为什么不选其它：**

- **TypeORM**：与 NestJS 集成更「原生」，但装饰器 + 隐式行为多，排查 N+1 和迁移问题成本更高。
- **Drizzle**：更轻、更接近 SQL，但生态与文档相对新。

#### 队列：BullMQ（ADR-203）

上版文档 ADR-005 只定了「Redis」。本轮明确用 **BullMQ** 作为 Redis 上的队列实现：

- 与 NestJS 有官方 `@nestjs/bullmq` 集成。
- 自带重试 / 退避 / 延迟任务 / 任务进度——正好对上「AI 任务状态机」的需求。

#### API 文档：Swagger（ADR-204）

- 客户端（Flutter）开发时可直接对着 `http://<host>:3000/api/docs` 调接口，**前后端契约不靠嘴对齐**。
- 也是学习材料：所有接口的请求/响应结构一目了然。

---

## 4. 模块划分

沿用上版文档 §13 的模块清单，落到代码目录：

```Plain Text
server/
├── prisma/
│   ├── schema.prisma          # 数据模型（唯一事实来源）
│   └── migrations/            # 迁移历史
│
├── src/
│   ├── main.ts                # 入口：全局管道 / Swagger / CORS
│   ├── app.module.ts          # 根模块
│   │
│   ├── common/                # 跨模块基础设施
│   │   ├── config/            # 配置校验（env schema）
│   │   ├── filters/           # 全局异常过滤器 → 统一错误结构
│   │   ├── interceptors/      # 统一响应包装
│   │   └── decorators/        # 如 @CurrentUser（匿名 id）
│   │
│   ├── prisma/                # PrismaModule（全局）
│   │
│   ├── storage/               # S3 / MinIO 封装
│   │   ├── storage.service.ts # Presigned URL 签发、对象读写、删除
│   │   └── storage.module.ts
│   │
│   ├── auth/                  # 匿名用户 + 会话
│   │   └── anonymous.middleware.ts   # 解析 X-Anonymous-Id → req.user
│   │
│   ├── users/                 # User 模块（Phase 1 仅匿名用户）
│   ├── photos/                # Photo：元数据 / 上传地址 / complete
│   ├── appearance/            # AppearanceProfile
│   ├── hairstyles/            # 发型目录
│   ├── ai-tasks/              # AI 任务状态机（统一）
│   ├── simulations/           # 核心业务：Photo + Profile + Hairstyle → Simulation
│   ├── feedback/              # 反馈
│   │
│   └── ai/                    # ★ AI Provider 抽象层
│       ├── hairstyle-provider.interface.ts   # 统一接口
│       ├── providers/
│       │   ├── mock.provider.ts              # 本轮实现（零成本闭环）
│       │   ├── perfect-corp.provider.ts      # 留位
│       │   └── gemini.provider.ts            # 留位
│       └── ai.module.ts
│
├── docker-compose.yml         # PostgreSQL + Redis + MinIO（本地/服务器通用）
└── .env.example
```

**依赖方向（硬约束）：**

1. `simulations` 依赖 `ai` 的**接口**，不依赖任何具体 Provider。
2. 所有模块通过 `PrismaService` 访问数据库，不裸写 SQL 连接。
3. `storage` 只被 `photos` / `simulations` 依赖，不反向依赖业务模块。

---

## 5. AI Provider 抽象层（核心设计）

上版文档 §32 要求：`simulation.service.ts` **不能**直接写死某个供应商。

### 5.1 接口定义

```TypeScript
export interface HairstyleProvider {
  readonly name: string;

  /** 发质 / 发长 / 发量 / 毛躁度检测 */
  analyzeHair(input: ProviderImageInput): Promise<HairAnalysis>;

  /** 脸型等面部特征 */
  analyzeFace(input: ProviderImageInput): Promise<FaceAnalysis>;

  /** 发型虚拟试戴（核心） */
  generateHairstyle(input: GenerateHairstyleInput): Promise<GenerationResult>;
}
```

### 5.2 本轮实现：MockProvider

- **返回结构真实、内容假**：字段齐全（脸型 / 发质 / 发长…），但值是**确定性伪随机**（由图片 hash 派生），保证同一张图结果稳定、便于测试。
- `generateHairstyle` 返回一张**占位结果图**（可用原始图 + 水印 / 纯色图），让客户端的前后对比滑块有东西可显示。
- 好处：**整条闭环（上传 → 分析 → 选发型 → 模拟 → 结果 → 反馈）零 AI 成本就能端到端跑通**，客户端的 UI 与状态机可以全部调完。

### 5.3 切换方式

通过环境变量选择实现，业务代码不改：

```env
AI_PROVIDER=mock   # mock | perfect-corp | gemini
```

---

## 6. 数据模型（PostgreSQL）

对齐上版文档 §36 的七张核心表，另加上版文档 §56 要求的成本表。

| 表 | 关键字段 | 说明 |
|---|---|---|
| `users` | `id`, `anonymous_id`, `created_at` | Phase 1 仅匿名用户 |
| `photos` | `id`, `user_id`, `storage_key`, `type`, `width`, `height`, `status` | 图片只存元数据，字节在 MinIO |
| `appearance_profiles` | `id`, `photo_id`, `face_shape`, `hair_type`, `hair_length`, `hair_density`, `hair_frizziness`, `raw` | `raw` 保留供应商原始输出 |
| `hairstyles` | `id`, `name`, `category`, `gender`, `length`, `texture`, `provider_style_id`, `reference_image` | 发型目录 |
| `ai_tasks` | `id`, `type`, `status`, `provider`, `error`, `created_at`, `finished_at` | 统一任务表（状态机见 §7） |
| `simulations` | `id`, `user_id`, `photo_id`, `appearance_profile_id`, `hairstyle_id`, `ai_task_id`, `output_storage_key` | 核心业务表 |
| `feedbacks` | `id`, `simulation_id`, `user_id`, `rating`, `reason`, `comment` | 反馈 |
| `ai_usages` | `id`, `provider`, `model`, `task_type`, `input_size`, `output_size`, `latency_ms`, `estimated_cost`, `success`, `created_at` | 成本监控（上版文档 §56） |

> **注意**：`appearance_profiles` 的字段是**第三方 AI 的输出**，不代表绝对真实的人体属性（上版文档 §16 明确要求）。API 与 UI 措辞都需谨慎。

---

## 7. 任务状态机

对齐上版文档 §19，客户端已镜像同一套枚举：

```Plain Text
CREATED ──→ QUEUED ──→ PROCESSING ──→ SUCCESS
                │            │
                └────────────┴──────→ FAILED
                             └──────→ CANCELLED
```

- 客户端通过 `GET /analysis/{task_id}`、`GET /simulations/{id}` **轮询**（客户端已有 `TaskPoller`，2s → 5s 退避）。
- 上版文档 §20 提到未来可换 WebSocket / SSE，Phase 1 不做。

---

## 8. API 契约

对齐上版文档 §21，全部挂在 `/api/v1` 前缀下（便于将来版本共存）。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/v1/health` | 健康检查（本轮即可验证） |
| `POST` | `/api/v1/photos/upload-url` | 取 Presigned 上传地址 → `{ photo_id, upload_url }` |
| `POST` | `/api/v1/photos/{id}/complete` | 通知上传完成 |
| `POST` | `/api/v1/analysis` | 创建分析任务 → `{ task_id, status }` |
| `GET` | `/api/v1/analysis/{task_id}` | 查询分析状态 → `{ status, profile? }` |
| `GET` | `/api/v1/hairstyles` | 发型列表 |
| `POST` | `/api/v1/simulations` | 创建模拟任务 → `{ simulation_id, status }` |
| `GET` | `/api/v1/simulations/{id}` | 查询模拟状态 → `{ status, output_image? }` |
| `POST` | `/api/v1/feedback` | 提交反馈 |

### 统一错误结构（与客户端 `ApiException` 对齐）

```JSON
{
  "code": "PHOTO_NOT_FOUND",
  "message": "照片不存在",
  "retryable": false
}
```

> 客户端 `dio_client.dart` 的 `toApiException` 已经按 `{ code, message }` 解析，**两边必须保持一致**。

### 匿名身份

客户端已在每个请求头带 `X-Anonymous-Id`（见 `auth_interceptor.dart`）。后端中间件据此 upsert 匿名用户，Phase 1 不做注册登录。

---

## 9. 关键数据流

### 9.1 图片上传（Presigned URL 直传）

```Plain Text
Flutter ──POST /photos/upload-url──→ NestJS
                                     │ 生成 presigned PUT URL
                                     ↓
Flutter ──PUT 图片字节──────────────→ MinIO      （Backend 不碰图片字节）
Flutter ──POST /photos/{id}/complete→ NestJS    （把 photo 标记为 READY）
```

### 9.2 分析 / 模拟（异步任务）

```Plain Text
Flutter ──POST /simulations──→ NestJS ──入队 BullMQ──→ Redis
                                  │                      │
                                  │                      ↓
                                  │                  Worker 处理
                                  │                （调 HairstyleProvider）
                                  ↓                      │
                           返回 simulation_id            ↓
Flutter ──GET /simulations/{id}（轮询）←── 状态 / 结果图 URL
```

---

## 10. 部署（Docker Compose）

上版文档 §40 明确：**Phase 1 不上 Kubernetes**。

```Plain Text
docker-compose.yml
├── postgres    （数据卷）
├── redis       （队列/缓存）
├── minio       （对象存储 + 控制台）
├── api         （NestJS）
└── worker      （NestJS 内的 BullMQ processor；Python Worker 后续再加）
```

**本地开发**：本机未装 Docker，云端服务器承载 Postgres / Redis / MinIO；
**部署目标**：自有云服务器，一条 `docker compose up -d` 起全套。

### 10.1 实际部署方案（2026-10-02 勘察后修订）

⚠️ **原计划与服务器现状冲突**：目标服务器（`101.35.163.174`，腾讯云 CVM，Ubuntu 22.04）
**不是一台空机器**，上面已有在跑的服务：

| 已有服务 | 占用端口 | 处理方式 |
| --- | --- | --- |
| 原生 PostgreSQL 14.23 | 5432 | **不动**；本栈改用 5433 |
| 原生 Redis 6.0.16 | 6379 | **不动**；本栈改用 6380 |
| MySQL / Docker Swarm / Node :3001 等 | 各自端口 | 不动 |

因此本栈采用**独立容器栈 + 备用端口 + 只绑回环**的方案：

```
127.0.0.1:5433 → pm-postgres:5432
127.0.0.1:6380 → pm-redis:6379
127.0.0.1:9000 → pm-minio:9000    （S3 API）
127.0.0.1:9001 → pm-minio:9001    （Web 控制台）
```

好处：与服务器上已有服务**零冲突**，随时 `docker compose down` 干净拆除，互不影响。

**四个端口一律只绑 `127.0.0.1`**，公网访问不到 —— 需要临时访问时走 SSH 隧道：

```bash
ssh -N -L 5433:127.0.0.1:5433 -L 6380:127.0.0.1:6380 \
       -L 9000:127.0.0.1:9000 -L 9001:127.0.0.1:9001 ubuntu@101.35.163.174
```

### 10.2 顺带修掉的一个安全问题

勘察时发现服务器上的**原生 Redis 是公网可达且无密码**的
（`bind 0.0.0.0 ::1` + `protected-mode no` + 无 `requirepass`）——
这是 Redis 未授权访问漏洞的教科书配置，可被写入 SSH key 或植入挖矿程序。

- **先做了入侵排查**：25 个 key 全是教学数据（`key1` / `mylist` / `heima:user*`），
  无 `backup1`/`crackit` 等典型入侵痕迹，日志里无外部 IP，`authorized_keys` 不存在，
  无异常定时任务，无挖矿进程 —— **未被入侵**。
- **已加固**（经创始人确认）：`bind 127.0.0.1 ::1` + `protected-mode yes` + 随机 `requirepass`。
  配置备份在 `/etc/redis/redis.conf.bak.20261002223909`，新密码存
  `/home/ubuntu/.phantommirror_redis_native_pass`（权限 600）。
  已验证：无密码访问返回 `NOAUTH`，带密码返回 `PONG`，且只监听回环地址。

### 10.3 预签名 URL 的「主机名」问题

SigV4 签名会**把 Host 头算进签名**，所以给客户端签发的地址必须用
「客户端真正能访问到的主机名」来签，不能用服务端内部用的那个。

因此 `StorageService` 内部持有**两个 S3Client**：一个走内网端点做实际读写，
一个专门用来签发对外的预签名 URL（读 `S3_PUBLIC_ENDPOINT`）。

当前 `S3_PUBLIC_ENDPOINT=http://127.0.0.1:9000`，只适用于隧道联调。
**等要用手机真机直接拉结果图时，必须改成 `http://101.35.163.174:9000`**，
同时把 `MINIO_BIND` 改成 `0.0.0.0` 并在腾讯云安全组放行 9000。

---

## 11. 交付边界（本轮）

### 由 AI 完成（骨架 + 基建）

- NestJS 工程脚手架、配置、全局异常/校验/日志
- `docker-compose.yml`（Postgres + Redis + MinIO）
- Prisma schema + 首版迁移
- `storage` 模块（Presigned URL 签发）
- `photos` 模块（upload-url / complete）
- `ai` 抽象层 + `MockProvider`
- `ai-tasks` 状态机、`simulations` 编排
- `hairstyles`、`feedback`、`health`
- Swagger 文档

### 留给创始人（本轮不写死，等你读懂后一起定）

- **Provider 接口的最终形态**（字段是否够、要不要拆更细）
- **任务状态机的边界情况**（超时、取消、重试策略）
- **真实 Provider 接入**（Perfect Corp / Gemini 的映射与错误处理）
- **Benchmark 与成本策略**（上版文档 §29、§55）

---

## 12. 下一步

1. 本机验证：`npm run build` + `GET /api/v1/health` 跑通
2. 待创始人读完本文档 → 逐条确认 ADR-201~204
3. 云服务器就绪 → `docker compose up -d`，接客户端真实联调