# PhantomMirror 客户端架构设计与技术选型

**版本：** V0.1
**阶段：** Phase 1 / MVP 技术验证
**决策日期：** 2026-10-02
**目标平台：** Android 优先（Web / iOS 保留）
**关联文档：** 《PhantomMirror（幻境）客户端_云端 模块拆解与架构设计》、《PhantomMirror（幻境）PR0.1》

---

## 1. 文档目的

本文档回答三个问题：

1. 客户端**用什么技术**（技术选型）
2. 客户端代码**怎么组织**（架构分层与目录结构）
3. 客户端数据**怎么流动**（关键流程时序）

业务模块的逐页拆解见《client-modules.md》，环境安装见《client-env-setup.md》。

---

## 2. 设计原则（承自上版文档，本客户端严格遵守）

| 原则 | 含义 | 在客户端的落地 |
|---|---|---|
| 客户端只负责交互 | 业务、数据、权限、AI 任务都在后端 | 客户端不做业务判断，只调 API、展示结果 |
| 不要过早架构 | Phase 1 以「能跑通闭环」优先 | 分层从简，避免过度抽象 |
| 能买不造 / 产品驱动技术 | 优先用成熟库、第三方能力 | 图片、上传、路由等都用社区成熟库 |
| 保留人工学习 | AI 是高级程序员，不是替代大脑 | 每个选型都写明「为什么」，便于自己读懂 |

---

## 3. 目标平台策略

| 平台 | 状态 | 说明 |
|---|---|---|
| **Android** | ✅ **优先** | 本次决定。首个真实运行目标，最接近产品最终形态 |
| **Web** | 🔄 保留 | Chrome 已就绪，`flutter run -d chrome` 可随时切换，用于快速调试 UI |
| **iOS** | ⏸️ Backlog | 需 macOS + Xcode，本机为 Windows，暂不涉及 |

> 含义：**所有技术选型必须同时兼容 Android 与 Web**（Flutter 天然满足），但环境配置、真机调试、性能优化以 Android 为先。

---

## 4. 技术选型

### 4.1 选型总表

| 维度 | 选择 | 备选 | 状态 |
|---|---|---|---|
| 语言 / 框架 | **Dart + Flutter（stable）** | — | 已定（文档 ADR-001） |
| 状态管理 | **Riverpod** | Provider / Bloc | 本次确定 |
| 网络 | **Dio** | http | 本次确定 |
| 路由 | **go_router** | Navigator 1.0 | 本次确定 |
| 图片选择 | **image_picker** | — | 本次确定 |
| 图片裁剪 | **image_cropper** | crop_your_image | 本次确定 |
| 图片加载 | **cached_network_image** | Image.network | 本次确定 |
| 本地存储 | **shared_preferences** | hive / sqflite | 本次确定 |
| 序列化 | **json_serializable** | 手写 / freezed | 本次确定 |
| 环境 / 配置 | **--dart-define + flutter_dotenv** | 硬编码 | 本次确定 |
| 日志 | **logger** | print | 本次确定 |
| 测试 | **flutter_test + mockito** | — | 本次确定（轻量） |

### 4.2 关键选型理由

#### 状态管理：Riverpod

**为什么选它：**

- 本项目状态几乎全是**异步**（上传进度、任务轮询、图片加载），Riverpod 对 async 支持最干净（`AsyncValue` / `FutureProvider` / `StreamProvider`）。
- 编译期安全、不依赖 `BuildContext`，单测容易。
- 学习曲线高于 Provider，但样板量远低于 Bloc，适合 Solo + 学习阶段。

**为什么不选其它：**

- **Provider**：已进入维护模式，async 处理不如 Riverpod。
- **Bloc**：事件/状态样板代码多，本项目的状态复杂度不值得引入。

**降级策略（避免为用而用）：**

- 纯页面局部状态（如裁剪 UI 开关）用 `StatefulWidget`。
- 只有**跨页面共享**的状态才上 Riverpod：当前照片、分析结果 Profile、选中发型、模拟结果、任务状态。

#### 网络：Dio

- 大图上传需要**上传进度回调**（`onSendProgress`），`http` 不支持。
- 拦截器统一处理：加 header、错误转换、日志、超时。
- 原生支持 `FormData`、`MultipartFile`。

#### 序列化：json_serializable

- 本项目模型较多（Photo / Profile / Hairstyle / Simulation / Feedback），手写 `fromJson/toJson` 易错。
- `json_serializable` 用代码生成，类型安全。`freezed` 可作为后续引入的增强（不可变 + copyWith），初期先不上，降低学习成本。

---

## 5. 总体架构分层

沿用上版文档的三层划分，明确**依赖方向**：

```Plain Text
                        ┌─────────────────────┐
                        │      Features       │  业务页面，按功能组织
                        │  (Home/Photo/…)     │
                        └──────────┬──────────┘
                                   │ 依赖
                        ┌──────────▼──────────┐
                        │        Core         │  通用基础能力（网络/配置/存储）
                        └──────────┬──────────┘
                                   │ 依赖
                        ┌──────────▼──────────┐
                        │       Shared        │  纯 UI 组件 / 主题 / 工具
                        └─────────────────────┘
```

**依赖规则（硬约束）：**

1. `Features` 可以依赖 `Core` 和 `Shared`。
2. `Core` 只能依赖 `Shared`（或 Flutter SDK），**不能**依赖任何 `Features`。
3. `Shared` 只能依赖 Flutter SDK，**不能**依赖 `Core` / `Features`。
4. 任何业务逻辑不写在 `Widget` 里，Widget 只负责「渲染 + 触发事件」。

---

## 6. 目录结构

```Plain Text
client/                            # Flutter 工程（后续 flutter create 生成）
├── pubspec.yaml
├── analysis_options.yaml
├── android/                       # Android 原生壳（一般不改）
├── web/                           # Web 目标（保留）
├── ios/                           # iOS 目标（Backlog，暂不生成）
│
└── lib/
    ├── main.dart                  # 入口：ProviderScope + 初始化
    │
    ├── app/
    │   ├── app.dart               # MaterialApp.router + 主题
    │   ├── router/
    │   │   └── app_router.dart    # go_router 路由表
    │   └── theme/
    │       └── app_theme.dart     # 颜色 / 字体 / 间距
    │
    ├── core/
    │   ├── network/
    │   │   ├── dio_client.dart        # Dio 单例 + 拦截器
    │   │   ├── api_endpoints.dart     # 接口路径常量
    │   │   ├── api_exception.dart     # 统一错误模型
    │   │   └── interceptors/
    │   │       ├── auth_interceptor.dart   # 附带 session / 匿名 id
    │   │       └── logging_interceptor.dart
    │   ├── config/
    │   │   └── app_config.dart        # baseUrl / env / 超时
    │   ├── storage/
    │   │   └── session_store.dart     # 匿名 user_id / session 持久化
    │   └── utils/
    │       ├── task_poller.dart       # 任务轮询通用封装（复用）
    │       └── image_utils.dart       # 压缩 / 质量预检
    │
    ├── features/
    │   ├── home/
    │   │   ├── presentation/
    │   │   │   ├── home_page.dart
    │   │   │   └── widgets/
    │   │   └── providers/             # Riverpod provider
    │   ├── photo/
    │   │   ├── data/
    │   │   │   ├── photo_api.dart     # 上传接口调用
    │   │   │   └── photo_model.dart
    │   │   ├── domain/
    │   │   │   └── photo_use_case.dart # 选图→预检→上传→complete 编排
    │   │   ├── providers/
    │   │   │   └── photo_provider.dart
    │   │   └── presentation/
    │   │       ├── photo_pick_page.dart
    │   │       ├── photo_preview_page.dart
    │   │       └── widgets/
    │   ├── analysis/
    │   │   ├── data/ analysis_api.dart · appearance_profile_model.dart
    │   │   ├── providers/ analysis_provider.dart
    │   │   └── presentation/ analysis_page.dart · widgets/
    │   ├── hairstyle/
    │   │   ├── data/ hairstyle_api.dart · hairstyle_model.dart
    │   │   ├── providers/ hairstyle_provider.dart
    │   │   └── presentation/ hairstyle_list_page.dart · widgets/
    │   ├── simulation/
    │   │   ├── data/ simulation_api.dart · simulation_model.dart
    │   │   ├── providers/ simulation_provider.dart
    │   │   └── presentation/ simulation_progress_page.dart · result_page.dart · widgets/
    │   └── feedback/
    │       ├── data/ feedback_api.dart · feedback_model.dart
    │       ├── providers/ feedback_provider.dart
    │       └── presentation/ feedback_page.dart
    │
    └── shared/
        ├── widgets/
        │   ├── primary_button.dart
        │   ├── loading_view.dart
        │   ├── error_view.dart
        │   └── before_after_slider.dart   # 前后对比滑块
        └── theme/                         # 若 app/theme 不够用再扩展
```

> 说明：每个 Feature 内部采用轻量分层（`data` 数据访问 / `domain` 编排 / `presentation` UI / `providers` 状态）。MVP 阶段若某 Feature 很薄（如 home、feedback），可先只保留 `presentation` + `providers`，**不要为分层而分层**。

---

## 7. 关键数据流

### 7.1 照片上传（Presigned URL 直传，不经 Backend 传图）

```Plain Text
用户选择照片
      ↓
本地质量预检（人脸存在 / 模糊 / 角度，提示用户）
      ↓
POST /photos/upload-url          → { photo_id, upload_url }
      ↓
Dio PUT upload_url（图片字节，onSendProgress 更新进度）
      ↓
POST /photos/{id}/complete        → 通知后端上传完成
      ↓
进入「分析」流程
```

> **要点**：图片直接传对象存储，后端只发「上传地址」，不做图片搬运工（呼应上版文档第 22/23 节）。

### 7.2 分析流程（异步任务轮询）

```Plain Text
POST /analysis                   → { task_id, status: CREATED }
      ↓
轮询 GET /analysis/{task_id}     （QUEUED / PROCESSING）
      ↓
SUCCESS → PersonalAppearanceProfile → 进入发型选择
FAILED  → 错误提示 + 重试
```

### 7.3 模拟流程（同 pattern，核心业务）

```Plain Text
POST /simulations                → { simulation_id, status: PROCESSING }
      ↓
轮询 GET /simulations/{id}
      ↓
SUCCESS → 结果图 URL（Presigned 短时）→ Before/After 结果页
FAILED  → 错误提示 + 重试
```

> 分析、模拟都是「创建任务 → 轮询状态」，所以 `core/utils/task_poller.dart` 做一个**通用轮询器**（间隔 / 超时 / 指数退避 / 取消），两处复用。

---

## 8. 客户端—后端边界（硬约束）

客户端**永远不做**以下事情：

| 禁止项 | 原因 |
|---|---|
| 保存 AI API Key | Key 只存在云端 |
| 直接调用 Perfect Corp / Gemini / 内部 AI 服务 | 防止 Key 泄露、逻辑失控 |
| 决定 AI Pipeline | 后端编排 |
| 直接操作数据库 | 权限与数据安全 |

**一切 AI 相关调用一律经过 PhantomMirror Backend。** 客户端只通过 REST API 与后端交互。

---

## 9. 状态与错误处理约定

### 9.1 任务状态枚举（后端定义，客户端镜像）

```Plain Text
CREATED → UPLOADING → QUEUED → PROCESSING → SUCCESS
                                  ↘ FAILED
                                  ↘ CANCELLED
```

### 9.2 统一错误模型

```Dart
class ApiException implements Exception {
  final String code;      // 后端错误码
  final String message;   // 面向用户的中文提示
  final bool retryable;   // 是否可重试
}
```

- 网络层（Dio 拦截器）把 HTTP 错误 / 超时统一转成 `ApiException`。
- UI 层只面对 `ApiException`，不感知 HTTP 细节。

### 9.3 轮询策略

- 间隔：初始 2s，指数退避到 5s（上限）。
- 超时：分析 60s / 模拟 120s（AI 生成较慢），超时转「失败可重试」。

---

## 10. 架构决策记录（ADR）

| 编号 | 决策 | 内容 |
|---|---|---|
| ADR-101 | 客户端 = Flutter | Android 优先，Web/iOS 保留 |
| ADR-102 | 状态管理 = Riverpod | 跨页共享状态用 Provider，局部用 StatefulWidget |
| ADR-103 | 网络 = Dio | 上传进度 + 拦截器 |
| ADR-104 | 路由 = go_router | 声明式路由 |
| ADR-105 | 图片直传对象存储 | Presigned URL，不经 Backend |
| ADR-106 | AI 一律经 Backend | 客户端不碰 Key、不直连 AI |
| ADR-107 | 序列化 = json_serializable | 代码生成，类型安全 |

---

## 11. 下一步

1. 详细业务模块拆解 → 《client-modules.md》
2. 环境安装（D 盘）→ 《client-env-setup.md》
3. 环境就绪后 → `flutter create client`，按本目录结构搭建骨架
