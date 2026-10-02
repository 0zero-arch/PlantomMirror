# PhantomMirror 客户端业务模块详细拆解

**版本：** V0.1
**关联文档：** 《client-architecture.md》

> 本文档把 C001~C008 页面与 Core / Shared 层逐一拆解为：职责、路由、组件树、状态（Riverpod Provider）、依赖 API、交互与错误处理。数据模型单独列在第 3 节。

---

## 1. 模块总览

```Plain Text
Flutter App
│
├── Core（基础能力）
│   ├── Network   · DioClient / ApiEndpoints / ApiException / Interceptors
│   ├── Config    · AppConfig（baseUrl / env）
│   ├── Storage   · SessionStore（匿名 id / session）
│   └── Utils     · TaskPoller / ImageUtils
│
├── Features（业务页面）
│   ├── home        C001 首页
│   ├── photo       C002 选图 / C003 上传
│   ├── analysis    C004 分析
│   ├── hairstyle   C005 发型选择
│   ├── simulation  C006 模拟进度 / C007 结果
│   └── feedback    C008 反馈
│
└── Shared（通用 UI）
    └── widgets / theme
```

页面流转（主流程）：

```Plain Text
C001 Home ──→ C002 选图 ──→ C003 上传 ──→ C004 分析 ──→ C005 发型 ──→ C006 模拟 ──→ C007 结果 ──→ C008 反馈
                                                                          ↑                    │
                                                                          └──── 换发型/重新生成 ┘
```

---

## 2. Core 层模块

### 2.1 Network

| 组件 | 职责 |
|---|---|
| `DioClient` | Dio 单例；配 baseUrl、超时、拦截器；暴露 `dio` 供各 Feature 使用 |
| `ApiEndpoints` | 接口路径常量（`/photos/upload-url`、`/analysis`、`/hairstyles`、`/simulations`、`/feedback`…） |
| `ApiException` | 统一错误模型（code / message / retryable） |
| `AuthInterceptor` | 请求头附带 `X-Anonymous-Id`（从 SessionStore 读取） |
| `LoggingInterceptor` | 打印请求/响应/耗时（脱敏，不打印图片字节与 Token） |

### 2.2 Config

- `AppConfig`：`baseUrl`（dev/prod 通过 `--dart-define` 注入）、网络超时、轮询参数。
- 隐私要求：日志绝不打印原始图片、人脸数据、Token、API Key。

### 2.3 Storage

- `SessionStore`：用 `shared_preferences` 持久化 `anonymous_id`（首次启动生成 UUID，之后复用），可选 session token。
- Phase 1 无完整注册体系，靠 `anonymous_id` 识别同一用户。

### 2.4 Utils

| 组件 | 职责 |
|---|---|
| `TaskPoller` | 通用任务轮询：`poll(taskId, fetcher, {interval, timeout, backoff})` → 返回结果或抛 `ApiException`；支持取消。分析/模拟两处复用 |
| `ImageUtils` | 图片压缩（大图压缩到合理尺寸再传）、本地质量预检（尺寸/格式/方向） |

---

## 3. 数据模型

### 3.1 Photo

```Dart
class Photo {
  final String id;         // photo_id
  final String storageKey;
  final String type;       // original / result
  final int width;
  final int height;
}
```

### 3.2 AppearanceProfile（个人外貌特征，产品核心数据结构）

```Dart
class AppearanceProfile {
  final String faceShape;      // oval/round/square/...
  final List<Point> faceLandmarks;
  final HeadPose headPose;
  final String hairType;       // straight/wavy/curly/coily
  final String hairLength;     // short/medium/long
  final String hairDensity;    // low/medium/high
  final String hairFrizziness; // low/medium/high
}
```

> 注意（承上版文档）：这些字段只是 Phase 1 数据结构，是第三方 AI 的输出，**不代表绝对真实的人体属性**，UI 措辞要谨慎（「AI 初步判断」而非「医学/科学结论」）。

### 3.3 Hairstyle

```Dart
class Hairstyle {
  final String id;
  final String name;
  final String category;       // 男/女
  final String gender;
  final String length;
  final String texture;
  final String providerStyleId; // 第三方 style_id
  final String referenceImage;  // 参考图 URL
}
```

### 3.4 Simulation

```Dart
class Simulation {
  final String id;
  final String photoId;
  final String hairstyleId;
  final String taskId;
  final TaskStatus status;   // 见下
  final String? outputImage; // 结果图 URL（Presigned 短时）
}
```

### 3.5 TaskStatus（枚举）

```Dart
enum TaskStatus { created, uploading, queued, processing, success, failed, cancelled }
```

### 3.6 Feedback

```Dart
class Feedback {
  final String simulationId;
  final int rating;         // 1~5（非常满意 ~ 非常不满意）
  final String? reason;     // 为什么
  final String? comment;    // 其他意见
}
```

---

## 4. Features 模块

### 4.1 C001 Home

| 项 | 内容 |
|---|---|
| 职责 | 产品介绍 + 引导开始 |
| 路由 | `/` |
| 组件树 | `HomePage` → Logo / Slogan / 功能介绍 / `PrimaryButton(开始体验)` |
| 状态 | 无（纯静态） |
| 交互 | 点击「开始体验」→ `context.push('/photo')` |

### 4.2 C002 Photo Pick（选图）＋ C003 Upload（上传）

> 两个页面同属 `photo` Feature，拆成 pick → preview → upload 三个子步骤。

| 项 | 内容 |
|---|---|
| 职责 | 相机/相册选图 → 裁剪 → 预览 → 上传（Presigned URL 直传） |
| 路由 | `/photo`（选图）、`/photo/preview`（预览+上传） |
| 组件树 | `PhotoPickPage`（相机/相册按钮）→ `PhotoPreviewPage`（预览图 / 裁剪按钮 / 上传按钮 / 进度条） |
| 状态 | `PhotoProvider`：`selectedImage`、`cropResult`、`uploadState`（idle/uploading/done/error）、`uploadProgress` |
| 依赖 API | `POST /photos/upload-url`、`PUT upload_url`、`POST /photos/{id}/complete` |
| 交互 | ① `image_picker` 选图（相机/相册）② `image_cropper` 裁剪到正脸 ③ 本地预检（人脸/模糊/角度）④ 获取 upload_url → Dio 直传（带进度）⑤ complete |
| 错误处理 | 预检不通过 → 引导重新上传（「请上传正面、光线正常、面部清晰、头发完整的照片」）；上传失败 → 可重试 |

### 4.3 C004 Analysis（分析）

| 项 | 内容 |
|---|---|
| 职责 | 展示分析进度 → 展示 Profile 摘要 |
| 路由 | `/analysis` |
| 组件树 | `AnalysisPage` → 进度文案（「正在分析脸型 / 头发 / 建立个人特征」）→ 成功后 `ProfileSummaryCard` |
| 状态 | `AnalysisProvider`（`AsyncValue<AppearanceProfile>`，含 task 状态） |
| 依赖 API | `POST /analysis`、`GET /analysis/{task_id}`（`TaskPoller` 轮询） |
| 交互 | 进入即创建分析任务 → 轮询 → 成功后展示脸型/发质/发长等 → 自动或点击进入发型选择 |
| 错误处理 | 分析失败 → 错误提示 + 重试 |

### 4.4 C005 Hairstyle（发型选择）

| 项 | 内容 |
|---|---|
| 职责 | 展示发型列表（图 / 名称 / 分类 / 长度），供用户选择 |
| 路由 | `/hairstyle` |
| 组件树 | `HairstyleListPage` → 分类筛选 + `HairstyleCard`（参考图 + 名称 + 长度标签） |
| 状态 | `HairstyleProvider`（`AsyncValue<List<Hairstyle>>`）、`selectedHairstyleId` |
| 依赖 API | `GET /hairstyles` |
| 交互 | 加载列表（cached_network_image 显示参考图）→ 点击某发型 → 进入模拟 |
| 错误处理 | 列表加载失败 → 重试 |

### 4.5 C006 Simulation（模拟进度）

| 项 | 内容 |
|---|---|
| 职责 | 创建模拟任务，展示「正在为你生成专属发型…」，轮询直到出结果 |
| 路由 | `/simulation/:hairstyleId` |
| 组件树 | `SimulationProgressPage` → 动画/进度文案 |
| 状态 | `SimulationProvider`（task 状态） |
| 依赖 API | `POST /simulations`、`GET /simulations/{id}`（`TaskPoller` 轮询） |
| 交互 | 进入即创建模拟任务 → 轮询 → SUCCESS 跳转结果页 |
| 错误处理 | 失败 → 提示 + 重试；超时 → 提示「生成较慢，请稍后重试」 |

### 4.6 C007 Result（结果）

| 项 | 内容 |
|---|---|
| 职责 | Before / After 对比，支持换发型 / 重新生成 / 保存 |
| 路由 | `/result/:simulationId` |
| 组件树 | `ResultPage` → `BeforeAfterSlider`（原图 vs 结果图）+ 操作栏（换发型 / 重新生成 / 保存） |
| 状态 | `SimulationProvider`（当前 simulation） |
| 交互 | 拖动滑块对比 → 换发型回到 C005 → 重新生成重跑 C006 → 保存到本地/相册 |
| 错误处理 | 结果图加载失败 → 重试 |

### 4.7 C008 Feedback（反馈）

| 项 | 内容 |
|---|---|
| 职责 | 收集满意度 + 原因 + 意见 |
| 路由 | `/feedback/:simulationId` |
| 组件树 | `FeedbackPage` → 满意度选择（5 档）+ 原因标签 + 意见输入框 + 提交 |
| 状态 | `FeedbackProvider`（提交中/成功/失败） |
| 依赖 API | `POST /feedback` |
| 交互 | 选择满意度（非常满意~非常不满意）→ 选原因 → 提交 → 感谢页 |
| 错误处理 | 提交失败 → 可重试；允许跳过 |

---

## 5. Shared 层

| 组件 | 用途 |
|---|---|
| `PrimaryButton` | 统一主按钮样式 |
| `LoadingView` | 统一加载态（转圈 + 文案） |
| `ErrorView` | 统一错误态（文案 + 重试按钮） |
| `BeforeAfterSlider` | 结果页前后对比滑块（Phase 1 关键交互组件） |
| `theme` | 颜色 / 字体 / 间距 tokens |

---

## 6. 模块依赖小结

- 所有 Feature 的 `data` 层只通过 `DioClient` 发请求，不直接 new Dio。
- 分析、模拟共用 `TaskPoller`。
- 所有页面的错误态统一用 `ErrorView`，加载态统一用 `LoadingView`。
