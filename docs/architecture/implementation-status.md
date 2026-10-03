# 实际实现行为清单（对照 PRD 用）

> 本文罗列的是**代码实际行为**，不是设计意图。服务端部分经公网实测（`server/scripts/smoke.py`
> 打 `http://101.35.163.174:3000` 全绿）；客户端部分经 `flutter analyze` + 代码走查。
>
> 记录时间：2026-10-03。用途：与产品需求文档逐条核对，找出「文档写了但没做」和
> 「做了但和文档不一样」的地方。

---

## 一、端到端动线（用户视角）

```
首页
 └─ 选择照片（相册 / 拍照）
     └─ 预览照片 ──[点「下一步」]──┐
                                   │ 取预签名 URL → 图片直传对象存储（带进度条）
                                   │ → 上报完成（服务端确认真实存在）
                                   ↓
                              外貌分析（自动开始，轮询进度）
                                   │ 展示：脸型 / 发质 / 发长 / 发量 / 毛躁程度
                                   ↓ [点「选择发型」]
                              发型列表（24 条）
                                   ↓ [点某条]
                              生成中（自动创建任务 + 轮询进度）
                                   ↓ 成功后自动跳转
                              试戴结果（Before / After 对比）
                                   ↓ [点「评价」]
                              反馈（星级 + 原因 + 意见）
```

**上下文传递**：`photoId` 由预览页产生，经 URL query 一路带到试戴页
（`/analysis?photoId=` → `/hairstyle?photoId=` → `/simulation/{hairstyleId}?photoId=`）。
中途丢失会导致试戴创建失败（服务端返回 `VALIDATION_FAILED`）。

---

## 二、服务端接口契约（实际实现）

全部挂在 `/api/v1` 下。**字段为 camelCase** —— 注意这与
`server-architecture.md` §8 文档里写的 snake_case **不一致**，以本文为准
（文档已按实际情况修正）。

### 2.1 接口一览

| # | 方法 路径 | 请求体 | 响应体 |
|---|---|---|---|
| 1 | `GET /health` | — | `{status, uptimeSeconds, aiProvider, checks:{database, databaseLatencyMs}}` |
| 2 | `POST /photos/upload-url` | `{contentType, type?, sizeBytes?, width?, height?}` | `{photoId, storageKey, uploadUrl, method, expiresInSeconds}` |
| 3 | `PUT <uploadUrl>` | 图片字节（**直传对象存储，不经后端**） | 200 |
| 4 | `POST /photos/{photoId}/complete` | — | `{photoId, status, sizeBytes}` |
| 5 | `POST /analysis` | `{photoId}` | `{taskId, status}` |
| 6 | `GET /analysis/{taskId}` | — | `{taskId, status, profile?}` |
| 7 | `GET /hairstyles` | — | `[{id, code, name, category, gender, length, texture, referenceImageUrl}]` |
| 8 | `POST /simulations` | `{photoId, hairstyleId}` | `{simulationId, taskId, status}` |
| 9 | `GET /simulations/{simulationId}` | — | `{simulationId, status, hairstyleId, outputImageUrl, error, createdAt, completedAt}` |
| 10 | `POST /feedback` | `{simulationId, rating?, reason?, comment?}` | `{feedbackId, simulationId}` |

### 2.2 关键约束

- **上传白名单**：`contentType` 只接受 `image/jpeg` / `image/png` / `image/webp`；
  单张上限 **20MB**。ContentType 会被签进预签名 URL，客户端必须按该类型上传。
- **预签名 URL 有效期**：900 秒（15 分钟）。Host 来自服务端 `S3_PUBLIC_ENDPOINT`。
- **`complete` 是真校验**：服务端会真的去对象存储确认对象存在，才把照片置 `READY`。该接口幂等。
- **`reason` 是单个枚举**，不是数组、不是自由文本：

  | 枚举值 | 含义 |
  |---|---|
  | `UNNATURAL` | 效果不自然 |
  | `WRONG_HAIRSTYLE` | 不是想要的发型 |
  | `NOT_LIKE_FACE` | 和脸型不搭 |
  | `TOO_SLOW` | 生成太慢 |
  | `OTHER` | 其他 |

  ⚠️ **全是负面原因**（DTO 注释写的是「不满意的原因」）。满意度本身由 `rating`（1-5 分）表达。
- **`comment`** 限制 500 字。
- **匿名身份**：客户端每个请求带 `X-Anonymous-Id` 头，后端据此 upsert 匿名用户。Phase 1 无注册登录。
- **统一错误结构**：`{code, message, retryable}`。

### 2.3 任务状态机

```
CREATED ──→ QUEUED ──→ PROCESSING ──→ SUCCESS
                │            │
                └────────────┴──────→ FAILED
                             └──────→ CANCELLED
```

客户端轮询间隔 2s → 5s 指数退避。超时：分析 **60s**、试戴 **120s**。

---

## 三、明确是「假的」的部分

整条链路跑的是 `AI_PROVIDER=mock` —— **结构真实，内容是假的**。

| 环节 | 现状 |
|---|---|
| 外貌分析 | 结果由**图片 hash 派生**的固定值。同一张图永远同一结果，换图会变，但和被拍的人**毫无关系** |
| 发型试戴 | 返回**确定性占位 PNG**，不是真的换了发型 |
| `perfect-corp` / `gemini` | **空实现**，每个方法显式抛 `AI_PROVIDER_UNAVAILABLE`（刻意不返回假数据，避免误配时得到查不出来的错误结果） |

**真实的**：上传/存储/任务队列/轮询/结果图回读/24 条发型目录/反馈入库，全部是真的。

---

## 四、已发现并已修复的问题（2026-10-03）

客户端骨架原本是照**假定的 snake_case 契约**写的，与服务端实际实现全面不符，
导致**每个功能页都连不上**。已全部修复：

| 问题 | 影响 |
|---|---|
| 请求/响应字段 snake_case vs camelCase | 所有接口 400 或解析抛异常 |
| 模型字段多余（`providerStyleId`）或类型过严（`referenceImage` 非空但实际为 null） | 发型列表整个解析失败 |
| `PhotoApi.upload` 从未被调用（预览页是占位 TODO） | **照片根本没上传过** |
| `photoId` 在导航链里丢失 | 试戴创建必然失败 |
| 反馈 `reason` 发中文展示串、且多选拼逗号 | 反馈提交 400 |

同时补了两个 release 包的致命问题（debug 包看不出来）：
**`main` 清单缺 `INTERNET` 权限**、**Android 9+ 默认拦截明文 HTTP**。

---

## 五、建议与 PRD 核对的疑点

以下几点我按「最小改动、可自洽」的原则处理了，但**可能与产品意图不符**，需要你确认：

1. **反馈的正面选项没了。** 客户端原本有「效果自然」「符合预期」两个正面标签，
   但服务端枚举全是负面的，wire 上没有对应值，我已改为只给负面选项。
   如果产品希望收集正面原因，**服务端枚举需要扩充**。

2. **结果页的「原图」是灰色占位块，不是用户上传的照片。**
   `result_page.dart` 里写死 `_placeholder('原图')`。
   Before/After 对比的 Before 侧目前没有接真实原图。

3. **本地图片预检未实现。** `ImageUtils.precheck` 是占位实现，永远放行。
   PRD 若要求「正脸 / 清晰度 / 角度」预检，这块还没做。

4. **试戴结果页依赖内存状态。** `ResultPage` 读的是全局 provider，
   直接深链到 `/result/{id}`（如从通知进入）会显示空白 —— 没有按 id 拉取数据。

5. **客户端没有重试/断点续传。** 上传失败只能整张重传。
   20MB 上限配合手机网络，失败重传的成本不小。

6. **`S3_PUBLIC_ENDPOINT` 目前指向裸 IP + HTTP。** 上线前需换成域名 + HTTPS，
   否则：证书无法配置、预签名 URL 会被中间人截获、且 Android 需要保留明文白名单。